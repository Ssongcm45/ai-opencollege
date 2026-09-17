"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    wcs_add?: Record<string, string>;
    wcs?: unknown;
    wcs_do?: () => void;
  }
}

// 네이버 애널리틱스(웹로그 분석) 페이지뷰 1건 전송.
function sendPageView(accountId: string) {
  if (typeof window === "undefined") return;
  if (!window.wcs || typeof window.wcs_do !== "function") return;
  window.wcs_add = window.wcs_add ?? {};
  window.wcs_add.wa = accountId;
  window.wcs_do();
}

// wcslog.js는 비동기 로드라 인라인 스크립트가 먼저 실행되면 집계가 누락된다.
// onLoad에서 최초 1회를 보내고, App Router 클라이언트 전환마다 다시 보낸다.
export function NaverAnalytics({ accountId }: { accountId: string }) {
  const pathname = usePathname();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) return;
    sendPageView(accountId);
  }, [pathname, accountId]);

  return (
    <Script
      src="//wcs.pstatic.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={() => {
        loadedRef.current = true;
        sendPageView(accountId);
      }}
    />
  );
}
