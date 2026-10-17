import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPublishedPortfolio } from "@/lib/content";
import { getVideoEmbed } from "@/lib/video";

export const metadata: Metadata = {
  title: "수강생작품 · 오픈컬리지",
  description: "교육 과정 안에서 수강생이 직접 완성한 업무 자동화, 콘텐츠, 에이전트 결과물을 소개합니다.",
  alternates: { canonical: "/portfolio" }
};

export default async function PortfolioListPage() {
  const portfolio = await getPublishedPortfolio();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">STUDENT WORKS</div>
            <h1 className="sh2 sh2-lg">수강생작품</h1>
            <p className="sdesc">교육은 결과물로 남아야 합니다. 수강생은 과정 안에서 실제 업무와 연결되는 산출물을 완성합니다.</p>
          </div>
        </section>
        <section className="portfolio-sec sec">
          <div className="wrap">
            {portfolio.length === 0 ? <p className="sdesc">등록된 수강생작품이 없습니다.</p> : null}
            <div className="portfolio-grid">
              {portfolio.map((item) => {
                const embed = getVideoEmbed(item.videoUrl);
                return (
                  <Link href={`/portfolio/${item.id}`} className="work-card" key={item.id}>
                    {item.thumbnailUrl ? (
                      <img className="work-thumb-img" src={item.thumbnailUrl} alt={item.title} loading="lazy" />
                    ) : embed ? (
                      <div className="video-embed work-thumb-media"><iframe src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
                    ) : (
                      <div className="work-thumb" />
                    )}
                    <div className="work-body"><div className="work-type">{item.type}</div><h3>{item.title}</h3></div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
