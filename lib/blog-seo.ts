import type { BlogPost } from "@/lib/db/schema";
import { siteUrl } from "@/lib/site";

/* ────────────────────────────────────────────────
   블로그 글 SEO 설정 공통 처리 — 공개 글 메타데이터, 관리자 저장, 에이전트 초안 등록이 함께 쓴다.
   SEO 칸이 비어 있으면 제목·요약·썸네일·기본 주소를 그대로 쓴다.
──────────────────────────────────────────────── */

const SITE_HOST = new URL(siteUrl).hostname;

type SeoSource = Pick<BlogPost, "title" | "slug" | "excerpt" | "thumbnailUrl"> &
  Partial<Pick<BlogPost, "seoTitle" | "seoDescription" | "seoKeywords" | "ogImage" | "canonicalUrl" | "noindex">>;

export function seoOf(post: SeoSource) {
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.title,
    keywords: (post.seoKeywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    ogImage: post.ogImage || post.thumbnailUrl || null,
    canonical: post.canonicalUrl || `${siteUrl}/blog/${post.slug}`,
    noindex: Boolean(post.noindex)
  };
}

/** 대표 주소(canonical)는 우리 사이트의 https 주소만 허용한다. 비었으면 null, 형식이 틀리면 undefined */
export function normalizeCanonicalUrl(value: string): string | null | undefined {
  const text = value.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.hostname !== SITE_HOST || url.username || url.password || url.port) return undefined;
  const normalized = url.toString();
  return normalized.length <= 500 ? normalized : undefined;
}

export function canonicalHint() {
  return `https://${SITE_HOST}/...`;
}

/** 쉼표로 구분한 키워드를 정리해 "a, b, c" 로 합친다 (비면 null) */
export function normalizeKeywords(list: string[]): string | null {
  const joined = list.map((k) => k.trim()).filter(Boolean).join(", ");
  return joined || null;
}
