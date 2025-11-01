// lib/session.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.APP_JWT_SECRET || "dev-secret"
);
export const SESSION_COOKIE = "bt_session";

export type AppSession = {
  sub: string; // telegram id as string
  name?: string;
  username?: string;
};

export async function signAppSession(payload: AppSession) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAppSession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AppSession;
}
