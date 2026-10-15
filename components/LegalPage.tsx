import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { BUSINESS_INFO } from "@/lib/business-info";
import "@/app/legal.css";

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="page-hero legal-hero">
          <div className="wrap">
            <p className="ey">{eyebrow}</p>
            <h1 className="sh2 sh2-lg">{title}</h1>
            <p className="sdesc">{intro}</p>
          </div>
        </section>
        <div className="wrap legal-wrap">
          <article className="legal-content">
            {children}
            <section>
              <h2>운영자 정보</h2>
              <dl className="legal-business">
                <div><dt>상호</dt><dd>{BUSINESS_INFO.companyName}</dd></div>
                <div><dt>브랜드</dt><dd>{BUSINESS_INFO.brandName}</dd></div>
                <div><dt>사업자등록번호</dt><dd>{BUSINESS_INFO.businessRegistrationNumber}</dd></div>
                <div><dt>통신판매업 신고번호</dt><dd>{BUSINESS_INFO.ecommerceRegistrationNumber}</dd></div>
                <div><dt>전화</dt><dd><a href={`tel:${BUSINESS_INFO.phone}`}>{BUSINESS_INFO.phone}</a></dd></div>
                <div><dt>이메일</dt><dd><a href={`mailto:${BUSINESS_INFO.email}`}>{BUSINESS_INFO.email}</a></dd></div>
              </dl>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
