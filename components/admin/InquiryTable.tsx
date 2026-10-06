"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { InquiryAnalysisPanel } from "@/components/admin/InquiryAnalysisPanel";
import { addInquiryNote, deleteInquiry, deleteInquiryNote, setInquiryStatusInline } from "@/lib/actions";
import { retryInquiryProcessing } from "@/lib/inquiry-admin-actions";
import type { InquiryAnalysis } from "@/lib/inquiry-analysis";

export type InquiryNote = { id: string; body: string; createdAt: string };

export type InquiryRow = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  audience: string | null;
  educationGoal: string | null;
  message: string;
  status: string;
  createdAt: string;
  analysis: InquiryAnalysis | null;
  analysisStatus: string;
  analysisError: string | null;
  analysisAt: string | null;
  notificationStatus: string;
  notificationError: string | null;
  notificationSentAt: string | null;
  notificationAttemptedAt: string | null;
  processingLeaseUntil: string | null;
  notes: InquiryNote[];
};

type CourseCatalog = Record<"genai_intro" | "ai_basics" | "practical", { name: string; duration: string; description: string }>;

const analysisLabels: Record<string, string> = {
  not_requested: "분석 전", pending: "분석 대기", processing: "분석 중", complete: "분석 완료", failed: "분석 실패"
};
const notificationLabels: Record<string, string> = {
  not_requested: "알림 전", pending: "알림 대기", sending: "알림 전송 중", sent: "담당자 알림 완료", failed: "담당자 알림 실패", uncertain: "전송 확인 필요"
};

type Status = "all" | "new" | "read" | "replied" | "archived";

const statusOptions = [
  { value: "new", label: "신규" },
  { value: "read", label: "확인" },
  { value: "replied", label: "회신완료" },
  { value: "archived", label: "보관" }
] as const;

const tabs: Array<{ value: Status; label: string }> = [
  { value: "all", label: "전체" },
  ...statusOptions
];

