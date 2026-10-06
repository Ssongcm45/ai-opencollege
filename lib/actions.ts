"use server";

import crypto from "crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { clearAdminSessionCookie, requireAdminSession, setAdminSessionCookie } from "@/lib/auth";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, categories, blogPosts, fieldCases, inquiries, inquiryNotes, portfolioItems, siteSettings } from "@/lib/db/schema";
import { receiveInquiry } from "@/lib/inquiry-service";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "jamescm8445@gmail.com").trim();

// ── Helpers ──────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(derived, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function escapeHtml(value: string | undefined): string {
  return (value || "-").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

function safeSubject(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "del", "s", "u", "ul", "ol", "li", "blockquote", "a", "code", "pre", "span", "table", "thead", "tbody", "tr", "th", "td", "img"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"], "*": ["class"] },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard"
  });
}

function ensureDb() {
  if (!hasDatabase) throw new Error("데이터베이스 연결이 필요합니다.");
}

// 정적으로 프리렌더된 공개 페이지(홈·목록·사이트맵)에 CMS 변경을 즉시 반영한다.
function revalidatePublic() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");
  revalidatePath("/llms.txt");
}

// ── Public: Inquiry ──────────────────────────────────────
export async function createInquiry(_: unknown, formData: FormData) {
  if (formData.get("privacy") !== "on") return { ok: false, message: "개인정보 수집 및 이용에 동의해 주세요." };
  if (String(formData.get("website") ?? "").trim()) return { ok: false, message: "입력 내용을 확인해 주세요." };
  const input = Object.fromEntries(formData);
  return receiveInquiry({
    name: input.name, organization: input.organization, email: input.email,
    phone: input.phone, audience: input.audience, message: input.message,
    educationGoal: input.educationGoal, source: "contact",
    rateIdentity: String(input.email ?? "")
  });
}

// ── Admin: Auth ──────────────────────────────────────────
export async function setupAdminPassword(formData: FormData) {
  if (!hasDatabase) redirect("/admin/login?error=nodb");
  const email = String(formData.get("email") ?? "");
  const setupToken = String(formData.get("setupToken") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/admin/login?error=email");
  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  if (!expectedToken || expectedToken.length < 32 ||
    !crypto.timingSafeEqual(
      crypto.createHash("sha256").update(setupToken).digest(),
      crypto.createHash("sha256").update(expectedToken).digest()
    )) redirect("/admin/login?error=setup");
  if (password.length < 8) redirect("/admin/login?setup=1&error=short");
  if (password !== confirm) redirect("/admin/login?setup=1&error=mismatch");

  const db = getDb();
  const passwordHash = hashPassword(password);
  const [created] = await db.insert(adminConfig)
    .values({ id: 1, passwordHash })
    .onConflictDoUpdate({
      target: adminConfig.id,
      set: { passwordHash },
      setWhere: isNull(adminConfig.passwordHash)
    })
    .returning({ sessionVersion: adminConfig.sessionVersion });
  if (!created) redirect("/admin/login?error=1");
  await audit("password.setup");
  await setAdminSessionCookie(created.sessionVersion);
  redirect("/admin");
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

// 로그인 알림 이메일 발송(실패해도 로그인 흐름을 막지 않도록 try/catch로 감싸 await).
async function sendLoginNotification() {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "-";
    const kst = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "AI OpenCollege <edu@opencollege.co.kr>",
      to: ADMIN_EMAIL,
      subject: "[AI OpenCollege] 관리자 로그인 알림",
      html: `
        <h2>관리자 계정 로그인이 감지되었습니다</h2>
        <table cellpadding="8" style="border-collapse:collapse">
          <tr><td><strong>시각 (KST)</strong></td><td>${escapeHtml(kst)}</td></tr>
          <tr><td><strong>IP</strong></td><td>${escapeHtml(ip)}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:13px">본인이 아니라면 즉시 비밀번호를 변경하고 세션을 폐기하세요.</p>
      `
    });
  } catch (e) {
    console.error("[Resend] 로그인 알림 발송 실패:", e);
  }
}

