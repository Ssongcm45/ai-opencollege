"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { clearAdminSessionCookie, requireAdminSession, setAdminSessionCookie } from "@/lib/auth";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, blogCategories, blogPosts, fieldCases, inquiries, siteSettings } from "@/lib/db/schema";

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
}

// ── Public: Inquiry ──────────────────────────────────────
const inquirySchema = z.object({
  name: z.string().min(1),
  organization: z.string().optional(),
  email: z.string().email().min(1),
  phone: z.string().min(1),
  audience: z.string().optional(),
  message: z.string().min(1),
  privacy: z.literal("on")
});

export async function createInquiry(_: unknown, formData: FormData) {
  const result = inquirySchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { ok: false, message: "필수 입력 항목과 개인정보 수집 및 이용 동의 여부를 확인해주세요." };
  }
  const data = result.data;

  if (hasDatabase) {
    await getDb().insert(inquiries).values({
      name: data.name,
      organization: data.organization,
      email: data.email,
      phone: data.phone,
      audience: data.audience,
      message: data.message
    });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "AI OpenCollege <edu@opencollege.co.kr>",
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: `[AI OpenCollege] 교육 문의: ${safeSubject(data.name)}`,
        html: `
          <h2>새 교육 문의가 접수되었습니다</h2>
          <table cellpadding="8" style="border-collapse:collapse">
            <tr><td><strong>이름</strong></td><td>${escapeHtml(data.name)}</td></tr>
            <tr><td><strong>소속</strong></td><td>${escapeHtml(data.organization)}</td></tr>
            <tr><td><strong>이메일</strong></td><td>${escapeHtml(data.email)}</td></tr>
            <tr><td><strong>전화</strong></td><td>${escapeHtml(data.phone)}</td></tr>
            <tr><td><strong>교육 대상</strong></td><td>${escapeHtml(data.audience)}</td></tr>
            <tr><td><strong>문의 내용</strong></td><td style="white-space:pre-wrap">${escapeHtml(data.message)}</td></tr>
          </table>
        `
      });
    } catch (e) {
      console.error("[Resend] 이메일 발송 실패:", e);
    }
  }

  return { ok: true, message: "문의가 접수되었습니다. 24시간 내 회신드리겠습니다." };
}

// ── Admin: Auth ──────────────────────────────────────────
export async function setupAdminPassword(formData: FormData) {
  if (!hasDatabase) redirect("/admin/login?error=nodb");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/admin/login?error=email");
  if (password.length < 8) redirect("/admin/login?setup=1&error=short");
  if (password !== confirm) redirect("/admin/login?setup=1&error=mismatch");

  const db = getDb();
  const existing = await db.select().from(adminConfig).where(eq(adminConfig.id, 1));
  if (existing.length > 0 && existing[0].passwordHash) redirect("/admin/login?error=1");

  const passwordHash = hashPassword(password);
  if (existing.length === 0) {
    await db.insert(adminConfig).values({ id: 1, passwordHash });
  } else {
    await db.update(adminConfig).set({ passwordHash }).where(eq(adminConfig.id, 1));
  }
  await setAdminSessionCookie();
  redirect("/admin");
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

export async function loginAdmin(formData: FormData) {
  if (!hasDatabase) redirect("/admin/login?error=nodb");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const db = getDb();
  const rows = await db.select().from(adminConfig).where(eq(adminConfig.id, 1));
  const config = rows[0];

  // 잠금 상태면 비밀번호 검증 없이 차단한다.
  if (config?.lockedUntil && config.lockedUntil.getTime() > Date.now()) {
    redirect("/admin/login?error=locked");
  }

  const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const stored = config?.passwordHash;
  const passwordOk = !!stored && verifyPassword(password, stored);

  if (!emailOk || !passwordOk) {
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
      redirect(justLocked ? "/admin/login?error=locked" : "/admin/login?error=1");
    }
    redirect("/admin/login?error=1");
  }

  // 성공: 실패 카운터/잠금 초기화 후 세션 발급.
  await db.update(adminConfig).set({ failedAttempts: 0, lockedUntil: null }).where(eq(adminConfig.id, 1));
  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
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
    published,
    featured: formData.get("featured") === "on",
    publishedAt: published ? now : null,
    updatedAt: now
  });
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
    published,
    featured: formData.get("featured") === "on",
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
    updatedAt: new Date()
  }).where(eq(blogPosts.id, id));
  revalidatePublic();
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePublic();
  redirect("/admin/blog");
}

// ── Admin: Portfolio ─────────────────────────────────────
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
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: now
  });
  revalidatePublic();
  redirect("/admin/portfolio");
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
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on",
    updatedAt: new Date()
  }).where(eq(fieldCases.id, id));
  revalidatePublic();
  redirect("/admin/portfolio");
}

export async function deleteCase(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(fieldCases).where(eq(fieldCases.id, id));
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

// ── Admin: Categories ────────────────────────────────────
export async function createCategory(formData: FormData) {
  await requireAdminSession();
  ensureDb();
  const name = String(formData.get("name") ?? "").trim().toUpperCase();
  if (!name) redirect("/admin/categories");
  await getDb().insert(blogCategories).values({ name }).onConflictDoNothing();
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  ensureDb();
  await getDb().delete(blogCategories).where(eq(blogCategories.id, id));
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
  revalidatePublic();
  redirect("/admin/settings?saved=1");
}
