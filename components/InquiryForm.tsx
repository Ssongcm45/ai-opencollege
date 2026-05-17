"use client";

import { useActionState } from "react";
import { createInquiry } from "@/lib/actions";

export function InquiryForm() {
  const [state, action, pending] = useActionState(createInquiry, null);

  return (
    <form action={action} className="form-card form-grid">
      <input className="input" name="name" placeholder="이름" required />
      <input className="input" name="organization" placeholder="기관/회사명" />
      <input className="input" name="email" placeholder="이메일" type="email" />
      <input className="input" name="phone" placeholder="연락처" />
      <input className="input" name="audience" placeholder="교육 대상/인원" />
      <textarea className="textarea" name="message" placeholder="교육 목적, 희망 일정, 필요한 과정" required />
      <button className="btn bn btn-lg btn-pill" style={{ width: "100%" }} disabled={pending}>{pending ? "접수 중..." : "교육 문의 접수 →"}</button>
      {state?.message ? <p className="cta-note">{state.message}</p> : null}
    </form>
  );
}
