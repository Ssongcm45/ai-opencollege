import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { BUSINESS_INFO } from "@/lib/business-info";

export const metadata: Metadata = {
  title: "이용약관 · 오픈컬리지",
  description: "오픈컬리지 웹사이트와 교육 문의, AI학습체크 서비스 이용약관입니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="TERMS OF USE" title="이용약관" intro="오픈컬리지 웹사이트의 정보 제공, 교육 문의, AI학습체크 이용에 관한 안내입니다.">
      <section>
        <h2>1. 운영자와 적용 범위</h2>
        <p>이 웹사이트는 {BUSINESS_INFO.companyName}(브랜드: {BUSINESS_INFO.brandName})가 운영합니다. 이 약관은 웹사이트 콘텐츠 열람, 교육 문의 접수, AI학습체크 이용에 적용됩니다. 구체적인 교육 제공 조건은 상담을 거쳐 별도로 안내하거나 당사자 간 계약으로 정합니다.</p>
      </section>
      <section>
        <h2>2. 제공하는 기능</h2>
        <p>운영자는 교육 과정과 사례 등의 정보를 게시하고, 교육 문의를 접수하며, AI학습체크를 통해 응답에 따른 진단 결과를 제공합니다. 서비스의 구성이나 제공 방식은 운영상 필요에 따라 변경될 수 있으며, 이용에 영향을 주는 중요한 변경은 웹사이트를 통해 알립니다.</p>
      </section>
      <section>
        <h2>3. 교육 문의와 계약</h2>
        <p>문의 접수만으로 교육 계약이나 일정·가격이 확정되지는 않습니다. 교육 범위, 일정, 비용, 취소·환불 조건 등은 개별 제안과 계약 단계에서 확인해 주세요. 사이트에 표시된 과정 소개는 해당 조건을 확정하는 견적이 아닙니다.</p>
      </section>
      <section>
        <h2>4. AI학습체크 이용</h2>
        <p>AI학습체크 결과는 입력한 응답을 바탕으로 학습 영역을 살펴보는 참고 자료입니다. 인사평가, 채용, 자격 인증 등 개인에 대한 결정의 유일한 근거로 사용하지 마세요. 조직 진단에 참여하는 경우 조직이 제공한 진단 링크와 안내에 따라 응답해야 합니다.</p>
      </section>
      <section>
        <h2>5. 이용자의 협조</h2>
        <p>이용자는 문의와 진단에 필요한 정보를 정확히 입력하고, 타인의 권리를 침해하거나 서비스 운영을 방해하는 방식으로 사이트를 사용하지 않아야 합니다. 문의나 자유 입력란에 다른 사람의 개인정보, 기밀정보, 인증 정보 등 입력할 권한이 없는 정보를 넣지 마세요.</p>
      </section>
      <section>
        <h2>6. 게시물과 외부 서비스</h2>
        <p>사이트에 게시된 글, 디자인, 이미지 등의 권리는 운영자 또는 정당한 권리자에게 있습니다. 법령상 허용된 이용을 제외하고 무단 복제·배포할 수 없습니다. 외부 사이트로 연결되는 링크와 영상은 해당 서비스의 조건이 적용될 수 있습니다.</p>
      </section>
      <section>
        <h2>7. 개인정보와 문의</h2>
        <p>개인정보 처리에 관한 사항은 <a href="/privacy">개인정보처리방침</a>을 확인해 주세요. 서비스 이용이나 약관에 관한 문의는 <a href={`mailto:${BUSINESS_INFO.email}`}>{BUSINESS_INFO.email}</a> 또는 <a href={`tel:${BUSINESS_INFO.phone}`}>{BUSINESS_INFO.phone}</a>으로 연락할 수 있습니다.</p>
      </section>
    </LegalPage>
  );
}
