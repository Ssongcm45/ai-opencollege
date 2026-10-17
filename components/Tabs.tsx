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
            <a href="#contact" className="btn bp btn-pill">{panel.cta}</a>
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

type TrackModule = { title: string; desc: string };
type FlowStep = { t: string; s: string };
type LevelBar = { code: string; name: string; hours: number; out: string };
type Track = {
  id: string;
  color: string;
  navTitle: string;
  navSub: string;
  tag: string;
  heading: string;
  sub: string;
  desc: string;
  chips: string[];
  mods: TrackModule[];
  hours: string;
  level: string;
  levels?: LevelBar[];
};

const tracks: Track[] = [
  {
    id: "A", color: "#E85A3E", navTitle: "완전 기초과정", navSub: "AI를 처음 시작하는 분",
    tag: "TRACK A · FOUNDATION",
    heading: "AI가 처음이어도\n오늘 바로 써봅니다",
    sub: "대상: AI 입문자, 디지털 도구가 낯선 실무자 · 수준: 완전 기초",
    desc: "계정 만들기, 질문하는 법, 안전한 사용 기준, 간단한 문서 작성까지 첫 경험의 장벽을 낮춥니다.",
    chips: ["AI 기본 개념", "프롬프트 첫걸음", "문서 초안", "보안·윤리"],
    mods: [
      { title: "AI와 친해지기", desc: "생성형 AI의 역할과 조심할 일을 쉽게 정리합니다." },
      { title: "질문을 업무로 바꾸기", desc: "목적·역할·형식·조건을 넣어 원하는 답을 얻는 구조를 익힙니다." },
      { title: "첫 결과물 만들기", desc: "안내문, 이메일, 요약문 등 바로 확인 가능한 결과물을 완성합니다." }
    ],
    hours: "3~6시간", level: "완전 기초"
  },
  {
    id: "B", color: "#0E1B3C", navTitle: "사무직 트랙", navSub: "문서·보고·회의 업무",
    tag: "TRACK B · OFFICE WORK",
    heading: "보고서·이메일·회의록을\n더 빠르게 완성합니다",
    sub: "대상: 사무직, 공무원, 관리직 · 수준: 입문~중급",
    desc: "반복 문서와 커뮤니케이션 업무를 AI로 줄이고, 조직에서 바로 쓰는 산출물 중심으로 훈련합니다.",
    chips: ["보고서 초안", "회의록 요약", "이메일 자동화", "GPTs 활용"],
    mods: [
      { title: "업무 프롬프트 설계", desc: "직무·목표·형식에 맞춰 재사용 가능한 요청문을 만듭니다." },
      { title: "문서 초안과 검토", desc: "제안서, 보고자료, 안내문을 만들고 검토 기준까지 적용합니다." },
      { title: "개인 업무 자동화", desc: "자주 하는 업무를 템플릿과 맞춤 GPT로 정리합니다." }
    ],
    hours: "4~8시간", level: "입문 ~ 중급"
  },
  {
    id: "C", color: "#6366F1", navTitle: "AI 크리에이티브", navSub: "이미지·영상·콘텐츠",
    tag: "TRACK C · AI CREATIVE",
    heading: "디자인팀이 아니어도\n콘텐츠를 만듭니다",
    sub: "대상: 홍보·마케팅·SNS 운영자 · 수준: 입문~중급",
    desc: "이미지, 영상, 음성, 카드뉴스까지 실무 콘텐츠 제작 흐름을 직접 경험합니다.",
    chips: ["이미지 생성", "영상 제작", "카피라이팅", "콘텐츠 운영"],
    mods: [
      { title: "콘텐츠 콘셉트 설계", desc: "타깃, 메시지, 톤앤매너를 정리해 제작 기준을 만듭니다." },
      { title: "이미지·영상 제작", desc: "생성형 이미지와 영상 도구를 활용해 홍보물을 제작합니다." },
      { title: "게시물 패키징", desc: "제목, 썸네일, 본문, CTA까지 배포 가능한 형태로 정리합니다." }
    ],
    hours: "6~12시간", level: "입문 ~ 중급"
  },
  {
    id: "D", color: "#B89545", navTitle: "AI 전략기획", navSub: "기획·사업·DX 담당",
    tag: "TRACK D · AI STRATEGY",
    heading: "아이디어를 사업계획과\n실행안으로 연결합니다",
    sub: "대상: 창업자, 기획자, DX 담당자 · 수준: 중급",
    desc: "시장 조사, 고객 분석, 사업계획, 실행 로드맵을 AI와 함께 설계합니다.",
    chips: ["시장 리서치", "사업계획서", "경쟁 분석", "DX 로드맵"],
    mods: [
      { title: "AI 리서치", desc: "자료 탐색과 요약을 통해 기획의 근거를 빠르게 정리합니다." },
      { title: "기획서 구조화", desc: "목표, 문제, 해결안, 실행계획을 문서 구조로 만듭니다." },
      { title: "전략 검토", desc: "리스크, 우선순위, KPI를 점검해 실행 가능성을 높입니다." }
    ],
    hours: "6~12시간", level: "중급"
  },
  {
    id: "E", color: "#3D5341", navTitle: "AI 리더십", navSub: "임원·관리자·리더",
    tag: "TRACK E · AI LEADERSHIP",
    heading: "리더가 먼저 이해해야\n조직이 움직입니다",
    sub: "대상: CEO, 임원, 관리자, 팀장 · 수준: 비개발 관리자",
    desc: "AI 도입 의사결정, 업무 전환, 조직 역량 관리에 필요한 관점을 실습과 사례로 정리합니다.",
    chips: ["AI 도입 전략", "조직 변화관리", "업무 재설계", "리더 인사이트"],
    mods: [
      { title: "AI 트렌드와 조직 영향", desc: "현재 기술 변화가 산업과 조직 운영에 미치는 영향을 봅니다." },
      { title: "도입 우선순위 설정", desc: "무엇부터 바꿀지 판단하는 프레임워크를 적용합니다." },
      { title: "리더 실습", desc: "직접 AI를 써보며 조직 내 확산 메시지를 설계합니다." }
    ],
    hours: "6~12시간", level: "비개발 관리자"
  },
  {
    id: "F", color: "#0D9488", navTitle: "AI 강사과정", navSub: "강사·HRD·코치",
    tag: "TRACK F · AI INSTRUCTOR",
    heading: "AI를 가르치는 사람을\n체계적으로 양성합니다",
    sub: "대상: 강사, 교사, HRD 담당자, 코치 · 수준: 중급~고급",
    desc: "AI 교육 설계, 강의안, 실습 과제, 평가 기준까지 현장형으로 준비하는 강사 양성 과정입니다.",
    chips: ["커리큘럼 설계", "강의안 제작", "실습 운영", "강사 브랜딩"],
    mods: [
      { title: "AI 교육 설계", desc: "대상과 목표에 맞는 교육 흐름과 활동을 구성합니다." },
      { title: "강의 자료 제작", desc: "강의안, 실습지, 평가 루브릭을 AI와 함께 만듭니다." },
      { title: "시연과 피드백", desc: "마이크로 티칭과 피드백으로 강의 운영력을 점검합니다." }
    ],
    hours: "30시간", level: "중급 ~ 고급"
  },
  {
    id: "OS", color: "#0F766E", navTitle: "AI OS 운영 트랙", navSub: "도구·지식·에이전트·운영 연결",
    tag: "AI OS OPERATIONS",
    heading: "흩어진 AI 활용을\n하나의 운영 흐름으로 만듭니다",
    sub: "대상: 업무 프로세스 담당자, 팀 리더, 운영·DX 담당자 · 수준: 중급~고급",
    desc: "조직의 도구와 업무 지식을 연결하고 역할별 에이전트와 자동화 흐름을 설계합니다. 사람의 검토와 예외 처리, 실행 기록과 개선 주기까지 포함해 실제 운영할 수 있는 업무 체계를 완성합니다.",
    chips: ["도구·지식 연결", "역할별 에이전트", "업무 흐름 자동화", "검토·기록·개선"],
    mods: [
      { title: "업무 맥락과 역할 설계", desc: "사용할 도구, 자료, 판단 기준을 정리하고 에이전트별 책임과 사람에게 넘길 지점을 정의합니다." },
      { title: "자동화 흐름과 통제 설계", desc: "입력부터 실행·검토·예외 처리까지 업무 흐름을 구성하고 승인 기준과 실행 기록 방식을 정합니다." },
      { title: "운영 실습과 개선 가이드", desc: "대표 업무를 끝까지 시뮬레이션하고 오류·예외 기록을 바탕으로 운영 흐름과 담당자 가이드를 완성합니다." }
    ],
    hours: "24~30시간", level: "중급 ~ 고급"
  },
  {
    id: "J", color: "#4B5563", navTitle: "취업준비 트랙", navSub: "대학생·구직자",
    tag: "JOB TRACK",
    heading: "AI로 취업 준비의\n완성도를 높입니다",
    sub: "대상: 대학생, 구직자 · 수준: 입문~중급",
    desc: "자기소개서, 포트폴리오, 면접 준비, 직무 분석까지 AI를 취업 역량으로 전환합니다.",
    chips: ["자소서 작성", "포트폴리오", "모의 면접", "직무 분석"],
    mods: [
      { title: "직무 기반 자기소개서", desc: "경험을 구조화하고 직무 언어로 바꿉니다." },
      { title: "포트폴리오 설계", desc: "프로젝트를 보기 쉬운 스토리와 증거로 정리합니다." },
      { title: "AI 면접 리허설", desc: "예상 질문, 답변 점검, 보완 피드백을 반복합니다." }
    ],
    hours: "80시간", level: "입문 ~ 중급"
  },
  {
    id: "G", color: "#5B5BD6", navTitle: "에이전트 트랙", navSub: "오픈클로·헤르메스·직접 구축",
    tag: "AGENT TRACK",
    heading: "AI 에이전트를 이해하고\n직접 구축합니다",
    sub: "대상: 실무 자동화 담당자, 기획자, 강사, 운영자 · 수준: 입문~중급",
    desc: "오픈클로, 헤르메스 같은 에이전트 도구의 사용 흐름부터 업무 목적에 맞춘 직접 구축형 에이전트 설계까지 다룹니다.",
    chips: ["오픈클로 활용", "헤르메스 활용", "워크플로 설계", "직접 구축"],
    mods: [
      { title: "에이전트 개념과 활용 구조", desc: "도구 호출, 역할 분담, 작업 흐름을 이해하고 업무에 맞는 사용 범위를 정합니다." },
      { title: "오픈클로·헤르메스 실습", desc: "기존 에이전트 도구로 리서치, 문서화, 반복 업무 자동화 흐름을 실습합니다." },
      { title: "직접 구축형 에이전트 설계", desc: "목표, 입력, 실행 단계, 검증 기준을 정의해 나만의 업무 에이전트를 설계합니다." }
    ],
    hours: "8~12시간", level: "입문 ~ 중급"
  },
  {
    id: "RD", color: "#2563EB", navTitle: "연구 R&D 트랙", navSub: "연구원·연구실·구축 담당",
    tag: "R&D TRACK · RESEARCH AI",
    heading: "특허·논문 조사부터\n연구실 AI 시스템까지",
    sub: "대상: 연구원, 연구실 실무 담당, 연구 지원·구축 담당 · 수준: 기초~고급",
    desc: "AI로 특허·논문을 찾고 읽고 정리해 보고하는 기초에서 시작해, 연구 지식 파이프라인 자동화, 멀티에이전트 연구 보조, 연구원용 검색 화면, 기관 내부 로컬 sLLM 운영까지 단계별로 이어집니다. 레벨마다 모듈 단위로 나뉘어 필요한 부분만 골라 들을 수 있습니다.",
    chips: ["특허·논문 조사", "용어 사전·라벨링", "연구 지식 파이프라인", "멀티에이전트", "로컬 sLLM"],
    mods: [
      { title: "연구원 일반 · L1 (30시간)", desc: "자기 연구 주제의 특허·논문을 찾고 정리해 요약 보고서로 만듭니다." },
      { title: "연구실 실무 담당 · L1 → L2 → L3 (114시간)", desc: "검색 파이프라인과 역할별 에이전트 팀을 연구실에서 직접 운영합니다." },
      { title: "구축 담당 · L2 → L4 → L5 (102시간)", desc: "연구원이 쓰는 검색 화면과 자료를 밖으로 내보내지 않는 기관 내부 AI 환경을 구축합니다." }
    ],
    hours: "198시간 (레벨별 선택)", level: "기초 ~ 고급",
    levels: [
      { code: "L1", name: "기초", hours: 30, out: "검색식·용어 사전·문헌 표·요약 보고서" },
      { code: "L2", name: "실무", hours: 42, out: "수집→변환→색인→검색 자동 파이프라인" },
      { code: "L3", name: "에이전트", hours: 42, out: "수집·정리·검수·보고 에이전트 팀 + 사람 승인" },
      { code: "L4", name: "화면", hours: 30, out: "검색 화면·대시보드·검수 화면 3종" },
      { code: "L5", name: "인프라", hours: 30, out: "기관 내부 로컬 sLLM·검색 운영 환경" },
      { code: "C", name: "캡스톤", hours: 24, out: "실제 연구 과제 1건 적용·발표" }
    ]
  },
  {
    id: "R", color: "#111827", navTitle: "정규교육과정", navSub: "기관 장기 과정",
    tag: "REGULAR PROGRAM",
    heading: "기관 교육과정으로\nAI 역량을 체계화합니다",
    sub: "대상: 대학, 공공기관, 인재개발원, 장기 교육 운영기관",
    desc: "학기제, 비교과, 직무전환, 지역 인재양성 등 장기 과정에 맞춰 진단·교육·평가·수료 관리를 설계합니다.",
    chips: ["학기제 과정", "비교과 과정", "직무전환", "성과 관리"],
    mods: [
      { title: "교육체계 설계", desc: "수준 진단과 목표 역량을 기반으로 모듈형 과정을 만듭니다." },
      { title: "프로젝트형 운영", desc: "팀 프로젝트, 산출물, 발표, 피드백까지 운영합니다." },
      { title: "수료·성과 관리", desc: "수료 기준과 결과 리포트를 기관 요구에 맞게 정리합니다." }
    ],
    hours: "100~300시간", level: "입문 ~ 고급"
  }
];

