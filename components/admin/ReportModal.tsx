"use client";

import { useEffect, useState, useTransition } from "react";
import { AI_MODEL_OPTIONS } from "@/lib/ai-models";
import { generateAiSummary } from "@/lib/check-actions";
import type { GroupStats } from "@/lib/check-data";
import { SENDER_PROFILES, type SenderProfileId } from "@/lib/sender-profiles";
import { ReportView, type ReportParticipant } from "@/components/admin/ReportView";

interface ReportModalProps {
  groupName: string;
  groupId: string;
  stats: GroupStats;
  participants: ReportParticipant[];
  initialAiSummary: string | null;
}

export function ReportModal({
  groupName,
  groupId,
  stats,
  participants,
  initialAiSummary
}: ReportModalProps) {
  const [open, setOpen] = useState(false);
  const [senderId, setSenderId] = useState<SenderProfileId>("uag-oc");
  const [recipientOrg, setRecipientOrg] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [comment, setComment] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(initialAiSummary);
  const [error, setError] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string>(AI_MODEL_OPTIONS[0].id);
  const [pending, startTransition] = useTransition();

  // 모달이 열려 있는 동안에만 인쇄 스코프 클래스를 body에 부착.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-report");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("printing-report");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function runGenerate(force: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await generateAiSummary(groupId, force, aiModel);
      if (result.ok && result.summary) {
        setAiSummary(result.summary);
      } else {
        setError(result.message ?? "AI 총평 생성에 실패했습니다.");
      }
    });
  }

  function handleRegenerate() {
    if (!window.confirm("기존 총평을 새로 생성할까요? API가 다시 호출됩니다.")) return;
    runGenerate(true);
  }

  return (
    <>
      <button type="button" className="cms-btn cms-btn-primary" onClick={() => setOpen(true)}>
        PDF 리포트
      </button>

      {open ? (
        <div
          className="report-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="report-modal-panel">
            <div className="report-modal-controls no-print">
              <div className="report-modal-controls-head">
                <span className="report-modal-title">PDF 리포트 구성</span>
                <button type="button" className="cms-btn cms-btn-cancel" onClick={() => setOpen(false)}>
                  닫기
                </button>
              </div>

              <div className="report-modal-field">
                <label className="report-modal-label">발신 정보</label>
                <select
                  className="cms-input"
                  value={senderId}
                  onChange={(event) => setSenderId(event.target.value as SenderProfileId)}
                >
                  {SENDER_PROFILES.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-modal-row">
                <div className="report-modal-field">
                  <label className="report-modal-label">받는 분 · 조직</label>
                  <input
                    className="cms-input"
                    value={recipientOrg}
                    onChange={(event) => setRecipientOrg(event.target.value)}
                    placeholder="예: (주)한빛물류"
                  />
                </div>
                <div className="report-modal-field">
                  <label className="report-modal-label">받는 분 · 이름</label>
                  <input
                    className="cms-input"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="예: 김담당"
                  />
                </div>
              </div>

              <div className="report-modal-field">
                <label className="report-modal-label">전달 코멘트</label>
                <textarea
                  className="cms-input"
                  rows={3}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="리포트와 함께 전달할 코멘트를 입력하세요."
                />
              </div>

              <div className="report-modal-field">
                <label className="report-modal-label">추천 교육 커리큘럼</label>
                <textarea
                  className="cms-input"
                  rows={4}
                  value={curriculum}
                  onChange={(event) => setCurriculum(event.target.value)}
                  placeholder="추천 교육 커리큘럼을 입력하세요."
                />
              </div>

              <div className="report-modal-field">
                <label className="report-modal-label">AI 총평</label>
                <select
                  className="cms-input report-modal-model"
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  disabled={pending}
                >
                  {AI_MODEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                {aiSummary ? (
                  <div className="report-modal-summary">
                    <p className="report-modal-summary-preview">{aiSummary.slice(0, 160)}…</p>
                    <button
                      type="button"
                      className="cms-btn cms-btn-cancel report-modal-small-btn"
                      onClick={handleRegenerate}
                      disabled={pending}
                    >
                      {pending ? "생성 중…" : "재생성"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cms-btn cms-btn-primary"
                    onClick={() => runGenerate(false)}
                    disabled={pending}
                  >
                    {pending ? "생성 중…" : "AI 총평 생성"}
                  </button>
                )}
                {error ? <p className="report-modal-error">{error}</p> : null}
              </div>

              <div className="report-modal-actions">
                <button type="button" className="cms-btn cms-btn-primary" onClick={() => window.print()}>
                  PDF로 저장 / 인쇄
                </button>
                <button type="button" className="cms-btn cms-btn-cancel" onClick={() => setOpen(false)}>
                  닫기
                </button>
              </div>
            </div>

            <div className="report report-in-modal">
              <ReportView
                groupName={groupName}
                stats={stats}
                participants={participants}
                aiSummary={aiSummary}
                senderId={senderId}
                recipient={{ name: recipientName, org: recipientOrg }}
                comment={comment}
                curriculum={curriculum}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
