import crypto from "crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig } from "@/lib/db/schema";

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  sub: "admin";
  exp: number;
  nonce: string;
  ver: number;
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

// 구조·서명·만료를 검증하고 파싱된 페이로드를 반환한다. 실패 시 null.
function verifyToken(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return null;
  if (!safeEqual(sign(encodedPayload), signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    if (payload.sub !== "admin" || typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      sub: "admin",
      exp: payload.exp,
      nonce: typeof payload.nonce === "string" ? payload.nonce : "",
      ver: typeof payload.ver === "number" ? payload.ver : 1
    };
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(ver = 1) {
  const jar = await cookies();
  const token = createToken({
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString("base64url"),
    ver
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

// 서명·만료와 DB에 저장된 현재 세션 버전을 함께 검증한다.
export async function isAdminSessionValid(): Promise<boolean> {
  try {
    const jar = await cookies();
    const payload = verifyToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
    if (!payload || !hasDatabase) return false;

    const [row] = await getDb()
      .select({ passwordHash: adminConfig.passwordHash, sessionVersion: adminConfig.sessionVersion })
      .from(adminConfig)
      .where(eq(adminConfig.id, 1))
      .limit(1);
    return !!row?.passwordHash && payload.ver === row.sessionVersion;
  } catch {
    return false;
  }
}

// 관리자 페이지와 서버 액션에도 같은 검증을 적용한다.
export async function requireAdminSession() {
  if (!(await isAdminSessionValid())) redirect("/admin/login");
}
