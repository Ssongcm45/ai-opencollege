import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAdminSession } from "@/lib/auth";
import { getCheckGroupById, getGroupResponses, getGroupStats } from "@/lib/check-data";
import { AREAS, MATURITY_LEVELS, ORG_UPSKILLING_GUIDE, type AreaKey } from "@/lib/diagnostic";

export const metadata: Metadata = { title: "AI학습체크 조직 진단 리포트", robots: { index: false, follow: false } };

const AREA_KEYS: AreaKey[] = ["A", "B", "C", "D", "E"];
const pct = (value: number) => `${Math.round(value * 100)}%`;

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default async function OrgDiagnosticReportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const group = await getCheckGroupById(id);
  if (!group) notFound();

  const [stats, responses] = await Promise.all([getGroupStats(group.id), getGroupResponses(group.id)]);
  const dominantLevel = ([1, 2, 3, 4, 5] as const).reduce(
    (dominant, level) => stats.levelDistribution[level] >= stats.levelDistribution[dominant] ? level : dominant,
    1 as const,
  );
  const guide = ORG_UPSKILLING_GUIDE[dominantLevel];

  return <div className="report">
    <PrintButton />
    <header>
      <div className="report-brand">AI OPEN COLLEGE · AI학습체크</div>
      <h1>{group.name}</h1>
      <div className="report-meta">{formatDate(new Date())} · {stats.n}명 응답 · {stats.avgValidAverage.toFixed(1)}/5.0</div>
      {stats.n < 10 ? <p className="report-caution">유효 응답 10명 미만으로, 소규모 집단의 재식별 위험에 유의해 활용하세요.</p> : null}
    </header>

    <section className="report-sec"><h2>성숙도 분포</h2>
      {([1, 2, 3, 4, 5] as const).map((level) => {
        const count = stats.levelDistribution[level];
        const ratio = stats.n > 0 ? count / stats.n : 0;
        return <div className={`report-row${level === dominantLevel ? " hl" : ""}`} key={level}>
          <div className="report-row-label">Level {level} · {MATURITY_LEVELS[level].name}</div>
          <div className="report-bar"><span style={{ width: pct(ratio) }} /></div>
          <div className="report-row-val">{count}명 · {pct(ratio)}</div>
        </div>;
      })}
    </section>

    <section className="report-sec"><h2>영역별 평균 점수</h2>
      {AREA_KEYS.map((key) => {
        const avg = stats.areaAverages[key];
        const isLowest = stats.lowestArea === key;
        const area = AREAS.find((item) => item.key === key);
        const width = avg === null ? 0 : Math.max(0, Math.min(100, ((avg - 6) / 24) * 100));
        return <div className={`report-row${isLowest ? " hl" : ""}`} key={key}>
          <div className="report-row-label">{key} · {area?.title ?? key}{isLowest ? " · 우선 학습 영역" : ""}</div>
          <div className="report-bar"><span style={{ width: `${width}%` }} /></div>
          <div className="report-row-val">{avg === null ? "미적용" : `${avg.toFixed(1)}/30`}</div>
        </div>;
      })}
    </section>

    <section className="report-sec"><h2>안전 준비도</h2><div className="report-figs">
      <div className="report-fig"><div className="report-fig-label">E 21점 이상</div><div className="report-fig-num">{pct(stats.eSafeRate)}</div></div>
      <div className="report-fig"><div className="report-fig-label">게이트 무경보</div><div className="report-fig-num">{pct(stats.gatePassRate)}</div></div>
      <div className="report-fig"><div className="report-fig-label">D 적용자 중 D 21점 이상</div><div className="report-fig-num">{stats.dReadyRate === null ? "-" : pct(stats.dReadyRate)}</div></div>
    </div></section>

    <section className="report-sec"><h2>권장 업스킬링 프로그램</h2><dl className="report-guide">
      <dt>조직의 다음 목표</dt><dd>{guide.goal}</dd><dt>권장 프로그램</dt><dd>{guide.programs}</dd><dt>운영 주의점</dt><dd>{guide.caution}</dd>
    </dl></section>

    <section className="report-sec"><h2>역할 분포</h2><table><thead><tr><th>역할</th><th>인원</th></tr></thead><tbody>
      {stats.roleDistribution.map((row) => <tr key={row.role}><td>{row.role}</td><td>{row.count}명</td></tr>)}
    </tbody></table></section>

    <section className="report-sec"><h2>참여자 요약</h2><table><thead><tr><th>이름</th><th>부서</th><th>직급</th><th>Level</th><th>평균</th></tr></thead><tbody>
      {responses.map((response) => <tr key={response.id}><td>{response.name ?? "익명"}</td><td>{response.department ?? "-"}</td><td>{response.position ?? "-"}</td><td>{response.finalLevel}</td><td>{response.validAverage.toFixed(2)}</td></tr>)}
    </tbody></table></section>

    <div className="report-foot">본 리포트는 AI학습체크 응답을 바탕으로 한 교육·지원 목적의 조직 진단 자료이며, 인사 평가나 권한 부여의 근거로 사용하지 않습니다.</div>
  </div>;
}
