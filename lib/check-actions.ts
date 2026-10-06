"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth";
import { getGroupStats, isGroupOpen, INDIVIDUAL_GROUP_CODE, INDIVIDUAL_GROUP_NAME } from "@/lib/check-data";
import { isAllowedAiModel } from "@/lib/ai-models";
import { buildAiSummaryMessages } from "@/lib/ai-summary-prompt";
import { getDb, hasDatabase } from "@/lib/db";
import { checkCompletions, checkGroups, checkResponses } from "@/lib/db/schema";
import { receiveInquiry } from "@/lib/inquiry-service";
import {
  AREAS,
  MATURITY_LEVELS,
  ORG_UPSKILLING_GUIDE,
  computeResult,
  type Answers,
  type AreaKey,
  type DiagnosticResult
} from "@/lib/diagnostic";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "jamescm8445@gmail.com").trim();
const RESEND_FROM = process.env.RESEND_FROM ?? "AI OpenCollege <edu@opencollege.co.kr>";

// ── Helpers ──────────────────────────────────────────────
function escapeHtml(value: string | undefined): string {
  return (value || "-").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

function safeSubject(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

function ensureDb() {
  if (!hasDatabase) throw new Error("데이터베이스 연결이 필요합니다.");
}

function areaTitle(key: AreaKey): string {
  return AREAS.find((a) => a.key === key)?.title ?? key;
}

function parseExpiresAt(value: FormDataEntryValue | null): { value: string; expiresAt: Date | null; valid: boolean } {
  const raw = String(value ?? "").trim();
  if (!raw) return { value: raw, expiresAt: null, valid: true };
  const expiresAt = new Date(`${raw}T23:59:59+09:00`);
  return { value: raw, expiresAt, valid: !Number.isNaN(expiresAt.getTime()) };
}

// 모든 문항 코드 집합 (A1..E6). D 코드만 0(미적용) 허용.
const ALL_CODES: string[] = AREAS.flatMap((area) => area.questions.map((q) => q.code));
const D_CODES = new Set(AREAS.find((a) => a.key === "D")!.questions.map((q) => q.code));

// 서버측 응답 검증: 정확히 30개 코드, 값 1..5 (D 코드는 0 허용). 실패 시 null.
function validateAnswers(input: unknown): Answers | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== ALL_CODES.length) return null;

  const answers: Answers = {};
  for (const code of ALL_CODES) {
    if (!(code in record)) return null;
    const raw = record[code];
    if (typeof raw !== "number" || !Number.isInteger(raw)) return null;
    if (raw === 0) {
      if (!D_CODES.has(code)) return null; // 0은 D 코드에서만 허용
    } else if (raw < 1 || raw > 5) {
      return null;
    }
    answers[code] = raw;
  }
  // 알 수 없는 키 방지 (keys.length === ALL_CODES.length 이고 모든 코드 포함 확인됨).
  return answers;
}

function clamp(value: string | undefined, max: number): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

// 결과 → checkResponses insert 값.
function toResponseRow(groupId: string, identity: {
  name: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  note: string;
}, background: {
  role?: string;
  frequency?: string;
  environment?: string;
  purpose?: string;
}, answers: Answers, result: DiagnosticResult) {
  return {
    groupId,
    name: clamp(identity.name, 80) ?? null,
    department: clamp(identity.department, 80) ?? null,
    position: clamp(identity.position, 60) ?? null,
    phone: clamp(identity.phone, 60) ?? null,
    email: clamp(identity.email, 160) ?? null,
    note: clamp(identity.note, Number.MAX_SAFE_INTEGER) ?? null,
    role: clamp(background.role, 60) ?? null,
    frequency: clamp(background.frequency, 60) ?? null,
    environment: clamp(background.environment, 120) ?? null,
    purpose: clamp(background.purpose, 60) ?? null,
    answers,
    scoreA: result.areaScores.A ?? 0,
    scoreB: result.areaScores.B ?? 0,
    scoreC: result.areaScores.C ?? 0,
    scoreD: result.dApplicable ? result.areaScores.D ?? 0 : null,
    scoreE: result.areaScores.E ?? 0,
    validAverage: result.validAverage,
    baseLevel: result.baseLevel,
    finalLevel: result.finalLevel,
    dApplicable: result.dApplicable,
    gateCount: result.gates.length
  };
}

// 결과 요약 한 줄 텍스트.
function resultSummaryLine(result: DiagnosticResult): string {
  const maturity = MATURITY_LEVELS[result.finalLevel];
  const d = result.dApplicable ? `${result.areaScores.D ?? 0}/30` : "미적용";
  return `[AI학습체크] Level ${result.finalLevel} ${maturity.name} · 평균 ${result.validAverage.toFixed(1)} · A ${result.areaScores.A ?? 0}/30 · B ${result.areaScores.B ?? 0}/30 · C ${result.areaScores.C ?? 0}/30 · D ${d} · E ${result.areaScores.E ?? 0}/30 · 게이트 ${result.gates.length}건`;
}

