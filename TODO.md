# Task Steps — COMPLETED

## Modify existing Pi authentication/payment implementation

### Step 1: app/api/auth/pi/route.ts ✅
- [x] Use `process.env.PI_NETWORK_API_KEY || process.env.PI_API_KEY`
- [x] Keep API key server-side only
- [x] Add validation for Lifeline product (lifeline_revive / 0.5 Pi / "Lifeline: Revive dead asset")
- [x] Do not trust arbitrary client-provided prices

### Step 2: components/farm/lifeline-modal.tsx ✅
- [x] Change REVIVE_PI_COST from 1 to 0.5
- [x] Change product ID from "farm_revive" to "lifeline_revive"
- [x] Use exact product: productId "lifeline_revive", amount 0.5, memo "Lifeline: Revive dead asset"
- [x] Preserve assetUid + revive action metadata
- [x] Add productId/product metadata consistently

### Step 3: contexts/auth-context.tsx ✅
- [x] Keep already-fixed parentCredentials behavior (no early return)
- [x] Keep exactly ONE active Pi.authenticate() with scopes ["username", "payments"]
- [x] No SDKLite.login()
- [x] Modify onIncompletePayment to route through backend recovery instead of only console.log
- [x] Do not create second payment/auth system

### Step 4: Verify ✅
- [x] Run `npx tsc --noEmit` → EXIT=0 (no errors)
- [x] Run build (`pnpm build`) → Compiled successfully, type check passed
- [x] Search entire repo again → confirmed
- [x] One Pi.authenticate, scopes, no SDKLite.login, parentCredentials no short-circuit,
      Pi.init before createPayment, onIncompletePayment handled, Lifeline = 0.5 Pi,
      productId = "lifeline_revive", memo = "Lifeline: Revive dead asset",
      backend uses PI_NETWORK_API_KEY || PI_API_KEY, API key server-side only,
      approve/complete endpoints functional
