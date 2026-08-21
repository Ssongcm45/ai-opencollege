import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPublishedCases } from "@/lib/content";
import { getVideoEmbed } from "@/lib/video";

export default async function CasesPage() {
  const cases = await getPublishedCases();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">FIELD CASES</div>
            <h1 className="sh2 sh2-lg">출강사례</h1>
            <p className="sdesc">기관의 목적과 참여자 수준에 맞춰 커리큘럼과 결과물을 조정합니다.</p>
          </div>
        </section>
        <section className="field-sec sec">
          <div className="wrap field-list">
            {cases.map((item, index) => {
              const embed = getVideoEmbed(item.videoUrl);

              return (
                <Link href={`/cases/${item.slug}`} className="field-item" key={item.slug}>
                  {item.thumbnailUrl ? (
                    <img className="card-thumb field-thumb" src={item.thumbnailUrl} alt={item.title} loading="lazy" />
                  ) : embed ? (
                    <div className="video-embed">
                      <iframe src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
                    </div>
                  ) : null}
                <div className="field-no">CASE {String(index + 1).padStart(2, "0")}</div>
                <div className="field-main"><h3>{item.title}</h3><p>{item.summary}</p></div>
                <div className="field-tags"><span>{item.clientType}</span><span>{item.hours}</span><span>실습형</span></div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
