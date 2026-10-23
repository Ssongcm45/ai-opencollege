import { getPublishedPosts } from "@/lib/content";
import { siteUrl } from "@/lib/site";

// 사이트맵과 같이 요청마다 새로 만든다 (발행 즉시 반영).
export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&apos;"
    };
    return entities[character];
  });
}

export async function GET() {
  let items = "";

  try {
    const posts = await getPublishedPosts();
    items = posts
      .map((post) => {
        const link = `${siteUrl}/blog/${post.slug}`;
        return `\n    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <description>${escapeXml(post.excerpt)}</description>\n      <pubDate>${(post.publishedAt ?? post.updatedAt).toUTCString()}</pubDate>\n      <category>${escapeXml(post.category)}</category>\n    </item>`;
      })
      .join("");
  } catch {
    items = "";
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>AI OpenCollege 블로그</title>\n    <link>${siteUrl}</link>\n    <description>AI 실무교육 전문기관 AI OpenCollege의 교육 방법론, 출강 기록, 기술 문서</description>\n    <language>ko</language>${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
