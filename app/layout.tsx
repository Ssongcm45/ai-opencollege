import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const defaultTitle = "AI OpenCollege · AI 실무교육 전문기관";
const defaultDescription =
  "기업·공공기관·대학을 위한 AI 실무교육 전문기관. AIRO 플랫폼 기반 맞춤 교육, 출강, 온라인, 실습형 AI 교육.";
const defaultIcon = "/logo.png";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const title = settings?.siteTitle || defaultTitle;
    const description = settings?.siteDescription || defaultDescription;
    const faviconUrl = settings?.faviconUrl || defaultIcon;
    const googleVerification = settings?.googleVerification;
    const naverVerification = settings?.naverVerification;

    return {
      title,
      description,
      icons: {
        icon: faviconUrl,
        apple: faviconUrl
      },
      metadataBase: new URL(siteUrl),
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
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        type: "website"
      }
    };
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
