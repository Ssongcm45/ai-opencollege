// AI 업무 실행 역량 진단 — data + pure scoring engine.
// Transcribed from form-ai-agent-workflow-competency-diagnostic.md (버전 1.1).
// Fully client-safe: no DB, no network, no side effects.

export type AreaKey = "A" | "B" | "C" | "D" | "E";

export interface Question {
  code: string;
  text: string;
}

export interface Area {
  key: AreaKey;
  title: string;
  questions: Question[];
}

// §3 본문항 30개 — verbatim.
export const AREAS: Area[] = [
  {
    key: "A",
    title: "AI 도구 활용 및 기본 이해",
    questions: [
      { code: "A1", text: "업무 목적에 따라 적절한 AI 도구, 모델 또는 AI 에이전트를 선택할 수 있다. (ChatGPT,Claude,Gemini,Grok,RunwayML,Midjourney,Genspark 등)" },
      { code: "A2", text: "생성형 AI가 그럴듯하지만 틀린 결과를 만들 수 있음을 이해하고, 사실 확인이 필요한 업무에는 신뢰할 수 있는 원천자료·MCP·데이터 API 등 근거를 연결해 환각을 줄일 수 있다." },
      { code: "A3", text: "AI 에이전트를 계획하고, 도구를 사용해 실행하고, 결과를 검증·보완하는 반복 루프(하네스)를 이해하며 업무에 적합한 범위를 정할 수 있다." },
      { code: "A4", text: "문서, 이미지, 표, 파일 등 업무 자료와 보조 도구를 활용해 반복되거나 시간이 많이 드는 업무를 개선한다." },
      { code: "A5", text: "AI 또는 에이전트 결과가 업무 요구사항과 원천 근거에 맞는지 검토하고 수정할 수 있다." },
      { code: "A6", text: "새로운 AI 도구, 기능, 정책을 스스로 학습해 업무 방식에 반영할 수 있다." },
    ],
  },
  {
    key: "B",
    title: "프롬프트·컨텍스트·스킬 설계",
    questions: [
      { code: "B1", text: "AI에게 요청할 때 목표와 최종 산출물을 명확히 설명할 수 있다." },
      { code: "B2", text: "더 나은 결과를 위해 필요한 업무 배경, 대상, 참고자료를 제공할 수 있다." },
      { code: "B3", text: "결과물의 범위, 제약, 금지사항, 품질 기준을 구체적으로 제시할 수 있다." },
      { code: "B4", text: "표, 보고서, 이메일, 코드, 요약 등 원하는 출력 형식을 명확히 지정할 수 있다." },
      { code: "B5", text: "복잡한 업무를 단계별 작업으로 나누고, 결과를 검토하며 다음 지시 또는 에이전트 작업 계약을 보완할 수 있다." },
      { code: "B6", text: "`AGENTS.md`, `CLAUDE.md` 등 프로젝트 지침 파일과 스킬(지침·스크립트·참고자료 묶음)을 업무 맥락에 맞게 설정하고 재사용할 수 있다." },
    ],
  },
  {
    key: "C",
    title: "업무 적용 및 데이터 문제 해결",
    questions: [
      { code: "C1", text: "AI를 적용했을 때 효과가 큰 업무와 반드시 사람이 최종 판단해야 할 업무를 구분할 수 있다." },
      { code: "C2", text: "AI 결과를 검토·보완하여 실제 보고서, 기획안, 고객 응대, 회의 준비 등의 산출물에 반영할 수 있다." },
      { code: "C3", text: "다른 AI 에이전트 또는 보조 도구를 연결해 반복 업무를 자동화하되, 각 단계의 입력·출력·검토 책임을 설계할 수 있다." },
      { code: "C4", text: "AI 활용 전후의 시간, 품질, 오류 감소 등 업무 효과를 확인하고 개선할 수 있다." },
      { code: "C5", text: "조직의 핵심 개념·용어·관계(온톨로지 또는 메타데이터)를 정리하고, 업무 데이터와 지식을 DB·저장소에 축적해 재사용하는 중요성을 이해한다." },
      { code: "C6", text: "데이터 분석 전 품질을 점검하고, AI가 제시한 분석·시각화 결과를 원본 데이터와 업무 맥락에 비춰 해석·검증할 수 있다." },
    ],
  },
  {
    key: "D",
    title: "에이전트·MCP·GitHub·CLI 워크플로",
    questions: [
      { code: "D1", text: "단순 대화형 AI와 파일·도구·서비스를 사용해 작업하는 AI 에이전트의 차이를 이해한다." },
      { code: "D2", text: "에이전트에 작업을 요청할 때 작업 범위, 완료 기준, 검증 방법을 명확히 설정할 수 있다." },
      { code: "D3", text: "MCP 또는 커넥터가 정보·문서를 제공하는 기능과 실제 작업을 실행하는 도구를 구분할 수 있다." },
      { code: "D4", text: "MCP·자동화 도구를 사용하기 전 접근 데이터, 필요한 권한, 외부 변경 가능성을 확인할 수 있다." },
      { code: "D5", text: "GitHub 또는 이에 준하는 협업 환경에서 이슈, 브랜치, 변경 이력, PR/diff, 리뷰의 목적을 이해하고 활용할 수 있다." },
      { code: "D6", text: "CLI 또는 실행 환경에서 변경 결과, 로그, 테스트·검증 결과를 확인할 수 있다." },
    ],
  },
  {
    key: "E",
    title: "AI 윤리·보안·품질 거버넌스",
    questions: [
      { code: "E1", text: "개인정보, 기밀정보, 저작권 보호 대상 정보 등 민감한 데이터를 구분할 수 있다." },
      { code: "E2", text: "AI를 사용하거나 외부 도구에 데이터를 연결하기 전에 적용되는 법령·시행령·내부 규정과 승인된 도구의 데이터 입력·공유 기준을 확인할 수 있다." },
      { code: "E3", text: "API 키, 토큰, 비밀번호 등 비밀정보를 코드, 프롬프트, 문서, 로그에 남기지 않도록 관리할 수 있다." },
      { code: "E4", text: "외부 문서, 웹페이지, 이슈에 포함된 지시를 무비판적으로 따르지 않고 프롬프트 인젝션 등 악성 지시 가능성을 점검할 수 있다." },
      { code: "E5", text: "법적 책임, 대외 의사소통, 인사·평가, 금전, 민감정보, 배포·병합처럼 반드시 휴먼터치가 필요한 업무를 구분하고 사람의 검토와 명시적 승인을 받도록 할 수 있다." },
      { code: "E6", text: "AI 결과의 사실성, 출처, 저작권, 편향 가능성을 점검하고 문제가 있으면 수정·중단·보고할 수 있다." },
    ],
  },
];

