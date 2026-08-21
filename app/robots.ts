import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin"
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