// 결과 영역별 표 (이메일용).
function areaTableRows(result: DiagnosticResult): string {
  return (["A", "B", "C", "D", "E"] as AreaKey[])
    .map((key) => {
      const score = result.areaScores[key];
      const band = result.areaLevels[key];
      const scoreText = score === null ? "미적용" : `${score}/30`;
      const levelText = band?.label ?? "-";
      return `<tr><td style="padding:6px 10px;border:1px solid #e0ddd6"><strong>${key}</strong> ${escapeHtml(areaTitle(key))}</td><td style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center">${escapeHtml(scoreText)}</td><td style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center">${escapeHtml(levelText)}</td></tr>`;
    })
    .join("");
}

// ── (a) 조직 진단 응답 저장 ──────────────────────────────
export async function submitOrgCheckResponse(
  code: string,
  identity: { name: string; department: string; position: string; phone: string; email: string; note: string },
  background: { role: string; frequency: string; environment: string; purpose: string },
  answers: Record<string, number>
): Promise<{ ok: boolean; message: string }> {
  const identityComplete = [identity.name, identity.department, identity.position, identity.phone, identity.note]
    .every((value) => value.trim().length > 0);
  const emailValid = z.string().email().safeParse(identity.email.trim()).success;
  if (!identityComplete || !emailValid) {
    return { ok: false, message: "이름, 부서, 직급, 전화번호, 이메일, 하고 싶은 말을 모두 입력해 주세요." };
  }

  if (!hasDatabase) {
    return { ok: false, message: "저장소가 설정되지 않아 응답을 기록하지 못했습니다." };
  }

  const [group] = await getDb()
    .select()
    .from(checkGroups)
    .where(eq(checkGroups.code, code))
    .limit(1);
  if (!group || !isGroupOpen(group)) {
    return { ok: false, message: "응답 기간이 종료되었거나 유효하지 않은 진단 링크입니다." };
  }

  const validated = validateAnswers(answers);
  if (!validated) {
    return { ok: false, message: "응답값이 올바르지 않습니다." };
  }

  const result = computeResult(validated);

  try {
    await getDb().insert(checkResponses).values(toResponseRow(group.id, identity, background, validated, result));
  } catch (e) {
    console.error("[check] 응답 저장 실패:", e);
    return { ok: false, message: "응답 저장 중 오류가 발생했습니다." };
  }

  return { ok: true, message: "응답이 저장되었습니다." };
}

