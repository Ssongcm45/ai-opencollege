import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckWizard } from "@/components/CheckWizard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCheckGroupByCode, isGroupOpen } from "@/lib/check-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const group = await getCheckGroupByCode(code);
  return {
    title: group ? `${group.name} AI학습체크 · AI OpenCollege` : "AI학습체크 · AI OpenCollege",
    robots: { index: false },
  };
}

export default async function OrgCheckPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getCheckGroupByCode(code);
  if (!group) notFound();

  if (!isGroupOpen(group)) {
    return (
      <>
        <Header />
        <main>
          <section className="page-hero">
            <div className="wrap">
              <div className="ey">AI CHECK · {group.name}</div>
              <h1 className="sh2 sh2-lg">진단 응답이 종료되었습니다</h1>
              <p className="sdesc">이 조직 진단의 응답 기간이 마감되었거나 종료 처리되었습니다.</p>
            </div>
          </section>
          <section className="sec">
            <div className="wrap" style={{ maxWidth: 720 }}>
              <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
                <p>진단에 참여하지 못하셨거나 조직 진단이 필요하시면 아래로 문의해 주세요.</p>
                <div className="hero-btns" style={{ justifyContent: "center" }}>
                  <a href="/#contact" className="btn bp btn-pill">교육 문의하기</a>
                  <a href="/check" className="btn bo btn-pill">AI학습체크 개인 진단하기</a>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">AI CHECK · {group.name}</div>
            <h1 className="sh2 sh2-lg">AI 업무 실행 역량 진단</h1>
            <p className="sdesc">최근 3개월 실제 업무 경험 기준 · 5개 영역 30문항 · 약 10분</p>
          </div>
        </section>
        <section className="sec">
          <div className="wrap" style={{ maxWidth: 900 }}>
            <CheckWizard orgCode={group.code} orgName={group.name} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
