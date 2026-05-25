import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db";
import { blogCategories, blogPosts, fieldCases, inquiries, siteSettings, type NewBlogPost, type NewFieldCase } from "@/lib/db/schema";

export const fallbackPosts = [
  {
    id: "fallback-method",
    title: "AI 교육은 어떻게 설계해야 현장에서 작동할까",
    slug: "ai-education-method",
    category: "METHOD",
    excerpt: "대상 진단, 실습 산출물, 피드백 방식까지 교육 방법론을 운영 관점에서 정리합니다.",
    content: "AI 교육은 도구 소개가 아니라 실제 업무 흐름을 바꾸는 과정이어야 합니다.\n\nAI OpenCollege는 대상자의 직무, 교육 시간, 기관 목적을 먼저 확인하고 교육이 끝나는 날 손에 남길 결과물을 기준으로 과정을 설계합니다.",
    published: true,
    featured: true,
    publishedAt: new Date("2026-01-10"),
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10")
  },
  {
    id: "fallback-field",
    title: "출강 전에는 무엇을 준비하고, 출강 후에는 무엇을 남길까",
    slug: "field-training-operation",
    category: "FIELD NOTE",
    excerpt: "기관 미팅, 사전 설문, 실습 파일, 현장 피드백, 결과 리포트까지 출강 운영 과정을 기록합니다.",
    content: "출강 전에는 교육 목적, 참여자 수준, 현장에서 사용할 도구 환경을 확인합니다.\n\n출강 후에는 수료 여부만 남기지 않습니다.",
    published: true,
    featured: false,
    publishedAt: new Date("2026-01-18"),
    createdAt: new Date("2026-01-18"),
    updatedAt: new Date("2026-01-18")
  },
  {
    id: "fallback-tech",
    title: "실습을 가능하게 하는 AI 도구와 기술 문서",
    slug: "ai-practice-tech-docs",
    category: "TECH DOC",
    excerpt: "프롬프트, 자동화, 에이전트, 콘텐츠 제작 도구를 교육 가능한 문서로 바꾸는 과정을 공유합니다.",
    content: "실습형 교육에는 도구 목록보다 재현 가능한 문서가 필요합니다.",
    published: true,
    featured: false,
    publishedAt: new Date("2026-01-24"),
    createdAt: new Date("2026-01-24"),
    updatedAt: new Date("2026-01-24")
  }
];

export const fallbackCases = [
  {
    id: "case-public",
    title: "공공기관 AI 리터러시 과정",
    slug: "public-ai-literacy",
    clientType: "공공",
    hours: "4~8시간",
    summary: "행정 문서 작성, 민원 응대, 회의록 정리 등 공공 업무에 바로 적용 가능한 실습으로 구성했습니다.",
    content: "행정 문서 작성, 민원 응대, 회의록 정리 등 공공 업무에서 반복되는 업무를 중심으로 실습했습니다.",
    order: 1,
    published: true,
    createdAt: new Date("2026-01-11"),
    updatedAt: new Date("2026-01-11")
  },
  {
    id: "case-job",
    title: "대학·청년 취업준비 과정",
    slug: "youth-job-portfolio",
    clientType: "청년",
    hours: "300시간",
    summary: "직무 분석, 자기소개서, 포트폴리오, 모의 면접을 AI와 함께 반복하며 장기 취업 포트폴리오를 완성했습니다.",
    content: "장기 과정에서는 직무 분석, 자기소개서, 포트폴리오, 모의 면접까지 개인별 결과물을 남기는 방식으로 운영했습니다.",
    order: 2,
    published: true,
    createdAt: new Date("2026-01-12"),
    updatedAt: new Date("2026-01-12")
  },
  {
    id: "case-video",
    title: "영상크리에이터 과정",
    slug: "video-creator-ai",
    clientType: "크리에이터",
    hours: "20시간",
    summary: "기획, 스크립트, 이미지·영상 생성, 편집 자동화까지 연결해 개인별 영상 콘텐츠 결과물을 완성했습니다.",
    content: "콘셉트, 스크립트, 이미지, 숏폼 영상 제작까지 하나의 패키지로 완성했습니다.",
    order: 3,
    published: true,
    createdAt: new Date("2026-01-13"),
    updatedAt: new Date("2026-01-13")
  }
];

// ── Public ──────────────────────────────────────────────
export async function getPublishedPosts() {
  if (!hasDatabase) return fallbackPosts;
  return getDb().select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt));
}

export async function getPostBySlug(slug: string) {
  if (!hasDatabase) return fallbackPosts.find((p) => p.slug === slug) ?? null;
  const [post] = await getDb().select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return post ?? null;
}

export async function getPublishedCases() {
  if (!hasDatabase) return fallbackCases;
  return getDb().select().from(fieldCases).where(eq(fieldCases.published, true)).orderBy(fieldCases.order);
}

export async function getCaseBySlug(slug: string) {
  if (!hasDatabase) return fallbackCases.find((c) => c.slug === slug) ?? null;
  const [item] = await getDb().select().from(fieldCases).where(eq(fieldCases.slug, slug)).limit(1);
  return item ?? null;
}

// ── Admin ────────────────────────────────────────────────
export async function getAllPostsAdmin() {
  if (!hasDatabase) return fallbackPosts;
  return getDb().select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function getPostById(id: string) {
  if (!hasDatabase) return null;
  const [post] = await getDb().select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return post ?? null;
}

export async function getAllCasesAdmin() {
  if (!hasDatabase) return fallbackCases;
  return getDb().select().from(fieldCases).orderBy(fieldCases.order);
}

export async function getCaseById(id: string) {
  if (!hasDatabase) return null;
  const [item] = await getDb().select().from(fieldCases).where(eq(fieldCases.id, id)).limit(1);
  return item ?? null;
}

export async function getAllInquiries() {
  if (!hasDatabase) return [];
  return getDb().select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export const DEFAULT_CATEGORIES = ["METHOD", "FIELD NOTE", "TECH DOC", "CASE", "NEWS"];

export async function getCategories(): Promise<string[]> {
  if (!hasDatabase) return DEFAULT_CATEGORIES;
  const rows = await getDb().select().from(blogCategories).orderBy(blogCategories.name);
  return rows.length ? rows.map((r) => r.name) : DEFAULT_CATEGORIES;
}

export async function getSiteSettings() {
  if (!hasDatabase) return null;
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}

export async function getCmsData() {
  if (!hasDatabase) return { posts: fallbackPosts, cases: fallbackCases, inquiries: [] };
  const db = getDb();
  const [posts, cases, inquiryRows] = await Promise.all([
    db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)),
    db.select().from(fieldCases).orderBy(fieldCases.order),
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt))
  ]);
  return { posts, cases, inquiries: inquiryRows };
}

export async function upsertPost(input: NewBlogPost) {
  const now = new Date();
  await getDb().insert(blogPosts).values({ ...input, updatedAt: now }).onConflictDoUpdate({
    target: blogPosts.slug,
    set: { ...input, updatedAt: now }
  });
}

export async function upsertCase(input: NewFieldCase) {
  const now = new Date();
  await getDb().insert(fieldCases).values({ ...input, updatedAt: now }).onConflictDoUpdate({
    target: fieldCases.slug,
    set: { ...input, updatedAt: now }
  });
}
