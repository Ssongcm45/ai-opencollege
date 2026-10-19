import { NextRequest, NextResponse } from "next/server";
import { withAgent } from "@/lib/agent-route";
import { readLimitedJson } from "@/lib/agent-http";
import { createBlogDraft, listBlogDrafts } from "@/lib/agent-blog";

// 외부 AI 에이전트 블로그 초안 — 목록·등록 (Authorization: Bearer <에이전트 키>). 발행은 관리자만 한다.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withAgent(req, async (agent) => NextResponse.json(await listBlogDrafts(agent)));
}

export async function POST(req: NextRequest) {
  return withAgent(req, async (agent) => {
    const body = await readLimitedJson(req);
    return NextResponse.json(await createBlogDraft(agent, body), { status: 201 });
  });
}
