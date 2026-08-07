# TODO: Pi SDK Payment Fix + Logout Button (inside app/page.tsx only)

## Steps
- [x] 1. Add imports: `usePiAuth` (auth-context) + `getPiUid` (pi-direct-payment)
- [x] 2. Add `logout` from `usePiAuth()` inside component
- [x] 3. Add safe `window.Pi.init({ version: "2.0", sandbox: false })` useEffect
- [x] 4. Add `handlePiPayment()` invoking `Pi.createPayment()` with all callbacks (approve/complete/cancel/error via /api/auth/pi)
- [x] 5. Add "logout" translation keys + render Logout button in header wired to `logout()`
- [x] 6. Wire purchase actions (land "استحواذ", BashaRescueModal onRescueWithPi, Pi-priced tile placement) to `handlePiPayment`
- [x] 7. Build + verify no TS errors

## Constraints
- Modify ONLY app/page.tsx in-place
- Do not delete/shorten/replace existing game code, UI, or state logic