export async function loginAdmin(formData: FormData) {
  if (!hasDatabase) redirect("/admin/login?error=nodb");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/admin/login?error=1");
  }

  const db = getDb();
  const rows = await db.select().from(adminConfig).where(eq(adminConfig.id, 1));
  const config = rows[0];

  // 잠금 상태면 비밀번호 검증 없이 차단한다.
  if (config?.lockedUntil && config.lockedUntil.getTime() > Date.now()) {
    await audit("login.fail", "locked");
    redirect("/admin/login?error=locked");
  }

  const stored = config?.passwordHash;
  const passwordOk = !!stored && verifyPassword(password, stored);

  if (!passwordOk) {
    // 설정 행이 존재할 때만 실패 카운터를 증가시킨다.
    if (config) {
      const nextAttempts = (config.failedAttempts ?? 0) + 1;
      let justLocked = false;
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        await db
          .update(adminConfig)
          .set({ failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) })
          .where(eq(adminConfig.id, 1));
        justLocked = true;
      } else {
        await db.update(adminConfig).set({ failedAttempts: nextAttempts }).where(eq(adminConfig.id, 1));
      }
      await audit(justLocked ? "login.locked" : "login.fail", "잘못된 자격 증명");
      redirect(justLocked ? "/admin/login?error=locked" : "/admin/login?error=1");
    }
    await audit("login.fail", "잘못된 자격 증명");
    redirect("/admin/login?error=1");
  }

  // 성공: 실패 카운터/잠금 초기화 후 세션 발급.
  await db.update(adminConfig).set({ failedAttempts: 0, lockedUntil: null }).where(eq(adminConfig.id, 1));
  await audit("login.success");
  // redirect()는 예외를 던지므로 이메일 발송을 그 전에 완료한다.
  await sendLoginNotification();
  await setAdminSessionCookie(config?.sessionVersion ?? 1);
  redirect("/admin");
}

