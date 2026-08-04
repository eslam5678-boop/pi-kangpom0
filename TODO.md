# Pi Payment Fix — Task List

## Goal
Remove all mock/fake payment `alert()` popups and ensure every Pi payment goes through the real `Pi.createPayment` flow (with proper server-approval/completion via `/api/auth/pi`), so the Pi Wallet window opens in Pi Browser.

## Steps
- [x] 1. Fix `components/LandRentalSystem.tsx` — replace mock `alert()` farm rent with real `payWithPi()` for the 5 Pi (and other tier) land contracts + loading/error states
- [ ] 2. Fix `components/MarketplaceArchitecture.tsx` — replace mock `alert()` P2P escrow with real `payWithPi()` (REVERTED by user — leave as-is)
- [x] 3. Fix `app/page.tsx` — replace mock `alert()` in Basha rescue `onRescueWithPi` with real `payWithPi()`
- [x] 4. Verify `lib/pi-direct-payment.ts` wiring (`Pi.createPayment` + 4 standard callbacks + `/api/auth/pi` approve/complete)
- [ ] 5. Build + deploy + test a real Test-Pi transaction (requires `PI_API_KEY` on Vercel)

## Done
- [x] Confirmed `system-config.ts` has `ENABLE_MOCK_MODE: false`
- [x] Confirmed `app-wrapper.tsx` has `ENABLE_DEV_MODE: false`
- [x] Confirmed API route `app/api/auth/pi/route.ts` implements `approve`/`complete`

