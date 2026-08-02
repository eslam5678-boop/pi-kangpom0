# Pi Network Security Configuration - Access Denied Fix

## Current Configuration (lib/system-config.ts)

\`\`\`typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SDK_LITE_URL: "https://pi-apps.github.io/pi-sdk-lite/build/production/sdklite.js",
  SANDBOX: true,  // NOW CHANGED TO TRUE FOR TESTING
} as const;
\`\`\`

## Error: "Access denied" or "Security Error"

This error occurs when:
1. **Domain mismatch** - App running on localhost, but Pi Network expects production domain
2. **SSL/Certificate issue** - HTTPS domain not registered in Pi Developer Portal
3. **Strict mode enabled** - SANDBOX: false forces strict SSL validation
4. **Wrong App ID** - App ID in Pi Network portal doesn't match current domain

## Solutions Applied

### 1. Sandbox Mode Enabled (DONE)
Changed `SANDBOX: false` → `SANDBOX: true` in `/lib/system-config.ts`
- Disables strict SSL certificate validation
- Allows development on localhost
- Comment: "// Changed to true for testing - removes SSL/certificate validation"

### 2. Environment Setup Needed (NEXT STEPS)

#### For Development (localhost):
1. Go to Pi Network Developer Portal: https://pi.dev
2. Create/select your app
3. Add callback URL: `http://localhost:3000` (or your dev port)
4. Note the App ID provided

#### For Production:
1. Register your production domain: `https://yourdomain.com`
2. Add callback URL: `https://yourdomain.com`
3. Update domain to match exactly (including www or non-www)
4. Enable SANDBOX: false once domain is configured

### 3. Callback URL Configuration

The callback URL is controlled in `/contexts/pi-auth-context.tsx`:
- Default: Uses `requestParentCredentials()` (iframe mode for App Studio)
- Fallback: `window.SDKLite.init()` (production)
- For custom domain: May need manual configuration

### 4. Testing the Configuration

After applying changes:
1. Check browser console for errors (F12 → Console)
2. Look for "Failed to load Pi SDK script" or CORS errors
3. Verify domain matches Pi Developer Portal exactly
4. Check that SANDBOX: true is enabled

## Files Modified

- `/lib/system-config.ts` - SANDBOX changed to true

## Next Steps for User

1. Provide App ID from Pi Developer Portal
2. Confirm current domain/URL being tested (localhost vs production)
3. Add callback URL to Pi Developer Portal if not already registered
4. If still seeing "Security Error", check browser console for specific error message
