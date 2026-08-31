// 조직 AI학습체크 — 성숙도 Level(1~5) × 강의 스타일(전달형/6:4/3:7)별 추천 교육 커리큘럼.
// 진단 5영역 A(도구·기본) · B(프롬프트·스킬) · C(업무·데이터) · D(에이전트·MCP·CLI) · E(윤리·보안·거버넌스)에
// 맞춰 설계한 커리큘럼으로, 관리자가 레벨과 강의 스타일을 선택하면 시수·운영 형태가 달라진다.
import { MATURITY_LEVELS } from "@/lib/diagnostic";

// ── 강의 스타일(강의 : 실습 비중) ──────────────────────
export type LectureStyleId = "lecture" | "balanced" | "practice";

export interface LectureStyle {
  id: LectureStyleId;
  label: string; // 선택지 라벨
  ratio: string; // 강의:실습 비중 표기
  blurb: string; // 한 줄 진행 방식 설명
}

export const LECTURE_STYLES: LectureStyle[] = [
  {
    id: "lecture",
    label: "강의 100% 전달형",
    ratio: "강의 100%",
    blurb: "개념·사례 전달 중심. 대규모 인원의 인식 확산과 온보딩에 적합합니다."
  },
  {
    id: "balanced",
    label: "강의 6 : 실습 4",
    ratio: "강의 60% · 실습 40%",
    blurb: "핵심 강의 후 가이드 실습으로 이해와 적용을 균형 있게 잡습니다."
  },
  {
    id: "practice",
    label: "강의 3 : 실습 7",
    ratio: "강의 30% · 실습 70%",
    blurb: "실습·프로젝트 중심 몰입형으로 현업 적용 성과를 지향합니다."
  }
];

export function getLectureStyle(id: LectureStyleId): LectureStyle {
  return LECTURE_STYLES.find((s) => s.id === id) ?? LECTURE_STYLES[1];
}

// ── Level별 커리큘럼(모듈은 공통, 시수·운영 형태는 스타일별) ──
export interface CurriculumModule {
  title: string;
  detail: string;
}

export interface CurriculumForm {
  duration: string; // 권장 시수·기간 (스타일별)
  format: string; // 운영 형태 (스타일별)
}

export interface LevelCurriculum {
  level: 1 | 2 | 3 | 4 | 5;
  headline: string; // 한 줄 목표 (레벨 고정)
  modules: CurriculumModule[]; // 학습 모듈 (레벨 고정)
  outcome: string; // 완료 후 도달점 (레벨 고정)
  forms: Record<LectureStyleId, CurriculumForm>; // 스타일별 시수·형태
}

