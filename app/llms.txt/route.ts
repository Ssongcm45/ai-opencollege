import { getPublishedCases, getPublishedPosts } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  let cases: Awaited<ReturnType<typeof getPublishedCases>> = [];

  try {
    [posts, cases] = await Promise.all([getPublishedPosts(), getPublishedCases()]);
  } catch {
    posts = [];
    cases = [];
  }

  const lines = [
    "# AI OpenCollege",
    "",
    "> AI 실무교육 전문기관 AI OpenCollege는 기업, 공공기관, 청년을 위한 맞춤형 AI 교육을 제공합니다.",
    "",
    "## 주요 페이지",
    "",
    `- 홈페이지: ${siteUrl}`,
    `- 블로그: ${siteUrl}/blog`,
    `- 출강 사례: ${siteUrl}/cases`,
    `- AI 역량 진단: ${siteUrl}/check`,
    "",
    "## 블로그"
  ];

  if (posts.length > 0) {
    lines.push(...posts.map((post) => `- [${post.title}](${siteUrl}/blog/${post.slug}): ${post.excerpt}`));
  }

  lines.push("", "## 출강 사례");

  if (cases.length > 0) {
    lines.push(...cases.map((item) => `- [${item.title}](${siteUrl}/cases/${item.slug}): ${item.summary}`));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
