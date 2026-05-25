import { getSiteSettings } from "@/lib/content";
import { saveSettings } from "@/lib/actions";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSiteSettings();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">설정</h1>
        {params.saved && (
          <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 8, fontSize: 13, fontWeight: 700, padding: "8px 16px" }}>
            ✓ 저장되었습니다
          </span>
        )}
      </div>

      <form action={saveSettings} className="cms-form">
        {/* SEO 기본 설정 */}
        <div className="cms-card">
          <div className="settings-section-title">SEO 기본 설정</div>
          <div className="cms-form">
            <div className="cms-field">
              <label className="cms-label">사이트 제목</label>
              <input
                className="cms-input"
                name="siteTitle"
                defaultValue={settings?.siteTitle ?? ""}
                placeholder="AI OpenCollege — AI 교육 전문 기관"
              />
              <p className="cms-hint">블로그·포트폴리오 페이지는 각 글의 제목이 자동 사용됩니다.</p>
            </div>
            <div className="cms-field">
              <label className="cms-label">사이트 설명 (meta description)</label>
              <textarea
                className="cms-input cms-textarea"
                name="siteDescription"
                defaultValue={settings?.siteDescription ?? ""}
                placeholder="공공기관, 기업, 대학 등 현장 맞춤형 AI 교육 설계·운영 전문 기관입니다."
              />
              <p className="cms-hint">개별 페이지는 각 글의 요약(excerpt)이 자동 사용됩니다.</p>
            </div>
          </div>
        </div>

        {/* OG / SNS 공유 */}
        <div className="cms-card">
          <div className="settings-section-title">OG / SNS 공유 설정</div>
          <div className="cms-form">
            <div className="cms-field">
              <label className="cms-label">OG 이미지 URL</label>
              <input
                className="cms-input"
                name="ogImageUrl"
                defaultValue={settings?.ogImageUrl ?? ""}
                placeholder="https://opencollege.co.kr/og-image.png"
              />
              <p className="cms-hint">카카오톡·트위터·링크드인 공유 시 표시되는 대표 이미지 URL</p>
            </div>
          </div>
        </div>

        {/* 파비콘 */}
        <div className="cms-card">
          <div className="settings-section-title">파비콘</div>
          <div className="cms-form">
            <div className="cms-field">
              <label className="cms-label">파비콘 URL</label>
              <input
                className="cms-input"
                name="faviconUrl"
                defaultValue={settings?.faviconUrl ?? ""}
                placeholder="https://opencollege.co.kr/favicon.ico"
              />
              <p className="cms-hint">브라우저 탭에 표시되는 아이콘 URL (권장: .ico 또는 .png 32×32)</p>
            </div>
          </div>
        </div>

        {/* 검색엔진 인증 */}
        <div className="cms-card">
          <div className="settings-section-title">검색엔진 소유자 인증</div>
          <div className="cms-form">
            <div className="cms-field">
              <label className="cms-label">네이버 서치어드바이저 인증 코드</label>
              <input
                className="cms-input"
                name="naverVerification"
                defaultValue={settings?.naverVerification ?? ""}
                placeholder="naver 인증 코드 (content= 값)"
              />
              <p className="cms-hint">네이버 서치어드바이저 → 사이트 등록 → HTML 태그 방식의 content 값만 입력</p>
            </div>
            <div className="cms-field">
              <label className="cms-label">구글 서치콘솔 인증 코드</label>
              <input
                className="cms-input"
                name="googleVerification"
                defaultValue={settings?.googleVerification ?? ""}
                placeholder="google 인증 코드 (content= 값)"
              />
              <p className="cms-hint">구글 서치콘솔 → 속성 추가 → HTML 태그 방식의 content 값만 입력</p>
            </div>
          </div>
        </div>

        <div className="cms-actions">
          <button type="submit" className="cms-btn cms-btn-primary" style={{ minWidth: 120 }}>설정 저장</button>
        </div>
      </form>
    </>
  );
}
