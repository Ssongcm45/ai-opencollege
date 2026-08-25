"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 헤더의 가이드북 메뉴 — 페이지 이동 대신 /guide를 모달(iframe)로 띄운다.
export function GuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className="nav-link-btn" onClick={() => setOpen(true)}>
        가이드북
      </button>
      {open
        ? createPortal(
            // 헤더의 backdrop-filter가 fixed 기준을 가로채므로 body로 포털 렌더한다.
            <div className="guide-modal-overlay" role="dialog" aria-modal="true" aria-label="시각 가이드북" onClick={() => setOpen(false)}>
              <div className="guide-modal-panel" onClick={(event) => event.stopPropagation()}>
                <div className="guide-modal-bar">
                  <span className="guide-modal-title">AI OpenCollege 시각 가이드북</span>
                  <div className="guide-modal-bar-actions">
                    <a className="guide-modal-open" href="/guide" target="_blank" rel="noreferrer">새 창에서 열기 ↗</a>
                    <button type="button" className="guide-modal-close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
                  </div>
                </div>
                <iframe className="guide-modal-frame" src="/guide" title="AI OpenCollege 시각 가이드북" />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
