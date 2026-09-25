# Test / CI / Release Checklist

## Per module

- [ ] migration added
- [ ] RLS added
- [ ] seed/verify updated where needed
- [ ] validator added
- [ ] service added
- [ ] API route added
- [ ] route registered
- [ ] SDK wrapper added/exported
- [ ] portal/admin UI added
- [ ] worker task added if needed
- [ ] API tests added
- [ ] E2E smoke test added
- [ ] feature doc/runbook added
- [ ] API inventory updated
- [ ] audit prompt run and P0/P1 issues resolved

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
supabase db reset
supabase db query < supabase/verify_seed.sql
```
