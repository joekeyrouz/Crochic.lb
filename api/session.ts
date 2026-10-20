import * as jose from "jose";
import { env } from "./lib/env";

export type SessionPayload = {
  unionId: string;
  clientId: string;
};

const JWT_ALG = "HS256";

function getSessionKey() {
  if (env.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }
  return new TextEncoder().encode(env.sessionSecret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30 days")
    .sign(getSessionKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jose.jwtVerify(token, getSessionKey(), {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (typeof unionId !== "string" || typeof clientId !== "string") {
      return null;
    }
    return { unionId, clientId };
  } catch {
    return null;
  }
}