// ── (b) 내 결과 이메일 발송 ──────────────────────────────
export async function recordCheckCompletion(): Promise<{ ok: boolean }> {
  if (!hasDatabase) return { ok: false };
  try {
    await getDb().insert(checkCompletions).values({ source: "individual" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// 개인 진단 응답을 담는 예약 그룹을 보장하고 id를 반환한다.
async function ensureIndividualGroupId(): Promise<string> {
  const db = getDb();
  await db
    .insert(checkGroups)
    .values({ name: INDIVIDUAL_GROUP_NAME, code: INDIVIDUAL_GROUP_CODE, active: false })
    .onConflictDoNothing({ target: checkGroups.code });
  const [group] = await db
    .select({ id: checkGroups.id })
    .from(checkGroups)
    .where(eq(checkGroups.code, INDIVIDUAL_GROUP_CODE))
    .limit(1);
  return group.id;
}

// ── (b-2) 개인 진단 응답 저장 (결과 확인 전 인적사항 수집) ──
export async function submitIndividualCheckResponse(
  identity: { name: string; organization: string; phone: string; email: string; note: string },
  background: { role: string; frequency: string; environment: string; purpose: string },
  answers: Record<string, number>
): Promise<{ ok: boolean; message: string }> {
  const name = identity.name.trim();
  const phone = identity.phone.trim();
  const emailValid = z.string().email().safeParse(identity.email.trim()).success;
  if (!name || !phone || !emailValid) {
    return { ok: false, message: "이름, 연락처, 이메일을 정확히 입력해 주세요." };
  }

  if (!hasDatabase) {
    return { ok: false, message: "저장소가 설정되지 않아 응답을 기록하지 못했습니다." };
  }

  const validated = validateAnswers(answers);
  if (!validated) {
    return { ok: false, message: "응답값이 올바르지 않습니다." };
  }

  const result = computeResult(validated);

  try {
    const groupId = await ensureIndividualGroupId();
    await getDb().insert(checkResponses).values(
      toResponseRow(
        groupId,
        { name, department: identity.organization, position: "", phone, email: identity.email, note: identity.note },
        background,
        validated,
        result
      )
    );
  } catch (e) {
    console.error("[check] 개인 응답 저장 실패:", e);
    return { ok: false, message: "응답 저장 중 오류가 발생했습니다." };
  }

  return { ok: true, message: "응답이 저장되었습니다." };
}

const emailSchema = z.string().email();

export async function emailMyResult(
  email: string,
  answers: Record<string, number>
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: "이메일 주소를 확인해주세요." };
  }

  const validated = validateAnswers(answers);
  if (!validated) {
    return { ok: false, message: "응답값이 올바르지 않습니다." };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, message: "이메일 발송이 설정되지 않았습니다." };
  }

  const result = computeResult(validated);
  const maturity = MATURITY_LEVELS[result.finalLevel];

  const strengthRows = result.strengths
    .map(
      (key) =>
        `<li style="margin-bottom:8px"><strong>${key} ${escapeHtml(areaTitle(key))}</strong><br/>${escapeHtml(result.areaSentences[key] ?? "-")}</li>`
    )
    .join("");
  const priorityRows = result.priorities
    .map(
      (key) =>
        `<li style="margin-bottom:8px"><strong>${key} ${escapeHtml(areaTitle(key))}</strong><br/>${escapeHtml(result.areaSentences[key] ?? "-")}</li>`
    )
    .join("");

  const gatesBlock = result.gates.length
    ? `<h3 style="margin:24px 0 8px">안전한 다음 단계</h3><ul style="padding-left:18px;line-height:1.7">${result.gates
        .map((g) => `<li>${escapeHtml(g)}</li>`)
        .join("")}</ul>`
    : "";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: RESEND_FROM,
      to: parsed.data,
      subject: `[AI OpenCollege] AI학습체크 결과 · Level ${result.finalLevel}`,
      html: `
        <div style="font-family:'Pretendard',sans-serif;color:#0e1b3c;max-width:640px;margin:0 auto">
          <h2 style="margin:0 0 6px">종합 Level ${result.finalLevel} · ${escapeHtml(maturity.name)}</h2>
          <p style="color:#38405a;line-height:1.6;margin:0 0 4px">${escapeHtml(maturity.behavior)}</p>
          <p style="color:#6b7190;margin:0 0 20px">유효 문항 평균 <strong>${result.validAverage.toFixed(1)}</strong> / 5.0</p>

          <h3 style="margin:0 0 8px">영역별 결과</h3>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <thead>
              <tr>
                <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:left;background:#f2efe8">영역</th>
                <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center;background:#f2efe8">점수</th>
                <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center;background:#f2efe8">수준</th>
              </tr>
            </thead>
            <tbody>${areaTableRows(result)}</tbody>
          </table>

          <h3 style="margin:24px 0 8px">강점 영역</h3>
          <ul style="padding-left:18px;line-height:1.6">${strengthRows}</ul>
          <h3 style="margin:16px 0 8px">우선 학습 영역</h3>
          <ul style="padding-left:18px;line-height:1.6">${priorityRows}</ul>
          ${gatesBlock}

          <hr style="border:none;border-top:1px solid #e0ddd6;margin:28px 0 16px"/>
          <p style="color:#6b7190;font-size:13px;line-height:1.6">
            더 알아보기: <a href="https://opencollege.co.kr" style="color:#e85a3e">opencollege.co.kr</a><br/>
            우리 조직 맞춤 교육이 필요하시면 사이트에서 교육 문의를 남겨주세요.
          </p>
        </div>
      `
    });
  } catch (e) {
    console.error("[check] 결과 이메일 발송 실패:", e);
    return { ok: false, message: "이메일 발송 중 오류가 발생했습니다." };
  }

  return { ok: true, message: "결과가 이메일로 발송되었습니다." };
}

// ── (c) 학습체크 결과 기반 교육 문의 ─────────────────────
export async function submitCheckInquiry(
  _: unknown,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  if (formData.get("privacy") !== "on" || String(formData.get("website") ?? "").trim()) {
    return { ok: false, message: "입력 내용과 개인정보 동의를 확인해 주세요." };
  }
  let answers: unknown;
  try { answers = JSON.parse(String(formData.get("answersJson") ?? "")); }
  catch { return { ok: false, message: "진단 결과를 확인할 수 없습니다. 다시 시도해 주세요." }; }
  const validated = validateAnswers(answers);
  if (!validated) return { ok: false, message: "진단 결과를 확인할 수 없습니다. 다시 시도해 주세요." };
  const result = computeResult(validated);
  const resultSummary = resultSummaryLine(result);
  const userMessage = String(formData.get("message") ?? "").trim();
  if (userMessage.length > 3500) return { ok: false, message: "문의 내용을 줄여 주세요." };
  return receiveInquiry({
    name: formData.get("name"), organization: String(formData.get("organization") ?? ""),
    email: formData.get("email"), phone: formData.get("phone"),
    audience: "AI학습체크 문의", educationGoal: String(formData.get("educationGoal") ?? ""),
    message: (userMessage ? userMessage + "\n\n" : "") + resultSummary,
    source: "learning_check", rateIdentity: String(formData.get("email") ?? "")
  });
}

