# Pi Network Payment Fix — Task List

## Goal
Implement real `Pi.createPayment` with proper standard callbacks so the Pi Wallet window opens in Pi Browser and processes a real Test-Pi transaction.

## Steps
- [x] 1. Disable mock/dev modes in `app-wrapper.tsx`, `auth-context.tsx`, `system-config.ts`
- [x] 2. Create direct Pi payment service `lib/pi-direct-payment.ts` with `Pi.createPayment` + callbacks
- [x] 3. Update `payment-button.tsx` to use direct Pi payment with correct product price
- [x] 4. Update `land-bureau.tsx` to pass actual `costPi` per tier
- [x] 5. Update `lifeline-modal.tsx` to pass `REVIVE_PI_COST`
- [x] 6. Update `marketplace.tsx` to pass service `pricePi`
- [x] 7. Verify API routes & CSP config
- [ ] 8. Build + test
