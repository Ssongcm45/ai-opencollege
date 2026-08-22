"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth";
import { getGroupStats } from "@/lib/check-data";
import { isAllowedAiModel } from "@/lib/ai-models";
import { getDb, hasDatabase } from "@/lib/db";
import { checkCompletions, checkGroups, checkResponses, inquiries } from "@/lib/db/schema";
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
  if (!group || !group.active) {
    return { ok: false, message: "유효하지 않거나 종료된 진단 링크입니다." };
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
const checkInquirySchema = z.object({
  name: z.string().min(1),
  organization: z.string().optional(),
  email: z.string().email().min(1),
  phone: z.string().min(1),
  message: z.string().optional(),
  privacy: z.literal("on")
});

export async function submitCheckInquiry(
  _: unknown,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const parsed = checkInquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "필수 입력 항목과 개인정보 수집 및 이용 동의 여부를 확인해주세요." };
  }
  const data = parsed.data;

  let answers: unknown;
  try {
    answers = JSON.parse(String(formData.get("answersJson") ?? ""));
  } catch {
    return { ok: false, message: "진단 결과 정보를 확인할 수 없습니다. 다시 시도해주세요." };
  }
  const validated = validateAnswers(answers);
  if (!validated) {
    return { ok: false, message: "진단 결과 정보를 확인할 수 없습니다. 다시 시도해주세요." };
  }

  const result = computeResult(validated);
  const maturity = MATURITY_LEVELS[result.finalLevel];
  const resultSummary = resultSummaryLine(result);
  const userMessage = (data.message ?? "").trim();
  const combinedMessage = (userMessage ? `${userMessage}\n\n` : "") + resultSummary;

  if (hasDatabase) {
    try {
      await getDb().insert(inquiries).values({
        name: data.name,
        organization: data.organization,
        email: data.email,
        phone: data.phone,
        audience: "AI학습체크 문의",
        message: combinedMessage
      });
    } catch (e) {
      console.error("[check] 문의 저장 실패:", e);
      return { ok: false, message: "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: RESEND_FROM,
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: `[AI OpenCollege] 학습체크 교육 문의: ${safeSubject(data.name)} (Level ${result.finalLevel})`,
        html: `
          <h2>AI학습체크 결과와 함께 교육 문의가 접수되었습니다</h2>
          <table cellpadding="8" style="border-collapse:collapse;margin-bottom:20px">
            <tr><td><strong>이름</strong></td><td>${escapeHtml(data.name)}</td></tr>
            <tr><td><strong>소속</strong></td><td>${escapeHtml(data.organization)}</td></tr>
            <tr><td><strong>이메일</strong></td><td>${escapeHtml(data.email)}</td></tr>
            <tr><td><strong>전화</strong></td><td>${escapeHtml(data.phone)}</td></tr>
            <tr><td><strong>문의 내용</strong></td><td style="white-space:pre-wrap">${escapeHtml(userMessage || "-")}</td></tr>
          </table>
          <div style="background:#f2efe8;border-left:4px solid #e85a3e;padding:14px 16px;border-radius:8px">
            <p style="margin:0 0 10px;font-weight:800;color:#0e1b3c">진단 결과 · 종합 Level ${result.finalLevel} (${escapeHtml(maturity.name)}) · 유효 평균 ${result.validAverage.toFixed(1)}</p>
            <table style="border-collapse:collapse;width:100%;font-size:13px">
              <thead>
                <tr>
                  <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:left;background:#fff">영역</th>
                  <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center;background:#fff">점수</th>
                  <th style="padding:6px 10px;border:1px solid #e0ddd6;text-align:center;background:#fff">수준</th>
                </tr>
              </thead>
              <tbody>${areaTableRows(result)}</tbody>
            </table>
            ${
              result.gates.length
                ? `<p style="margin:12px 0 4px;font-weight:700;color:#0e1b3c">안전 게이트 (${result.gates.length}건)</p><ul style="margin:0;padding-left:18px;line-height:1.6;color:#38405a">${result.gates
                    .map((g) => `<li>${escapeHtml(g)}</li>`)
                    .join("")}</ul>`
                : `<p style="margin:12px 0 0;color:#38405a">안전 게이트 경보 없음</p>`
            }
          </div>
        `
      });
    } catch (e) {
      console.error("[check] 문의 이메일 발송 실패:", e);
    }
  }

  return {
    ok: true,
    message: "문의가 접수되었습니다. 진단 결과와 함께 전달되었으며 24시간 내 회신드리겠습니다."
  };
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

  const db = getDb();
  let code = randomCode();
  try {
    await db.insert(checkGroups).values({ name: name.slice(0, 120), code });
  } catch {
    // 유니크 충돌 시 한 번 재시도.
    code = randomCode();
    await db.insert(checkGroups).values({ name: name.slice(0, 120), code });
  }
  await audit("check.group-create", name.slice(0, 120));
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

  const dominantLevel = ([1, 2, 3, 4, 5] as const).reduce(
    (dominant, level) =>
      stats.levelDistribution[level] >= stats.levelDistribution[dominant] ? level : dominant,
    1 as 1 | 2 | 3 | 4 | 5
  );
  const guide = ORG_UPSKILLING_GUIDE[dominantLevel];

  const levelLines = ([1, 2, 3, 4, 5] as const)
    .map((level) => `Level ${level} ${MATURITY_LEVELS[level].name}: ${stats.levelDistribution[level]}명`)
    .join(", ");
  const areaLines = (["A", "B", "C", "D", "E"] as AreaKey[])
    .map((key) => {
      const avg = stats.areaAverages[key];
      return `${key}(${areaTitle(key)}): ${avg === null ? "미적용" : `${avg.toFixed(1)}/30`}`;
    })
    .join(", ");
  const lowestAreaText = stats.lowestArea
    ? `${stats.lowestArea}(${areaTitle(stats.lowestArea)})`
    : "없음";
  const roleLines = stats.roleDistribution.map((r) => `${r.role} ${r.count}명`).join(", ") || "없음";

  const systemPrompt =
    "당신은 조직의 AI 업무 역량 진단 결과를 해석하는 교육 컨설턴트다. 과장 없이 데이터에 근거해 쓰고, 개인을 지목하지 않으며, '낮음' 대신 '우선 학습 영역' 같은 성장 언어를 쓴다.";

  const userPrompt = [
    `조직명: ${group.name}`,
    `응답 수: ${stats.n}명`,
    `평균 유효점수: ${stats.avgValidAverage.toFixed(1)}/5.0`,
    `Level 분포: ${levelLines}`,
    `영역별 평균: ${areaLines}`,
    `우선 학습(최저) 영역: ${lowestAreaText}`,
    `안전 준비도 — E 21점 이상 비율: ${pctText(stats.eSafeRate)}, 게이트 무경보 비율: ${pctText(stats.gatePassRate)}, D 적용자 중 D 준비율: ${stats.dReadyRate === null ? "해당 없음" : pctText(stats.dReadyRate)}`,
    `역할 분포: ${roleLines}`,
    `우세 Level(${dominantLevel}) 업스킬링 가이드 — 목표: ${guide.goal} / 권장 프로그램: ${guide.programs} / 운영 주의점: ${guide.caution}`,
    "",
    "다음 구성으로 순수 텍스트(마크다운 금지) 총평을 작성하라: ① 종합 총평 2~3문단 ② 영역별 해석(강점 2개·우선 학습 2개 중심) ③ 권장 교육 우선순위 3가지. 전체 900~1400자, 문단 사이 빈 줄."
  ].join("\n");

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
