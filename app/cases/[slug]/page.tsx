import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCaseBySlug, getSiteSettings } from "@/lib/content";
import { toHtmlBody } from "@/lib/html";
import { siteUrl } from "@/lib/site";
import { getVideoEmbed } from "@/lib/video";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) return {};
  const settings = await getSiteSettings().catch(() => null);
  const ogImage = item.thumbnailUrl ?? settings?.ogImageUrl ?? null;
  return {
    title: `${item.title} · AI OpenCollege`,
    description: item.summary,
    openGraph: {
      title: item.title,
      description: item.summary,
      type: "article",
      ...(ogImage ? { images: [ogImage] } : {})
    }
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item || !item.published) notFound();
  const embed = getVideoEmbed(item.videoUrl);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.title,
    description: item.summary,
    datePublished: item.createdAt?.toISOString(),
    dateModified: item.updatedAt?.toISOString?.() ?? undefined,
    image: item.thumbnailUrl ?? undefined,
    mainEntityOfPage: `${siteUrl}/cases/${item.slug}`,
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">{item.clientType} · {item.hours}</div>
            <h1 className="sh2 sh2-lg">{item.title}</h1>
            <p className="sdesc">{item.summary}</p>
          </div>
        </section>
        {embed ? (
          <section className="sec video-sec">
            <div className="wrap" style={{ maxWidth: 860 }}>
              <div className="video-embed">
                <iframe src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
              </div>
            </div>
          </section>
        ) : item.thumbnailUrl ? (
          <section className="sec video-sec">
            <div className="wrap" style={{ maxWidth: 860 }}>
              <img className="detail-thumb" src={item.thumbnailUrl} alt={item.title} />
            </div>
          </section>
        ) : null}
        <article className="sec">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: toHtmlBody(item.content) }} />
            <div className="detail-back">
              <Link href="/cases" className="btn bo btn-pill">← 출강사례 목록으로</Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
