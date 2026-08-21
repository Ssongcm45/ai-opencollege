import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPortfolioDetail, getSiteSettings } from "@/lib/content";
import { toHtmlBody } from "@/lib/html";
import { getVideoEmbed } from "@/lib/video";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getPortfolioDetail(id);
  if (!item) return {};
  const description = stripHtml(item.description);
  const settings = await getSiteSettings().catch(() => null);
  const ogImage = item.thumbnailUrl ?? settings?.ogImageUrl ?? null;

  return {
    title: `${item.title} · AI OpenCollege`,
    description,
    openGraph: {
      title: `${item.title} · AI OpenCollege`,
      description,
      type: "article",
      ...(ogImage ? { images: [ogImage] } : {})
    }
  };
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getPortfolioDetail(id);
  if (!item || !item.published) notFound();
  const embed = getVideoEmbed(item.videoUrl);

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">STUDENT PORTFOLIO · {item.type}</div>
            <h1 className="sh2 sh2-lg">{item.title}</h1>
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
            <div className="article-body" dangerouslySetInnerHTML={{ __html: toHtmlBody(item.description) }} />
            <div className="detail-back">
              <Link href="/#portfolio" className="btn bo btn-pill">← 포트폴리오 목록으로</Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
