# Pi Payments Scope Fix — Task List

## Goal
Fix "Cannot create a payment without 'payments' scope" by ensuring `Pi.authenticate()` requests the `'payments'` scope during authentication.

## Steps
- [x] 1. Update `contexts/auth-context.tsx` console.log to show `["username", "payments"]` scopes
- [x] 2. Update `contexts/auth-context.tsx` `piInstance.authenticate()` call to pass `["username", "payments"]`
- [x] 3. Verify no other `Pi.authenticate` calls need the `payments` scope
- [ ] 4. Build + test
