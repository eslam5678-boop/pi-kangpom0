# TODO - CSP Fix for Next.js on Vercel (Pi Kingdom Farm)

## Problem
Strict `script-src` in production CSP blocks Next.js inline runtime scripts and eval → browser console errors like:
- "Executing inline script violates the following Content Security Policy directive..."
- "Uncaught Error: Connection closed"

## Steps
- [x] Create this TODO.md tracking file
- [x] Rewrite `middleware.ts`:
  - Always include `'unsafe-inline'` and `'unsafe-eval'` in `script-src` (dev + production)
  - Keep `'self'`, `https://*.pi.network`, `https://*.vercel.app`
  - Expand `connect-src` with `https://sdk.minepi.com`, `https://api.minepi.com`, `https://pi-apps.github.io`, `wss:`
  - Add `font-src` and `frame-src` for completeness
- [x] Rewrite `vercel.json`:
  - Match CSP with `script-src` including `'unsafe-inline'` / `'unsafe-eval'`
  - Keep Pi Network / Vercel domains
  - Remove deprecated/conflicting `X-Frame-Options: ALLOW-FROM` (frame-ancestors handles it)
- [ ] Rebuild with `next build` and deploy to Vercel
- [ ] Verify: hard-refresh browser, confirm no CSP violations in console