const trackFlows: Record<string, FlowStep[]> = {
  A: [
    { t: "계정·환경 준비", s: "도구 첫 접속" },
    { t: "질문 구조 익히기", s: "목적·역할·형식" },
    { t: "첫 결과물", s: "안내문·요약문" },
    { t: "안전 기준", s: "보안·윤리 점검" }
  ],
  B: [
    { t: "업무 정리", s: "반복 문서 찾기" },
    { t: "프롬프트 템플릿", s: "재사용 요청문" },
    { t: "초안·검토", s: "보고서·이메일" },
    { t: "업무 자동화", s: "맞춤 GPT" }
  ],
  C: [
    { t: "콘셉트", s: "타깃·톤앤매너" },
    { t: "이미지 생성", s: "홍보 비주얼" },
    { t: "영상·음성", s: "숏폼 제작" },
    { t: "게시물 배포", s: "썸네일·본문·CTA" }
  ],
  D: [
    { t: "AI 리서치", s: "시장·경쟁 조사" },
    { t: "고객 분석", s: "문제 정의" },
    { t: "사업계획서", s: "문서 구조화" },
    { t: "실행 로드맵", s: "KPI·우선순위" }
  ],
  E: [
    { t: "트렌드 이해", s: "조직 영향" },
    { t: "우선순위", s: "도입 판단" },
    { t: "리더 실습", s: "직접 써보기" },
    { t: "확산 메시지", s: "변화관리" }
  ],
  F: [
    { t: "교육 설계", s: "대상·목표" },
    { t: "자료 제작", s: "강의안·실습지" },
    { t: "마이크로 티칭", s: "시연" },
    { t: "피드백", s: "평가 루브릭" }
  ],
  OS: [
    { t: "도구·지식 연결", s: "업무 맥락" },
    { t: "역할별 에이전트", s: "책임 정의" },
    { t: "승인·예외 처리", s: "사람 검토" },
    { t: "기록·개선", s: "운영 가이드" }
  ],
  J: [
    { t: "직무 분석", s: "목표 직무" },
    { t: "자기소개서", s: "경험 구조화" },
    { t: "포트폴리오", s: "증거 정리" },
    { t: "모의 면접", s: "AI 리허설" }
  ],
  G: [
    { t: "개념 이해", s: "도구·역할" },
    { t: "도구 실습", s: "오픈클로·헤르메스" },
    { t: "직접 설계", s: "나만의 에이전트" },
    { t: "검증", s: "실행 기준" }
  ],
  RD: [
    { t: "찾기", s: "특허·논문 검색식" },
    { t: "읽히기", s: "PDF·한글 변환" },
    { t: "정리", s: "용어 사전·라벨링" },
    { t: "보고서", s: "선행기술 요약" }
  ],
  R: [
    { t: "수준 진단", s: "AI학습체크" },
    { t: "모듈 설계", s: "목표 역량" },
    { t: "프로젝트 운영", s: "산출물·발표" },
    { t: "수료·성과", s: "결과 리포트" }
  ]
};

