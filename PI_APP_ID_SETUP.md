# Pi Network App ID Setup - Pharaohs Pi Farm

## Problem
"App ID not found" error when initializing Pi Network.

## Root Cause
The `Pi.init()` call was missing the required `appId` parameter. Pi SDK requires:
1. Valid App ID registered in Pi Developer Portal
2. Correct callback URL (origin) matching the registration
3. Sandbox mode for development

## Solution Implemented

### 1. System Configuration Updated (`/lib/system-config.ts`)
\`\`\`typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: true,
  APP_ID: "pharaohs-pi-farm", // Add your App ID here
  CALLBACK_URL: window.location.origin, // Auto-detected from browser
};
\`\`\`

### 2. Pi.init() Updated (`/contexts/pi-auth-context.tsx`)
\`\`\`typescript
await window.Pi.init({
  version: "2.0",
  sandbox: PI_NETWORK_CONFIG.SANDBOX,
  appId: PI_NETWORK_CONFIG.APP_ID, // ← Now included
});
\`\`\`

### 3. Environment Variables Support
For production deployment, you can use:
\`\`\`
NEXT_PUBLIC_PI_APP_ID=your-actual-app-id
NEXT_PUBLIC_CALLBACK_URL=https://yourdomain.com
\`\`\`

### 4. Sandbox Configuration Payload (Current Setup ✅)
The current setup reads from the **Pi Developer Dashboard → Sandbox → Configuration Payload**:

\`\`\`json
{ "appId": "3APCPV83", "sandbox": true }
\`\`\`

This is configured in two places:
1. **`.env.local`** (local secrets, ignored by Git):
   \`\`\`
   NEXT_PUBLIC_PI_APP_ID=3APCPV83
   PI_API_KEY=your_pi_server_api_key
   \`\`\`
2. **`/lib/system-config.ts`** → `PI_SANDBOX_PAYLOAD` constant as a fallback default.

**Priority order** for `APP_ID` (first match wins):
1. `window.__PI_APP_ID` (set before app loads)
2. `NEXT_PUBLIC_PI_APP_ID` environment variable (from `.env.local`)
3. `PI_SANDBOX_PAYLOAD.appId` (hardcoded fallback)

## Debugging Instructions

Open Browser Console (F12 → Console tab) and look for logs:

### Success Logs
\`\`\`
[PiAuth] Pi.init() config: {
  version: "2.0",
  sandbox: true,
  appId: "pharaohs-pi-farm",
  origin: "http://localhost:3000",
  piAppId: "pharaohs-pi-farm"
}

[PiAuth] Authentication successful: {
  appId: "pharaohs-pi-farm",
  origin: "http://localhost:3000",
  pi_getAppId: "pharaohs-pi-farm",
  url: "http://localhost:3000"
}
\`\`\`

### Error Logs
\`\`\`
[PiAuth] SDKLite initialization failed: {
  appId: "pharaohs-pi-farm",
  origin: "http://localhost:3000",
  sandbox: true,
  piAvailable: true,
  sdkLiteAvailable: true,
  errorType: "Error",
  errorMessage: "App ID not found"
}
\`\`\`

## Steps to Fix

### Step 1: Get Your App ID
1. Log in to Pi Developer Portal (https://pi.dev/developer/)
2. Create/Select your app
3. Copy the App ID

### Step 2: Update Configuration
Replace the default `appId` in `/lib/system-config.ts`:
\`\`\`typescript
APP_ID: "YOUR-ACTUAL-APP-ID", // From Pi Developer Portal
\`\`\`

### Step 3: Verify Callback URL
In Pi Developer Portal, under "App Details":
- Sandbox Callback URL: `http://localhost:3000` (for development)
- Production Callback URL: `https://yourdomain.com` (for deployment)

### Step 4: Test Connection
Open browser console and verify logs show:
- `[PiAuth] Pi.init() config` with your actual App ID
- `[PiAuth] Authentication successful` or specific error message

## Common Issues

| Issue | Solution |
|-------|----------|
| "App ID not found" | Verify App ID in config matches Pi Developer Portal |
| "Callback URL mismatch" | Ensure `window.location.origin` matches registered URL |
| CORS errors | Keep `SANDBOX: true` for development |
| SDK not loading | Check network tab for failed script loads |

## Sandbox vs Production

**Development (Sandbox)**:
- `SANDBOX: true`
- App ID: Any value (e.g., "pharaohs-pi-farm")
- URL: `http://localhost:3000`
- SSL: Not required

**Production**:
- `SANDBOX: false`
- App ID: Registered in Pi Portal
- URL: HTTPS domain registered in Pi Portal
- Callback URL: Must match exactly
