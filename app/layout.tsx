import React from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";

import { AppWrapper } from "../components/app-wrapper";
import { ErrorBoundary } from "../components/error-boundary";

export const metadata: Metadata = {
  title: "إمبراطورية باي الفرعونية - Pi Kingdom Farm",
  description: "لعبة زراعية واقتصادية ويب 3 داخل نظام Pi Network",
  applicationName: "Pi Kingdom Farm",
  generator: "v0.app",
  keywords: [
    "Pi Network",
    "Farm",
    "Game",
    "Egypt",
    "Web3",
    "NFT",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-white antialiased"
      >
        {/* سكريبت Pi SDK الرسمي — يُحمَّل قبل أي كود تطبيق حتى يكون window.Pi جاهزًا */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
          onError={(e) => console.warn("[PiSDK] Official pi-sdk.js failed to load", e)}
        />
        <ErrorBoundary>
          <AppWrapper>{children}</AppWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}