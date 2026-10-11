# Release Gate

In-repo release-readiness gate, aligned with the **repo-deep-dive** audit run
`mainecybertech-20261011-0426-full-main-8d299b8` (target `main` @ `8d299b8`,
2026-10-11). The run's published gate records an advisory **NO-GO**:
[`audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/RELEASE_GATE.md`](audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/RELEASE_GATE.md).

This revision supersedes the previous gate, which was bound to run
`20261003-0018-fix-p2-batch-31` at commit `2295958d` (branch `fix/p2-batch-31`).
That commit is no longer reachable from `main` or `develop`, so the old binding
could not be verified. Nothing previously closed is reopened here: statuses are
carried from the 2026-10-11 register, and a row only moves backwards where that
register records a residual (e.g. `EXEC-P1-001`).

**Status source:** the run's reconciled register
([`audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/risk_register.md`](audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/risk_register.md),
reconciled at `fb9f16ce`, 2026-10-11). Where this document and the register
disagree, the register wins — re-read this file after each reconciliation so a
stale status cannot outlive it.

**Gate owner:** release owner (ops/release). **Review by:** before the first
`main` → prod deploy, and after every audit re-run.

This repository has **no production environment yet**. The items below are
therefore **pre-go-live blockers**, not production regressions: they must be
resolved (or explicitly accepted by an owner) before the first `main` → prod
deploy. See [`RELEASING.md`](RELEASING.md) for the branch model and deploy path.

## Verdict rules

| Verdict | Rule |
| --- | --- |
| **GO** | No P0/P1 finding is open or partially fixed, and every release-blocking exit criterion below is green with a dated artifact at the deployed commit. |
| **GO WITH CONDITIONS** | Only P2/P3 findings remain open, and every exit criterion is green or explicitly owner-accepted with a recorded decision. |
| **NO-GO** | Any P0/P1 finding is open or partially fixed, or any exit criterion lacks an artifact. |

The 2026-10-11 run records **NO-GO** (advisory): P0 ×8, P1 ×89, with
`DR-P0-001` partially fixed (the repo-side dispatcher is fixed; the operator
backup secrets are still unprovisioned) and `IR-P0-003` (dead-man's switch
configured but not exercised) partially fixed.

> Status is deliberately recorded as *decision / owner / evidence required*,
> not as "fixed". A finding may only be treated as closed with an artifact
> captured at the deployed commit (a green CI run, test output, or an operator
> action recorded in GitHub). Assertions and intentions do not close findings.

## Consolidated findings → exit conditions

| Final finding | Title | Status at `8d299b8` | Exit condition (all must hold) | Owner |
| --- | --- | --- | --- | --- |
| `FINAL-P1-001` | P0 data-loss path and unverified "fixed" claim block a clean release | `verified-fixed` (code); `EXEC-P1-001` `partially-fixed` (closure artifact) | Orphan cleanup lists per known prefix and reconciles full paths; any entry with a null `id` is treated as a folder and never passed to `storage.remove`; a pre-remove guard rejects any non-object key; a regression test models Supabase `list(path)` semantics and fails on the pre-fix code. Code + tests are present at `8d299b8` (`DATA-P0-001` verified-fixed); remaining: record the deployed-commit (or, until the first prod deploy exists, an equivalent staging/CI) regression artifact, or owner-accept the code-level tests (`EXEC-P1-001`). | worker/data + release |
| `FINAL-P2-001` | Governance and observability gaps mean the platform cannot yet detect or control production failure | `partially-fixed` | `prod`/`prod-approval` provisioned with secrets/vars + required reviewers; one dry `main` deploy green; alert routing wired and a synthetic alert delivered; a dated green `db-restore-test` with row assertions; a documented single-host SPOF/backup plan. Routing is now wired (`OBS-P2-001` verified-fixed; Alertmanager → ntfy); still missing: reviewer configuration (`CI-P1-001`), a synthetic delivery and a missed-heartbeat drill (`OBS-P2-014`), and any successful restore run (`DR-P0-001`; the `DR-P1-001` baseline-loader bug is fixed). | ops/release |
| `FINAL-P2-002` | Residual authorization/secret defaults need explicit decisions | `partially-fixed` | Each fail-open default is either made to fail closed in production or explicitly owner-accepted with a recorded decision (see register below). All five controls are now fail-closed in code; the decision record itself is still stale (`EXEC-P2-001`) and `API-P2-001` remains open. | security/API |
| `FINAL-P2-004` | Release-gate artifacts contradict the reconciled register | `open` | The run's published gate/summary/index carry the reconciled NO-GO verdict on `develop`, and this document is rebound to a resolvable commit (done here). Remaining: a guard asserting `manifest.releaseGate == gate verdict` and that the gate commit resolves from `main`. | audit owner + release |

