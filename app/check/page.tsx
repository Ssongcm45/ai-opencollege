import type { Metadata } from "next";
import { CheckWizard } from "@/components/CheckWizard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "AI학습체크 · AI OpenCollege",
  description: "5개 영역 30문항으로 AI 업무 실행 역량과 우선 학습 영역을 10분 만에 진단합니다.",
};

export default function CheckPage() {
  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">AI CHECK</div>
            <h1 className="sh2 sh2-lg">AI 업무 실행 역량 진단</h1>
            <p className="sdesc">최근 3개월 실제 업무 경험 기준 · 5개 영역 30문항 · 약 10분</p>
          </div>
        </section>
        <section className="sec">
          <div className="wrap" style={{ maxWidth: 900 }}>
            <CheckWizard />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
