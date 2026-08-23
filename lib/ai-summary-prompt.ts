// AI 총평 프롬프트 빌더 — 서버 액션(generateAiSummary)과 운영 스크립트가
// 동일한 프롬프트를 사용하도록 분리한 순수 모듈.
import type { GroupStats } from "@/lib/check-data";
import { AREAS, MATURITY_LEVELS, ORG_UPSKILLING_GUIDE, type AreaKey } from "@/lib/diagnostic";

function areaTitle(key: AreaKey): string {
  return AREAS.find((area) => area.key === key)?.title ?? key;
}

const pctText = (value: number) => `${Math.round(value * 100)}%`;

export function buildAiSummaryMessages(groupName: string, stats: GroupStats): { system: string; user: string } {
  const dominantLevel = ([1, 2, 3, 4, 5] as const).reduce(
    (dominant, level) =>
      stats.levelDistribution[level] >= stats.levelDistribution[dominant] ? level : dominant,
    1 as 1 | 2 | 3 | 4 | 5
  );
  const guide = ORG_UPSKILLING_GUIDE[dominantLevel];

  const levelLines = ([1, 2, 3, 4, 5] as const)
    .map((level) => `Level ${level} ${MATURITY_LEVELS[level].name}: ${stats.levelDistribution[level]}명`)
    .join(", ");
  const areaLines = (["A", "B", "C", "D", "E"] as AreaKey[])
    .map((key) => {
      const avg = stats.areaAverages[key];
      return `${key}(${areaTitle(key)}): ${avg === null ? "미적용" : `${avg.toFixed(1)}/30`}`;
    })
    .join(", ");
  const lowestAreaText = stats.lowestArea
    ? `${stats.lowestArea}(${areaTitle(stats.lowestArea)})`
    : "없음";
  const roleLines = stats.roleDistribution.map((r) => `${r.role} ${r.count}명`).join(", ") || "없음";

  const system =
    "당신은 조직의 AI 업무 역량 진단 결과를 해석하는 교육 컨설턴트다. 과장 없이 데이터에 근거해 쓰고, 개인을 지목하지 않으며, '낮음' 대신 '우선 학습 영역' 같은 성장 언어를 쓴다.";

  const user = [
    `조직명: ${groupName}`,
    `응답 수: ${stats.n}명`,
    `평균 유효점수: ${stats.avgValidAverage.toFixed(1)}/5.0`,
    `Level 분포: ${levelLines}`,
    `영역별 평균: ${areaLines}`,
    `우선 학습(최저) 영역: ${lowestAreaText}`,
    `안전 준비도 — E 21점 이상 비율: ${pctText(stats.eSafeRate)}, 게이트 무경보 비율: ${pctText(stats.gatePassRate)}, D 적용자 중 D 준비율: ${stats.dReadyRate === null ? "해당 없음" : pctText(stats.dReadyRate)}`,
    `역할 분포: ${roleLines}`,
    `우세 Level(${dominantLevel}) 업스킬링 가이드 — 목표: ${guide.goal} / 권장 프로그램: ${guide.programs} / 운영 주의점: ${guide.caution}`,
    "",
    "다음 구성으로 순수 텍스트(마크다운 금지) 총평을 작성하라: ① 종합 총평 2~3문단 ② 영역별 해석(강점 2개·우선 학습 2개 중심) ③ 권장 교육 우선순위 3가지. 전체 900~1400자, 문단 사이 빈 줄."
  ].join("\n");

  return { system, user };
}
