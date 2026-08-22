import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/auth-edge";

const ADMIN_SESSION_COOKIE = "admin_session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지(및 하위)는 항상 통과.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/admin");
  const secret = process.env.ADMIN_SESSION_SECRET;

  // 시크릿이 없으면 fail-closed.
  if (!secret) {
    return reject(request, isApi);
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid } = await verifySessionTokenEdge(token, secret);
  if (!valid) {
    return reject(request, isApi);
  }

  return NextResponse.next();
}

function reject(request: NextRequest, isApi: boolean): NextResponse {
  if (isApi) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}