function TrackFlow({ steps, color }: { steps: FlowStep[]; color: string }) {
  return (
    <ol className="cp-flow" style={{ ["--tc" as string]: color }} aria-label="학습 흐름">
      {steps.map((step, i) => (
        <li className="cpf-step" key={step.t}>
          <span className="cpf-dot">{i + 1}</span>
          <span className="cpf-t">{step.t}</span>
          <span className="cpf-s">{step.s}</span>
        </li>
      ))}
    </ol>
  );
}

function LevelChart({ levels, color }: { levels: LevelBar[]; color: string }) {
  const max = Math.max(...levels.map((l) => l.hours));
  const total = levels.reduce((sum, l) => sum + l.hours, 0);
  return (
    <figure className="cp-levels" style={{ ["--tc" as string]: color }}>
      <figcaption>
        <strong>레벨별 과정 구성</strong>
        <span>총 {total}시간 · 1회 3시간 · 레벨별 수강 가능</span>
      </figcaption>
      <div className="cpl-branch" aria-hidden="true">
        <span>L1 기초</span><i>→</i><span>L2 실무</span><i>→</i>
        <span className="split"><b>L3 에이전트</b><b>L4 화면 → L5 인프라</b></span><i>→</i><span>캡스톤</span>
      </div>
      <ul>
        {levels.map((l) => (
          <li key={l.code}>
            <span className="cpl-code">{l.code}</span>
            <span className="cpl-name">{l.name}</span>
            <span className="cpl-bar"><span style={{ width: `${(l.hours / max) * 100}%` }}>{l.hours}h</span></span>
            <span className="cpl-out">{l.out}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function CurriculumTabs() {
  const [active, setActive] = useState(0);
  const item = tracks[active];
  const flow = trackFlows[item.id];

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
          {flow ? <TrackFlow steps={flow} color={item.color} /> : null}
          {item.levels ? <LevelChart levels={item.levels} color={item.color} /> : null}
          {item.levels ? <div className="cp-mods-h">수강 경로</div> : null}
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
        </div>
      </div>
    </div>
  );
}
