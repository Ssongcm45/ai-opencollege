import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // www 주소를 대표 도메인으로 모은다(308). 이전에는 www도 200으로 따로 열렸다.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.opencollege.co.kr" }],
        destination: "https://opencollege.co.kr/:path*",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [{ source: "/guide", destination: "/guide.html" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