## Release-blocking exit criteria

A prod release is blocked until every row below is green or owner-accepted.

| # | Criterion | Status at `8d299b8` |
| --- | --- | --- |
| 1 | `DATA-P0-001` — orphan cleanup cannot delete folders/prefixes; regression test present. Closure artifact at the deployed commit (`EXEC-P1-001`). | code + tests `verified-fixed`; artifact missing → `partially-fixed` |
| 2 | `SEC-P1-002` — production refuses to boot without a valid 32-byte `FIELD_ENCRYPTION_KEY`; no new `plain:` writes in prod. Residual: `SEC-P2-002` plaintext profile columns remain the source of truth and are still returned. | `verified-fixed` (fail-closed boot); coverage residual open |
| 3 | `SEC-P2-013` — production requires `TURNSTILE_SECRET_KEY`; `/public/submit` fails closed without a verified token. | `verified-fixed` |
| 4 | `CI-P1-001` / `CI-P1-003` — `prod` and `prod-approval` have the required secrets/vars and required reviewers; one dry `main` deploy is green. | `still-open` (operator action) |
| 5 | `OBS-P2-001` — Alertmanager is wired to a receiver and a synthetic alert is delivered. Residual: `IR-P0-003` external watchdog URL unset + no missed-heartbeat drill. | routing `verified-fixed` (ntfy); exercise/URL outstanding |
| 6 | `OBS-P2-003` — a dated `db-restore-test` run is green with row assertions. `DR-P1-001` (baseline loader) is `verified-fixed`; still blocked by `DR-P0-001`'s operator residual (backup secrets unprovisioned) until a dated green run exists. | `partially-fixed` |
| 7 | `BP-P1-002` / `CI-P1-002` — branch protection sets `enforce_admins: true` and requires CODEOWNERS review, with matching required checks. | `verified-fixed` in code; live application is a repo-admin action |

## Fail-closed decisions register (`FINAL-P2-002`)

Each default below was flagged as failing open/dead. The code-side fail-closed
work is done; the *decision record* is the remaining artifact (`EXEC-P2-001`).

| Control | Default today | Required decision | Enforcement point | Status |
| --- | --- | --- | --- | --- |
| PII field encryption | `SEC-P1-002`: prod boot requires a valid 32-byte key and `encryptField` fails closed. Residual `SEC-P2-002`: plaintext profile columns remain the source of truth and are still returned | Decide whether to stop returning/storing plaintext profile columns or owner-accept the additive design | `apps/api/src/config/env.ts`, `apps/api/src/lib/field-encryption.ts` | `fixed-in-code`; coverage decision open |
| CAPTCHA / Turnstile | `SEC-P2-013`: prod requires `TURNSTILE_SECRET_KEY`; `/public/submit` fails closed | none (done) | `apps/api/src/routes/public.ts`, `apps/api/src/config/env.ts` | `fixed-in-code` |
| Search scoping | `API-P2-006` / `MT-P2-001`: queries scope to `req.orgScope` and substitute `["__none__"]` on an empty scope | none (done) | `apps/api/src/routes/search.ts` | `fixed-in-code` |
| API keys | `FEAT-P2-001` / `SEC-P2-018`: `mct_` keys authenticate again | none (done); optional residual `ACM-P2-005` (expiry pruning) | `apps/api/src/middleware/api-key.ts`, `apps/api/src/middleware/auth.ts` | `fixed-in-code` |
| Demo/test data | `FEAT-P2-002`: demo migrations gate on `app.seed_demo`, default off | none (done) | `supabase/migrations/*_demo*.sql` | `fixed-in-code` |

## Pre-go-live operator checklist (`FINAL-P2-001`)

These are GitHub/operator actions, not (only) code. Each needs a recorded
artifact.

- [ ] **Provision `prod`** environment secrets and variables (`SUPABASE_*`,
      `JWT_SECRET`, `DROPLET_IP`, Stripe/SMTP/JSM/Redis, encryption key,
      Turnstile, SSH). Evidence: `gh api repos/:owner/:repo/environments`.
      Owner: ops.
- [ ] **Required reviewers** on `prod` and `prod-approval` (1+ each). Evidence:
      `gh api` or a settings capture. Gate does not work until set. Owner: ops.
- [ ] **Dry `main` deploy** green (build → validate → SSH → health gate).
      Evidence: run URL. Owner: release.
- [ ] **Alert routing**: Alertmanager → ntfy delivery is wired; record a
      synthetic alert landing in `portal-alerts`. Then provision
      `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` and record the missed-heartbeat drill
      (`docker compose stop alertmanager` → external page). Owner: infra.
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
