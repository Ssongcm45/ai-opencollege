"use client";

import { useState } from "react";
import type { InquiryAnalysis } from "@/lib/inquiry-analysis";

type CourseCatalog = Record<"genai_intro" | "ai_basics" | "practical", { name: string; duration: string; description: string }>;

export function InquiryAnalysisPanel({ analysis, catalog, email, name }: {
  analysis: InquiryAnalysis;
  catalog: CourseCatalog;
  email: string | null;
  name: string;
}) {
  const [draft, setDraft] = useState(analysis.replyDraft);
  const [copyStatus, setCopyStatus] = useState("");

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus("답변 초안을 복사했습니다.");
    } catch {
      setCopyStatus("복사하지 못했습니다. 초안을 직접 선택해 복사해 주세요.");
    }
  }

  return (
    <section className="inq-analysis" aria-label="문의 분석 결과">
      <h3>교육 목표 중심 분석</h3>
      <p className="inq-analysis-summary">{analysis.summary}</p>
      <div className="inq-analysis-grid">
        <div className="inq-analysis-block">
          <h4>명시된 교육 목표</h4>
          <p>{analysis.educationGoal.stated || "문의에 명시되지 않았습니다."}</p>
        </div>
        <div className="inq-analysis-block">
          <h4>목표 해석 · 제안</h4>
          <p>{analysis.educationGoal.interpretation || "추가 확인이 필요합니다."}</p>
        </div>
      </div>
      <div className="inq-analysis-block">
        <h4>확인된 사실과 근거</h4>
        {analysis.confirmedFacts.length ? <ul>{analysis.confirmedFacts.map((fact, index) => (
          <li key={`${fact.label}-${index}`}><strong>{fact.label}: {fact.value}</strong><span>근거: {fact.evidence}</span></li>
        ))}</ul> : <p>확인된 사실이 없습니다.</p>}
      </div>
      <div className="inq-analysis-block">
        <h4>추천 교육 과정 · 검토 제안</h4>
        {analysis.recommendedCourses.length ? <ul>{analysis.recommendedCourses.map((item) => {
          const course = catalog[item.courseId];
          return <li key={item.courseId}><strong>{course.name} · {course.duration}</strong><span>{item.reason}</span></li>;
        })}</ul> : <p>추천 전에 추가 정보가 필요합니다.</p>}
      </div>
      <div className="inq-analysis-block">
        <h4>진행 방식 제안</h4>
        <p>{analysis.deliveryRecommendation}</p>
      </div>
      <div className="inq-analysis-grid">
        <div className="inq-analysis-block">
          <h4>추가로 확인할 정보</h4>
          {analysis.missingInformation.length ? <ul>{analysis.missingInformation.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>없음</p>}
        </div>
        <div className="inq-analysis-block">
          <h4>다음 행동 제안</h4>
          {analysis.nextActions.length ? <ul>{analysis.nextActions.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>없음</p>}
        </div>
      </div>
      <div className="inq-analysis-block">
        <label htmlFor="inq-reply-draft"><strong>고객 답변 초안 · 검토 후 사용</strong></label>
        <textarea id="inq-reply-draft" className="cms-input inq-reply-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} />
        <div className="inq-detail-actions">
          <button className="cms-btn cms-btn-cancel" type="button" onClick={copyDraft}>초안 복사</button>
          {email && <a className="cms-btn cms-btn-cancel" href={`mailto:${email}?subject=${encodeURIComponent(`문의 회신: ${name}님`)}&body=${encodeURIComponent(draft)}`}>메일 앱에서 열기</a>}
        </div>
        <p className="inq-analysis-hint">초안 수정은 이 화면에서만 유지됩니다. 메일 앱에서 내용을 확인한 뒤 직접 보내세요.</p>
        {copyStatus && <p role="status" className="inq-analysis-hint">{copyStatus}</p>}
      </div>
    </section>
  );
}
