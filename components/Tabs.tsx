"use client";

import { useState } from "react";
import { TrackFlow } from "@/components/courses/TrackFlow";
import { tracks } from "@/lib/courses";

export function CourseTabs() {
  const [active, setActive] = useState(0);
  const tabs = [
    ["TYPE 01", "공공기관·지자체\n출강 교육", "공무원 · 공공법인"],
    ["TYPE 02", "기업·단체\n맞춤 교육", "B2B · 사내 출강"],
    ["TYPE 03", "개인·오픈\n클래스", "온라인 · 오프라인"],
    ["TYPE 04", "K-Digital\n국비 과정", "고용노동부 연계"]
  ];
  const panels = [
    {
      badge: "공공기관 · 지자체",
      title: "공공기관과 행정 현장에\n최적화된 AI 교육",
      desc: "행정·공공 업무 흐름에 맞춘 커리큘럼입니다. 문서 작성, 민원 응대, 회의록 정리, AI 리터러시를 실습 중심으로 배웁니다.",
      tags: ["행정 문서 자동화", "AI 리터러시", "보고서·보도자료", "공공데이터 분석", "회의록 AI"],
      rows: [
        ["대상", "공무원, 공공기관 직원, 교사·교육연구사"],
        ["형태", "방문 출강 (오프라인)"],
        ["시간", "2시간 ~ 8시간 (맞춤 협의)"],
        ["인원", "10명 ~ 200명"],
        ["수료증", "발급 가능"]
      ],
      cta: "출강 문의하기",
      more: { href: "/lp/public", label: "공공기관 교육 자세히 보기" }
    },
    {
      badge: "기업 · 단체",
      title: "우리 회사 직무에 맞는\n100% 맞춤 AI 교육",
      desc: "조직의 직무와 산업 맥락에 맞춘 기업 특화 커리큘럼입니다. 마케팅·인사·운영·기획 등 직무별 AI 활용법을 실습합니다.",
      tags: ["ChatGPT 업무 심화", "AI 마케팅·콘텐츠", "업무 자동화", "임원 AI 전략"],
      rows: [
        ["대상", "임직원 전 직급, 팀 단위"],
        ["형태", "출강 또는 온라인"],
        ["시간", "2시간 ~ 1일 집중"],
        ["커리큘럼", "직무·산업별 맞춤 설계"],
        ["수료증", "발급 가능"]
      ],
      cta: "기업 교육 문의",
      more: { href: "/lp/company", label: "기업 출강 자세히 보기" }
    },
    {
      badge: "개인 · 오픈 클래스",
      title: "개인도 제대로\n배울 수 있습니다",
      desc: "온라인과 오프라인으로 운영되는 개인·오픈 클래스입니다. 직장인·강사·1인 크리에이터를 위한 실전형 AI 과정입니다.",
      tags: ["온라인 VOD", "오프라인 집중", "개인 프로젝트", "강사 역량 강화"],
      rows: [
        ["대상", "직장인, 강사, 1인 사업자"],
        ["형태", "온라인 VOD + 오프라인"],
        ["수료증", "발급 가능"]
      ],
      cta: "수강 문의",
      more: null
    },
    {
      badge: "준비 중",
      title: "K-Digital 국비 과정은\n준비 중입니다",
      desc: "실습형 AI 교육을 장기 과정으로 확장하기 위한 과정을 준비하고 있습니다.",
      tags: ["장기 과정", "취업 준비", "프로젝트", "포트폴리오"],
      rows: [
        ["대상", "취업 준비생, 재직자"],
        ["형태", "준비 중"],
        ["수료증", "발급 예정"]
      ],
      cta: "준비 과정 문의",
      more: null
    }
  ];
  const panel = panels[active];

  return (
    <>
      <div className="type-tabs">
        {tabs.map((tab, index) => (
          <button className={`ttab ${active === index ? "on" : ""}`} key={tab[0]} onClick={() => setActive(index)}>
            <div className="tt-n">{tab[0]}</div>
            <div className="tt-t">{tab[1].split("\n").map((line) => <span key={line}>{line}<br /></span>)}</div>
            <div className="tt-s">{tab[2]}</div>
            {index === 3 ? <span className="badge bdn">준비 중</span> : null}
          </button>
        ))}
      </div>
      <div className="type-panel">
        <div>
          <span className="badge bdv">{panel.badge}</span>
          <h3 className="tp-h">{panel.title.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h3>
          <p className="tp-p">{panel.desc}</p>
          <div className="tp-tags">{panel.tags.map((tag) => <span className="tp-tag" key={tag}>{tag}</span>)}</div>
          <div className="tp-acts">
            <a href="/#contact" className="btn bp btn-pill">{panel.cta}</a>
            {panel.more ? <a href={panel.more.href} className="btn bo btn-pill">{panel.more.label}</a> : null}
          </div>
        </div>
        <div className="tp-info">
          <div className="ey">교육 정보</div>
          {panel.rows.map(([key, value]) => <div className="tp-row" key={key}><span className="k">{key}</span><span className="v">{value}</span></div>)}
        </div>
      </div>
    </>
  );
}

export function CurriculumTabs() {
  const [active, setActive] = useState(0);
  const item = tracks[active];

  return (
    <div className="curr-wrap">
      <div className="curr-nav">
        {tracks.map((track, index) => (
          <button
            className={`cn-item ${active === index ? "on" : ""}`}
            key={track.id}
            onClick={() => setActive(index)}
          >
            <span className="track-dot" style={{ background: track.color }} />
            <span className="cn-num">{track.id}</span>
            <span className="cn-body">
              <h4 aria-level={3}>{track.navTitle}</h4>
              <p>{track.navSub}</p>
            </span>
            <span className="cn-arr">›</span>
          </button>
        ))}
      </div>
      <div className="curr-panel-zone">
        <div className="cpanel on" key={item.id}>
          <div className="cp-tag">{item.tag}</div>
          <h3 className="cp-h">
            {item.heading.split("\n").map((line) => <span key={line}>{line}<br /></span>)}
          </h3>
          <div className="cp-sub">{item.sub}</div>
          <p className="cp-desc">{item.desc}</p>
          <div className="cp-chips">
            {item.chips.map((chip) => <span className="cp-chip" key={chip}>{chip}</span>)}
          </div>
          <TrackFlow steps={item.flow} color={item.color} />
          {item.paths ? <div className="cp-mods-h">수강 경로</div> : null}
          <div className="cp-mods">
            {item.mods.map((mod, i) => (
              <div className="cpmod" key={mod.title}>
                <div className="cpm-i">{i + 1}</div>
                <div>
                  <div className="cpm-t">{mod.title}</div>
                  <div className="cpm-d">{mod.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cp-meta">
            <div className="cpm2"><div className="k">권장 시간</div><div className="v">{item.hours}</div></div>
            <div className="cpm2"><div className="k">형태</div><div className="v">출강 · 온라인</div></div>
            <div className="cpm2"><div className="k">수준</div><div className="v">{item.level}</div></div>
            <div className="cpm2"><div className="k">제공</div><div className="v">수료증</div></div>
          </div>
          <a href={`/courses/${item.slug}`} className="cp-more">과정 자세히 보기 →</a>
        </div>
      </div>
    </div>
  );
}
