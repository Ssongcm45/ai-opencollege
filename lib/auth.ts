import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: "admin";
  exp: number;
  nonce: string;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createToken(payload: AdminSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return false;
  if (!safeEqual(sign(encodedPayload), signature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    return payload.sub === "admin" && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie() {
  const jar = await cookies();
  const token = createToken({
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("base64url")
  });

  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS
  });
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminSessionValid(): Promise<boolean> {
  const jar = await cookies();
  try {
    return verifyToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    return false;
  }
}

export async function requireAdminSession() {
  if (!(await isAdminSessionValid())) {
    redirect("/admin/login");
  }
}
