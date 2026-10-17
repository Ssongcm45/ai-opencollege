"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AttributionFields } from "@/components/AttributionFields";
import { createLandingInquiry } from "@/lib/actions";
import { trackLead } from "@/lib/analytics";
import styles from "@/app/lp/lp.module.css";

type LandingKind = "public" | "company";

// 광고 랜딩 전용 짧은 문의 폼. 성공 응답에서만 generate_lead를 보낸다.
export function LandingLeadForm({ lp }: { lp: LandingKind }) {
  const [state, action, pending] = useActionState(createLandingInquiry, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showModal, setShowModal] = useState(false);
  const id = (name: string) => `lp-${lp}-${name}`;
  const orgLabel = lp === "public" ? "기관명" : "회사명";

  useEffect(() => {
    if (state?.ok) {
      trackLead(lp === "company" ? "lp_company" : "lp_public", "lp");
      setShowModal(true);
      formRef.current?.reset();
    }
  }, [state, lp]);

  return (
    <>
      <form ref={formRef} action={action} className={styles.form}>
        <input type="hidden" name="lp" value={lp} />
        <AttributionFields />
        <div className={styles.hp} aria-hidden="true">
          <label htmlFor={id("website")}>웹사이트</label>
          <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor={id("name")}>이름 <em>*</em></label>
            <input className={`input ${styles.control}`} id={id("name")} name="name" autoComplete="name" maxLength={80} required />
          </div>
          <div className={styles.field}>
            <label htmlFor={id("organization")}>{orgLabel} <em>*</em></label>
            <input className={`input ${styles.control}`} id={id("organization")} name="organization" autoComplete="organization" maxLength={140} required />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor={id("phone")}>연락처 <em>*</em></label>
            <input className={`input ${styles.control}`} id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" maxLength={60} required />
          </div>
          <div className={styles.field}>
            <label htmlFor={id("email")}>이메일 <span className={styles.opt}>(선택)</span></label>
            <input className={`input ${styles.control}`} id={id("email")} name="email" type="email" inputMode="email" autoComplete="email" maxLength={160} />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor={id("headcount")}>교육 인원 <em>*</em></label>
            <input className={`input ${styles.control}`} id={id("headcount")} name="headcount" placeholder="예: 30명" maxLength={60} required />
          </div>
          <div className={styles.field}>
            <label htmlFor={id("timing")}>희망 시기 <em>*</em></label>
            <input className={`input ${styles.control}`} id={id("timing")} name="timing" placeholder="예: 11월 중순, 협의 가능" maxLength={100} required />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={id("request")}>요청사항 <span className={styles.opt}>(선택)</span></label>
          <textarea className={`textarea ${styles.textarea}`} id={id("request")} name="request" maxLength={1000} placeholder="대상 직급·직무, 원하는 실습 주제, 교육 시간 등을 적어 주세요." />
        </div>

        <div className="privacy-box">
          <label className={`privacy-check ${styles.consent}`}>
            <input type="checkbox" name="privacy" required />
            <span>개인정보 수집 및 이용에 동의합니다. <em>(필수)</em></span>
          </label>
          <details className="privacy-detail">
            <summary>자세히 보기</summary>
            <p>
              수집 항목: 이름, 기관/회사명, 연락처, 이메일(선택), 교육 인원, 희망 시기, 요청사항 · 수집 목적: 교육 문의 상담 및 회신 ·
              보유 기간: 문의 처리 완료 후 1년, 이후 지체 없이 파기 · 동의를 거부할 수 있으나 거부 시 문의 접수가 제한됩니다.
            </p>
          </details>
          <p><a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침 보기 (새 창)</a></p>
        </div>

        <button className={`btn bp btn-lg btn-pill ${styles.submit}`} disabled={pending}>
          {pending ? "접수 중..." : "무료 상담 신청하기 →"}
        </button>
        <p className={styles.formNote}>* 필수 항목 · 담당자가 확인 후 24시간 내 회신드립니다.</p>
        {state && !state.ok ? <p className={styles.formErr} role="alert">{state.message}</p> : null}
      </form>

      {showModal ? (
        <div className="inquiry-modal" role="dialog" aria-modal="true" aria-labelledby={id("modal-title")} onClick={() => setShowModal(false)}>
          <div className="inquiry-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="inquiry-modal-icon" aria-hidden="true">✓</div>
            <h3 id={id("modal-title")}>문의가 접수되었습니다</h3>
            <p>담당자가 내용을 확인한 후 24시간 내에 연락드리겠습니다.</p>
            <button className="btn bp btn-pill" type="button" onClick={() => setShowModal(false)}>확인</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
