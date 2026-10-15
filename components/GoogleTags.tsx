import Script from "next/script";

const GTM_ID = "GTM-TJ5J2J2L";
const GA_ID = "G-G8N6XZQNMD";

// Google Tag Manager + GA4(gtag.js 직접 설치).
// GA4 페이지뷰는 여기서 직접 보내므로 GTM 컨테이너에 같은 측정 ID의 GA4 구성 태그를 추가하면 중복 집계된다.
// App Router 클라이언트 전환은 GA4 향상된 측정(브라우저 기록 변경 기반 페이지뷰)이 잡는다.
export function GoogleTags() {
  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}

export function GoogleTagManagerNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
