import crypto from "node:crypto";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { getDb, hasDatabase } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { analyzeInquiry, getInquiryAiProvider, type InquiryAnalysisInput } from "@/lib/inquiry-analysis";
import { INQUIRY_COURSES, InquiryAnalysisSchema } from "@/lib/inquiry-analysis";

const LEASE_MS = 150_000;
const MAIL_TIMEOUT_MS = 20_000;
const IDEMPOTENCY_HOURS = 24;
export const inquiryInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  organization: z.string().trim().max(140).optional(),
  email: z.email().max(160),
  phone: z.string().trim().min(1).max(60),
  audience: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(4000),
  educationGoal: z.string().trim().max(1000).optional(),
  source: z.enum(["contact", "learning_check"]),
  rateIdentity: z.string().max(200).optional(),
});
export type InquiryInput = z.infer<typeof inquiryInputSchema>;
type Result = { ok: boolean; message: string };
const RECEIVED = "문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.";
const UNAVAILABLE = "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function escapeHtml(value: unknown) {
  return String(value ?? "-").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
function htmlRow(label: string, value: unknown) {
  return `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
}
function adminUrl(id: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://opencollege.co.kr";
  return new URL(`/admin/inquiries?inquiry=${encodeURIComponent(id)}`, base).toString();
}
function mailPayload(row: typeof inquiries.$inferSelect) {
  const parsed = InquiryAnalysisSchema.safeParse(row.analysis);
  const analysis = parsed.success ? parsed.data : null;
  const analysisHtml = analysis ? `<h2>AI 분석</h2><table cellpadding="8">${htmlRow("요약", analysis.summary)}${htmlRow("명시된 교육 목표", analysis.educationGoal.stated)}${htmlRow("목표 해석·제안", analysis.educationGoal.interpretation)}${htmlRow("확인된 사실", analysis.confirmedFacts.map(f => `${f.label}: ${f.value} (근거: ${f.evidence})`).join("\n"))}${htmlRow("추천 과정", analysis.recommendedCourses.map(c => `${INQUIRY_COURSES[c.courseId].name}: ${c.reason}`).join("\n"))}${htmlRow("운영 제안", analysis.deliveryRecommendation)}${htmlRow("확인할 사항", analysis.missingInformation.join("\n"))}${htmlRow("다음 단계", analysis.nextActions.join("\n"))}${htmlRow("답장 초안", analysis.replyDraft)}</table>` : `<h2>AI 분석 실패</h2><p>문의 원문을 직접 확인해 주세요.</p>`;
  const safeName = row.name.replace(/[\r\n]/g, " ");
  const body = `<h2>교육 문의 접수</h2><table cellpadding="8">${htmlRow("이름", row.name)}${htmlRow("소속", row.organization)}${htmlRow("이메일", row.email)}${htmlRow("전화", row.phone)}${htmlRow("대상", row.audience)}${htmlRow("교육 목표", row.educationGoal)}${htmlRow("문의 원문", row.message)}</table>${analysisHtml}<p><a href="${escapeHtml(adminUrl(row.id))}">관리자에서 문의 보기</a></p>`;
  return {
    from: process.env.RESEND_FROM ?? "AI OpenCollege <edu@opencollege.co.kr>",
    to: (process.env.ADMIN_EMAIL ?? "jamescm8445@gmail.com").trim(),
    reply_to: row.email ?? undefined,
    subject: `[AI OpenCollege] 교육 문의: ${safeName}`,
    html: body,
  };
}

async function consumeRateLimit(input: InquiryInput) {
  const identity = (input.rateIdentity || input.email).trim().toLowerCase();
  const key = crypto.createHash("sha256").update(identity).digest("hex");
  const result = await getDb().execute(sql`
    INSERT INTO inquiry_rate_limits (rate_key, window_start, attempts)
    VALUES (${key}, now(), 1)
    ON CONFLICT (rate_key) DO UPDATE SET
      window_start = CASE WHEN inquiry_rate_limits.window_start < now() - interval '10 minutes' THEN now() ELSE inquiry_rate_limits.window_start END,
      attempts = CASE WHEN inquiry_rate_limits.window_start < now() - interval '10 minutes' THEN 1 ELSE inquiry_rate_limits.attempts + 1 END
    WHERE inquiry_rate_limits.window_start < now() - interval '10 minutes' OR inquiry_rate_limits.attempts < 3
    RETURNING rate_key
  `);
  return result.rows.length > 0;
}

export async function receiveInquiry(raw: unknown): Promise<Result> {
  const parsed = inquiryInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "입력 내용을 확인해 주세요." };
  if (!hasDatabase) return { ok: false, message: UNAVAILABLE };
  const { rateIdentity, ...input } = parsed.data;
  try {
    const bucket = Math.floor(Date.now() / 600_000);
    const intakeKey = crypto.createHash("sha256").update(JSON.stringify([input.name, input.organization, input.email.toLowerCase(), input.phone, input.audience, input.educationGoal, input.message, input.source, bucket])).digest("hex");
    if (!(await consumeRateLimit(parsed.data))) return { ok: false, message: "잠시 후 다시 시도해 주세요." };
    const [row] = await getDb().insert(inquiries).values({
      ...input, intakeKey,
      analysisStatus: "pending",
      notificationStatus: "pending",
    }).onConflictDoNothing().returning({ id: inquiries.id });
    if (!row) return { ok: true, message: RECEIVED };
    try {
      after(async () => { try { await processInquiry(row.id); } catch { console.error("[inquiry] processing failed"); } });
    } catch (error) {
      console.error("[inquiry] scheduling failed");
    }
    return { ok: true, message: RECEIVED };
  } catch (error) {
    console.error("[inquiry] intake failed");
    return { ok: false, message: UNAVAILABLE };
  }
}

export async function processInquiry(id: string): Promise<void> {
  if (!hasDatabase || !z.uuid().safeParse(id).success) return;
  const token = crypto.randomUUID();
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MS);
  const [claimed] = await getDb().update(inquiries).set({ processingToken: token, processingLeaseUntil: leaseUntil })
    .where(and(eq(inquiries.id, id), or(isNull(inquiries.processingLeaseUntil), lt(inquiries.processingLeaseUntil, now)),
      or(eq(inquiries.analysisStatus, "pending"), eq(inquiries.analysisStatus, "failed"), eq(inquiries.notificationStatus, "pending"), eq(inquiries.notificationStatus, "failed"), eq(inquiries.notificationStatus, "sending"))))
    .returning();
  if (!claimed) return;

  let row = claimed;
  if (row.analysisStatus === "pending" || row.analysisStatus === "failed") {
    try {
      const input: InquiryAnalysisInput = {
        organization: row.organization ?? "",
        audience: row.audience ?? "",
        message: row.message,
        educationGoal: row.educationGoal ?? "",
      };
      const analysis = await analyzeInquiry(input);
      const wasNotified = row.notificationStatus === "sent";
      const [updated] = await getDb().update(inquiries).set({
        analysis, analysisStatus: "complete", analysisError: null,
        analysisAt: new Date(), analysisModel: getInquiryAiProvider() === "openrouter" ? (process.env.INQUIRY_AI_MODEL?.trim() || process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash") : `${getInquiryAiProvider()}-cli`,
        ...(wasNotified || !row.notificationAttemptedAt ? { notificationStatus: "pending", notificationPayload: null,
          notificationKey: null, notificationAttemptedAt: null, notificationError: null } : {}),
      }).where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token))).returning();
      if (!updated) return;
      row = updated;
    } catch (error) {
      const [updated] = await getDb().update(inquiries).set({ analysisStatus: "failed", analysisError: "AI 분석 요청에 실패했습니다.", analysisAt: new Date() })
        .where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token))).returning();
      if (!updated) return;
      row = updated;
    }
  }

  if (row.notificationStatus === "sent" || row.notificationStatus === "uncertain") {
    await release(id, token);
    return;
  }
  if (!process.env.RESEND_API_KEY) {
    await getDb().update(inquiries).set({ notificationStatus: "failed", notificationError: "메일 서비스 설정이 필요합니다.", processingToken: null, processingLeaseUntil: null })
      .where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token)));
    return;
  }
  const payload = row.notificationPayload ?? mailPayload(row);
  const key = row.notificationKey ?? `inquiry-${id}-${row.analysisAt?.getTime() ?? 0}`;
  const needsNewAnalysisMail = row.analysisStatus === "complete" && Boolean(row.notificationKey) && key !== `inquiry-${id}-${row.analysisAt?.getTime() ?? 0}`;
  const firstAttempt = row.notificationAttemptedAt;
  if (firstAttempt && Date.now() - firstAttempt.getTime() > IDEMPOTENCY_HOURS * 3_600_000) {
    await getDb().update(inquiries).set({ notificationStatus: "uncertain", notificationError: "Delivery outcome unknown after provider idempotency window", processingToken: null, processingLeaseUntil: null })
      .where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token)));
    return;
  }
  const [sending] = await getDb().update(inquiries).set({
    notificationStatus: "sending", notificationPayload: payload, notificationKey: key,
    notificationAttemptedAt: firstAttempt ?? new Date(), notificationError: null,
  }).where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token))).returning();
  if (!sending) return;
  let sentOldVersion = false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(MAIL_TIMEOUT_MS),
    });
    const body = await response.json() as { id?: string; message?: string };
    if (!response.ok || !body.id) throw new Error(body.message || `Resend HTTP ${response.status}`);
    await getDb().update(inquiries).set({
      notificationStatus: needsNewAnalysisMail ? "pending" : "sent",
      notificationProviderId: body.id, notificationSentAt: new Date(), notificationError: null,
      ...(needsNewAnalysisMail ? { notificationKey: null, notificationPayload: null, notificationAttemptedAt: null } : {}),
    }).where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token)));
    sentOldVersion = needsNewAnalysisMail;
  } catch (error) {
    await getDb().update(inquiries).set({ notificationStatus: "failed", notificationError: "메일 발송 결과를 확인하지 못했습니다." })
      .where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token)));
  } finally {
    await release(id, token);
  }
  if (sentOldVersion) await processInquiry(id);
}

async function release(id: string, token: string) {
  await getDb().update(inquiries).set({ processingToken: null, processingLeaseUntil: null })
    .where(and(eq(inquiries.id, id), eq(inquiries.processingToken, token)));
}
