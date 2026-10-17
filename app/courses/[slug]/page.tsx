import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BranchDiagram, PathCards, StageChart } from "@/components/courses/StageChart";
import { TrackFlow } from "@/components/courses/TrackFlow";
import { formatHours, getTrackBySlug, tracks } from "@/lib/courses";
import { defaultOgImage, siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return tracks.map((track) => ({ slug: track.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const track = getTrackBySlug(slug);
  if (!track) return {};
  const title = `${track.navTitle} · 과정소개 · 오픈컬리지`;
  const url = `${siteUrl}/courses/${track.slug}`;
  return {
    title,
    description: track.overview,
    alternates: { canonical: url },
    openGraph: { title, description: track.overview, url, type: "website", images: [defaultOgImage] }
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = getTrackBySlug(slug);
  if (!track) notFound();

  const index = tracks.indexOf(track);
  const prev = tracks[(index - 1 + tracks.length) % tracks.length];
  const next = tracks[(index + 1) % tracks.length];
  const tc = { ["--tc" as string]: track.color };

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: track.navTitle,
    description: track.overview,
    url: `${siteUrl}/courses/${track.slug}`,
    inLanguage: "ko",
    teaches: track.chips,
    provider: {
      "@type": "EducationalOrganization",
      name: "AI OpenCollege",
      url: siteUrl
    }
  };

  return (
    <>
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }} />
        <section className="page-hero crs-hero" style={tc}>
          <div className="wrap">
            <nav className="crs-crumb" aria-label="현재 위치">
              <Link href="/courses">과정소개</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{track.navTitle}</span>
            </nav>
            <div className="crs-hero-grid">
              <div>
                <div className="ey crs-tag"><span className="crs-id">{track.id}</span>{track.tag}</div>
                <h1 className="sh2 sh2-lg">
                  {track.heading.split("\n").map((line) => <span key={line}>{line}<br /></span>)}
                </h1>
                <div className="cp-sub">{track.sub}</div>
                <p className="sdesc">{track.desc}</p>
                <div className="cp-chips">
                  {track.chips.map((chip) => <span className="cp-chip" key={chip}>{chip}</span>)}
                </div>
              </div>
              <dl className="crs-facts">
                <div><dt>권장 시간</dt><dd>{track.hours}</dd></div>
                <div><dt>수준</dt><dd>{track.level}</dd></div>
                <div><dt>형태</dt><dd>출강 · 온라인</dd></div>
                <div><dt>제공</dt><dd>수료증</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="sec crs-sec">
          <div className="wrap crs-narrow">
            <div className="crs-sec-hd">
              <div className="ey">OVERVIEW</div>
              <h2 className="crs-h2">과정 개요</h2>
            </div>
            <p className="crs-overview">{track.overview}</p>
            <div className="crs-sub-h">학습 흐름</div>
            <TrackFlow steps={track.flow} color={track.color} />
          </div>
        </section>

        <section className="sec crs-sec crs-sec-cream">
          <div className="wrap crs-narrow">
            <div className="crs-sec-hd">
              <div className="ey">STRUCTURE</div>
              <h2 className="crs-h2">과정 구성</h2>
              <p className="crs-sec-desc">단계별 시간과 각 단계에서 만드는 결과물입니다. 기관 일정과 참여자 수준에 맞춰 시간과 구성을 조정합니다.</p>
            </div>
            {track.paths ? <BranchDiagram stages={track.stages} color={track.color} /> : null}
            <StageChart stages={track.stages} color={track.color} note={track.stageNote} title={track.paths ? "레벨별 과정 구성" : "단계별 과정 구성"} />
            {track.paths ? (
              <>
                <div className="crs-sub-h">맡은 일에 따른 수강 경로</div>
                <PathCards paths={track.paths} color={track.color} />
              </>
            ) : null}
            {track.id === "RD" ? (
              <div className="crs-deep" style={tc}>
                <div className="crs-sub-h">용어·관계 체계가 레벨을 따라 깊어집니다</div>
                <div className="crs-deep-grid">
                  {[
                    ["시소러스", "같은 것을 같은 말로", "대표어·동의어·영문 대응으로 용어를 약속합니다."],
                    ["온톨로지", "무엇이 무엇과 어떤 관계인가", "개체와 관계의 틀로 문헌 표의 열을 맞춥니다."],
                    ["라벨링", "문헌마다 라벨 붙이기", "문헌마다 3~5개 라벨 축의 값을 붙이고 검수합니다."]
                  ].map(([name, tagline, desc], i) => (
                    <div className="crs-deep-card" key={name}>
                      <span className="crs-deep-n">{i + 1}</span>
                      <strong>{name}</strong>
                      <em>{tagline}</em>
                      <p>{desc}</p>
                    </div>
                  ))}
                </div>
                <ol className="crs-deep-steps">
                  <li><b>L1 손으로</b>용어 사전·관계 도식·라벨된 문헌 표를 직접 만듭니다.</li>
                  <li><b>L2 스크립트로</b>같은 규칙이 용어 확장 검색과 대량 라벨링의 기준이 됩니다.</li>
                  <li><b>L3 에이전트로</b>규칙이 에이전트 지침이 되고, 검수 에이전트와 사람이 승인합니다.</li>
                </ol>
              </div>
            ) : null}
            {track.note ? <p className="crs-note">{track.note}</p> : null}
          </div>
        </section>

        <section className="sec crs-sec">
          <div className="wrap crs-narrow">
            <div className="crs-sec-hd">
              <div className="ey">CURRICULUM</div>
              <h2 className="crs-h2">세부 커리큘럼</h2>
            </div>
            <ol className="crs-modules" style={tc}>
              {track.modules.map((mod) => (
                <li key={mod.no}>
                  <span className="crs-mod-no">{mod.no}</span>
                  <div className="crs-mod-body">
                    <div className="crs-mod-t">
                      {mod.title}
                      {mod.stage ? <span className="crs-mod-stage">{mod.stage}</span> : null}
                    </div>
                    <p>{mod.desc}</p>
                  </div>
                  {mod.hours !== undefined ? <span className="crs-mod-h">{formatHours(mod.hours)}h</span> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sec crs-sec crs-sec-cream">
          <div className="wrap crs-narrow">
            <div className="crs-three" style={tc}>
              {[
                { h: "이런 분께 추천합니다", items: track.audience },
                { h: "끝나면 할 수 있는 것", items: track.outcomes },
                { h: "가져가는 결과물", items: track.deliverables }
              ].map((col) => (
                <div className="crs-col" key={col.h}>
                  <h3>{col.h}</h3>
                  <ul>{col.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </div>

            <div className="airo-banner" data-cta-location="course_detail">
              <div>
                <h4>{track.navTitle}, 우리 기관에 맞게 설계해 드립니다</h4>
                <p>참여자 수준과 교육 목표, 일정을 알려 주시면 시간과 모듈 구성을 맞춤으로 제안해 드립니다.</p>
                <p className="airo-gadia">실습 환경: 유료 AI 계정이 없는 기관은 <a href="https://gadia.ai" target="_blank" rel="noopener noreferrer">Gadia</a> 실습 환경을 함께 안내해 드립니다.</p>
              </div>
              <div className="crs-cta-acts">
                <a href="/#contact" className="btn bw btn-pill">교육 문의</a>
                <a href="/check" className="btn bow btn-pill">AI학습체크</a>
              </div>
            </div>

            <nav className="crs-pager" aria-label="다른 과정 보기">
              <Link href={`/courses/${prev.slug}`} className="crs-pg">
                <small>← 이전 과정</small>
                <span><i style={{ background: prev.color }} />{prev.navTitle}</span>
              </Link>
              <Link href={`/courses/${next.slug}`} className="crs-pg crs-pg-next">
                <small>다음 과정 →</small>
                <span><i style={{ background: next.color }} />{next.navTitle}</span>
              </Link>
            </nav>
            <div className="detail-back">
              <Link href="/courses" className="btn bo btn-pill">← 과정소개 전체 보기</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