export const LEVEL_CURRICULA: Record<1 | 2 | 3 | 4 | 5, LevelCurriculum> = {
  1: {
    level: 1,
    headline: "전 구성원이 두려움 없이 AI를 안전하게 시작합니다.",
    modules: [
      { title: "생성형 AI 첫걸음", detail: "AI의 기본 기능·한계·환각을 이해하고 어디까지 믿어도 되는지 감을 잡습니다. (A)" },
      { title: "안전한 입력 습관", detail: "민감정보·기밀을 판별하고 마스킹해 안전하게 질문하는 법을 익힙니다. (E)" },
      { title: "결과 검토 기본기", detail: "AI 답변을 사실 확인·출처 대조로 검증하는 습관을 만듭니다. (A·E)" },
      { title: "업무 맛보기 실습", detail: "요약·초안 작성·아이디어 브레인스토밍을 직접 해봅니다. (C)" }
    ],
    outcome: "사람이 검토하는 전제 하에 일상 업무의 보조 도구로 AI를 사용할 수 있습니다.",
    forms: {
      lecture: { duration: "3~4시간", format: "대규모 집합·온라인 세미나" },
      balanced: { duration: "5~6시간", format: "강의 후 가이드 실습 워크숍" },
      practice: { duration: "6~8시간", format: "실습 중심 핸즈온 워크숍" }
    }
  },
  2: {
    level: 2,
    headline: "직무별 템플릿·프롬프트로 반복 업무를 표준화합니다.",
    modules: [
      { title: "프롬프트 기본 공식", detail: "역할·맥락·형식을 지정해 원하는 결과를 안정적으로 얻습니다. (B)" },
      { title: "직무별 프롬프트·템플릿 라이브러리", detail: "부서·업무별로 재사용 가능한 프롬프트 세트를 만듭니다. (B·C)" },
      { title: "문서·요약·조사 워크플로", detail: "보고서·회의록·리서치를 반복 가능한 절차로 처리합니다. (C)" },
      { title: "출처 검증·재작업 줄이기", detail: "근거 확인과 프롬프트 개선으로 오류와 반복 수정을 줄입니다. (E)" }
    ],
    outcome: "반복 문서·요약·조사 업무에 재사용 템플릿이 정착되어 개인 생산성이 안정적으로 오릅니다.",
    forms: {
      lecture: { duration: "5~6시간", format: "직무별 개념·사례 강의" },
      balanced: { duration: "8~12시간", format: "강의 + 직무별 템플릿 실습" },
      practice: { duration: "12~16시간", format: "직무 템플릿 제작 워크숍" }
    }
  },
  3: {
    level: 3,
    headline: "검증된 활용 사례를 팀 표준 워크플로로 확장합니다.",
    modules: [
      { title: "스킬·지침 파일 설계", detail: "반복 업무를 스킬·지침 문서로 정리해 팀이 같은 품질로 재현합니다. (B·D 기초)" },
      { title: "데이터 다루기", detail: "표·CSV·데이터를 분석·검증하고 실무 의사결정에 연결합니다. (C)" },
      { title: "업무 자동화 PoC", detail: "실제 업무 1건을 골라 자동화 소규모 실험을 설계·측정합니다. (C)" },
      { title: "품질·오류 관리", detail: "성공뿐 아니라 실패·중단 사례를 기록해 개선 루프를 만듭니다. (E)" }
    ],
    outcome: "팀 단위로 재현 가능한 AI 워크플로와 성과 지표를 확보합니다.",
    forms: {
      lecture: { duration: "8~10시간", format: "사례 강의·라이브 데모 중심" },
      balanced: { duration: "16~24시간", format: "강의 + 팀 실습 병행" },
      practice: { duration: "24~32시간", format: "팀 PoC 프로젝트 중심" }
    }
  },
  4: {
    level: 4,
    headline: "에이전트·MCP·CLI를 업무 흐름에 안전하게 통합·자동화합니다.",
    modules: [
      { title: "에이전트 워크플로 설계", detail: "역할을 분리하고 사람 승인 지점을 둔 에이전트 흐름을 설계합니다. (D)" },
      { title: "MCP·도구 연결", detail: "최소 권한 원칙으로 읽기 도구와 쓰기 도구를 분리해 연결합니다. (D·E)" },
      { title: "GitHub·CLI·테스트 기초", detail: "버전관리·명령줄·검증을 익혀 자동화의 기반을 다집니다. (D)" },
      { title: "자동화 거버넌스", detail: "승인·로깅·롤백을 설계해 외부 변경을 통제된 흐름에 둡니다. (E)" }
    ],
    outcome: "검증·승인 흐름을 갖춘 안전한 자동화 파이프라인을 운영할 수 있습니다.",
    forms: {
      lecture: { duration: "12~16시간", format: "아키텍처·거버넌스 강의 중심" },
      balanced: { duration: "24~40시간", format: "강의 + 실습 프로젝트 병행" },
      practice: { duration: "40~56시간", format: "실전 통합 프로젝트 중심" }
    }
  },
  5: {
    level: 5,
    headline: "스킬·지침·데이터 지식체계를 표준화하고 조직 전체로 확산합니다.",
    modules: [
      { title: "스킬 라이브러리 표준화", detail: "AGENTS.md·CLAUDE.md 등 조직 표준 지침 체계를 구축합니다. (D·B)" },
      { title: "지식체계 구축", detail: "온톨로지·내부 DB·RAG로 조직 지식을 AI가 활용하도록 연결합니다. (C·D)" },
      { title: "사내 AI 코치·챔피언 양성", detail: "부서별 리더를 길러 안전한 활용을 자립적으로 확산합니다. (확산)" },
      { title: "감사·개정 거버넌스", detail: "승인·감사·개정 책임자를 명확히 하고 정책을 정례 점검합니다. (E)" }
    ],
    outcome: "조직 표준과 거버넌스를 갖춘 자립적 확산 체계를 확립합니다.",
    forms: {
      lecture: { duration: "월 2~4시간 정기 세미나", format: "리더 대상 강의·공유회" },
      balanced: { duration: "월 4~8시간 상시", format: "강의 + 코치 실습 병행" },
      practice: { duration: "분기 프로젝트 상시", format: "챔피언 주도 실습·구축" }
    }
  }
};

// 성숙도 분포에서 가장 인원이 많은(우세) Level. 동률이면 상위 Level 우선.
export function dominantLevelFromDistribution(
  levelDistribution: Record<1 | 2 | 3 | 4 | 5, number>
): 1 | 2 | 3 | 4 | 5 {
  return ([1, 2, 3, 4, 5] as const).reduce(
    (dominant, level) =>
      levelDistribution[level] >= levelDistribution[dominant] ? level : dominant,
    1 as 1 | 2 | 3 | 4 | 5
  );
}

// Level × 스타일 → 화면 렌더용 조합 결과.
export interface ComposedCurriculum {
  level: 1 | 2 | 3 | 4 | 5;
  levelName: string;
  style: LectureStyle;
  headline: string;
  duration: string;
  format: string;
  modules: CurriculumModule[];
  outcome: string;
}

export function composeCurriculum(
  level: 1 | 2 | 3 | 4 | 5,
  styleId: LectureStyleId
): ComposedCurriculum {
  const base = LEVEL_CURRICULA[level];
  const style = getLectureStyle(styleId);
  const form = base.forms[style.id];
  return {
    level,
    levelName: MATURITY_LEVELS[level].name,
    style,
    headline: base.headline,
    duration: form.duration,
    format: form.format,
    modules: base.modules,
    outcome: base.outcome
  };
}

// PDF 리포트 "추천 교육 커리큘럼" 필드에 채울 순수 텍스트.
export function curriculumToText(level: 1 | 2 | 3 | 4 | 5, styleId: LectureStyleId): string {
  const c = composeCurriculum(level, styleId);
  const modules = c.modules.map((m, i) => `${i + 1}. ${m.title} — ${m.detail}`).join("\n");
  return [
    `[Level ${c.level} · ${c.levelName}] 추천 교육 커리큘럼`,
    `진행 방식: ${c.style.label} (${c.style.ratio}) — ${c.style.blurb}`,
    `목표: ${c.headline}`,
    `권장: ${c.duration} · ${c.format}`,
    "",
    modules,
    "",
    `완료 후: ${c.outcome}`
  ].join("\n");
}
