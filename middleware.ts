import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Script-Src: allow self-hosted scripts + Pi SDK, and include 'unsafe-inline'
  // + 'unsafe-eval' in BOTH development and production. Next.js runtime emits
  // inline scripts/styles and relies on eval for some dev/prod chunk paths.
  // Omitting these on Vercel (production) causes:
  //   "Executing inline script violates ... Content-Security-Policy"
  //   "Uncaught Error: Connection closed"
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://*.pi.network",
    "https://*.vercel.app",
  ];

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.pi.network https://*.vercel.app",
    // connect-src: Pi SDK, Pi API, and Pi SDK Lite (github pages) + WebSockets
    "connect-src 'self' https://*.pi.network https://sdk.minepi.com https://api.minepi.com https://pi-apps.github.io wss: http://localhost:3000 ws://localhost:3000",
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:",
    "frame-src 'self' https://*.pi.network https://*.vercel.app http://localhost:3000",
    "frame-ancestors 'self' https://*.pi.network https://*.vercel.app http://localhost:3000",
    "base-uri 'self'",
    "form-action 'self'",
    "block-all-mixed-content",
    "upgrade-insecure-requests",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  return res;
}

export const config = {
  matcher: "/:path*",
};

