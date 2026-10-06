import type { Metadata } from "next";
import { NaverAnalytics } from "@/components/NaverAnalytics";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/site";
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
  alternateName: "오픈컬리지",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  email: "edu@opencollege.co.kr",
  parentOrganization: {
    "@type": "Organization",
    name: "(주)유에이지"
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
        ...(settings?.ogImageUrl ? { images: [settings.ogImageUrl] } : {})
      },
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
        type: "website"
      },
      verification: {
        other: { "naver-site-verification": defaultNaverVerification }
      }
    };
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationLd, webSiteLd]) }} />
        {children}
        <NaverAnalytics accountId={naverAnalyticsId} />
      </body>
    </html>
  );
}
