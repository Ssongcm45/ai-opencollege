"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, hasDatabase } from "@/lib/db";
import { blogPosts, fieldCases, inquiries } from "@/lib/db/schema";
import { upsertCase, upsertPost } from "@/lib/content";

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

  return { ok: true, message: "문의가 접수되었습니다. 24시간 내 회신드리겠습니다." };
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
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
