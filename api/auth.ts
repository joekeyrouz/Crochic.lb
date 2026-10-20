import { createHash, randomBytes } from "node:crypto";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { Paths, Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { env } from "./lib/env";
import { findUserByUnionId, upsertUser } from "./queries/users";
import { signSessionToken, verifySessionToken } from "./session";

const OAUTH_COOKIE = "crochic_google_oauth";
const OAUTH_COOKIE_MAX_AGE = 10 * 60;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const googleJwks = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

type OAuthCookie = {
  state: string;
  nonce: string;
  verifier: string;
};

function getApplicationOrigin(c: Context) {
  const requestUrl = new URL(c.req.url);
  const forwardedProto = c.req
    .header("x-forwarded-proto")
    ?.split(",")[0]
    .trim();

  if (forwardedProto === "http" || forwardedProto === "https") {
    requestUrl.protocol = `${forwardedProto}:`;
  }

  return requestUrl.origin;
}

function getGoogleCallbackUrl(c: Context) {
  return new URL(Paths.googleCallback, getApplicationOrigin(c)).toString();
}

function getLoginUrl(error?: string) {
  const url = new URL(Paths.login, "http://localhost");
  if (error) {
    url.searchParams.set("error", error);
  }
  return `${url.pathname}${url.search}`;
}

function clearOAuthCookie(c: Context) {
  setCookie(c, OAUTH_COOKIE, "", {
    ...getSessionCookieOptions(c.req.raw.headers),
    path: Paths.googleCallback,
    maxAge: 0,
  });
}

export function createGoogleLoginHandler() {
  return async (c: Context) => {
    if (!env.googleClientId || !env.googleClientSecret) {
      console.error(
        "[auth] Google login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      );
      return c.redirect(getLoginUrl("google_not_configured"), 302);
    }

    const state: OAuthCookie = {
      state: randomBytes(32).toString("base64url"),
      nonce: randomBytes(32).toString("base64url"),
      verifier: randomBytes(32).toString("base64url"),
    };
    const callbackUrl = getGoogleCallbackUrl(c);
    const challenge = createHash("sha256")
      .update(state.verifier)
      .digest("base64url");
    const authorizationUrl = new URL(GOOGLE_AUTH_URL);
    authorizationUrl.searchParams.set("client_id", env.googleClientId);
    authorizationUrl.searchParams.set("redirect_uri", callbackUrl);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state.state);
    authorizationUrl.searchParams.set("nonce", state.nonce);
    authorizationUrl.searchParams.set("code_challenge", challenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("prompt", "select_account");

    setCookie(c, OAUTH_COOKIE, JSON.stringify(state), {
      ...getSessionCookieOptions(c.req.raw.headers),
      path: Paths.googleCallback,
      maxAge: OAUTH_COOKIE_MAX_AGE,
    });

    return c.redirect(authorizationUrl.toString(), 302);
  };
}

async function exchangeGoogleCode(
  code: string,
  verifier: string,
  redirectUri: string,
) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(
      `[auth] Google token exchange failed (${response.status}): ${detail}`,
    );
    throw new Error("Google token exchange failed.");
  }
  return (await response.json()) as { id_token?: string };
}

export function createGoogleCallbackHandler() {
  return async (c: Context) => {
    const rawState = getCookie(c, OAUTH_COOKIE);
    clearOAuthCookie(c);

    let state: OAuthCookie | undefined;
    try {
      state = rawState ? (JSON.parse(rawState) as OAuthCookie) : undefined;
    } catch {
      state = undefined;
    }
    const returnedState = c.req.query("state");
    const code = c.req.query("code");
    const providerError = c.req.query("error");

    if (
      !state?.state ||
      !state.nonce ||
      !state.verifier ||
      !returnedState ||
      returnedState !== state.state
    ) {
      return c.redirect(getLoginUrl("invalid_oauth_state"), 302);
    }
    if (providerError || !code) {
      return c.redirect(getLoginUrl("google_cancelled"), 302);
    }

    try {
      const tokenResponse = await exchangeGoogleCode(
        code,
        state.verifier,
        getGoogleCallbackUrl(c),
      );
      if (!tokenResponse.id_token) {
        throw new Error("Google did not return an ID token.");
      }

      const { payload } = await jose.jwtVerify(
        tokenResponse.id_token,
        googleJwks,
        {
          issuer: ["https://accounts.google.com", "accounts.google.com"],
          audience: env.googleClientId,
        },
      );
      if (
        payload.nonce !== state.nonce ||
        typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        payload.email_verified !== true
      ) {
        throw new Error("Google returned an unverified or invalid account.");
      }

      const email = payload.email.trim().toLowerCase();
      const user = await upsertUser({
        unionId: email,
        email,
        name: typeof payload.name === "string" ? payload.name : email,
        avatar: typeof payload.picture === "string" ? payload.picture : null,
        role: "user",
        lastSignInAt: new Date(),
      });
      if (user.role === "admin") {
        return c.redirect(getLoginUrl("admin_account"), 302);
      }

      const sessionToken = await signSessionToken({
        unionId: user.unionId,
        clientId: "google",
      });
      setCookie(c, Session.cookieName, sessionToken, {
        ...getSessionCookieOptions(c.req.raw.headers),
        maxAge: Session.maxAgeMs / 1000,
      });
      return c.redirect("/", 302);
    } catch (error) {
      console.error("[auth] Google callback failed.", error);
      return c.redirect(getLoginUrl("google_failed"), 302);
    }
  };
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw new Error("No session cookie found.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw new Error("Invalid session token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw new Error("Session user no longer exists.");
  }
  return { user, authMethod: claim.clientId };
}

export async function createEmailSessionCookie(email: string) {
  const user = await findUserByUnionId(email);
  if (!user) {
    throw new Error("Cannot create a session for an unknown account.");
  }
  const token = await signSessionToken({
    unionId: user.unionId,
    clientId: "email_otp",
  });
  return token;
}

export async function createAdminSessionCookie(email: string) {
  const user = await findUserByUnionId(email);
  if (!user || user.role !== "admin") {
    throw new Error("Cannot create an admin session for a non-admin account.");
  }
  return signSessionToken({
    unionId: user.unionId,
    clientId: "admin_password",
  });
}
