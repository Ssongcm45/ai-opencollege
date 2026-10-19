import { NextRequest, NextResponse } from "next/server";
import { withAgent } from "@/lib/agent-route";
import { listBlogCategories } from "@/lib/agent-blog";

// 외부 AI 에이전트용 — 관리자가 관리하는 블로그 카테고리 목록 (Authorization: Bearer <에이전트 키>)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withAgent(req, async () => NextResponse.json(await listBlogCategories()));
}