export async function logoutAdmin() {
  await audit("logout");
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

// ── Admin: Change password ───────────────────────────────
export async function changeAdminPassword(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const db = getDb();
  const [config] = await db.select().from(adminConfig).where(eq(adminConfig.id, 1)).limit(1);
  const stored = config?.passwordHash;
  if (!stored || !verifyPassword(currentPassword, stored)) {
    redirect("/admin/settings?pwerror=current");
  }
  if (newPassword.length < 8) redirect("/admin/settings?pwerror=short");
  if (newPassword !== confirm) redirect("/admin/settings?pwerror=mismatch");

  // 새 해시 저장 + 세션 버전 증가(현재 브라우저 외 모든 세션 폐기).
  const [updated] = await db
    .update(adminConfig)
    .set({ passwordHash: hashPassword(newPassword), sessionVersion: sql`${adminConfig.sessionVersion} + 1` })
    .where(and(eq(adminConfig.id, 1), eq(adminConfig.passwordHash, stored)))
    .returning({ sessionVersion: adminConfig.sessionVersion });
  if (!updated) redirect("/admin/settings?pwerror=current");
  await audit("password.change");
  // 현재 브라우저는 새 버전으로 재발급해 로그인 유지.
  await setAdminSessionCookie(updated.sessionVersion);
  redirect("/admin/settings?pwsaved=1");
}

// ── Admin: Blog ──────────────────────────────────────────
export async function createPost(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const published = formData.get("published") === "on";
  const now = new Date();
  await getDb().insert(blogPosts).values({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    category: String(formData.get("category") ?? "METHOD"),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: sanitizeContent(String(formData.get("content") ?? "")),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    published,
    featured: formData.get("featured") === "on",
    publishedAt: published ? now : null,
    updatedAt: now
  });
  await audit("post.create", String(formData.get("title") ?? ""));
  revalidatePublic();
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const published = formData.get("published") === "on";
  const [existing] = await getDb().select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  await getDb().update(blogPosts).set({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    category: String(formData.get("category") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: sanitizeContent(String(formData.get("content") ?? "")),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    published,
    featured: formData.get("featured") === "on",
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
    updatedAt: new Date()
  }).where(eq(blogPosts.id, id));
  await audit("post.update", String(formData.get("title") ?? id));
  revalidatePublic();
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(blogPosts).where(eq(blogPosts.id, id));
  await audit("post.delete", id);
  revalidatePublic();
  redirect("/admin/blog");
}

// ── Admin: Cases (출강사례) ───────────────────────────────
export async function createCase(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const now = new Date();
  await getDb().insert(fieldCases).values({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    clientType: String(formData.get("clientType") ?? ""),
    hours: String(formData.get("hours") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: sanitizeContent(String(formData.get("content") ?? "")),
    videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: now
  });
  await audit("case.create", String(formData.get("title") ?? ""));
  revalidatePublic();
  redirect("/admin/cases");
}

export async function updateCase(id: string, formData: FormData) {
  await requireAdminSession();
  ensureDb();
  await getDb().update(fieldCases).set({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    clientType: String(formData.get("clientType") ?? ""),
    hours: String(formData.get("hours") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: sanitizeContent(String(formData.get("content") ?? "")),
    videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: new Date()
  }).where(eq(fieldCases.id, id));
  await audit("case.update", String(formData.get("title") ?? id));
  revalidatePublic();
  redirect("/admin/cases");
}

export async function deleteCase(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(fieldCases).where(eq(fieldCases.id, id));
  await audit("case.delete", id);
  revalidatePublic();
  redirect("/admin/cases");
}

// ── Admin: Portfolio (수강생 포트폴리오) ──────────────────
export async function createPortfolioItem(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const now = new Date();
  await getDb().insert(portfolioItems).values({
    type: String(formData.get("type") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: sanitizeContent(String(formData.get("description") ?? "")).trim(),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: now
  });
  await audit("portfolio.create", String(formData.get("title") ?? ""));
  revalidatePublic();
  redirect("/admin/portfolio");
}

export async function updatePortfolioItem(id: string, formData: FormData) {
  await requireAdminSession();
  ensureDb();
  await getDb().update(portfolioItems).set({
    type: String(formData.get("type") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: sanitizeContent(String(formData.get("description") ?? "")).trim(),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim() || null,
    videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: new Date()
  }).where(eq(portfolioItems.id, id));
  await audit("portfolio.update", String(formData.get("title") ?? id));
  revalidatePublic();
  redirect("/admin/portfolio");
}

export async function deletePortfolioItem(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(portfolioItems).where(eq(portfolioItems.id, id));
  await audit("portfolio.delete", id);
  revalidatePublic();
  redirect("/admin/portfolio");
}

// ── Admin: Inquiry status ────────────────────────────────
export async function markInquiryRead(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().update(inquiries).set({ status: "read" }).where(eq(inquiries.id, id));
  redirect("/admin/inquiries");
}

export async function setInquiryStatus(id: string, status: string) {
  await requireAdminSession();
  ensureDb();
  if (!["new", "read", "replied", "archived"].includes(status)) redirect("/admin/inquiries");
  await getDb().update(inquiries).set({ status }).where(eq(inquiries.id, id));
  await audit("inquiry.status", `${id} → ${status}`);
  redirect("/admin/inquiries");
}

export async function setInquiryStatusInline(id: string, status: string): Promise<{ ok: boolean }> {
  await requireAdminSession();
  ensureDb();
  if (!["new", "read", "replied", "archived"].includes(status)) return { ok: false };
  await getDb().update(inquiries).set({ status }).where(eq(inquiries.id, id));
  await audit("inquiry.status", `${id} → ${status}`);
  return { ok: true };
}

export async function addInquiryNote(inquiryId: string, body: string): Promise<{ ok: boolean; note?: { id: string; body: string; createdAt: string } }> {
  await requireAdminSession();
  ensureDb();
  const trimmedBody = body.trim();
  if (!trimmedBody || trimmedBody.length > 2000) return { ok: false };
  const [note] = await getDb().insert(inquiryNotes).values({ inquiryId, body: trimmedBody }).returning();
  await audit("inquiry.note-add", inquiryId);
  return { ok: true, note: { id: note.id, body: note.body, createdAt: note.createdAt.toISOString() } };
}

export async function deleteInquiryNote(id: string): Promise<{ ok: boolean }> {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(inquiryNotes).where(eq(inquiryNotes.id, id));
  await audit("inquiry.note-delete", id);
  return { ok: true };
}

export async function deleteInquiry(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(inquiryNotes).where(eq(inquiryNotes.inquiryId, id));
  await getDb().delete(inquiries).where(eq(inquiries.id, id));
  await audit("inquiry.delete", id);
  redirect("/admin/inquiries");
}

// ── Admin: Categories ────────────────────────────────────
export async function createCategory(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const scope = String(formData.get("scope") ?? "");
  if (scope !== "blog" && scope !== "case" && scope !== "portfolio") redirect("/admin/categories");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/categories");
  await getDb().insert(categories).values({ scope, name }).onConflictDoNothing();
  await audit("category.create", `${scope}:${name}`);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(categories).where(eq(categories.id, id));
  await audit("category.delete", id);
  redirect("/admin/categories");
}

// ── Admin: Settings ──────────────────────────────────────
export async function saveSettings(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const data = {
    siteTitle: String(formData.get("siteTitle") ?? ""),
    siteDescription: String(formData.get("siteDescription") ?? ""),
    ogImageUrl: String(formData.get("ogImageUrl") ?? ""),
    faviconUrl: String(formData.get("faviconUrl") ?? ""),
    naverVerification: String(formData.get("naverVerification") ?? ""),
    googleVerification: String(formData.get("googleVerification") ?? ""),
    updatedAt: new Date()
  };
  await getDb()
    .insert(siteSettings)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: siteSettings.id, set: data });
  await audit("settings.save");
  revalidatePublic();
  redirect("/admin/settings?saved=1");
}
