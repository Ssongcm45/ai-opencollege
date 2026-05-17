"use client";

import { useState } from "react";

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
      cta: "출강 문의하기"
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
      cta: "기업 교육 문의"
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
      cta: "수강 문의"
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
      cta: "준비 과정 문의"
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
          <a href="#contact" className="btn bp btn-pill">{panel.cta}</a>
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
  const tracks = [
    ["A", "완전 기초과정", "AI를 처음 시작하는 분", "#E85A3E", "AI가 처음이어도\n오늘 바로 써봅니다", "계정 만들기, 질문하는 법, 안전한 사용 기준, 간단한 문서 작성까지 첫 경험의 장벽을 낮춥니다.", "3~6시간", ["AI 기본 개념", "프롬프트 첫걸음", "문서 초안", "보안·윤리"], "수료증"],
    ["B", "사무직 트랙", "문서·보고·회의 업무", "#0E1B3C", "보고서·이메일·회의록을\n더 빠르게 완성합니다", "반복 문서와 커뮤니케이션 업무를 AI로 줄이고, 조직에서 바로 쓰는 산출물 중심으로 훈련합니다.", "4~8시간", ["보고서 초안", "회의록 요약", "이메일 자동화", "GPTs 활용"], "수료증"],
    ["C", "AI 크리에이티브", "이미지·영상·콘텐츠", "#6366F1", "디자인팀이 아니어도\n콘텐츠를 만듭니다", "이미지, 영상, 음성, 카드뉴스까지 실무 콘텐츠 제작 흐름을 직접 경험합니다.", "6~12시간", ["이미지 생성", "영상 제작", "카피라이팅", "콘텐츠 운영"], "수료증"],
    ["D", "AI 전략기획", "기획·사업·DX 담당", "#B89545", "아이디어를 사업계획과\n실행안으로 연결합니다", "시장 조사, 고객 분석, 사업계획, 실행 로드맵을 AI와 함께 설계합니다.", "6~12시간", ["시장 리서치", "사업계획서", "경쟁 분석", "DX 로드맵"], "수료증"],
    ["E", "AI 리더십", "임원·관리자·리더", "#3D5341", "리더가 먼저 이해해야\n조직이 움직입니다", "AI 도입 의사결정, 업무 전환, 조직 역량 관리에 필요한 관점을 실습과 사례로 정리합니다.", "6~12시간", ["AI 도입 전략", "조직 변화관리", "업무 재설계", "리더 인사이트"], "수료증"],
    ["F", "AI 강사과정", "강사·HRD·코치", "#0D9488", "AI를 가르치는 사람을\n체계적으로 양성합니다", "AI 교육 설계, 강의안, 실습 과제, 평가 기준까지 현장형으로 준비하는 강사 양성 과정입니다.", "30시간", ["커리큘럼 설계", "강의안 제작", "실습 운영", "강사 브랜딩"], "수료증"],
    ["S", "시니어 트랙", "50+ 생활 AI", "#D97706", "50+도 부담 없이\nAI를 생활 도구로 씁니다", "말로 질문하기, 가족 문자 작성, 건강 정보 확인, 생활 편의 기능까지 쉬운 언어로 시작합니다.", "8~12시간", ["음성 입력", "생활 검색", "가족 소통", "안전한 사용"], "수료증"],
    ["J", "취업준비 트랙", "대학생·구직자", "#4B5563", "AI로 취업 준비의\n완성도를 높입니다", "자기소개서, 포트폴리오, 면접 준비, 직무 분석까지 AI를 취업 역량으로 전환합니다.", "80시간", ["자소서 작성", "포트폴리오", "모의 면접", "직무 분석"], "수료증"],
    ["G", "에이전트 트랙", "오픈클로·헤르메스·직접 구축", "#5B5BD6", "AI 에이전트를 이해하고\n직접 구축합니다", "에이전트 도구의 사용 흐름부터 업무 목적에 맞춘 직접 구축형 에이전트 설계까지 다룹니다.", "8~12시간", ["오픈클로 활용", "헤르메스 활용", "워크플로 설계", "직접 구축"], "수료증"],
    ["R", "정규교육과정", "기관 장기 과정", "#111827", "기관 교육과정으로\nAI 역량을 체계화합니다", "학기제, 비교과, 직무전환, 지역 인재양성 등 장기 과정에 맞춰 진단·교육·평가·수료 관리를 설계합니다.", "100~300시간", ["학기제 과정", "비교과 과정", "직무전환", "성과 관리"], "수료증"]
  ];
  const item = tracks[active];

  return (
    <div className="curr-wrap">
      <div className="curr-nav">
        {tracks.map((track, index) => (
          <button className={`cn-item ${active === index ? "on" : ""}`} key={track[0] as string} onClick={() => setActive(index)}>
            <span className="track-dot" style={{ background: track[3] as string }} />
            <span className="cn-num">{track[0]}</span>
            <span className="cn-body"><h4>{track[1]}</h4><p>{track[2]}</p></span>
          </button>
        ))}
      </div>
      <div className="curr-panel-zone">
        <div className="cpanel on">
          <div className="cp-tag">TRACK {item[0]}</div>
          <h3 className="cp-h">{(item[4] as string).split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h3>
          <div className="cp-sub">대상: {item[2]} · 수준: 맞춤 설계</div>
          <p className="cp-desc">{item[5]}</p>
          <div className="cp-chips">{(item[7] as string[]).map((chip) => <span className="cp-chip" key={chip}>{chip}</span>)}</div>
          <div className="cp-meta">
            <div className="cpm2"><div className="k">권장 시간</div><div className="v">{item[6]}</div></div>
            <div className="cpm2"><div className="k">형태</div><div className="v">출강 · 온라인</div></div>
            <div className="cpm2"><div className="k">수준</div><div className="v">입문 ~ 고급</div></div>
            <div className="cpm2"><div className="k">제공</div><div className="v">{item[8]}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
