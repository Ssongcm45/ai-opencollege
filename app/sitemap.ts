import type { MetadataRoute } from "next";
import { getPublishedCases, getPublishedPortfolio, getPublishedPosts } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      priority: 1.0
    },
    {
      url: `${baseUrl}/blog`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/cases`,
      priority: 0.8
    },
    {
      url: `${baseUrl}/check`,
      priority: 0.8
    }
  ];

  try {
    const [posts, cases, portfolio] = await Promise.all([getPublishedPosts(), getPublishedCases(), getPublishedPortfolio()]);

    return [
      ...staticEntries,
      ...posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt
      })),
      ...cases.map((item) => ({
        url: `${baseUrl}/cases/${item.slug}`,
        lastModified: item.updatedAt
      })),
      ...portfolio
        .filter((item) => /^[0-9a-f]{8}-/.test(item.id))
        .map((item) => ({
          url: `${baseUrl}/portfolio/${item.id}`,
          lastModified: item.updatedAt
        }))
    ];
  } catch {
    return staticEntries;
  }
}
