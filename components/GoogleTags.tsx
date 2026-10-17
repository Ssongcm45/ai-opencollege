import Script from "next/script";

const GTM_ID = "GTM-TJ5J2J2L";

// Google Tag Manager. GA4(gtag.js)는 app/layout.tsx <head>에서 직접 설치하므로
// GTM 컨테이너에 같은 측정 ID의 GA4 구성 태그를 추가하면 중복 집계된다.
export function GoogleTags() {
  return (
    <Script id="gtm" strategy="lazyOnload">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
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
