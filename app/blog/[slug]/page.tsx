import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPostBySlug, getSiteSettings } from "@/lib/content";
import { toHtmlBody } from "@/lib/html";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const settings = await getSiteSettings().catch(() => null);
  const ogImage = post.thumbnailUrl ?? settings?.ogImageUrl ?? null;
  return {
    title: `${post.title} · AI OpenCollege`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      ...(ogImage ? { images: [ogImage] } : {})
    }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">{post.category}</div>
            <h1 className="sh2 sh2-lg">{post.title}</h1>
            <p className="sdesc">{post.excerpt}</p>
          </div>
        </section>
        {post.thumbnailUrl ? (
          <section className="sec video-sec">
            <div className="wrap" style={{ maxWidth: 860 }}>
              <img className="detail-thumb" src={post.thumbnailUrl} alt={post.title} />
            </div>
          </section>
        ) : null}
        <article className="sec">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: toHtmlBody(post.content) }} />
            <div className="detail-back">
              <Link href="/blog" className="btn bo btn-pill">← 블로그 목록으로</Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
