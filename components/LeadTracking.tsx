"use client";

import { useEffect } from "react";
import { track, type CtaLocation } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

function ctaLocationOf(element: Element): CtaLocation {
  const explicit = element.closest<HTMLElement>("[data-cta-location]")?.dataset.ctaLocation;
  if (explicit) return explicit as CtaLocation;
  if (element.closest("header")) return "header";
  if (element.closest("footer")) return "footer";
  if (window.location.pathname.startsWith("/lp/")) return "lp";
  if (element.closest("#top")) return "hero";
  return "section";
}

function isContactCta(anchor: HTMLAnchorElement) {
  if (anchor.dataset.cta !== undefined) return true;
  const href = anchor.getAttribute("href") ?? "";
  return /#(contact|lp-form)$/.test(href);
}

// 전역 1회 설치: 유입 정보 저장 + 전화·메일·문의 버튼 클릭 이벤트(이벤트 위임).
export function LeadTracking() {
  useEffect(() => {
    captureAttribution();

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const location = ctaLocationOf(anchor);
      if (href.startsWith("tel:")) {
        track("phone_click", { cta_location: location, link_url: href });
      } else if (href.startsWith("mailto:")) {
        track("email_click", { cta_location: location });
      } else if (anchor.dataset.kakao !== undefined) {
        track("kakao_click", { cta_location: location });
      } else if (isContactCta(anchor)) {
        track("cta_click", { cta_location: location, link_text: (anchor.textContent ?? "").trim().slice(0, 40) });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
