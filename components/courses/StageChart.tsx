import { formatHours, type CoursePath, type Stage } from "@/lib/courses";

// 단계별 과정 구성 막대 차트(막대 길이 = 시간). 홈의 레벨 차트를 모든 트랙용으로 일반화했다.
export function StageChart({ stages, color, note, title = "과정 구성" }: { stages: Stage[]; color: string; note: string; title?: string }) {
  const max = Math.max(...stages.map((s) => s.hours));
  const total = stages.reduce((sum, s) => sum + s.hours, 0);
  return (
    <figure className="cp-levels crs-stages" style={{ ["--tc" as string]: color }}>
      <figcaption>
        <strong>{title}</strong>
        <span>총 {formatHours(total)}시간 · {note}</span>
      </figcaption>
      <ul>
        {stages.map((s) => (
          <li key={s.code}>
            <span className="cpl-code">{s.code}</span>
            <span className="cpl-name">{s.name}</span>
            <span className="cpl-bar"><span style={{ width: `${Math.max((s.hours / max) * 100, 14)}%` }}>{formatHours(s.hours)}h</span></span>
            <span className="cpl-out">{s.out}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// R&D 트랙의 갈래 지도: L1 → L2 → {L3 | L4 → L5} → 캡스톤
export function BranchDiagram({ stages, color }: { stages: Stage[]; color: string }) {
  const h = (code: string) => stages.find((s) => s.code === code);
  const node = (code: string) => {
    const s = h(code);
    if (!s) return null;
    return (
      <span className="crs-node">
        <b>{s.code === "C" ? "캡스톤" : `${s.code} ${s.name}`}</b>
        <small>{formatHours(s.hours)}시간</small>
      </span>
    );
  };
  return (
    <figure className="crs-branch" style={{ ["--tc" as string]: color }}>
      <figcaption>레벨 지도 — L2에서 맡은 일에 따라 두 갈래로 나뉘고 캡스톤에서 만납니다</figcaption>
      <div className="crs-branch-row">
        {node("L1")}
        <i aria-hidden="true">→</i>
        {node("L2")}
        <i aria-hidden="true">→</i>
        <span className="crs-split">
          <span className="crs-lane"><em>연구실 실무 담당</em>{node("L3")}</span>
          <span className="crs-lane"><em>구축 담당</em>{node("L4")}<i aria-hidden="true">→</i>{node("L5")}</span>
        </span>
        <i aria-hidden="true">→</i>
        {node("C")}
      </div>
    </figure>
  );
}

export function PathCards({ paths, color }: { paths: CoursePath[]; color: string }) {
  return (
    <div className="crs-paths" style={{ ["--tc" as string]: color }}>
      {paths.map((p) => (
        <div className="crs-path" key={p.name}>
          <div className="crs-path-h">
            <strong>{p.name}</strong>
            <span>{p.hours}시간</span>
          </div>
          <div className="crs-path-route">{p.route}</div>
          <p>{p.desc}</p>
        </div>
      ))}
    </div>
  );
}
