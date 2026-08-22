import Link from "next/link";
import { notFound } from "next/navigation";
import { getCheckGroupById, getGroupResponses, getGroupStats } from "@/lib/check-data";
import { AREAS, MATURITY_LEVELS, type AreaKey } from "@/lib/diagnostic";

const AREA_KEYS: AreaKey[] = ["A", "B", "C", "D", "E"];

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function CheckStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await getCheckGroupById(id);
  if (!group) notFound();

  const [stats, responses] = await Promise.all([getGroupStats(group.id), getGroupResponses(group.id)]);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">{group.name} · 조직 역량 통계</h1>
        <Link href="/admin/checks" className="cms-link">← 목록으로</Link>
      </div>

      {stats.n === 0 ? (
        <div className="cms-card">
          <p className="cms-empty">아직 응답이 없습니다. 참여 링크를 공유하세요.</p>
        </div>
      ) : (
        <>
          {stats.n < 10 ? (
            <div className="stat-warn">
              유효 응답 10명 미만입니다. 소규모 집단은 개인 식별 위험이 있어 조직 공유용 보고에는 10명 이상을 권장합니다.
            </div>
          ) : null}

          {/* ① 응답 현황 */}
          <div className="cms-card">
            <div className="cms-card-head">
              <span className="cms-card-title">응답 현황</span>
            </div>
            <div className="stat-figs">
              <div className="stat-fig">
                <div className="stat-fig-label">총 응답</div>
                <div className="stat-fig-num">{stats.n}명</div>
              </div>
              <div className="stat-fig">
                <div className="stat-fig-label">평균 유효점수</div>
                <div className="stat-fig-num">
                  {stats.avgValidAverage.toFixed(1)}
                  <span className="stat-fig-unit"> / 5.0</span>
                </div>
              </div>
              <div className="stat-fig">
                <div className="stat-fig-label">D 적용 인원</div>
                <div className="stat-fig-num">{stats.dApplicableCount}명</div>
              </div>
            </div>
          </div>

          {/* ② 성숙도 분포 */}
          <div className="cms-card">
            <div className="cms-card-head">
              <span className="cms-card-title">성숙도 분포</span>
            </div>
            <div className="stat-rows">
              {([1, 2, 3, 4, 5] as const).map((lvl) => {
                const count = stats.levelDistribution[lvl];
                const ratio = stats.n > 0 ? count / stats.n : 0;
                return (
                  <div className="stat-row" key={lvl}>
                    <div className="stat-row-label">
                      Level {lvl} · {MATURITY_LEVELS[lvl].name}
                    </div>
                    <div className="stat-bar-track">
                      <div className="stat-bar" style={{ width: pct(ratio) }} />
                    </div>
                    <div className="stat-row-val">
                      {count}명 · {pct(ratio)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ③ 영역별 평균 */}
          <div className="cms-card">
            <div className="cms-card-head">
              <span className="cms-card-title">영역별 평균</span>
            </div>
            <div className="stat-rows">
              {AREA_KEYS.map((key) => {
                const avg = stats.areaAverages[key];
                const title = AREAS.find((a) => a.key === key)?.title ?? key;
                const isLowest = stats.lowestArea === key;
                if (avg === null) {
                  return (
                    <div className="stat-row" key={key}>
                      <div className="stat-row-label">
                        <b>{key}</b> {title}
                      </div>
                      <div className="stat-bar-track stat-bar-track-na">
                        <span className="stat-na-note">미적용</span>
                      </div>
                      <div className="stat-row-val">-</div>
                    </div>
                  );
                }
                const width = ((avg - 6) / 24) * 100;
                return (
                  <div className="stat-row" key={key}>
                    <div className="stat-row-label">
                      <b>{key}</b> {title}
                    </div>
                    <div className="stat-bar-track">
                      <div
                        className={`stat-bar${isLowest ? " stat-bar-low" : ""}`}
                        style={{ width: `${Math.max(0, Math.min(100, width))}%` }}
                      />
                    </div>
                    <div className="stat-row-val">
                      {avg.toFixed(1)}/30{isLowest ? " · 최저" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ④ 안전 준비도 */}
          <div className="cms-card">
            <div className="cms-card-head">
              <span className="cms-card-title">안전 준비도</span>
            </div>
            <div className="stat-figs">
              <div className="stat-fig">
                <div className="stat-fig-label">E 21점 이상</div>
                <div className="stat-fig-num">{pct(stats.eSafeRate)}</div>
              </div>
              <div className="stat-fig">
                <div className="stat-fig-label">게이트 무경보</div>
                <div className="stat-fig-num">{pct(stats.gatePassRate)}</div>
              </div>
              <div className="stat-fig">
                <div className="stat-fig-label">D 적용자 중 D 21점 이상</div>
                <div className="stat-fig-num">
                  {stats.dReadyRate === null ? "-" : pct(stats.dReadyRate)}
                </div>
              </div>
            </div>
          </div>

          {/* ⑤ 역할 분포 */}
          <div className="cms-card">
            <div className="cms-card-head">
              <span className="cms-card-title">역할 분포</span>
            </div>
            <table className="cms-table">
              <thead>
                <tr>
                  <th>역할</th>
                  <th>응답 수</th>
                </tr>
              </thead>
              <tbody>
                {stats.roleDistribution.map((row) => (
                  <tr key={row.role}>
                    <td>{row.role}</td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{row.count}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">개별 응답</span>
        </div>
        {responses.length === 0 ? (
          <p className="cms-empty">아직 응답이 없습니다.</p>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>부서</th>
                <th>직급</th>
                <th>Level</th>
                <th>평균</th>
                <th>게이트</th>
                <th>제출일시</th>
                <th>상세보기</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}>
                  <td>{response.name ?? "익명(테스트)"}</td>
                  <td>{response.department ?? "-"}</td>
                  <td>{response.position ?? "-"}</td>
                  <td>{response.finalLevel}</td>
                  <td>{response.validAverage.toFixed(2)}</td>
                  <td>{response.gateCount}</td>
                  <td>{formatDateTime(response.createdAt)}</td>
                  <td><Link href={`/admin/checks/${group.id}/${response.id}`}>보기</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
