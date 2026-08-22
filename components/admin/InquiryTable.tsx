"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { addInquiryNote, deleteInquiry, deleteInquiryNote, setInquiryStatusInline } from "@/lib/actions";

export type InquiryNote = { id: string; body: string; createdAt: string };

export type InquiryRow = {
  id: string;
  name: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  audience: string | null;
  message: string;
  status: string;
  createdAt: string;
  notes: InquiryNote[];
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

export function InquiryTable({ inquiries }: { inquiries: InquiryRow[] }) {
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

  const getStatus = (row: InquiryRow) => statuses[row.id] ?? row.status;
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filteredInquiries = inquiries.filter((row) => {
    const status = getStatus(row);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesQuery = !normalizedQuery || [row.name, row.organization, row.email, row.phone]
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
        <input className="cms-input" style={{ width: 260 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·기관·이메일 검색" />
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
                      <div className="inq-msg" style={{ whiteSpace: "pre-wrap" }}>{row.message}</div>
                      <div className="inq-meta">대상: {row.audience ?? "-"}</div>
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
