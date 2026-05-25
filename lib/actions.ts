"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";
import { clearAdminSessionCookie, requireAdminSession, setAdminSessionCookie } from "@/lib/auth";
import { upsertCase, upsertPost } from "@/lib/content";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, inquiries } from "@/lib/db/schema";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "jamescm8445@gmail.com";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(hash, "hex");
  const derivedBuffer = Buffer.from(derived, "hex");
  return storedBuffer.length === derivedBuffer.length && crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

function escapeHtml(value: string | undefined): string {
  return (value || "-").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function safeSubject(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

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
        from: "AI OpenCollege <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
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

export async function savePost(formData: FormData) {
  await requireAdminSession();
  ensureDbForCms();

  await upsertPost({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    category: String(formData.get("category") ?? "METHOD"),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    publishedAt: formData.get("published") === "on" ? new Date() : null
  });
  redirect("/admin");
}

export async function saveCase(formData: FormData) {
  await requireAdminSession();
  ensureDbForCms();

  await upsertCase({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    clientType: String(formData.get("clientType") ?? ""),
    hours: String(formData.get("hours") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    order: Number(formData.get("order") ?? 0),
    published: formData.get("published") === "on"
  });
  redirect("/admin");
}

function ensureDbForCms() {
  if (!hasDatabase) {
    throw new Error("CMS 저장 기능은 DATABASE_URL 연결 후 사용할 수 있습니다.");
  }
}