export interface BackgroundQuestion {
  key: string;
  label: string;
  options: string[];
}

// §2.2 권장 배경 문항 (비채점).
export const BACKGROUND_QUESTIONS: BackgroundQuestion[] = [
  {
    key: "role",
    label: "현재 역할",
    options: ["기획·운영", "사무·지원", "데이터·분석", "개발·자동화", "관리", "기타"],
  },
  {
    key: "frequency",
    label: "최근 3개월의 생성형 AI 사용 빈도",
    options: ["거의 없음", "월 1~2회", "주 1~2회", "주 3회 이상", "거의 매일"],
  },
  {
    key: "environment",
    label: "업무에서 사용하는 환경",
    options: ["일반 대화형 AI", "사내 AI 도구", "GitHub 또는 버전관리", "CLI·개발환경", "MCP·커넥터", "해당 없음"],
  },
  {
    key: "purpose",
    label: "주 활용 목적",
    options: ["문서·기획", "조사·요약", "데이터·분석", "코드·자동화", "회의·협업", "기타"],
  },
];

export interface ScaleOption {
  value: number;
  label: string;
}

// §2.3 응답 척도.
export const SCALE: ScaleOption[] = [
  { value: 1, label: "전혀 해당하지 않음" },
  { value: 2, label: "조금 해당함" },
  { value: 3, label: "보통임" },
  { value: 4, label: "대체로 해당함" },
  { value: 5, label: "매우 해당함" },
];

