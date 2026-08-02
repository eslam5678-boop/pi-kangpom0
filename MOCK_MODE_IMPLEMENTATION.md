# Mock Mode Implementation - June 7, 2026

## Overview
تم تفعيل Mock Mode لتشغيل اللعبة ببيانات وهمية عند فشل الاتصال بـ Pi Network SDK.

## Configuration

### Enable/Disable Mock Mode
في `/lib/system-config.ts`:
\`\`\`typescript
ENABLE_MOCK_MODE: true, // تعيين على false لتعطيل وضع المحاكاة
\`\`\`

## How It Works

### 1. Fallback on SDK Error
عند فشل تحميل Pi SDK أو المصادقة:
\`\`\`typescript
// /contexts/pi-auth-context.tsx - catch block
if (PI_NETWORK_CONFIG.ENABLE_MOCK_MODE) {
  console.warn("[PiAuth] Enabling Mock Mode - game will run with demo data");
  setIsAuthenticated(true);
  setUser({
    username: "Demo User",
    id: "mock-user-demo",
  });
  // لا تضبط hasError - تسمح للعبة بالعمل
}
\`\`\`

### 2. Demo Data
- **User**: "Demo User" (معرّف: mock-user-demo)
- **State**: بيانات seed state افتراضية من `seedState()`
- **Game Mode**: وضع المحاكاة (بدون اتصال فعلي بـ Pi)

### 3. Console Logs
عند تفعيل Mock Mode ستشاهد:
\`\`\`javascript
[PiAuth] Enabling Mock Mode - game will run with demo data
\`\`\`

## Debug Info

للتحقق من الإعدادات الحالية، في Console:
\`\`\`javascript
// App ID
console.log(window.__PI_APP_ID || "pharaohs-pi-farm");

// Callback URL
console.log(window.location.origin);

// Mock Mode Status
console.log("Mock Mode: enabled/disabled");
\`\`\`

## Production Setup

للإنتاج (إيقاف Mock Mode):
1. سجل App ID الفعلي في Pi Developer Portal
2. غير `ENABLE_MOCK_MODE: false` في system-config.ts
3. تحديث Callback URL مع Domain الفعلي

## Test Flow

1. افتح التطبيق → يحاول الاتصال بـ Pi SDK
2. إذا فشل → Active Mock Mode → عرض اللعبة ببيانات وهمية
3. إذا نجح → اتصال فعلي بـ Pi Network

## Files Modified
- `/lib/system-config.ts` - Added `ENABLE_MOCK_MODE` flag
- `/contexts/pi-auth-context.tsx` - Added Mock Mode fallback in catch block
