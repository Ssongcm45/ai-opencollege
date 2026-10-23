import type { MetadataRoute } from "next";
import { getPublishedCases, getPublishedPortfolio, getPublishedPosts } from "@/lib/content";
import { tracks } from "@/lib/courses";
import { siteUrl } from "@/lib/site";

// 빌드 때 한 번 만든 사이트맵이 계속 나가지 않도록 요청마다 DB에서 새로 만든다.
// (정적 사이트맵은 revalidatePath("/sitemap.xml") 로도 갱신되지 않았다 — 2026-10-23 운영 확인)
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      priority: 1.0
    },
    {
      url: `${baseUrl}/courses`,
      priority: 0.9
    },
    ...tracks.map((track) => ({
      url: `${baseUrl}/courses/${track.slug}`,
      priority: 0.8
    })),
    {
      url: `${baseUrl}/blog`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/cases`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/portfolio`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/airo`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/lp/public`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/lp/company`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/check`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/guide`,
      priority: 0.7
    },
    {
      url: `${baseUrl}/privacy`,
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      priority: 0.3
    }
  ];

  // 섹션별로 따로 받는다. 한 쿼리가 실패해도 나머지 항목은 그대로 싣는다.
  const [posts, cases, portfolio] = await Promise.allSettled([
    getPublishedPosts(),
    getPublishedCases(),
    getPublishedPortfolio()
  ]);

  return [
    ...staticEntries,
    // 작성 주체(관리자·에이전트)와 상관없이 발행된 글은 모두 싣는다.
    // 검색 제외(noindex) 글만 뺀다 (초안은 getPublishedPosts 에서 이미 빠진다)
    ...(posts.status === "fulfilled" ? posts.value : [])
      .filter((post) => !post.noindex)
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ?? post.publishedAt ?? undefined
      })),
    ...(cases.status === "fulfilled" ? cases.value : []).map((item) => ({
      url: `${baseUrl}/cases/${item.slug}`,
      lastModified: item.updatedAt
    })),
    ...(portfolio.status === "fulfilled" ? portfolio.value : [])
      .filter((item) => /^[0-9a-f]{8}-/.test(item.id))
      .map((item) => ({
        url: `${baseUrl}/portfolio/${item.id}`,
        lastModified: item.updatedAt
      }))
  ];
}
