// Pi Network Sandbox Configuration Payload
// Source: https://developers.pi.computer/ → Your App → Sandbox
// Format: { appId: "3APCPV83", sandbox: true }
const PI_SANDBOX_PAYLOAD = {
  appId: "3APCPV83", // ← From Pi Developer Dashboard Sandbox
  sandbox: true,
} as const;

export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: PI_SANDBOX_PAYLOAD.sandbox, // true = sandbox/test mode
  
  // IMPORTANT: App ID Configuration
  // Priority (first match wins):
  //   1. window.__PI_APP_ID (set before app loads)
  //   2. NEXT_PUBLIC_PI_APP_ID environment variable
  //   3. Pi Sandbox Configuration Payload appId (3APCPV83)
  APP_ID:
    typeof window !== "undefined"
      ? (window as any).__PI_APP_ID ||
        process.env.NEXT_PUBLIC_PI_APP_ID ||
        PI_SANDBOX_PAYLOAD.appId
      : process.env.NEXT_PUBLIC_PI_APP_ID || PI_SANDBOX_PAYLOAD.appId,
  
  // IMPORTANT: Callback URL Configuration
  // This must match EXACTLY what you registered in Pi Developer Portal
  // Including protocol (https for production, http for localhost)
  CALLBACK_URL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_CALLBACK_URL || "http://localhost:3000",
  
ENABLE_MOCK_MODE: false, // Disable mock mode — always use real Pi Network
} as const;
