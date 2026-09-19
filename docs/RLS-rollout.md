# RLS Rollout Runbook (`getScopedClient` allow-list)

The API's tenant isolation does **not** currently rely on Postgres RLS for most
requests: `getScopedClient(req, moduleKey, kind)` returns the **service-role**
client unless the module is explicitly listed in `RLS_READS_ENABLED` /
`RLS_WRITES_ENABLED` (see `apps/api/src/services/supabase.ts:164`). When a
module is listed **and** the request carries a user JWT (`req.userJwt`), the
caller gets a **user-scoped** client and Postgres RLS is enforced.

This is a deliberate, reversible, per-module migration so RLS can be switched
on one leaf module at a time without a big-bang change.

## How the flag works

- `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED` are comma-separated module keys,
  e.g. `satisfaction-pulse,findings`.
- `kind: "read"` consults `RLS_READS_ENABLED`; `kind: "write"` consults
  `RLS_WRITES_ENABLED` (independent).
- Empty/unset → every call returns the service-role client (current default).
- The flag values are injected into the API container `.env` by
  `deploy-do.yml` from the `RLS_READS_ENABLED` / `RLS_WRITES_ENABLED` GitHub
  **secrets** (per environment `dev` / `prod`).
- Covered by `apps/api/src/__tests__/get-scoped-client.test.ts`.

## Preconditions before enabling a module

1. **Complete RLS policies.** Every table the module touches must have
   `ENABLE ROW LEVEL SECURITY` and approved-aware policies. Prefer the
   `public.is_org_member(organization_id)` helper (which filters
   `status = 'approved'`) — see `supabase/migrations/5302112_*.sql` for the
   pattern and `docs/RLS-coverage-matrix.md` for current coverage. Avoid raw
   `organization_id in (select organization_id from memberships where
user_id = auth.uid())` (no status filter).
2. **No cross-tenant service-role need for regular members.** A user-scoped
   client cannot read another tenant's rows. This is handled for **platform
   admins**: `getScopedClient` keeps the service-role client when
   `req.orgScope.platformAdmin` is set (org switcher / impersonation), so
   admin cross-tenant access is unaffected — their access is already audited
   by `requireOrgAccess`. Only regular (non-admin) members are switched to the
   RLS client.
3. **No anonymous access.** The scoped client is only chosen when
   `req.userJwt` is set, so public routes are unaffected.

## Enable a module (dev first)

1. Pick a leaf module and confirm its read/write routes use
   `getScopedClient(req, "<moduleKey>", ...)`.
2. Set the GitHub secret for the **dev** environment (append, don't replace,
   the existing keys):
   ```bash
   gh secret set RLS_READS_ENABLED  --env dev --body "satisfaction-pulse"
   gh secret set RLS_WRITES_ENABLED --env dev --body "satisfaction-pulse"
   ```
   (Retain any existing keys in the comma-separated list.)
3. Redeploy dev (`gh workflow run deploy-do.yml --ref develop`) so the API
   container picks up the new `.env`.
4. Validate (see below). Only then repeat for the other environment.

## Validation checklist

- As an **approved member** of org A: list/read/create/update the module's
  records in org A → all succeed.
- As an approved member of org B (or a user with no membership in A): the
  same org-A ids → **no rows / 403** (RLS denies). This is the key assertion.
- A **pending/suspended** member of A → denied.
- A **platform admin** using the org switcher → still works (or is explicitly
  allowed to fall back to the service-role path).
- Watch API logs for `DB_ERROR` / empty-result regressions on the module.

## Rollback

Remove the module key from the secret and redeploy. The allow-list is empty by
default, so reverting restores the service-role behavior immediately — no code
change or migration required.
