"use client";

import { useActionState, useState } from "react";
import { createAgentKey, type CreateAgentKeyState } from "@/lib/agent-key-actions";

// 에이전트 키 발급 폼. 새 키는 이 화면에서 한 번만 보여 주고, 새로고침하면 다시 볼 수 없다.
export function AgentKeyManager() {
  const [state, action, pending] = useActionState<CreateAgentKeyState, FormData>(createAgentKey, { ok: false });
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    if (!state.key) return;
    try {
      await navigator.clipboard.writeText(state.key);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <form action={action} className="cms-form" style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="cms-field" style={{ flex: "1 1 260px", marginBottom: 0 }}>
          <label className="cms-label">에이전트 이름 <em>*</em></label>
          <input className="cms-input" name="name" maxLength={100} placeholder="예: 블로그 작성 에이전트 (Claude)" required />
        </div>
        <button type="submit" className="cms-btn cms-btn-primary" disabled={pending}>
          {pending ? "발급 중..." : "키 발급"}
        </button>
      </form>

      {state.message ? <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{state.message}</p> : null}

      {state.ok && state.key ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: "#fff7ed", border: "1px solid #fdba74" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            「{state.name}」 키가 발급되었습니다. 지금 복사해 에이전트 쪽 비밀 저장소에 넣으세요.
          </div>
          <div style={{ fontSize: 13, color: "#9a3412", marginBottom: 10 }}>
            이 키는 다시 볼 수 없습니다. 서버에는 해시만 저장됩니다.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ padding: "8px 10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, wordBreak: "break-all", flex: "1 1 320px" }}>
              {state.key}
            </code>
            <button type="button" className="cms-btn cms-btn-cancel" onClick={copyKey}>
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
