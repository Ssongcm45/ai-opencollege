import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCaseBySlug, getSiteSettings } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item) return {};
  const settings = await getSiteSettings().catch(() => null);
  return {
    title: `${item.title} · AI OpenCollege`,
    description: item.summary,
    openGraph: {
      title: item.title,
      description: item.summary,
      type: "article",
      ...(settings?.ogImageUrl ? { images: [settings.ogImageUrl] } : {})
    }
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);
  if (!item || !item.published) notFound();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">{item.clientType} · {item.hours}</div>
            <h1 className="sh2 sh2-lg">{item.title}</h1>
            <p className="sdesc">{item.summary}</p>
          </div>
        </section>
        <article className="sec">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: item.content }} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
