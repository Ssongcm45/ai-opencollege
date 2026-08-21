"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { clearAdminSessionCookie, requireAdminSession, setAdminSessionCookie } from "@/lib/auth";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, blogCategories, blogPosts, fieldCases, inquiries, siteSettings } from "@/lib/db/schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "jamescm8445@gmail.com";

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
  message: z.string().min(1)
});

export async function createInquiry(_: unknown, formData: FormData) {
  const data = inquirySchema.parse(Object.fromEntries(formData));

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

export async function loginAdmin(formData: FormData) {
  if (!hasDatabase) redirect("/admin/login?error=nodb");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) redirect("/admin/login?error=1");

  const db = getDb();
  const rows = await db.select().from(adminConfig).where(eq(adminConfig.id, 1));
  const stored = rows[0]?.passwordHash;
  if (!stored || !verifyPassword(password, stored)) redirect("/admin/login?error=1");

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
    content: String(formData.get("content") ?? ""),
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
    content: String(formData.get("content") ?? ""),
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
    content: String(formData.get("content") ?? ""),
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
    content: String(formData.get("content") ?? ""),
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
