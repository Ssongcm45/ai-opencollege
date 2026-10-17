import type { FlowStep } from "@/lib/courses";

// 트랙별 4단계 학습 흐름 인포그래픽. 훅이 없어 서버·클라이언트 컴포넌트 어디서든 쓸 수 있다.
export function TrackFlow({ steps, color }: { steps: FlowStep[]; color: string }) {
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
