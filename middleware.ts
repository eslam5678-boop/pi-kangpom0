import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const isDevelopment = process.env.NODE_ENV === "development";

  const scriptSrc = ["'self'", "https://*.pi.network", "https://*.vercel.app"];

  if (isDevelopment) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  }

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.pi.network https://*.vercel.app",
    "connect-src 'self' https://*.pi.network wss:",
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