// §2.1 시작 안내문 (verbatim).
export const INTRO_TEXT =
  "이 설문은 AI 업무 실행 역량과 교육 필요 영역을 파악하기 위한 자기진단입니다. 최근 3개월의 실제 업무 경험을 기준으로 답해 주세요. 고객정보, 개인정보, 기밀정보, API 키 등 실제 민감정보는 입력하지 마세요. 결과는 교육·지원 설계에만 사용하며, 개인의 서열이나 인사평가에 사용하지 않습니다.";

// D 영역 미적용 옵션 라벨 (§2.3).
export const D_NOT_APPLICABLE_LABEL = "현재 업무환경 또는 권한이 없음";

export interface MaturityLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  behavior: string;
}

// §5 성숙도 5단계 (명칭 + 관찰되는 행동).
export const MATURITY_LEVELS: Record<1 | 2 | 3 | 4 | 5, MaturityLevel> = {
  1: {
    level: 1,
    name: "탐색 및 안전한 보조",
    behavior: "AI의 기본 기능과 한계를 익히는 단계. 결과를 바로 업무에 쓰기보다 사람의 확인이 필요하다.",
  },
  2: {
    level: 2,
    name: "기초 반복 활용",
    behavior: "정해진 템플릿과 가이드로 문서·요약·조사 업무를 반복 수행한다.",
  },
  3: {
    level: 3,
    name: "관리된 실무 적용",
    behavior: "실제 산출물과 데이터 업무에 AI를 적용하고, 검토·수정·성과 측정이 가능하다.",
  },
  4: {
    level: 4,
    name: "통합 및 자동화",
    behavior: "에이전트·보조 도구·MCP를 업무 흐름에 연결하고, 권한·검증·휴먼터치를 설계한다.",
  },
  5: {
    level: 5,
    name: "확산 및 최적화",
    behavior: "스킬·지침·데이터 지식체계를 표준화하고, 다른 구성원의 안전한 활용을 지원한다.",
  },
};

// §7.3 영역별 해석 문장 (결과지용) — per area, per Level 1~5.
export const ORG_UPSKILLING_GUIDE: Record<1 | 2 | 3 | 4 | 5, { goal: string; programs: string; caution: string }> = {
  1: { goal: "안전한 첫 사용 만들기", programs: "기본 도구 온보딩, 민감정보 판별, 결과 검토 실습", caution: "고권한 도구·외부 데이터 연결을 서두르지 않는다." },
  2: { goal: "개인 활용을 반복 가능한 습관으로 전환", programs: "직무별 프롬프트·템플릿, 출처 검증, 업무 1건 적용", caution: "교육 후 템플릿이 실제로 재사용되는지 확인한다." },
  3: { goal: "검증된 업무 사례를 팀 워크플로로 확장", programs: "스킬·지침 파일, 데이터 검증, 소규모 PoC", caution: "성공 사례만 보지 말고 오류·중단 사례도 기록한다." },
  4: { goal: "안전한 통합·자동화 구현", programs: "MCP 최소 권한, 에이전트 역할 분리, GitHub·CLI·테스트, 휴먼 승인 설계", caution: "읽기 도구와 쓰기 도구를 구분하고 모든 외부 변경을 승인 흐름에 둔다." },
  5: { goal: "조직 지식과 운영 체계로 최적화", programs: "스킬 라이브러리, `AGENTS.md`/`CLAUDE.md` 표준, 온톨로지·DB, 내부 커뮤니티", caution: "개인의 노하우를 표준화하되 승인·감사·개정 책임자를 명확히 둔다." },
};

