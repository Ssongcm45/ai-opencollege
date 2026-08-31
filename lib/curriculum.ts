// 조직 AI학습체크 — 성숙도 Level(1~5)별 추천 교육 커리큘럼.
// 진단 5영역 A(도구·기본) · B(프롬프트·스킬) · C(업무·데이터) · D(에이전트·MCP·CLI) · E(윤리·보안·거버넌스)에
// 맞춰 설계한 정식 커리큘럼으로, 통계 페이지와 PDF 리포트에서 조직 우세 Level 기준으로 제안한다.
import { MATURITY_LEVELS } from "@/lib/diagnostic";

export interface CurriculumModule {
  title: string;
  detail: string;
}

export interface LevelCurriculum {
  level: 1 | 2 | 3 | 4 | 5;
  headline: string; // 한 줄 목표
  duration: string; // 권장 시수·기간
  format: string; // 운영 형태
  modules: CurriculumModule[];
  outcome: string; // 완료 후 도달점
}

export const LEVEL_CURRICULA: Record<1 | 2 | 3 | 4 | 5, LevelCurriculum> = {
  1: {
    level: 1,
    headline: "전 구성원이 두려움 없이 AI를 안전하게 시작합니다.",
    duration: "4~6시간",
    format: "집합 또는 온라인 · 실습 중심 입문 워크숍",
    modules: [
      { title: "생성형 AI 첫걸음", detail: "AI의 기본 기능·한계·환각을 이해하고 어디까지 믿어도 되는지 감을 잡습니다. (A)" },
      { title: "안전한 입력 습관", detail: "민감정보·기밀을 판별하고 마스킹해 안전하게 질문하는 법을 익힙니다. (E)" },
      { title: "결과 검토 기본기", detail: "AI 답변을 사실 확인·출처 대조로 검증하는 습관을 만듭니다. (A·E)" },
      { title: "업무 맛보기 실습", detail: "요약·초안 작성·아이디어 브레인스토밍을 직접 해봅니다. (C)" }
    ],
    outcome: "사람이 검토하는 전제 하에 일상 업무의 보조 도구로 AI를 사용할 수 있습니다."
  },
  2: {
    level: 2,
    headline: "직무별 템플릿·프롬프트로 반복 업무를 표준화합니다.",
    duration: "8~12시간",
    format: "직무별 분반 · 템플릿 구축 실습",
    modules: [
      { title: "프롬프트 기본 공식", detail: "역할·맥락·형식을 지정해 원하는 결과를 안정적으로 얻습니다. (B)" },
      { title: "직무별 프롬프트·템플릿 라이브러리", detail: "부서·업무별로 재사용 가능한 프롬프트 세트를 만듭니다. (B·C)" },
      { title: "문서·요약·조사 워크플로", detail: "보고서·회의록·리서치를 반복 가능한 절차로 처리합니다. (C)" },
      { title: "출처 검증·재작업 줄이기", detail: "근거 확인과 프롬프트 개선으로 오류와 반복 수정을 줄입니다. (E)" }
    ],
    outcome: "반복 문서·요약·조사 업무에 재사용 템플릿이 정착되어 개인 생산성이 안정적으로 오릅니다."
  },
  3: {
    level: 3,
    headline: "검증된 활용 사례를 팀 표준 워크플로로 확장합니다.",
    duration: "16~24시간",
    format: "팀 단위 · 소규모 PoC 병행",
    modules: [
      { title: "스킬·지침 파일 설계", detail: "반복 업무를 스킬·지침 문서로 정리해 팀이 같은 품질로 재현합니다. (B·D 기초)" },
      { title: "데이터 다루기", detail: "표·CSV·데이터를 분석·검증하고 실무 의사결정에 연결합니다. (C)" },
      { title: "업무 자동화 PoC", detail: "실제 업무 1건을 골라 자동화 소규모 실험을 설계·측정합니다. (C)" },
      { title: "품질·오류 관리", detail: "성공뿐 아니라 실패·중단 사례를 기록해 개선 루프를 만듭니다. (E)" }
    ],
    outcome: "팀 단위로 재현 가능한 AI 워크플로와 성과 지표를 확보합니다."
  },
  4: {
    level: 4,
    headline: "에이전트·MCP·CLI를 업무 흐름에 안전하게 통합·자동화합니다.",
    duration: "24~40시간",
    format: "실무 프로젝트 기반 · 심화 과정",
    modules: [
      { title: "에이전트 워크플로 설계", detail: "역할을 분리하고 사람 승인 지점을 둔 에이전트 흐름을 설계합니다. (D)" },
      { title: "MCP·도구 연결", detail: "최소 권한 원칙으로 읽기 도구와 쓰기 도구를 분리해 연결합니다. (D·E)" },
      { title: "GitHub·CLI·테스트 기초", detail: "버전관리·명령줄·검증을 익혀 자동화의 기반을 다집니다. (D)" },
      { title: "자동화 거버넌스", detail: "승인·로깅·롤백을 설계해 외부 변경을 통제된 흐름에 둡니다. (E)" }
    ],
    outcome: "검증·승인 흐름을 갖춘 안전한 자동화 파이프라인을 운영할 수 있습니다."
  },
  5: {
    level: 5,
    headline: "스킬·지침·데이터 지식체계를 표준화하고 조직 전체로 확산합니다.",
    duration: "상시 운영 프로그램",
    format: "사내 코치 양성 + 거버넌스 정례화",
    modules: [
      { title: "스킬 라이브러리 표준화", detail: "AGENTS.md·CLAUDE.md 등 조직 표준 지침 체계를 구축합니다. (D·B)" },
      { title: "지식체계 구축", detail: "온톨로지·내부 DB·RAG로 조직 지식을 AI가 활용하도록 연결합니다. (C·D)" },
      { title: "사내 AI 코치·챔피언 양성", detail: "부서별 리더를 길러 안전한 활용을 자립적으로 확산합니다. (확산)" },
      { title: "감사·개정 거버넌스", detail: "승인·감사·개정 책임자를 명확히 하고 정책을 정례 점검합니다. (E)" }
    ],
    outcome: "조직 표준과 거버넌스를 갖춘 자립적 확산 체계를 확립합니다."
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

// PDF 리포트 "추천 교육 커리큘럼" 필드에 채울 순수 텍스트.
export function curriculumToText(level: 1 | 2 | 3 | 4 | 5): string {
  const c = LEVEL_CURRICULA[level];
  const modules = c.modules.map((m, i) => `${i + 1}. ${m.title} — ${m.detail}`).join("\n");
  return [
    `[Level ${c.level} · ${MATURITY_LEVELS[level].name}] 추천 교육 커리큘럼`,
    `목표: ${c.headline}`,
    `권장: ${c.duration} · ${c.format}`,
    "",
    modules,
    "",
    `완료 후: ${c.outcome}`
  ].join("\n");
}
