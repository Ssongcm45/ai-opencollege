"use client";

import { useMemo, useState } from "react";
import {
  AREAS,
  BACKGROUND_QUESTIONS,
  D_NOT_APPLICABLE_LABEL,
  INTRO_TEXT,
  MATURITY_LEVELS,
  SCALE,
  computeResult,
  type Answers,
  type AreaKey,
} from "@/lib/diagnostic";

const TOTAL_QUESTIONS = AREAS.reduce((n, a) => n + a.questions.length, 0);
const AREA_STEPS = AREAS.length; // 5
const LAST_STEP = AREA_STEPS + 1; // 6 = 결과

function areaTitle(key: AreaKey): string {
  return AREAS.find((a) => a.key === key)?.title ?? key;
}

export function CheckWizard() {
  // step 0 = 인트로, 1..5 = 영역 A~E, 6 = 결과.
  const [step, setStep] = useState(0);
  const [background, setBackground] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Answers>({});

  const backgroundComplete = BACKGROUND_QUESTIONS.every((q) => background[q.key]);

  const answeredCount = useMemo(
    () => AREAS.reduce((n, area) => n + area.questions.filter((q) => answers[q.code] !== undefined).length, 0),
    [answers],
  );

  const currentArea = step >= 1 && step <= AREA_STEPS ? AREAS[step - 1] : null;
  const currentAreaComplete = currentArea
    ? currentArea.questions.every((q) => answers[q.code] !== undefined)
    : false;

  const progressPercent =
    step === 0 ? 0 : step > AREA_STEPS ? 100 : Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  const setScale = (code: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  };

  const toggleNotApplicable = (code: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (next[code] === 0) {
        delete next[code];
      } else {
        next[code] = 0;
      }
      return next;
    });
  };

  const reset = () => {
    setStep(0);
    setBackground({});
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goTo = (target: number) => {
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- Step 0: 인트로 + 배경 문항 ----
  if (step === 0) {
    return (
      <div className="check-wizard">
        <div className="check-progress" aria-hidden="true">
          <div className="check-progress-bar" style={{ width: "0%" }} />
        </div>
        <div className="check-card check-intro">
          <p className="check-intro-text">{INTRO_TEXT}</p>
        </div>
        <div className="check-card">
          <h2 className="check-step-title">시작 전, 몇 가지 배경을 알려주세요</h2>
          <p className="check-step-sub">채점에는 반영되지 않으며, 결과 해석에만 참고합니다.</p>
          {BACKGROUND_QUESTIONS.map((q) => (
            <div className="check-bg" key={q.key}>
              <div className="check-bg-label">{q.label}</div>
              <div className="check-chips">
                {q.options.map((opt) => (
                  <button
                    aria-pressed={background[q.key] === opt}
                    className={`chip${background[q.key] === opt ? " on" : ""}`}
                    key={opt}
                    onClick={() => setBackground((prev) => ({ ...prev, [q.key]: opt }))}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="check-nav">
          <span />
          <button
            className="btn bp btn-pill"
            disabled={!backgroundComplete}
            onClick={() => goTo(1)}
            type="button"
          >
            진단 시작 →
          </button>
        </div>
      </div>
    );
  }

  // ---- Steps 1..5: 영역 A~E ----
  if (currentArea) {
    const isDArea = currentArea.key === "D";
    return (
      <div className="check-wizard">
        <div className="check-progress" aria-hidden="true">
          <div className="check-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="check-meta">
          영역 {step}/{AREA_STEPS} · 문항 {answeredCount}/{TOTAL_QUESTIONS}
        </p>
        <div className="check-card">
          <div className="check-area-head">
            <span className="check-area-key">{currentArea.key}</span>
            <h2 className="check-step-title">{currentArea.title}</h2>
          </div>
          {isDArea ? (
            <p className="check-step-sub">
              현재 업무환경이나 권한이 없는 문항은 아래 “{D_NOT_APPLICABLE_LABEL}”을 선택하십시오. 이 응답은 부족이 아니라 미적용으로 처리됩니다.
            </p>
          ) : null}

          {currentArea.questions.map((q, i) => {
            const value = answers[q.code];
            const na = value === 0;
            return (
              <div className="check-q" key={q.code}>
                <div className="check-q-head">
                  <span className="check-q-no">{q.code}</span>
                  <p className="check-q-text">{q.text}</p>
                </div>
                <div className="check-scale" role="group" aria-label={`${q.code} 응답 척도`}>
                  {SCALE.map((s) => (
                    <button
                      aria-pressed={value === s.value}
                      className={`check-scale-btn${value === s.value ? " on" : ""}`}
                      key={s.value}
                      onClick={() => setScale(q.code, s.value)}
                      type="button"
                    >
                      <span className="check-scale-num">{s.value}</span>
                      <span className="check-scale-label">{s.label}</span>
                    </button>
                  ))}
                </div>
                {isDArea ? (
                  <button
                    aria-pressed={na}
                    className={`check-dna${na ? " on" : ""}`}
                    onClick={() => toggleNotApplicable(q.code)}
                    type="button"
                  >
                    <span className="check-dna-box" aria-hidden="true">
                      {na ? "✓" : ""}
                    </span>
                    {D_NOT_APPLICABLE_LABEL}
                  </button>
                ) : null}
                {i < currentArea.questions.length - 1 ? <div className="check-q-div" /> : null}
              </div>
            );
          })}
        </div>
        <div className="check-nav">
          <button className="btn bo btn-pill" onClick={() => goTo(step - 1)} type="button">
            ← 이전
          </button>
          <button
            className="btn bp btn-pill"
            disabled={!currentAreaComplete}
            onClick={() => goTo(step + 1)}
            type="button"
          >
            {step === AREA_STEPS ? "결과 보기 →" : "다음 →"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Step 6: 결과 ----
  const result = computeResult(answers);
  const maturity = MATURITY_LEVELS[result.finalLevel];

  return (
    <div className="check-wizard">
      <div className="check-progress" aria-hidden="true">
        <div className="check-progress-bar" style={{ width: "100%" }} />
      </div>

      {/* 1. 종합 */}
      <div className="check-card result-hero">
        <div className="result-hero-eyebrow">종합 진단 결과</div>
        <div className="result-hero-level">
          Level {result.finalLevel} · {maturity.name}
        </div>
        <p className="result-hero-behavior">{maturity.behavior}</p>
        <div className="result-hero-avg">
          유효 문항 평균 <strong>{result.validAverage.toFixed(1)}</strong> / 5.0
        </div>
        {result.agentCapabilityUnknown ? (
          <div className="result-badge">에이전트 통합 역량(Level 4~5)은 환경 미적용으로 미확인</div>
        ) : null}
      </div>

      {/* 2. 영역별 막대 */}
      <div className="check-card">
        <h2 className="check-step-title">영역별 수준</h2>
        <div className="result-bars">
          {AREAS.map((area) => {
            const score = result.areaScores[area.key];
            const band = result.areaLevels[area.key];
            const isStrength = result.strengths.includes(area.key);
            if (score === null || band === null) {
              return (
                <div className="rbar" key={area.key}>
                  <div className="rbar-head">
                    <span className="rbar-name">
                      <b>{area.key}</b> {area.title}
                    </span>
                    <span className="rbar-na">미적용</span>
                  </div>
                  <div className="rbar-track rbar-track-na">
                    <span className="rbar-na-note">에이전트 환경 준비도 별도</span>
                  </div>
                </div>
              );
            }
            const width = ((score - 6) / 24) * 100;
            return (
              <div className="rbar" key={area.key}>
                <div className="rbar-head">
                  <span className="rbar-name">
                    <b>{area.key}</b> {area.title}
                  </span>
                  <span className="rbar-score">
                    {score}/30 · <em>{band.label}</em>
                  </span>
                </div>
                <div className="rbar-track">
                  <div
                    className={`rbar-fill${isStrength ? " rbar-fill-strong" : ""}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {!result.dApplicable ? (
          <div className="result-na-card">
            <strong>에이전트 환경 준비도: 미적용</strong>
            <p>
              GitHub·CLI·MCP를 직접 사용하지 않는 환경으로 D 영역을 별도 준비도로 표시했습니다. 무경험을 역량 부족으로 해석하지 않습니다.
            </p>
          </div>
        ) : null}
      </div>

      {/* 3. 강점 / 우선 학습 영역 */}
      <div className="result-grid">
        <div className="check-card result-col">
          <h3 className="result-col-title">강점 영역</h3>
          {result.strengths.map((key) => (
            <div className="result-item" key={key}>
              <div className="result-item-head">
                <span className="result-item-key">{key}</span>
                {areaTitle(key)}
              </div>
              <p className="result-item-sent">{result.areaSentences[key]}</p>
            </div>
          ))}
        </div>
        <div className="check-card result-col">
          <h3 className="result-col-title">우선 학습 영역</h3>
          {result.priorities.map((key) => (
            <div className="result-item" key={key}>
              <div className="result-item-head">
                <span className="result-item-key">{key}</span>
                {areaTitle(key)}
              </div>
              <p className="result-item-sent">{result.areaSentences[key]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 안전한 다음 단계 (게이트) */}
      {result.gates.length ? (
        <div className="check-card gate-card">
          <h3 className="gate-title">안전한 다음 단계</h3>
          <ul className="gate-list">
            {result.gates.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 5. CTA */}
      <div className="check-nav result-cta">
        <button className="btn bo btn-pill" onClick={reset} type="button">
          다시 진단하기
        </button>
        <a className="btn bp btn-lg btn-pill" href="/#contact">
          우리 조직 맞춤 교육 문의 →
        </a>
      </div>

      {/* 6. 미세 문구 */}
      <p className="check-note">결과는 저장되지 않으며 이 화면에서만 확인할 수 있습니다.</p>
    </div>
  );
}
