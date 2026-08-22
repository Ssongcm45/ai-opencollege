"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { emailMyResult, recordCheckCompletion, submitCheckInquiry, submitOrgCheckResponse } from "@/lib/check-actions";
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

interface CheckWizardProps {
  orgCode?: string;
  orgName?: string;
}

export function CheckWizard({ orgCode, orgName }: CheckWizardProps) {
  // step 0 = 인트로, 1..5 = 영역 A~E, 6 = 결과.
  const [step, setStep] = useState(0);
  const [background, setBackground] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Answers>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const initialMount = useRef(true);

  const isOrgMode = Boolean(orgCode);

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

  // 단계 전환 시 위저드 상단으로 부드럽게 스크롤 (초기 마운트는 제외).
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

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
    setBackground({});
    setAnswers({});
    setStep(0);
  };

  const goTo = (target: number) => {
    setStep(target);
  };

  // ---- Step 0: 인트로 + 배경 문항 ----
  if (step === 0) {
    return (
      <div className="check-wizard" ref={containerRef}>
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
      <div className="check-wizard" ref={containerRef}>
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
  return (
    <ResultView
      answers={answers}
      background={background}
      containerRef={containerRef}
      isOrgMode={isOrgMode}
      onReset={reset}
      orgCode={orgCode}
      orgName={orgName}
    />
  );
}

interface ResultViewProps {
  answers: Answers;
  background: Record<string, string>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isOrgMode: boolean;
  onReset: () => void;
  orgCode?: string;
  orgName?: string;
}

function ResultView({ answers, background, containerRef, isOrgMode, onReset, orgCode, orgName }: ResultViewProps) {
  const result = useMemo(() => computeResult(answers), [answers]);
  const maturity = MATURITY_LEVELS[result.finalLevel];

  // 조직 모드: 결과 화면 진입 시 한 번만 저장.
  const [orgStatus, setOrgStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const submittedRef = useRef(false);
  const completionRecordedRef = useRef(false);

  useEffect(() => {
    if (!isOrgMode || !orgCode || submittedRef.current) return;
    submittedRef.current = true;
    submitOrgCheckResponse(
      orgCode,
      {
        role: background.role,
        frequency: background.frequency,
        environment: background.environment,
        purpose: background.purpose,
      },
      answers,
    ).then(setOrgStatus);
  }, [isOrgMode, orgCode, background, answers]);

  useEffect(() => {
    if (isOrgMode || completionRecordedRef.current) return;
    completionRecordedRef.current = true;
    void recordCheckCompletion();
  }, [isOrgMode]);

  return (
    <div className="check-wizard" ref={containerRef}>
      <div className="check-progress" aria-hidden="true">
        <div className="check-progress-bar" style={{ width: "100%" }} />
      </div>

      {isOrgMode && orgStatus ? (
        <p className={`check-org-status${orgStatus.ok ? " ok" : " err"}`}>
          {orgStatus.ok ? `✓ ${orgName ?? "조직"} 조직 진단에 응답이 저장되었습니다` : orgStatus.message}
        </p>
      ) : null}

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

      {/* 5. 이메일로 결과 받기 */}
      <EmailResultCard answers={answers} />

      {/* 6. 이 결과로 교육 문의하기 */}
      <CheckInquiryCard answers={answers} />

      {/* 7. CTA */}
      <div className="check-nav result-cta">
        <button className="btn bo btn-pill" onClick={onReset} type="button">
          다시 진단하기
        </button>
      </div>

      {/* 8. 미세 문구 */}
      <p className="check-note">
        {isOrgMode
          ? "응답(역할·응답값)은 조직 통계 목적으로만 저장되며 이름 등 개인 식별 정보는 수집하지 않습니다."
          : "응답 내용은 저장되지 않으며, 완료 횟수만 익명으로 집계됩니다."}
      </p>
    </div>
  );
}

function EmailResultCard({ answers }: { answers: Answers }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    setStatus(null);
    startTransition(async () => {
      const res = await emailMyResult(email, answers);
      setStatus(res);
      if (res.ok) setEmail("");
    });
  };

  return (
    <div className="check-card check-sub-card">
      <h3 className="check-sub-title">이메일로 결과 받기</h3>
      <p className="check-sub-desc">진단 결과 요약을 입력하신 이메일로 보내드립니다.</p>
      <div className="check-email-row">
        <input
          className="input"
          disabled={pending}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          type="email"
          value={email}
        />
        <button
          className="btn bn btn-pill"
          disabled={pending || !email.trim()}
          onClick={send}
          type="button"
        >
          {pending ? "발송 중..." : "결과 받기 →"}
        </button>
      </div>
      {status ? (
        <p className={`check-inline-msg${status.ok ? " ok" : " err"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}

function CheckInquiryCard({ answers }: { answers: Answers }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitCheckInquiry, null);
  const answersJson = useMemo(() => JSON.stringify(answers), [answers]);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <div className="check-card check-sub-card">
      <h3 className="check-sub-title">이 결과로 교육 문의하기</h3>
      <p className="check-sub-desc">진단 결과를 바탕으로 우리 조직에 맞는 교육을 문의할 수 있습니다.</p>

      {state?.ok ? (
        <p className="check-inline-msg ok">{state.message}</p>
      ) : (
        <>
          {!open ? (
            <button className="btn bp btn-lg btn-pill" onClick={() => setOpen(true)} type="button">
              진단결과로 교육 문의하기 →
            </button>
          ) : (
            <form action={action} className="check-inquiry-form">
              <input name="answersJson" type="hidden" value={answersJson} />
              <input className="input" name="name" placeholder="이름 *" required />
              <input className="input" name="organization" placeholder="기관/회사명" />
              <input className="input" name="email" placeholder="이메일 *" required type="email" />
              <input className="input" name="phone" placeholder="연락처 *" required />
              <textarea className="textarea" name="message" placeholder="교육 목적, 희망 일정, 필요한 과정 등" />
              <div className="privacy-box">
                <label className="privacy-check">
                  <input name="privacy" required type="checkbox" />
                  <span>
                    개인정보 수집 및 이용에 동의합니다. <em>(필수)</em>
                  </span>
                </label>
              </div>
              <p className="check-sub-note">진단 결과 요약이 문의와 함께 관리자에게 전달됩니다.</p>
              <button className="btn bn btn-pill" disabled={pending} type="submit">
                {pending ? "접수 중..." : "교육 문의 접수 →"}
              </button>
              {state && !state.ok ? <p className="check-inline-msg err">{state.message}</p> : null}
            </form>
          )}
        </>
      )}
    </div>
  );
}
