# Pi Network Authentication Debugging Guide

## Problem: "App ID not Found" or "401/403 Unauthorized"

### Quick Diagnosis - Check Console (F12)

Open your browser's **Developer Tools → Console** and look for:

\`\`\`
[PiAuth] Pi.init() config: {
  appId: "YOUR-APP-ID",
  origin: "http://localhost:3000",
  sandbox: true,
  ...
}
\`\`\`

### Step 1: Verify App ID Configuration

#### Current Setup
- **Default App ID**: "pharaohs-pi-farm"
- **File**: `/lib/system-config.ts`
- **Priority** (first match wins):
  1. `window.__PI_APP_ID` (if set before app loads)
  2. `NEXT_PUBLIC_PI_APP_ID` environment variable
  3. "pharaohs-pi-farm" (hardcoded default)

#### To Update App ID

**Option A: Edit Config File (Easiest)**
\`\`\`typescript
// /lib/system-config.ts
APP_ID: "your-actual-app-id-from-developer-portal"
\`\`\`

**Option B: Environment Variable**
\`\`\`bash
NEXT_PUBLIC_PI_APP_ID=your-actual-app-id-from-developer-portal
\`\`\`

**Option C: Global Variable**
\`\`\`javascript
// Before app loads (in HTML head)
window.__PI_APP_ID = "your-actual-app-id-from-developer-portal"
\`\`\`

### Step 2: Verify Callback URL

The **origin** must match Pi Developer Portal exactly:

\`\`\`
Console Output Shows:
  origin: "http://localhost:3000"
  
Developer Portal Should Have:
  Callback URL: http://localhost:3000
\`\`\`

#### For Production
- Console shows: `origin: "https://yourdomain.com"`
- Developer Portal: `https://yourdomain.com` (exactly this)

### Step 3: Read Error Messages

When authentication fails, Console will show:

\`\`\`
[PiAuth] Full Error Debug Info: {
  appId: "pharaohs-pi-farm",
  origin: "http://localhost:3000",
  errorMessage: "App ID not found",
  ...
}

[PiAuth] ERROR LIKELY CAUSE: Invalid App ID. 
Check Developer Portal and update in system-config.ts
\`\`\`

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `App ID not found` | Wrong App ID | Update in system-config.ts |
| `Unauthorized` | Origin mismatch | Check Callback URL in Developer Portal |
| `CORS error` | Sandbox mode off | Ensure `SANDBOX: true` |
| `Login failed` | SDK not loaded | Check internet connection |

### Step 4: Enable Debug Logging

The app now logs every step:

1. **Before Init**: `[PiAuth] Pi.init() config:`
2. **After Init**: `[PiAuth] Pi.init() succeeded`
3. **Before Login**: `[PiAuth] About to call sdkInstance.login()`
4. **Login Result**: `[PiAuth] sdkInstance.login() result: true/false`
5. **On Error**: `[PiAuth] Full Error Debug Info:` + suggestions

### Step 5: Using Mock Mode

If Pi authentication fails, the game runs in Mock Mode with demo data:

\`\`\`typescript
// /lib/system-config.ts
ENABLE_MOCK_MODE: true  // Game shows with demo user

ENABLE_MOCK_MODE: false // Game only works with real Pi auth
\`\`\`

### Testing Checklist

- [ ] Open Console (F12)
- [ ] Note the `appId` value shown
- [ ] Compare to Pi Developer Portal
- [ ] Check `origin` matches Callback URL exactly
- [ ] If error, read `[PiAuth] ERROR LIKELY CAUSE:` message
- [ ] Update config and reload page
- [ ] Verify `[PiAuth] Authentication successful:` appears

### Pi Developer Portal Steps

1. Go to: https://developers.pi.computer/
2. Create or select your app
3. Copy the **App ID**
4. Set **Callback URL** to your exact origin (e.g., `http://localhost:3000`)
5. Save changes
6. Update `APP_ID` in `/lib/system-config.ts`
7. Reload your app

### Example Working Setup

\`\`\`typescript
// /lib/system-config.ts
APP_ID: "my-test-app-12345",  // From Pi Developer Portal
CALLBACK_URL: "http://localhost:3000",  // Auto-detected
SANDBOX: true,  // Development mode
ENABLE_MOCK_MODE: true,  // Fallback to demo data
\`\`\`

Console output on success:
\`\`\`
[PiAuth] Pi.init() config: { appId: "my-test-app-12345", ... }
[PiAuth] Pi.init() succeeded
[PiAuth] About to call sdkInstance.login()
[PiAuth] sdkInstance.login() result: true
[PiAuth] Authentication successful:
\`\`\`

### Still Having Issues?

1. **Open Console** and copy all `[PiAuth]` messages
2. **Check if Mock Mode** is allowing game to run
3. **Verify App ID** matches exactly (case-sensitive)
4. **Check origin** - includes protocol and port
5. **Clear cache** and reload (Ctrl+Shift+R)

For further help, provide the console output showing:
- Your current App ID value
- Your expected App ID from Developer Portal
- The full error message
