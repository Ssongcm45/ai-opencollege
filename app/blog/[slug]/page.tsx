import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogArticle";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { seoOf } from "@/lib/blog-seo";
import { getPostBySlug, getSiteSettings } from "@/lib/content";
import { defaultOgImage, siteUrl } from "@/lib/site";

// 공개 글만 보여 준다. 초안(비공개)은 제목·요약이 메타데이터로도 새지 않게 빈 메타데이터를 돌려준다.
async function getPublicPost(slug: string) {
  const post = await getPostBySlug(slug);
  return post?.published ? post : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) return {};
  const settings = await getSiteSettings().catch(() => null);
  const seo = seoOf(post);
  const ogImage = seo.ogImage || settings?.ogImageUrl || defaultOgImage;
  return {
    title: `${seo.title} · AI OpenCollege`,
    description: seo.description,
    ...(seo.keywords.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: seo.canonical },
    ...(seo.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "article",
      url: seo.canonical,
      publishedTime: post.publishedAt?.toISOString(),
      ...(ogImage ? { images: [ogImage] } : {})
    }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicPost(slug);
  if (!post) notFound();
  const seo = seoOf(post);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seo.description,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString?.() ?? undefined,
    image: post.thumbnailUrl ?? undefined,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    ...(seo.keywords.length ? { keywords: seo.keywords.join(", ") } : {}),
    author: { "@type": "Organization", name: "AI OpenCollege" },
    publisher: {
      "@type": "Organization",
      name: "AI OpenCollege",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` }
    },
    inLanguage: "ko"
  };

  return (
    <>
      <Header />
      <main>
        {/* 제목 등에 </script> 가 들어 있어도 스크립트가 끊기지 않도록 < 를 이스케이프한다 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, "\\u003c") }} />
        <BlogArticle post={post} />
      </main>
      <Footer />
    </>
  );
}
