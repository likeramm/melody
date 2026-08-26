import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MELODY HQ",
    template: "%s · MELODY HQ",
  },
  description: "MELODY 통합 학원 관리 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 태블릿·휴대폰에서 표를 확대해 볼 수 있도록 확대를 막지 않습니다.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