export const AREA_LEVEL_SENTENCES: Record<AreaKey, Record<1 | 2 | 3 | 4 | 5, string>> = {
  A: {
    1: "한 가지 승인된 AI 도구로 자주 하는 업무 1건을 안전하게 처리해 보는 것부터 시작하십시오.",
    2: "사실 확인이 필요한 질문에는 원천자료를 함께 제공하고, AI 답변과 근거의 차이를 비교하십시오.",
    3: "업무별로 챗봇·모델·에이전트를 선택하는 기준과 검증 절차를 템플릿으로 만드십시오.",
    4: "근거 데이터 연결, 실행 루프, 실패 시 중단·검토 지점을 포함한 에이전트 하네스를 설계하십시오.",
    5: "팀의 도구 선택·근거 연결·결과 검증 기준을 표준화하고 개선 사례를 확산할 수 있습니다.",
  },
  B: {
    1: "요청마다 목적·분량·출력 형식 세 가지를 먼저 적는 습관을 만드십시오.",
    2: "업무 배경, 참고자료, 금지사항을 더해 재작업을 줄이는 프롬프트를 만드십시오.",
    3: "자주 하는 업무를 단계별 템플릿과 재사용 스킬로 정리하십시오.",
    4: "프로젝트별 `AGENTS.md`·`CLAUDE.md`에 작업 범위, 검증 명령, 금지사항을 명시하십시오.",
    5: "지침 파일과 스킬 라이브러리를 관리하며, 변경 이력과 적용 효과까지 지속적으로 개선할 수 있습니다.",
  },
  C: {
    1: "제출 부담이 없는 작은 업무 1건에서 AI 초안과 본인 수정본을 비교해 보십시오.",
    2: "반복 업무를 하나 고르고, 시간·품질·오류 중 한 지표를 정해 개선 효과를 확인하십시오.",
    3: "데이터 품질 점검과 원본 대조를 포함한 업무 적용 사례를 1건 이상 완주하십시오.",
    4: "여러 에이전트·보조 도구의 입력·출력·검토 책임을 분리하고, 핵심 데이터의 DB 축적 기준을 만드십시오.",
    5: "온톨로지·메타데이터·DB를 활용해 개인의 경험을 조직 지식으로 전환하고 재사용 체계를 운영할 수 있습니다.",
  },
  D: {
    1: "대화형 AI와 도구를 실행하는 에이전트의 차이, 읽기와 쓰기 도구의 차이부터 익히십시오.",
    2: "에이전트 작업 요청에 범위·완료 기준·검증 방법을 함께 적고, 결과를 직접 확인하십시오.",
    3: "이슈·브랜치·diff·테스트 결과를 활용해 변경사항을 검토하는 흐름을 반복하십시오.",
    4: "MCP 권한을 최소화하고, 계획·실행·리뷰 역할을 분리한 에이전트 워크플로를 구축하십시오.",
    5: "안전한 MCP·GitHub·CLI 운영 표준과 리뷰·감사 흐름을 조직에 확산할 수 있습니다.",
  },
  E: {
    1: "개인정보·기밀·시크릿을 입력하지 않는 기본 금지 목록부터 적용하십시오.",
    2: "AI 사용 전 승인된 도구인지, 데이터 공유가 허용되는지, 출처를 확인하는 체크리스트를 쓰십시오.",
    3: "관련 법령·시행령·내부 규정과 휴먼터치가 필요한 업무를 구분하는 기준을 업무 흐름에 넣으십시오.",
    4: "쓰기 권한, 배포, 대외 발신 등 영향이 큰 작업에 명시적 승인·감사·중단 절차를 설계하십시오.",
    5: "법령 변화와 운영 위험을 반영해 조직의 AI 사용 기준·승인 체계·사고 대응 절차를 개선할 수 있습니다.",
  },
};

// §4.2 영역별 수준 밴드 라벨.
export interface AreaLevelBand {
  label: string; // 입문 / 기초 활용 / 실무 적용 / 확산·선도
  band: string; // 해석 문장
}

