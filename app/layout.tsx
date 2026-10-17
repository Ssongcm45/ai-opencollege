import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleTagManagerNoscript, GoogleTags } from "@/components/GoogleTags";
import { LeadTracking } from "@/components/LeadTracking";
import { NaverAnalytics } from "@/components/NaverAnalytics";
import { getSiteSettings } from "@/lib/content";
import { defaultOgImage, siteUrl } from "@/lib/site";
import { BUSINESS_INFO } from "@/lib/business-info";
import "./globals.css";

export const maxDuration = 120;

const defaultTitle = "AI OpenCollege · AI 실무교육 전문기관";
const defaultDescription =
  "기업·공공기관·대학을 위한 AI 실무교육 전문기관. AIRO 플랫폼 기반 맞춤 교육, 출강, 온라인, 실습형 AI 교육.";
const defaultIcon = "/logo.png";
// 네이버 서치어드바이저 소유확인 코드. 관리자 설정(siteSettings.naverVerification)에 값이 있으면 그쪽이 우선.
const defaultNaverVerification = "0cd5e0e2ab2bd6d9d60a12432f972d003ba1d111";
// 네이버 애널리틱스(웹로그 분석) 계정 키.
const naverAnalyticsId = "261fdd11f0bdf80";
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "AI OpenCollege",
  legalName: BUSINESS_INFO.companyName,
  alternateName: BUSINESS_INFO.brandName,
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  email: BUSINESS_INFO.email,
  telephone: BUSINESS_INFO.phone,
  taxID: BUSINESS_INFO.businessRegistrationNumber,
  parentOrganization: {
    "@type": "Organization",
    name: BUSINESS_INFO.companyName
  }
};
const webSiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AI OpenCollege",
  url: siteUrl,
  inLanguage: "ko"
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const title = settings?.siteTitle || defaultTitle;
    const description = settings?.siteDescription || defaultDescription;
    const faviconUrl = settings?.faviconUrl || defaultIcon;
    const googleVerification = settings?.googleVerification;
    const naverVerification = settings?.naverVerification || defaultNaverVerification;

    return {
      title,
      description,
      icons: {
        icon: faviconUrl,
        apple: faviconUrl
      },
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
        types: {
          "application/rss+xml": `${siteUrl}/rss.xml`
        }
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: [settings?.ogImageUrl || defaultOgImage]
      },
      twitter: { card: "summary_large_image" },
      ...((googleVerification || naverVerification)
        ? {
            verification: {
              ...(googleVerification ? { google: googleVerification } : {}),
              ...(naverVerification
                ? { other: { "naver-site-verification": naverVerification } }
                : {})
            }
          }
        : {})
    };
  } catch {
    return {
      title: defaultTitle,
      description: defaultDescription,
      icons: {
        icon: defaultIcon,
        apple: defaultIcon
      },
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
        types: {
          "application/rss+xml": `${siteUrl}/rss.xml`
        }
      },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        type: "website",
        images: [defaultOgImage]
      },
      twitter: { card: "summary_large_image" },
      verification: {
        other: { "naver-site-verification": defaultNaverVerification }
      }
    };
  }
}

const GA4_ID = "G-G8N6XZQNMD";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 셀프호스팅(동일 출처) + 히어로 한글 서브셋 preload: 폰트 스왑 CLS 완화 */}
        <link rel="stylesheet" href="/fonts/pretendard.css" />
        {[91, 90, 89, 88, 87].map((n) => (
          <link key={n} rel="preload" as="font" type="font/woff2" crossOrigin="anonymous" href={`/fonts/pretendard/PretendardVariable.subset.${n}.woff2`} />
        ))}
        {/* Google tag (gtag.js) — GA4 */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`
          }}
        />
      </head>
      <body>
        <GoogleTagManagerNoscript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationLd, webSiteLd]) }} />
        {children}
        <LeadTracking />
        <NaverAnalytics accountId={naverAnalyticsId} />
        <Analytics />
        <GoogleTags />
      </body>
    </html>
  );
}
