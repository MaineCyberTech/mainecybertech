# Release Gate

In-repo release-readiness gate for the **repo-deep-dive** audit run
`20261003-0018-fix-p2-batch-31-2295958d` (branch `fix/p2-batch-31`, commit
`2295958d`). It consolidates the run's final-register findings into explicit
exit criteria, owners, and operator actions.

This repository has **no production environment yet**. The items below are
therefore **pre-go-live blockers**, not production regressions: they must be
resolved (or explicitly accepted by an owner) before the first `main` → prod
deploy. See [`RELEASING.md`](RELEASING.md) for the branch model and deploy path.

> Status is deliberately recorded as *decision / owner / evidence required*,
> not as "fixed". A finding may only be treated as closed with an artifact
> captured at the deployed commit (a green CI run, test output, or an operator
> action recorded in GitHub). Assertions and intentions do not close findings.

## Consolidated findings → exit conditions

| Final finding | Title | Underlying findings | Exit condition (all must hold) | Owner |
| --- | --- | --- | --- | --- |
| `FINAL-P1-001` | P0 data-loss path and unverified "fixed" claim block a clean release | `DATA-P0-001`, `TEST-P2-001` | Orphan cleanup lists per known prefix and reconciles full paths; any entry with a null `id` is treated as a folder and never passed to `storage.remove`; a pre-remove guard rejects any non-object key; a regression test models Supabase `list(path)` semantics and fails on the pre-fix code. | worker/data |
| `FINAL-P2-001` | Governance and observability gaps mean the platform cannot yet detect or control production failure | `CI-P1-001`, `CI-P2-001`, `OBS-P2-001`, `OBS-P2-003`, `ARCH-P2-001` | `prod` environment provisioned with secrets/vars + required reviewers; one dry `main` deploy green; alert routing wired and a synthetic alert delivered; a dated green `db-restore-test` with row assertions; a documented single-host SPOF/backup plan. | ops/release |
| `FINAL-P2-002` | Residual authorization/secret defaults need explicit decisions | `SEC-P1-001`, `SEC-P2-002`, `API-P2-001`, `FEAT-P2-001`, `FEAT-P2-002` | Each fail-open default is either made to fail closed in production or explicitly owner-accepted with a recorded decision (see register below). | security/API |

### Release-blocking exit criteria

A prod release is blocked until every row below is green or owner-accepted.

1. `DATA-P0-001` — orphan cleanup cannot delete folders/prefixes; regression test at the deployed commit. (`TEST-P2-001`)
2. `SEC-P1-001` — production refuses to boot without a valid 32-byte `FIELD_ENCRYPTION_KEY`; no new `plain:` writes in prod.
3. `SEC-P2-002` — production requires `TURNSTILE_SECRET_KEY`; `/public/submit` fails closed without a verified token.
4. `CI-P1-001` — `prod` environment has the required secrets/vars and required reviewers; one dry `main` deploy is green.
5. `OBS-P2-001` — Alertmanager is wired to a receiver and a synthetic alert is delivered.
6. `OBS-P2-003` — a dated `db-restore-test` run is green with row assertions.
7. `CI-P2-001` — branch protection sets `enforce_admins: true` and requires CODEOWNERS review.

## Fail-closed decisions register (`FINAL-P2-002`)

Each default below currently fails open / dead. Recorded decision = make it fail
closed in production unless an owner explicitly accepts it otherwise.

| Control | Default today | Required decision | Enforcement point | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| PII field encryption | `FIELD_ENCRYPTION_KEY` is optional; `encryptField` returns reversible `` `plain:` `` when the key is absent/short | Prod boot must require a valid 32-byte key; `encryptField` must throw in prod rather than write `plain:`; emit a metric for legacy plaintext rows | `apps/api/src/config/env.ts`, `apps/api/src/lib/field-encryption.ts` | security/API | open |
| CAPTCHA / Turnstile | `verifyCaptcha` returns `true` when `TURNSTILE_SECRET_KEY` is unset | Prod must require the secret and fail closed (400/503) when a token is missing or unverifiable | `apps/api/src/routes/public.ts`, `apps/api/src/config/env.ts` | API | open |
| Search scoping | Unscoped fallthrough for callers with no admin org scope | Fail closed (empty/403) when no org scope; all-tenant search only for a platform admin with an explicit, audited flag | `apps/api/src/routes/search.ts` | API | open |
| API keys | `mct_` keys cannot authenticate — the feature is dead | Either implement prefix lookup + constant-time hash compare + active/expiry checks, or hide the UI and document the feature as unsupported | `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/api-keys.ts` | API | open |
| Demo/test data | Demo content ships as migrations, so a fresh prod DB can receive demo rows | Move demo content to `supabase/seeds/` (local/E2E only) or gate on `SEED_DEMO` default-off; add a CI assertion that a fresh migrate yields zero demo orgs | `supabase/migrations/5302119…5302126_demo*.sql`, `supabase/seeds/` | data | open |

## Pre-go-live operator checklist (`FINAL-P2-001`)

These are GitHub/operator actions, not (only) code. Each needs a recorded
artifact.

- [ ] **Provision `prod`** environment secrets and variables (`SUPABASE_*`,
      `JWT_SECRET`, `DROPLET_IP`, Stripe/SMTP/JSM/Redis, encryption key,
      Turnstile, SSH). Evidence: `gh api repos/:owner/:repo/environments`.
      Owner: ops.
- [ ] **Required reviewers** on `prod-approval` (1+). Evidence: `gh api` or a
      settings capture. Gate does not work until set. Owner: ops.
- [ ] **Dry `main` deploy** green (build → validate → SSH → health gate).
      Evidence: run URL. Owner: release.
- [ ] **Alert routing**: Alertmanager receiver + `Watchdog` dead-man heartbeat
      observed. Evidence: synthetic alert delivery. Owner: infra.
- [ ] **Backup restore drill**: dated green `db-restore-test` with row
      assertions; ordinary `db-backup` runs succeeding from the default branch.
      Evidence: run URL. Owner: infra.
- [ ] **SPOF / backup plan**: confirm documented recovery path and target
      RTO/RPO for the single-droplet topology.
      See [`runbooks/backup-disaster-recovery.md`](runbooks/backup-disaster-recovery.md),
      [`RTO_RPO.md`](RTO_RPO.md). Owner: ops.

## Severity model and status vocabulary

- Severity: `P0` immediate, `P1` this week, `P2` this month, `P3` this quarter.
- Finding status: `open`, `partially-fixed`, `verified-fixed`, `still-open`,
  `regressed`, `owner-accepted`. `verified-fixed` requires an artifact at the
  deployed commit (see the shared audit rules).

## References

- [`RELEASING.md`](RELEASING.md) — branch model, quality gates, promotion, rollback.
- [`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) — alerting and dashboards.
- [`GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md) — required secrets/vars.
- [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) — rotation procedures.
- [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) — automated and manual rollback.
- [`runbooks/backup-disaster-recovery.md`](runbooks/backup-disaster-recovery.md) — restore runbook.