export function InquiryTable({ inquiries, catalog }: { inquiries: InquiryRow[]; catalog: CourseCatalog }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [notesById, setNotesById] = useState<Record<string, InquiryNote[]>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [notePending, setNotePending] = useState<Record<string, boolean>>({});
  const [retryPending, setRetryPending] = useState<Record<string, boolean>>({});
  const [retryMessages, setRetryMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!inquiries.some((row) => ["pending", "processing"].includes(row.analysisStatus) || ["pending", "sending"].includes(row.notificationStatus))) return;
    const timer = window.setInterval(() => router.refresh(), 12000);
    return () => window.clearInterval(timer);
  }, [inquiries, router]);

  const getStatus = (row: InquiryRow) => statuses[row.id] ?? row.status;
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filteredInquiries = inquiries.filter((row) => {
    const status = getStatus(row);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesQuery = !normalizedQuery || [row.name, row.organization, row.email, row.phone, row.message, row.educationGoal, row.analysis?.summary]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("ko-KR").includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  });

  function updateStatus(id: string, nextStatus: string, previousStatus: string) {
    setStatuses((current) => ({ ...current, [id]: nextStatus }));
    setPending((current) => ({ ...current, [id]: true }));
    startTransition(async () => {
      try {
        const result = await setInquiryStatusInline(id, nextStatus);
        if (!result.ok) setStatuses((current) => ({ ...current, [id]: previousStatus }));
      } catch {
        setStatuses((current) => ({ ...current, [id]: previousStatus }));
      } finally {
        setPending((current) => ({ ...current, [id]: false }));
        router.refresh();
      }
    });
  }

  function toggleExpanded(row: InquiryRow) {
    setExpandedId((current) => current === row.id ? null : row.id);
    setNotesById((current) => current[row.id] ? current : { ...current, [row.id]: row.notes });
  }

  function addNote(inquiryId: string) {
    const body = (noteDrafts[inquiryId] ?? "").trim();
    if (!body || notePending[inquiryId]) return;
    const temporaryNote: InquiryNote = { id: `temp-${Date.now()}`, body, createdAt: new Date().toISOString() };
    const previousNotes = notesById[inquiryId] ?? [];
    setNotesById((current) => ({ ...current, [inquiryId]: [...(current[inquiryId] ?? []), temporaryNote] }));
    setNoteDrafts((current) => ({ ...current, [inquiryId]: "" }));
    setNotePending((current) => ({ ...current, [inquiryId]: true }));
    startTransition(async () => {
      try {
        const result = await addInquiryNote(inquiryId, body);
        if (result.ok && result.note) {
          setNotesById((current) => ({
            ...current,
            [inquiryId]: (current[inquiryId] ?? []).map((note) => note.id === temporaryNote.id ? result.note! : note)
          }));
        } else {
          setNotesById((current) => ({ ...current, [inquiryId]: previousNotes }));
        }
      } catch {
        setNotesById((current) => ({ ...current, [inquiryId]: previousNotes }));
      } finally {
        setNotePending((current) => ({ ...current, [inquiryId]: false }));
        router.refresh();
      }
    });
  }

  function removeNote(inquiryId: string, note: InquiryNote) {
    if (!confirm("이 메모를 삭제할까요?")) return;
    const previousNotes = notesById[inquiryId] ?? [];
    setNotesById((current) => ({ ...current, [inquiryId]: (current[inquiryId] ?? []).filter((item) => item.id !== note.id) }));
    startTransition(async () => {
      try {
        const result = await deleteInquiryNote(note.id);
        if (!result.ok) setNotesById((current) => ({ ...current, [inquiryId]: previousNotes }));
      } catch {
        setNotesById((current) => ({ ...current, [inquiryId]: previousNotes }));
      } finally {
        router.refresh();
      }
    });
  }

  function retry(row: InquiryRow) {
    if (retryPending[row.id]) return;
    setRetryPending((current) => ({ ...current, [row.id]: true }));
    setRetryMessages((current) => ({ ...current, [row.id]: "" }));
    startTransition(async () => {
      try {
        const result = await retryInquiryProcessing(row.id);
        setRetryMessages((current) => ({ ...current, [row.id]: result.message }));
      } catch {
        setRetryMessages((current) => ({ ...current, [row.id]: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }));
      } finally {
        setRetryPending((current) => ({ ...current, [row.id]: false }));
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="cms-tabs">
        {tabs.map((tab) => {
          const count = tab.value === "all"
            ? inquiries.length
            : inquiries.filter((row) => getStatus(row) === tab.value).length;
          return (
            <button key={tab.value} type="button" className={`cms-tab ${statusFilter === tab.value ? "on" : ""}`} onClick={() => setStatusFilter(tab.value)}>
              {tab.label} {count}
            </button>
          );
        })}
      </div>
      <div className="cms-search">
        <input aria-label="문의 검색" className="cms-input" style={{ width: 300 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·기관·내용·교육 목표 검색" />
        <button className="cms-btn cms-btn-cancel" type="button" onClick={() => router.refresh()}>새로고침</button>
      </div>

      <table className="cms-table">
        <thead>
          <tr>
            <th>접수일</th><th>이름</th><th>기관</th><th>연락처</th><th>유형</th><th>상태</th><th aria-label="상세" />
          </tr>
        </thead>
        <tbody>
          {filteredInquiries.map((row) => {
            const status = getStatus(row);
            const notes = notesById[row.id] ?? row.notes;
            const level = row.message.match(/\[AI학습체크\] Level (\d)/)?.[1];
            const isExpanded = expandedId === row.id;
            const active = ["processing"].includes(row.analysisStatus) || ["sending"].includes(row.notificationStatus);
            const leaseActive = Boolean(row.processingLeaseUntil && new Date(row.processingLeaseUntil).getTime() > Date.now());
            const canRetry = !leaseActive && row.notificationStatus !== "uncertain" && !(row.analysisStatus === "complete" && row.notificationStatus === "sent");
            const deleteAction = deleteInquiry.bind(null, row.id);
            return (
              <Fragment key={row.id}>
                <tr className="clickable" onClick={() => toggleExpanded(row)}>
                  <td>{new Date(row.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{row.name}</td><td>{row.organization ?? "-"}</td>
                  <td><small>{row.phone ?? "-"}</small><br /><small>{row.email ?? "-"}</small></td>
                  <td>{row.audience === "AI학습체크 문의" ? <><span className="badge badge-gray">AI학습체크</span>{level && <> <span className="badge-level">Level {level}</span></>}</> : row.audience || "일반"}</td>
                  <td>
                    <select className="cms-input inq-status-select" value={status} disabled={pending[row.id]} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(row.id, event.target.value, status)}>
                      {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </td>
                  <td>{notes.length > 0 && <span className="inq-note-count">💬 {notes.length}</span>}{isExpanded ? "▾" : "▸"}</td>
                </tr>
                {isExpanded && (
                  <tr className="inq-detail-row" key={`${row.id}-detail`}>
                    <td colSpan={7}>
                      <div className="inq-analysis-block"><h3>문의 원문</h3><div className="inq-msg">{row.message}</div></div>
                      <div className="inq-analysis-block"><h3>작성한 교육 목표</h3><div className="inq-msg">{row.educationGoal?.trim() || "입력되지 않았습니다."}</div></div>
                      <div className="inq-meta">대상: {row.audience ?? "-"}</div>
                      <div className="inq-processing-status" aria-label="처리 상태">
                        <div><strong>AI 분석</strong><span className={`inq-state inq-state-${row.analysisStatus}`}>{analysisLabels[row.analysisStatus] ?? row.analysisStatus}</span>{row.analysisAt && <small> {new Date(row.analysisAt).toLocaleString("ko-KR")}</small>}{row.analysisError && <p className="inq-state-error" role="alert">{row.analysisError}</p>}</div>
                        <div><strong>담당자 메일</strong><span className={`inq-state inq-state-${row.notificationStatus}`}>{notificationLabels[row.notificationStatus] ?? row.notificationStatus}</span>{row.notificationSentAt && <small> {new Date(row.notificationSentAt).toLocaleString("ko-KR")}</small>}{row.notificationError && <p className="inq-state-error" role="alert">{row.notificationError}</p>}</div>
                      </div>
                      {row.analysisStatus === "complete" && row.analysis ? <InquiryAnalysisPanel key={`${row.id}-${row.analysisAt ?? "saved"}`} analysis={row.analysis} catalog={catalog} email={row.email} name={row.name} /> : (
                        <p className="inq-analysis-hint">{row.analysisStatus === "failed" ? "분석에 실패했습니다. 원문을 확인하고 다시 시도할 수 있습니다." : "저장된 분석 결과가 아직 없습니다."}</p>
                      )}
                      <div className="inq-detail-actions">
                        <button className="cms-btn cms-btn-cancel" type="button" disabled={!canRetry || retryPending[row.id]} onClick={() => retry(row)}>{retryPending[row.id] ? "요청 중..." : row.analysisStatus === "not_requested" ? "분석 및 관리자 알림" : "처리 다시 시도"}</button>
                        {leaseActive && <span className="inq-analysis-hint">처리 중에는 다시 요청할 수 없습니다.</span>}
                      </div>
                      {retryMessages[row.id] && <p role="status" className="inq-analysis-hint">{retryMessages[row.id]}</p>}
                      <div className="inq-notes-title">팔로업 메모</div>
                      {notes.map((note) => (
                        <div className="inq-note" key={note.id}>
                          <div className="inq-note-date"><span>{new Date(note.createdAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span><button className="inq-note-del" type="button" onClick={() => removeNote(row.id, note)}>삭제 ×</button></div>
                          <div className="inq-note-body">{note.body}</div>
                        </div>
                      ))}
                      <form className="inq-note-form" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); addNote(row.id); }}>
                        <textarea className="cms-input" rows={2} value={noteDrafts[row.id] ?? ""} placeholder="팔로업 내용을 남기세요 (통화 내용, 견적 발송, 다음 액션 등)" onChange={(event) => setNoteDrafts((current) => ({ ...current, [row.id]: event.target.value }))} />
                        <button className="cms-btn cms-btn-primary" type="submit" disabled={notePending[row.id]}>메모 추가</button>
                      </form>
                      <div className="inq-detail-actions">
                        {row.email && <a className="cms-btn cms-btn-primary" href={`mailto:${row.email}?subject=${encodeURIComponent(`문의 회신: ${row.name}님`)}`}>회신 메일</a>}
                        {row.phone && <a className="cms-btn cms-btn-cancel" href={`tel:${row.phone}`}>전화</a>}
                        <DeleteButton action={deleteAction} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {!filteredInquiries.length && <tr><td colSpan={7} className="cms-empty">조건에 맞는 문의가 없습니다.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
