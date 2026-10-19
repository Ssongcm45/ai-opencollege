import { NextRequest, NextResponse } from "next/server";
import { withAgent } from "@/lib/agent-route";
import { readLimitedJson } from "@/lib/agent-http";
import { getBlogDraft, parseDraftId, updateBlogDraft } from "@/lib/agent-blog";

// 외부 AI 에이전트 블로그 초안 — 조회·부분 수정 (에이전트가 만든 미발행 초안만)
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withAgent(req, async (agent) => {
    const id = parseDraftId((await params).id);
    return NextResponse.json(await getBlogDraft(agent, id));
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withAgent(req, async (agent) => {
    const id = parseDraftId((await params).id);
    const body = await readLimitedJson(req);
    return NextResponse.json(await updateBlogDraft(agent, id, body));
  });
}
