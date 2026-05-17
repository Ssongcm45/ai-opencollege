import { getDb } from "../lib/db";
import { fieldCases, blogPosts } from "../lib/db/schema";
import { fallbackCases, fallbackPosts } from "../lib/content";

async function main() {
  const db = getDb();

  for (const post of fallbackPosts) {
    await db.insert(blogPosts).values({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      featured: post.featured,
      publishedAt: post.publishedAt
    }).onConflictDoNothing();
  }

  for (const item of fallbackCases) {
    await db.insert(fieldCases).values({
      title: item.title,
      slug: item.slug,
      clientType: item.clientType,
      hours: item.hours,
      summary: item.summary,
      content: item.content,
      order: item.order,
      published: item.published
    }).onConflictDoNothing();
  }

  console.log("Seed complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
