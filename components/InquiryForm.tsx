"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createInquiry } from "@/lib/actions";

export function InquiryForm() {
  const [state, action, pending] = useActionState(createInquiry, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setShowModal(true);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <form ref={formRef} action={action} className="form-card form-grid">
      <div className="field-wrap">
        <input className="input" name="name" placeholder="이름 *" required />
      </div>
      <input className="input" name="organization" placeholder="기관/회사명" />
      <div className="field-wrap">
        <input className="input" name="email" placeholder="이메일 *" type="email" required />
      </div>
      <div className="field-wrap">
        <input className="input" name="phone" placeholder="연락처 *" required />
      </div>
      <input className="input" name="audience" placeholder="교육 대상/인원" />
      <div className="field-wrap">
        <textarea className="textarea" name="message" placeholder="교육 목적, 희망 일정, 필요한 과정 *" required />
      </div>
      <div className="privacy-box">
        <label className="privacy-check">
          <input type="checkbox" name="privacy" required />
          <span>개인정보 수집 및 이용에 동의합니다. <em>(필수)</em></span>
        </label>
        <details className="privacy-detail">
          <summary>자세히 보기</summary>
          <p>
            수집 항목: 이름, 기관/회사명, 이메일, 연락처, 문의 내용 · 수집 목적: 교육 문의 상담 및 회신 ·
            보유 기간: 문의 처리 완료 후 1년, 이후 지체 없이 파기 · 동의를 거부할 수 있으나 거부 시 문의 접수가 제한됩니다.
          </p>
        </details>
      </div>
      <p style={{ fontSize: 12, color: "var(--t3)", marginTop: -4 }}>* 필수 입력 항목</p>
      <button className="btn bn btn-lg btn-pill" style={{ width: "100%" }} disabled={pending}>{pending ? "접수 중..." : "교육 문의 접수 →"}</button>
      {state && !state.ok ? <p className="cta-note err">{state.message}</p> : null}
      </form>
      {showModal ? (
        <div className="inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-modal-title" onClick={() => setShowModal(false)}>
          <div className="inquiry-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="inquiry-modal-icon" aria-hidden="true">✓</div>
            <h3 id="inquiry-modal-title">문의가 접수되었습니다</h3>
            <p>담당자가 내용을 확인한 후 24시간 내에 연락드리겠습니다.</p>
            <button className="btn bp btn-pill" type="button" onClick={() => setShowModal(false)}>확인</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
