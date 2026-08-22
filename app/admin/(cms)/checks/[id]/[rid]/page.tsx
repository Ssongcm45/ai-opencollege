import Link from "next/link";
import { notFound } from "next/navigation";
import { getCheckGroupById, getResponseById } from "@/lib/check-data";
import { AREAS } from "@/lib/diagnostic";

function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function CheckResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string; rid: string }>;
}) {
  const { id, rid } = await params;
  const group = await getCheckGroupById(id);
  if (!group) notFound();

  const response = await getResponseById(rid);
  if (!response || response.groupId !== group.id) notFound();

  const answers = response.answers as Record<string, number>;
  const identityRows = [
    ["이름", response.name ?? "익명(테스트)"],
    ["부서", response.department ?? "-"],
    ["직급", response.position ?? "-"],
    ["전화번호", response.phone ?? "-"],
    ["이메일", response.email ?? "-"],
    ["제출일시", formatDateTime(response.createdAt)]
  ];
  const backgroundRows = [
    ["역할", response.role ?? "-"],
    ["사용 빈도", response.frequency ?? "-"],
    ["사용 환경", response.environment ?? "-"],
    ["주 활용 목적", response.purpose ?? "-"]
  ];
  const resultRows = [
    ["Level", `${response.finalLevel} (base: ${response.baseLevel})`],
    ["validAverage", response.validAverage.toFixed(2)],
    ["영역별 점수 A/B/C/D/E", `${response.scoreA} / ${response.scoreB} / ${response.scoreC} / ${response.scoreD ?? "미적용"} / ${response.scoreE}`],
    ["gateCount", String(response.gateCount)]
  ];

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">{response.name ?? "익명(테스트)"} · 응답 상세</h1>
        <Link href={`/admin/checks/${group.id}`} className="cms-link">목록으로</Link>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">참여자 정보</span>
        </div>
        <table className="cms-table">
          <tbody>
            {identityRows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <blockquote>{response.note ?? "-"}</blockquote>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">배경</span>
        </div>
        <table className="cms-table">
          <tbody>
            {backgroundRows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">결과 요약</span>
        </div>
        <table className="cms-table">
          <tbody>
            {resultRows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">문항별 응답</span>
        </div>
        {AREAS.map((area) => (
          <section key={area.key}>
            <h2 className="cms-card-title">{area.key}. {area.title}</h2>
            <table className="cms-table">
              <thead>
                <tr>
                  <th>코드</th>
                  <th>문항 텍스트</th>
                  <th>응답값</th>
                </tr>
              </thead>
              <tbody>
                {area.questions.map((question) => {
                  const value = answers[question.code];
                  return (
                    <tr key={question.code}>
                      <td>{question.code}</td>
                      <td>{question.text}</td>
                      <td>{value === 0 ? "미적용" : `${value}점`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}