function areaLevelBand(score: number): AreaLevelBand {
  if (score <= 15) return { label: "입문", band: "기초 개념, 안전한 사용법, 기본 실습이 우선" };
  if (score <= 20) return { label: "기초 활용", band: "가이드와 템플릿 기반으로 적용 가능" };
  if (score <= 25) return { label: "실무 적용", band: "독립적으로 업무에 활용하고 검증 가능" };
  return { label: "확산·선도", band: "업무 방식 개선, 표준화, 동료 지원 가능" };
}

// §4.3 유효 문항 평균 → 성숙도 Level.
function levelFromAverage(avg: number): 1 | 2 | 3 | 4 | 5 {
  if (avg < 2.0) return 1;
  if (avg < 3.0) return 2;
  if (avg < 4.0) return 3;
  if (avg < 4.5) return 4;
  return 5;
}

// 영역 점수(6~30) → 해당 영역 자체의 수준 Level(1~5), §4.2 밴드 매핑.
// 6-15→L1(입문은 넓으므로 areaSentence는 L1~L2 경계를 두지 않고 L1), 16-20→L2, 21-25→L3,
// 26-30→L4 (단 areaScore>=28→L5).
function areaSelfLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score <= 15) return 1;
  if (score <= 20) return 2;
  if (score <= 25) return 3;
  if (score >= 28) return 5;
  return 4;
}

export type Answers = Record<string, number>; // code -> 1..5; D-area codes may map to 0 meaning "미적용".

export interface DiagnosticResult {
  areaScores: Record<AreaKey, number | null>; // 6..30, null when D 미적용
  areaLevels: Record<AreaKey, AreaLevelBand | null>; // §4.2 밴드 라벨
  dApplicable: boolean; // false when 2+ D questions answered 미적용 (§4.1)
  validAverage: number; // 유효 문항 평균 (미적용 D 문항 제외)
  baseLevel: 1 | 2 | 3 | 4 | 5; // §4.3
  finalLevel: 1 | 2 | 3 | 4 | 5; // §5.1 안전성 상한
  agentCapabilityUnknown: boolean; // D 미적용이고 baseLevel>=4일 때 true
  gates: string[]; // §4.4 충족 못한 게이트 안내 문장들 (verbatim)
  strengths: AreaKey[]; // 적용 영역 중 점수 상위 2개
  priorities: AreaKey[]; // 적용 영역 중 점수 하위 2개
  areaSentences: Record<AreaKey, string | null>; // 영역 자체 수준에 맞는 §7.3 문장
}

const AREA_KEYS: AreaKey[] = ["A", "B", "C", "D", "E"];

// §4.4 게이트 운영 원칙 문장 (verbatim).
const GATE_E_LOW = "민감정보 입력, 외부 도구 쓰기 권한, 자동 실행 전에 보안 교육을 우선한다.";
const GATE_D4_E5 = "MCP 쓰기 도구, 메일 발송, 데이터 수정, 배포는 사람 승인 아래에서만 수행한다.";
const GATE_E3 = "시크릿이 필요한 도구·통합 권한을 부여하기 전에 시크릿 관리 교육을 실시한다.";
const GATE_D6 = "에이전트가 만든 변경은 테스트·diff 검토가 가능한 담당자와 공동 검증한다.";

