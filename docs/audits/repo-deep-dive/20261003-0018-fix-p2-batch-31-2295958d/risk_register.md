# Risk Register

- Repository: `mainecybertech` @ `2295958d`
- Run: `20261003-0018-fix-p2-batch-31-2295958d`
- Total findings: 44 (P0 1, P1 3, P2 26, P3 14)

## Consolidated Top Risks

| ID | Finding | Sev | Area | Likelihood | Impact | Evidence | Mitigation | Owner | Window |
|---|---|---|---|---|---|---|---|---|---|
| R1 | Orphan cleanup can recursively delete documents/avatars | P0 | DATA | Medium | Catastrophic data loss | DATA-P0-001 | Folder-aware listing; reject folder entries; regression test | worker/data | immediate |
| R2 | PII encryption falls back to reversible plaintext | P1 | SEC | Medium | Breach/compliance | SEC-P1-001 | Require 32-byte key in prod; fail closed | security/API | this week |
| R3 | Production deploy path not runnable/protected | P1 | CI | High | Go-live blocked | CI-P1-001 | Provision `prod` env + reviewers + dry deploy | ops/release | this week |
| R4 | Prometheus alerts not routed | P2 | OBS | High | Long MTTR | OBS-P2-001 | Alertmanager + `alerting:` + watchdog | infra | this week |
| R5 | Search fail-open cross-tenant query | P2 | API | Low | Tenant leak | API-P2-001 | Fail closed when no org scope | API | this week |
| R6 | Demo data/weak creds can seed prod | P2 | FEAT | Medium | Account compromise | FEAT-P2-002 | Move to seeds / explicit flag | data | this month |
| R7 | Route authz regressions not caught by tests | P2 | TEST | Medium | Tenant leak | TEST-P2-002 | Router-stack authorization tests | API QA | this month |
| R8 | Branch protection bypass / CODEOWNERS ignored | P2 | CI | Medium | Unsafe merge | CI-P2-001 | `enforce_admins`, require owners + CodeQL | repo admin | this week |
| R9 | API keys cannot authenticate | P2 | FEAT | High | Failed integrations | FEAT-P2-001 | Implement auth or hide | API | this month |
| R10 | Single-host SPOF (Redis+all services) | P2 | ARCH | Medium | Full outage | ARCH-P2-001 | Managed Redis, 2nd replica, snapshots | infra | later |
| R11 | Backups/restore not verified | P2 | OBS | Medium | Data loss | OBS-P2-003 | Restore drill with evidence | ops | this week |
| R12 | Public OpenAPI/metrics surface | P2/P3 | API | High | Recon | API-P2-002, API-P3-001 | Gate docs; deny metrics by default | API | this month |
| R13 | License policy absent; licenses.json unverified | P2 | SUPPLY | Medium | Legal | SUPPLY-P2-001 | Policy + CI check | DevEx | this month |
| R14 | Repo bloat + diverged catalogs | P2 | HYG | High | Review errors | HYG-P2-001/002 | Externalize packs; canonicalize catalog | DevEx | this month |

## Full Finding Index

| Finding ID | Sev | Area | Title |
|---|---|---|---|
| INV-P2-001 | P2 | INV | Committed generated artifacts drift without a gate |
| INV-P2-002 | P2 | INV | Duplicate schema bootstrap SQL |
| INV-P3-001 | P3 | INV | Large committed prompt/audit corpus |
| INV-P3-002 | P3 | INV | Stale machine-specific repo path |
| ARCH-P2-001 | P2 | ARCH | Single-droplet SPOF |
| ARCH-P2-002 | P2 | ARCH | Service-role default (RLS bypass) |
| ARCH-P2-003 | P2 | ARCH | Prometheus rules not routed |
| ARCH-P3-001 | P3 | ARCH | Web middleware unverified JWT exp |
| FEAT-P2-001 | P2 | FEAT | API keys cannot authenticate |
| FEAT-P2-002 | P2 | FEAT | Demo data in prod migration path |
| FEAT-P3-001 | P3 | FEAT | Public OpenAPI + CSP-blocked Swagger |
| SEC-P1-001 | P1 | SEC | PII encryption plaintext fallback |
| SEC-P2-002 | P2 | SEC | CAPTCHA bypass when unset |
| SEC-P2-003 | P2 | SEC | `/health` info disclosure |
| SEC-P3-001 | P3 | SEC | Deprecated header / broad CSP style |
| SEC-P3-002 | P3 | SEC | M365 clientState non-constant-time |
| DATA-P0-001 | P0 | DATA | Orphan cleanup recursive bucket delete |
| DATA-P2-001 | P2 | DATA | Generated schema/feature drift (`encrypted_pii`) |
| DATA-P2-002 | P2 | DATA | Unbounded `.in()` reference query |
| API-P2-001 | P2 | API | Search unscoped fall-through |
| API-P2-002 | P2 | API | Public OpenAPI / CSP-blocked UI |
| API-P3-001 | P3 | API | `/metrics` public without token |
| TEST-P2-001 | P2 | TEST | Orphan-cleanup test models list wrong |
| TEST-P2-002 | P2 | TEST | Route suites stub authz middleware |
| TEST-P3-001 | P3 | TEST | Low coverage thresholds / E2E unproven on main |
| CI-P1-001 | P1 | CI | Prod deploy path not runnable/protected |
| CI-P2-001 | P2 | CI | Branch protection bypass/CODEOWNERS |
| CI-P2-002 | P2 | CI | Terraform apply manual, no drift detection |
| CI-P3-001 | P3 | CI | `main` behind `develop`; scheduled jobs stale |
| SUPPLY-P2-001 | P2 | SUPPLY | `licenses.json` unenforced/unverified |
| SUPPLY-P2-002 | P2 | SUPPLY | Unpinned Swagger script without SRI |
| SUPPLY-P3-001 | P3 | SUPPLY | SBOM not release-bound |
| SUPPLY-P3-002 | P3 | SUPPLY | Untracked secrets file on disk |
| OBS-P2-001 | P2 | OBS | Alerts not routed |
| OBS-P2-002 | P2 | OBS | No dashboards/SLOs |
| OBS-P2-003 | P2 | OBS | Backups not verified |
| OBS-P3-001 | P3 | OBS | Partial incident runbooks/tabletop |
| HYG-P2-001 | P2 | HYG | Prompt/audit corpus bloat |
| HYG-P2-002 | P2 | HYG | Diverged duplicate catalogs |
| HYG-P3-001 | P3 | HYG | Stale generated docs |
| HYG-P3-002 | P3 | HYG | Inconsistent generated-artifact tracking |
| FINAL-P1-001 | P1 | FINAL | P0 data-loss path + unverified fixed claim |
| FINAL-P2-001 | P2 | FINAL | Governance/observability gaps block operation |
| FINAL-P2-002 | P2 | FINAL | Fail-open authorization/secret defaults |

## Notes

- `unknown`/`unverified`: live environment state (prod secrets, hosted DB demo rows, whether `orphanCleanup` is scheduled) could not be observed in this read-only, offline run.
- Prior findings recorded as `verified-fixed` (static): `public_interactions` RLS re-enable and anon grant revocation (`5302129`, `5302434`).
- `/api/v1/metrics` numeric finding counts are reproducible from the `### Finding ID:` lines in each report.