// ── (d) 관리자: 조직 그룹 CRUD ───────────────────────────
function randomCode(): string {
  // 8자 소문자 base36.
  return crypto.randomBytes(8).toString("hex").slice(0, 8).replace(/[^0-9a-z]/g, "0");
}

export async function createCheckGroup(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/checks");
  const expiry = parseExpiresAt(formData.get("expiresAt"));
  if (!expiry.valid) redirect("/admin/checks");

  const db = getDb();
  let code = randomCode();
  try {
    await db.insert(checkGroups).values({ name: name.slice(0, 120), code, expiresAt: expiry.expiresAt });
  } catch {
    // 유니크 충돌 시 한 번 재시도.
    code = randomCode();
    await db.insert(checkGroups).values({ name: name.slice(0, 120), code, expiresAt: expiry.expiresAt });
  }
  await audit("check.group-create", name.slice(0, 120));
  revalidatePath("/admin/checks");
  redirect("/admin/checks");
}

export async function updateCheckGroupExpiry(id: string, formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const expiry = parseExpiresAt(formData.get("expiresAt"));
  if (!expiry.valid) redirect("/admin/checks");

  await getDb()
    .update(checkGroups)
    .set({ expiresAt: expiry.expiresAt })
    .where(eq(checkGroups.id, id));
  await audit("check.group-expiry", `${id} → ${expiry.value || "무기한"}`);
  revalidatePath("/admin/checks");
  redirect("/admin/checks");
}

export async function toggleCheckGroup(id: string) {
  await requireAdminSession();
  ensureDb();
  const db = getDb();
  const [group] = await db.select().from(checkGroups).where(eq(checkGroups.id, id)).limit(1);
  if (group) {
    await db.update(checkGroups).set({ active: !group.active }).where(eq(checkGroups.id, id));
  }
  await audit("check.group-toggle", id);
  revalidatePath("/admin/checks");
  redirect("/admin/checks");
}

export async function deleteCheckGroup(id: string) {
  await requireAdminSession();
  ensureDb();
  const db = getDb();
  await db.delete(checkResponses).where(eq(checkResponses.groupId, id));
  await db.delete(checkGroups).where(eq(checkGroups.id, id));
  await audit("check.group-delete", id);
  revalidatePath("/admin/checks");
  redirect("/admin/checks");
}

// ── (e) 관리자: AI 총평 생성(캐시) ───────────────────────
const pctText = (value: number) => `${Math.round(value * 100)}%`;

export async function generateAiSummary(
  groupId: string,
  force = false,
  model?: string
): Promise<{ ok: boolean; summary?: string; message?: string }> {
  await requireAdminSession();
  if (!hasDatabase) {
    return { ok: false, message: "데이터베이스 연결이 필요합니다." };
  }

  const db = getDb();
  const [group] = await db.select().from(checkGroups).where(eq(checkGroups.id, groupId)).limit(1);
  if (!group) {
    return { ok: false, message: "진단 그룹을 찾을 수 없습니다." };
  }

  // 저장된 총평이 있고 강제 재생성이 아니면 API 호출 없이 반환.
  if (group.aiSummary && !force) {
    return { ok: true, summary: group.aiSummary };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, message: "OPENROUTER_API_KEY가 설정되지 않았습니다." };
  }

  const stats = await getGroupStats(groupId);
  if (stats.n === 0) {
    return { ok: false, message: "응답이 없어 총평을 생성할 수 없습니다." };
  }

  const { system: systemPrompt, user: userPrompt } = buildAiSummaryMessages(group.name, stats);

  let summary: string;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://opencollege.co.kr",
        "X-Title": "AI OpenCollege"
      },
      body: JSON.stringify({
        model: model && isAllowedAiModel(model) ? model : (process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash"),
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      console.error("[check] AI 총평 생성 실패:", res.status);
      return { ok: false, message: "AI 총평 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      return { ok: false, message: "AI 총평 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }
    summary = content.trim();
  } catch (e) {
    console.error("[check] AI 총평 생성 오류:", e);
    return { ok: false, message: "AI 총평 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  try {
    await db
      .update(checkGroups)
      .set({ aiSummary: summary, aiSummaryAt: new Date() })
      .where(eq(checkGroups.id, groupId));
  } catch (e) {
    console.error("[check] AI 총평 저장 실패:", e);
    return { ok: false, message: "AI 총평 저장에 실패했습니다." };
  }

  await audit("check.ai-summary", `${groupId} · ${model ?? "default"}`);
  revalidatePath(`/admin/checks/${groupId}`);
  return { ok: true, summary };
}
