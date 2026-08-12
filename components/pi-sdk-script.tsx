"use client";

import Script from "next/script";

/**
 * Loads the official Pi Network SDK before the rest of the app so `window.Pi` is ready.
 *
 * `next/script`'s <Script> is a Client Component and rejects event-handler props
 * (like `onError`) when rendered from a Server Component. Wrapping it in its own
 * Client Component keeps that handler inside the client boundary and avoids the
 * "Event handlers cannot be passed to Client Component props" prerender error.
 */
export function PiSdkScript() {
  return (
    <Script
      src="https://sdk.minepi.com/pi-sdk.js"
      strategy="beforeInteractive"
      onError={(e) => console.warn("[PiSDK] Official pi-sdk.js failed to load", e)}
    />
  );
}