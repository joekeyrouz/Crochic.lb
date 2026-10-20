import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";
import { Paths } from "@contracts/constants";

let createGoogleLoginHandler: typeof import("./auth").createGoogleLoginHandler;
let createGoogleCallbackHandler: typeof import("./auth").createGoogleCallbackHandler;
let signSessionToken: typeof import("./session").signSessionToken;
let verifySessionToken: typeof import("./session").verifySessionToken;

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = "test-google-client";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
  process.env.SESSION_SECRET = "test-session-secret-long-enough-for-hmac";
  ({ createGoogleLoginHandler, createGoogleCallbackHandler } =
    await import("./auth"));
  ({ signSessionToken, verifySessionToken } = await import("./session"));
});

describe("Google sign-in", () => {
  it("starts OAuth with CSRF state, nonce, and PKCE", async () => {
    const app = new Hono();
    app.get(Paths.googleLogin, createGoogleLoginHandler());

    const response = await app.request(
      `http://localhost:3000${Paths.googleLogin}`,
      { headers: { host: "localhost:3000" } },
    );
    const location = response.headers.get("location");
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(302);
    expect(location).not.toBeNull();
    const authorizationUrl = new URL(location!);
    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.pathname).toBe("/o/oauth2/v2/auth");
    expect(authorizationUrl.searchParams.get("client_id")).toBe(
      "test-google-client",
    );
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
      `http://localhost:3000${Paths.googleCallback}`,
    );
    expect(authorizationUrl.searchParams.get("scope")).toBe(
      "openid email profile",
    );
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(authorizationUrl.searchParams.get("state")).toBeTruthy();
    expect(authorizationUrl.searchParams.get("nonce")).toBeTruthy();
    expect(authorizationUrl.searchParams.get("code_challenge")).toBeTruthy();
    expect(setCookie).toContain("crochic_google_oauth=");
    expect(setCookie).toContain(`Path=${Paths.googleCallback}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("uses HTTPS forwarded by the hosting proxy in the callback URI", async () => {
    const app = new Hono();
    app.get(Paths.googleLogin, createGoogleLoginHandler());
    const response = await app.request(
      `http://shop.example.test${Paths.googleLogin}`,
      {
        headers: {
          host: "shop.example.test",
          "x-forwarded-proto": "https",
        },
      },
    );

    const authorizationUrl = new URL(response.headers.get("location")!);
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
      `https://shop.example.test${Paths.googleCallback}`,
    );
  });

  it("rejects callbacks with a mismatched state", async () => {
    const app = new Hono();
    app.get(Paths.googleCallback, createGoogleCallbackHandler());
    const oauthCookie = encodeURIComponent(
      JSON.stringify({
        state: "expected-state",
        nonce: "nonce",
        verifier: "verifier",
      }),
    );
    const response = await app.request(
      `${Paths.googleCallback}?code=test-code&state=wrong-state`,
      { headers: { cookie: `crochic_google_oauth=${oauthCookie}` } },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "/login?error=invalid_oauth_state",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("session tokens", () => {
  it("signs and verifies a short-lived application session", async () => {
    const token = await signSessionToken({
      unionId: "customer@example.com",
      clientId: "email_otp",
    });

    await expect(verifySessionToken(token)).resolves.toEqual({
      unionId: "customer@example.com",
      clientId: "email_otp",
    });
    await expect(verifySessionToken("invalid")).resolves.toBeNull();
  });
});
