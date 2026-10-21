import { Metadata } from "next";
import "@/app/styles/globals.scss";
import {
  PortfolioHeader,
  PortfolioFooter,
  PortfolioBackdrop,
} from "./components/portfolio/Portfolio";
import JsonLd from "@/app/components/JsonLd";
import Script from "next/script";
import ScrollViewport from "./components/portfolio/ScrollViewport";

export const metadata: Metadata = {
  metadataBase: new URL("https://kdhportfolio-omega.vercel.app"),
  other: {
    "portfolio-revision": process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  },
  title: "김도훈 — 프론트엔드 개발자",
  description:
    "디자인피버에서 렉서스 상담·예약 UI와 기아 반응형 UI·스크롤 인터랙션을 개발하는 프론트엔드 개발자 김도훈의 포트폴리오.",
  keywords:
    "프론트엔드 개발자, 포트폴리오, 프론트엔드 포트폴리오, 개발자 포트폴리오",
  openGraph: {
    siteName: "프론트엔드 개발자 김도훈 포트폴리오",
    title: "프론트엔드 개발자 김도훈 포트폴리오",
    type: "website",
    description:
      "디자인피버 재직 중인 프론트엔드 개발자 김도훈. 렉서스 상담·예약 UI와 기아 반응형 UI·스크롤 인터랙션 개발 경험을 소개합니다.",
    images: [
      {
        url: "https://kdhportfolio-omega.vercel.app/meta/sum-logo.jpg",
        alt: "프론트엔드 개발자 김도훈 포트폴리오",
      },
    ],
    url: "https://kdhportfolio-omega.vercel.app/",
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
      <head>
        <link
          rel="preload"
          href="/font/NewYork.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
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
          <PortfolioBackdrop />
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
