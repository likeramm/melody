import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ELOQUENCE",
    template: "%s · ELOQUENCE",
  },
  description: "ELOQUENCE Liberal Arts & Communications 운영 시스템",
  icons: {
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 태블릿·휴대폰에서 표를 확대해 볼 수 있도록 확대를 막지 않습니다.
  maximumScale: 5,
  themeColor: "#441f25",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* 로고 워드마크와 같은 고전 세리프, 그리고 한글 제목용 명조 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Serif+KR:wght@500;600;700&display=swap"
        />
        {/* 본문 · 표 — 한글 UI 가독성이 가장 좋은 Pretendard */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
