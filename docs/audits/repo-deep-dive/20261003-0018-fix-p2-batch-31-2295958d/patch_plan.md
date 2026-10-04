# Patch Plan

- Repository: `mainecybertech` @ `2295958d`
- Run: `20261003-0018-fix-p2-batch-31-2295958d`
- Audience: implementation agents. Each patch is scoped and independently reviewable.

## PATCH-001 (P0) — Make orphan cleanup folder-aware and non-destructive

- Findings: DATA-P0-001, TEST-P2-001
- Files:
  - `apps/worker/src/tasks/orphan-cleanup.ts`
  - `apps/worker/src/__tests__/orphan-cleanup.test.ts`
- Change:
  1. List per known prefix, not the bucket root. For `documents`: enumerate org ids (`organizations.id`) and list `orgs/<orgId>/`; for `avatars`: enumerate profile ids and list `<uid>/`. Fall back to a recursive object search if available.
  2. Ignore any entry whose `id` is `null` (folder placeholder); never pass a bare folder name to `storage.remove`.
  3. Assert before `remove` that every path contains a `/` (is an object key), else abort and report failure.
  4. Keep the existing fail-closed behaviour when a reference query errors.
- Tests:
  - Model `list(path)` semantics: root returns folders; nested returns files; pagination per path.
  - Fixture: `orgs/<org>/ref.pdf` + `orgs/<org>/orphan.pdf`; assert `ref.pdf` survives, only `orphan.pdf` removed, and no `remove` call ever includes a folder.
- Validation:
  - `pnpm --filter=worker test`
  - Integration against containerised Supabase Storage (if available).
- Exit: no `remove` input equals a known folder/prefix; regression test fails on the old code.

## PATCH-002 (P1) — Fail closed on PII encryption in production

- Finding: SEC-P1-001
- Files: `apps/api/src/config/env.ts`, `apps/api/src/lib/field-encryption.ts`
- Change:
  1. When `NODE_ENV==="production"`, require `FIELD_ENCRYPTION_KEY` to decode to 32 bytes, else throw at `getEnv()`.
  2. `encryptField` must throw (not return `plain:`) in production when the key is absent.
  3. Add a metric/log counter for legacy `plain:` values; do not silently rewrite.
- Tests: unit — boot prod without key throws; `encryptField` throws in prod; dev fallback unchanged.
- Validation: `pnpm --filter=api test`.

## PATCH-003 (P1) — Require Turnstile in production

- Finding: SEC-P2-002
- Files: `apps/api/src/config/env.ts`, `apps/api/src/routes/public.ts`
- Change: in `NODE_ENV==="production"`, require `TURNSTILE_SECRET_KEY`; `verifyCaptcha` returns `false` (fail closed) when called with no secret.
- Tests: unit — prod config without secret fails; `/submit` without token → 400 in prod.
- Validation: `pnpm --filter=api test`.

## PATCH-004 (P1) — Provision production environment and prove the deploy

- Finding: CI-P1-001
- Files (GitHub settings/mostly ops): `.github/workflows/deploy-do.yml` (verify), `docs/RELEASE.md` (new)
- Change:
  1. Add `prod`/`prod-approval` environment secrets/vars required by `deploy-do.yml` (Supabase, JWT, Stripe, SMTP, JSM, Redis, encryption key, Turnstile, SSH).
  2. Add required reviewers + wait timer to `prod`.
  3. Run one dry `main` deploy and record the run URL.
- Validation: `gh api repos/:owner/:repo/environments`; deploy run green.

## PATCH-005 (P2) — Fail-closed search

- Finding: API-P2-001
- Files: `apps/api/src/routes/search.ts`
- Change: if the caller is not a platform admin and `adminOrgIds.length === 0`, return empty/403; for platform admins require an explicit org or an audited all-tenants flag. Prefer `req.orgScope`.
- Tests: admin with no memberships → no rows; status-drift membership → no rows; platform admin explicit org → scoped.
- Validation: `pnpm --filter=api test`.

## PATCH-006 (P2) — Alert routing + watchdog

