import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CourseTabs } from "@/components/Tabs";
import { LEVEL_LABELS, tracks, type LevelRank } from "@/lib/courses";
import { defaultOgImage, siteUrl } from "@/lib/site";

const title = "과정소개 · 오픈컬리지";
const description =
  "공공기관·기업·개인을 위한 AI 실무교육 과정소개. 완전 기초부터 사무직·크리에이티브·전략기획·리더십·강사·AI OS·취업·에이전트·연구 R&D·정규교육과정까지 11개 트랙의 구성과 세부 커리큘럼을 확인하세요.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl}/courses` },
  openGraph: { title, description, url: `${siteUrl}/courses`, type: "website", images: [defaultOgImage] }
};

const levels: LevelRank[] = [1, 2, 3, 4];

export default function CoursesPage() {
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI OpenCollege 과정 트랙",
    itemListElement: tracks.map((track, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/courses/${track.slug}`,
      name: track.navTitle
    }))
  };

  return (
    <>
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">COURSES</div>
            <h1 className="sh2 sh2-lg">과정소개</h1>
            <p className="sdesc">교육 대상과 방식, 수준과 목적에 맞는 11개 트랙. 모든 과정은 실습으로 진행하고, 교육이 끝나는 날 내 업무에 쓸 결과물을 가져갑니다.</p>
            <div className="crs-hero-acts">
              <a href="#types" className="btn bo btn-pill">교육 대상별 안내</a>
              <a href="#tracks" className="btn bo btn-pill">트랙 한눈에 보기</a>
            </div>
          </div>
        </section>

        <section className="courses sec" id="types">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">EDUCATION TYPE</div>
              <h2 className="sh2">어떤 방식으로<br />배우실 건가요?</h2>
              <p className="sdesc">기관 출강부터 온라인 과정까지. 상황에 맞는 형태를 선택하세요.</p>
            </div>
            <CourseTabs />
          </div>
        </section>

        <section className="sec crs-tracks-sec" id="tracks">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">CURRICULUM · AIRO TRACKS</div>
              <h2 className="sh2">수준과 목적에 맞는<br />11개 AI 교육 트랙</h2>
              <p className="sdesc">트랙을 누르면 학습 흐름, 단계별 과정 구성, 세부 커리큘럼과 결과물을 확인할 수 있습니다.</p>
            </div>

            <figure className="crs-matrix">
              <figcaption>
                <strong>수준 축으로 보는 트랙</strong>
                <span>막대는 각 트랙이 다루는 수준 범위입니다</span>
              </figcaption>
              <div className="crs-mx-head" aria-hidden="true">
                <span />
                {levels.map((lv) => <span key={lv}>{LEVEL_LABELS[lv]}</span>)}
              </div>
              <ul>
                {tracks.map((track) => {
                  const [from, to] = track.levelRange;
                  return (
                    <li key={track.id}>
                      <Link href={`/courses/${track.slug}`} className="crs-mx-row" style={{ ["--tc" as string]: track.color }}>
                        <span className="crs-mx-name"><i>{track.id}</i>{track.navTitle}</span>
                        <span className="crs-mx-track">
                          <span className="crs-mx-bar" style={{ gridColumn: `${from} / ${to + 1}` }}>
                            <span className="sr-only">{LEVEL_LABELS[from]}{from !== to ? ` ~ ${LEVEL_LABELS[to]}` : ""} · </span>{track.hours}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </figure>

            <div className="crs-grid">
              {tracks.map((track) => (
                <Link href={`/courses/${track.slug}`} className="crs-card" key={track.id} style={{ ["--tc" as string]: track.color }}>
                  <div className="crs-card-top">
                    <span className="crs-id">{track.id}</span>
                    <span className="crs-card-tag">{track.tag}</span>
                  </div>
                  <h3>{track.navTitle}</h3>
                  <p className="crs-card-h">{track.heading.replace("\n", " ")}</p>
                  <p className="crs-card-d">{track.navSub}</p>
                  <div className="crs-card-facts">
                    <span><b>시간</b>{track.hours}</span>
                    <span><b>수준</b>{track.level}</span>
                  </div>
                  <div className="cp-chips">
                    {track.chips.slice(0, 4).map((chip) => <span className="cp-chip" key={chip}>{chip}</span>)}
                  </div>
                  <span className="crs-card-more">자세히 보기 →</span>
                </Link>
              ))}
            </div>

            <div className="airo-banner">
              <div>
                <h4>어떤 트랙이 맞을지 고민되시나요?</h4>
                <p>참여자 수준과 교육 목표를 알려 주시면 트랙 모듈을 조합해 기관 맞춤 커리큘럼을 설계해 드립니다. 먼저 AI학습체크로 현재 수준을 확인해 보셔도 좋습니다.</p>
                <div className="airo-feats"><span className="af">맞춤 설계</span><span className="af">실습 과제</span><span className="af">수료증 제공</span><span className="af">기관 맞춤 리포트</span></div>
              </div>
              <div className="crs-cta-acts">
                <a href="/#contact" className="btn bw btn-pill" data-cta-location="courses_index">교육 설계 문의</a>
                <a href="/check" className="btn bow btn-pill">AI학습체크</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