export function computeResult(answers: Answers): DiagnosticResult {
  // 1) 영역별 점수 및 유효 문항 수집.
  const areaScores: Record<AreaKey, number | null> = { A: null, B: null, C: null, D: null, E: null };
  const areaLevels: Record<AreaKey, AreaLevelBand | null> = { A: null, B: null, C: null, D: null, E: null };
  const areaSentences: Record<AreaKey, string | null> = { A: null, B: null, C: null, D: null, E: null };

  // D 영역 미적용(값 0) 개수.
  const dArea = AREAS.find((a) => a.key === "D")!;
  const dNotApplicableCount = dArea.questions.filter((q) => answers[q.code] === 0).length;
  const dApplicable = dNotApplicableCount < 2;

  // 2) 유효 문항 평균: 미적용(0) 문항은 모든 합계·평균에서 제외. D 미적용이면 D 전체 제외.
  let validSum = 0;
  let validCount = 0;

  for (const area of AREAS) {
    const isDArea = area.key === "D";
    // D 미적용이면 D 영역은 유효 문항에서 완전히 제외.
    const includeAreaInAverage = !(isDArea && !dApplicable);

    let areaSum = 0;
    let areaAnswered = 0; // 실제 값(1~5)이 있는 문항 수 (0=미적용 제외)
    for (const q of area.questions) {
      const v = answers[q.code];
      if (v === undefined) continue;
      if (v === 0) continue; // 미적용 문항 — 합계/평균 제외
      areaSum += v;
      areaAnswered += 1;
      if (includeAreaInAverage) {
        validSum += v;
        validCount += 1;
      }
    }

    if (isDArea && !dApplicable) {
      // D 미적용 → 점수/레벨/문장 모두 null.
      areaScores.D = null;
      areaLevels.D = null;
      areaSentences.D = null;
    } else if (areaAnswered > 0) {
      areaScores[area.key] = areaSum;
      areaLevels[area.key] = areaLevelBand(areaSum);
      areaSentences[area.key] = AREA_LEVEL_SENTENCES[area.key][areaSelfLevel(areaSum)];
    }
  }

  const validAverage = validCount > 0 ? validSum / validCount : 0;
  const baseLevel = levelFromAverage(validAverage);

  // 3) §5.1 안전성 상한 (E 영역 기준).
  const eScore = areaScores.E ?? 0;
  const e3 = answers["E3"] ?? 0;
  const e5 = answers["E5"] ?? 0;
  let cap: 1 | 2 | 3 | 4 | 5 = 5;
  if (eScore >= 6 && eScore <= 15) {
    cap = 2;
  } else if ((eScore >= 16 && eScore <= 20) || (e3 >= 1 && e3 <= 2) || (e5 >= 1 && e5 <= 2)) {
    cap = 3;
  }
  const finalLevel = (Math.min(baseLevel, cap) as 1 | 2 | 3 | 4 | 5);

  // §5.1: D 미적용이고 기본 성숙도가 Level 4~5면 에이전트 통합 역량은 미확인.
  const agentCapabilityUnknown = !dApplicable && baseLevel >= 4;

  // 4) §4.4 게이트 — 충족하지 못한 항목의 운영 원칙 문장.
  const gates: string[] = [];
  const d4 = answers["D4"] ?? 0;
  const d6 = answers["D6"] ?? 0;
  if (eScore >= 1 && eScore <= 15) gates.push(GATE_E_LOW);
  if ((d4 >= 1 && d4 <= 2) || (e5 >= 1 && e5 <= 2)) gates.push(GATE_D4_E5);
  if (e3 >= 1 && e3 <= 2) gates.push(GATE_E3);
  if (d6 >= 1 && d6 <= 2) gates.push(GATE_D6);

  // 5) 강점/우선 학습 영역 — 적용 영역 중 점수 상·하위 2개 (§6.1 단순화 허용).
  const applied: { key: AreaKey; score: number }[] = AREA_KEYS.filter(
    (k) => areaScores[k] !== null,
  ).map((k) => ({ key: k, score: areaScores[k] as number }));

  // 동점은 영역 순서(A→E)로 안정 정렬 유지.
  const byScoreDesc = [...applied].sort((a, b) => b.score - a.score);
  const byScoreAsc = [...applied].sort((a, b) => a.score - b.score);

  const strengths = byScoreDesc.slice(0, 2).map((x) => x.key);
  // 우선 학습 영역은 강점과 겹치지 않게 (영역이 4개 미만인 극단은 겹칠 수 있으나 실무상 5개 적용).
  const priorities = byScoreAsc
    .filter((x) => !strengths.includes(x.key))
    .slice(0, 2)
    .map((x) => x.key);

  return {
    areaScores,
    areaLevels,
    dApplicable,
    validAverage,
    baseLevel,
    finalLevel,
    agentCapabilityUnknown,
    gates,
    strengths,
    priorities,
    areaSentences,
  };
}