- Finding: OBS-P2-001
- Files: `infra/digitalocean/docker-compose.yml`, `infra/digitalocean/prometheus.yml`, `infra/digitalocean/prometheus.rules.yml`
- Change: add Alertmanager service + `alerting:` block; add a `Watchdog` always-firing alert + dead-man receiver; sensitive values via `.env`.
- Validation: synthetic breach alert delivered; watchdog heartbeat observed.

## PATCH-007 (P2) — Branch protection hardening

- Finding: CI-P2-001
- Change (GitHub settings): `enforce_admins: true`, `require_code_owner_reviews: true`, add `CodeQL`/`Validate`/`SBOM` to required checks when stable.
- Validation: `gh api` branch-protection dump; bypass merge blocked.

## PATCH-008 (P2) — Demo data seed-only

- Finding: FEAT-P2-002
- Files: `supabase/migrations/5302119…5302126_demo*.sql`
- Change: move demo content to `supabase/seeds/` (local/E2E only) or gate on an explicit `SEED_DEMO=true` env that defaults off. Add a CI assertion that a fresh migration run produces zero demo orgs.
- Validation: migrate an empty DB; assert no demo rows.

## PATCH-009 (P2) — API-key authentication or removal

- Finding: FEAT-P2-001
- Files: `apps/api/src/middleware/auth.ts` (or new `middleware/api-key.ts`), `apps/api/src/routes/api-keys.ts`
- Change: implement `mct_` bearer verification (prefix lookup → constant-time SHA-256 compare → active/expiry → attach org + permissions, update `last_used_at`), or hide the UI and document as unsupported.
- Validation: integration test with a real key; revoked/expired 401.

## PATCH-010 (P2) — Gate OpenAPI/docs and self-host Swagger

- Findings: API-P2-002, FEAT-P3-001, SUPPLY-P2-002
- Files: `apps/api/src/routes/docs.ts`, `apps/api/src/middleware/security-headers.ts`
- Change: serve Swagger assets from the API image (or exact version + SRI); pass the CSP nonce to the inline script; restrict `/docs`+`/openapi.json` to non-prod/auth.
- Validation: `/docs` initialises with no CSP violations; unauthenticated prod fetch denied.

## PATCH-011 (P2) — Health/metrics minimisation

- Findings: SEC-P2-003, API-P3-001
- Files: `apps/api/src/routes/health.ts`, `apps/api/src/app.ts`
- Change: `/health` returns only `{status}` publicly; move detail behind auth/`METRICS_TOKEN`; deny `/metrics` by default.
- Validation: public responses contain no provider names/errors; external `/metrics` 404.

## PATCH-012 (P2) — License policy and generated-artifact freshness

- Findings: SUPPLY-P2-001, INV-P2-001, HYG-P3-002
- Files: `docs/LICENSE_POLICY.md` (new), `.github/workflows/test.yml`, `licenses.json`
- Change: define an SPDX allowlist; add a `--check` regeneration step; pick one tracking policy for `licenses.json`/`sbom.cdx.json`.
- Validation: CI fails on a disallowed/untracked drift.

## PATCH-013 (P2/P3) — Hygiene batch

- Findings: HYG-P2-001, HYG-P2-002, INV-P2-002, INV-P3-002, SUPPLY-P3-002, CI-P2-002, CI-P3-001, TEST-P2-002, TEST-P3-001, DATA-P2-002, ARCH-P2-001/003, OBS-P2-002/003, OBS-P3-001, SEC-P3-001/002, DATA-P2-001
- Change: fix `review.md` path; externalize prompt corpus; reconcile catalogs; mark docs bootstrap historical; add route-stack authorization tests; ratchet coverage; chunk `.in()`; scheduled Terraform plan; promote `main`; add SLO dashboards/runbooks; constant-time M365 compare; drop deprecated header; wire `encrypted_pii` or document reserved.

## Validation commands (reference)

```
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
node scripts/verify-rls.mjs
node scripts/generate-db-types.js --check
node scripts/openapi-audit.js
node scripts/sync-review-md.mjs --check
pnpm --filter=worker test
```

## Guardrails

- Do not modify application code outside the files listed per patch without a separate review.
- Keep all migrations idempotent and paired `drop policy`/`create policy` for versions ≥ `5302427`.
- Never print secret values; use redaction in logs and PR descriptions.
