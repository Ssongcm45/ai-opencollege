"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, blogPosts, fieldCases, inquiries } from "@/lib/db/schema";
import { upsertCase, upsertPost } from "@/lib/content";
import { Resend } from "resend";

const ADMIN_EMAIL = "jaemscm8445@gmail.com";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

const inquirySchema = z.object({
  name: z.string().min(1),
  organization: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
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
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "AI OpenCollege <onboarding@resend.dev>",
      to: "edu@opencollege.co.kr",
      subject: `[AI OpenCollege] 새 교육 문의: ${data.name}`,
      html: `
        <h2>새 교육 문의가 접수되었습니다</h2>
        <table cellpadding="8" style="border-collapse:collapse">
          <tr><td><strong>이름</strong></td><td>${data.name}</td></tr>
          <tr><td><strong>소속</strong></td><td>${data.organization || "-"}</td></tr>
          <tr><td><strong>이메일</strong></td><td>${data.email || "-"}</td></tr>
          <tr><td><strong>전화</strong></td><td>${data.phone || "-"}</td></tr>
          <tr><td><strong>교육대상</strong></td><td>${data.audience || "-"}</td></tr>
          <tr><td><strong>문의내용</strong></td><td style="white-space:pre-wrap">${data.message}</td></tr>
        </table>
      `
    });
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

  const jar = await cookies();
  jar.set("admin_session", "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
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

  const jar = await cookies();
  jar.set("admin_session", "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete("admin_session");
  redirect("/admin/login");
}

export async function savePost(formData: FormData) {
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
