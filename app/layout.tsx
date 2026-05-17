import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI OpenCollege · AI 실무교육 전문기관",
  description:
    "기업·공공기관·대학을 위한 AI 실무교육 전문기관. AIRO 플랫폼 기반 맞춤 교육, 출강, 온라인, 실습형 AI 교육."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
