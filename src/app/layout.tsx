import { Metadata } from "next";
import "@/app/styles/globals.scss";
import {
  PortfolioHeader,
  PortfolioFooter,
} from "./components/portfolio/Portfolio";
import JsonLd from "@/app/components/JsonLd";
import Script from "next/script";
import ScrollViewport from "./components/portfolio/ScrollViewport";

export const metadata: Metadata = {
  metadataBase: new URL("https://kdhportfolio.vercel.app"),
  title: "김도훈 — 프론트엔드 개발자",
  description:
    "섬세한 인터랙션과 견고한 코드로 기억에 남는 웹 경험을 만드는 프론트엔드 개발자 김도훈의 포트폴리오.",
  keywords:
    "프론트엔드 개발자, 포트폴리오, 프론트엔드 포트폴리오, 개발자 포트폴리오",
  openGraph: {
    siteName: "프론트엔드 개발자 김도훈 포트폴리오",
    title: "프론트엔드 개발자 김도훈 포트폴리오",
    type: "website",
    description:
      "항상 도전하고 성장해나가는 삶을 추구하는 프론트엔드 개발자 입니다.",
    images: [
      {
        url: "https://kdhportfolio.vercel.app/meta/sum-logo.jpg",
        alt: "프론트엔드 개발자 김도훈 포트폴리오",
      },
    ],
    url: "https://kdhportfolio.vercel.app/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "0oOQJWKCfZsWJ07hnLRdZmPZIrM4E08eKRu-S8KrJf0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-BEEP7DTK7K"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BEEP7DTK7K');
          `}
        </Script>

        {/* JsonLd 구조화 데이터 */}
        <JsonLd />

        <ScrollViewport>
          <a className="skip-link" href="#main-content">
            본문으로 바로가기
          </a>
          <PortfolioHeader />
          <div id="main-content">{children}</div>
          <PortfolioFooter />
        </ScrollViewport>
      </body>
    </html>
  );
}
