import { jwtVerify, SignJWT } from "jose";

// V1 has exactly one admin account, so a session only needs to prove "this
// request came from the logged-in admin." The token is a signed JWT (HS256
// via `jose`, which works in both Node and the Next.js edge runtime used by
// middleware) carrying the admin's id and a short expiry. Everything
// session-related lives behind this module so swapping to multi-account
// auth later only means changing this file, not every call site.

const SESSION_COOKIE_NAME = "dl_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  adminId: string;
}

export async function createSessionToken(adminId: string): Promise<string> {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.adminId !== "string") return null;
    return { adminId: payload.adminId };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
