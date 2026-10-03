# Roadmap — repo-deep-dive run `20261002-0344-develop-6286137`

Companion to `risk_register.md` (269 findings) and `patch_plan.md` (patch sets PS-001…PS-015). This roadmap sequences the remediation work into 7/30/60/90-day windows and maps every item to the patch set(s) that close it.

- Repository: `C:/temp/mainecybertech`
- Branch: `develop` · Commit: `62861370`
- Generated: 2026-10-02
- Area code: `FINAL`

## Executive framing

The platform is functionally rich — RBAC is applied at ~240 sites, containers are hardened, secrets are handled carefully in most paths, and CI has a broad workflow set. But the audit found that **two of the platform's most important safety nets are configured but not actually exercised**: automated database backups do not run (their workflows are absent from `main`) and the weekly restore test cannot fail. Five P0 findings are release-blocking: those two, plus the total absence of an incident-response plan, a data-breach process, and any independent watchdog that survives loss of the monitoring stack.

The remediation is deliberately staged so that the **P0-only immediate set (PS-001, PS-002) has no dependencies** and can ship today, followed by the P1 security/governance cluster this week, and hardening (RLS, supply chain, observability, docs) over the following months.

### Strengths to preserve

- Permission middleware applied broadly (`requirePermission` at ~240 sites, 40+ routers).
- Container hardening (non-root, capability drops) and SHA-pinned GitHub Actions.
- Trivy/audit/CodeQL scanning present; secret handling generally via `env:` + `chmod 600`.
- A concrete backup/restore drill plan (`backup_restore_drill_plan.md`, drills D1–D7) and tabletop scenarios already authored.
- Extensive documentation and an audit harness with machine-checkable finding IDs.

## Phase 1 — Immediate / release blocking (7 days)

**Goal:** make recovery and response real, and stop shipping with no independent failure signal. These are the P0s and the tightest P1s.

| # | Item | Findings | Patch set | Owner | Effort |
|---|---|---|---|---|---|
| 1 | Make backup/restore workflows reachable from `main` (merge or `workflow_dispatch` dispatcher) and capture a green scheduled run | DR-P0-001 | PS-001 | platform/ops | S–M |
| 2 | Make the restore test assert integrity: remove `\|\| true`, assert baseline table/migration counts and ≥2 critical tables, add tenant-isolation check, pin image | DR-P0-002, CI-P2-002, IR-P1-004, RES-P2-006 (C-02) | PS-001 | platform/backend | S |
| 3 | Write `docs/INCIDENT_RESPONSE.md` (SEV1–5, roles, comms, postmortem) and `docs/templates/POSTMORTEM.md` | IR-P0-001 | PS-002 | platform lead / security | M |
| 4 | Write `docs/DATA_BREACH_RESPONSE.md` (detect → contain → assess → notify → disclose) + breach register | IR-P0-002 | PS-002 | security/legal | M |
| 5 | Stand up an out-of-band dead-man's switch: Alertmanager + ≥1 external receiver (Watchdog rule routed), external HTTP probe off the droplet | IR-P0-003, INFRA-P2-003, RES-P2-005 (C-18) | PS-008 | platform/infra | M |
| 6 | Add `requirePermission` to onboarding mutations and governance `submit` | ACM-P1-001, SEC-P2-001, API-P2-001, CHAIN-P2-003 (C-01) | PS-003 | API platform | S |
| 7 | Use `APP_BASE_URL` (not `Origin`) for the password-reset redirect | CHAIN-P1-002, SEC-P2-003 (C-14) | PS-004 | API team | S |
| 8 | Worker `unhandledRejection` handler + abortable external fetches | NOTIF-P2-003, RES-P2-001, RES-P2-004 (C-07) | PS-005 | platform/backend | S |
| 9 | M365 secret truth: write `M365_CLIENT_STATE` in deploy, delete `M365_WEBHOOK_SECRET` dead config | SECRET-P1-001, WH-P1-002 (C-06) | PS-006 | platform/security | S |
| 10 | Make worker health fatal in the deploy gate | IR-P1-003, CTR-P2-004, RES-P3-004 (C-11) | PS-007 | platform/CI | S |
| 11 | Restrict SSH: require `admin_ip_ranges` from a secret; remove `0.0.0.0/0` default | INFRA-P1-001, CHAIN-P2-007 (C-15) | PS-013 | platform/infra | S |

## Phase 2 — This week (7–30 days)

**Goal:** close the P1 governance, tenancy, backup-security, and supply-chain gaps.

| Item | Findings | Patch set | Owner | Effort |
|---|---|---|---|---|
| Protect `main`/`prod`: fix `Dependency Review` context, `enforce_admins:true`, require reviewers on `prod`, enable CODEOWNERS; correct the false approval docs | BP-P1-001/002/003, CI-P1-001/002, CHAIN-P1-008, REL-P1-002 (C-16) | PS-012 | repo admin | S |
| MSP trust-model decision + ADR; explicit `can_traverse_tenants`; split cross-tenant read from permission bypass | CHAIN-P1-001, SEC-P2-002, ACM-P2-002, MT-P2-005 (C-24) | PS-009 | CTO/security + API | M |
| Encrypt DB backups (SSE-KMS or gpg/age) and add a second-region copy | DR-P1-003 | PS-010 | platform/security | M |
| Standardize the backup-location contract (`S3_BACKUP_BUCKET`) across script/workflow/restore | DR-P1-002, IR-P1-005, INFRA-P3-009 (C-03) | PS-010 | platform | S |
| Add restore-test failure alert + "no successful restore in N days" external alert | DR-P1-004, DR-P2-001 (C-19) | PS-010 | platform | S |
| Enable storage versioning/export and rehearse D5 (files) | DR-P1-001, FILE-P2-004 (C-21) | PS-010 | platform/backend | M |
| Webhook idempotency: atomic check in API, add key in worker dispatcher | WH-P1-001, API-P2-005, RES-P3-002 | PS-011 | integrations/backend | M |
| Enforce notification preferences + dedup on all send paths; delivery observability | NOTIF-P1-001/002/003 | PS-011 | notifications/backend | M |
| Tenant-scope audit log list/export and platform dashboards | MT-P1-001/002/003, ADMIN-P1-001 | PS-009 | API platform | M |
| Alert/review impersonation and cross-tenant admin access | ADMIN-P1-002, MT-P2-005, IR-P2-002 | PS-009 | API platform | S |
| Authz drift guards: catalog-lint + non-atomic uses on remaining routers | ACM-P2-004/005, ACM-P3-002 | PS-009 | API platform | S |
| Billing enforcement: entitlements server-side, populate `payments`, missing Stripe events | BILL-P1-001/002/003 | PS-011 | billing/backend | M |
| Migration dry-run made blocking + no swallowed `\|\| true`; reverse-migration runbook/rehearsal | IR-P1-002, IR-P2-006, DATA-P2-004, DR-P1-005 | PS-010 | backend/data | M |
| RPO/RTO split by method and validated by drills D1/D2 | DR-P1-006, IR-P1-004 | PS-010 | platform/ops | S |
| Rollback doc contradiction fixed (SHA-targeted rollback) | IR-P1-001, REL-P2-004 (C-27) | PS-010 / PS-015 | docs/platform | S |
| RLS regression alerting (runtime) | IR-P1-006 | PS-009 | backend/DB | M |
| Supply-chain: image SBOM + image scan + license gate + provenance | SBOM-P1-001/002, SC-P1-001, CTR-P1-001/002/003 (C-20) | PS-011 | supply-chain | M–L |

## Phase 3 — This month (30–60 days)

**Goal:** platform hardening, data governance, and depth in the medium-severity set.

| Item | Findings | Patch set | Owner | Effort |
|---|---|---|---|---|
| Incremental RLS rollout for high-risk modules; scoped-client enforcement | ACM-P2-003, SEC-P2-005 (C-05), ACM-P2-006/007/008 | PS-009 | backend/DB + platform | L |
| Retention/cascade: bound deletes, return `ok:false`, archive or `SET NULL`, define `impersonation_log` retention | DATA-P1-002, DATA-P2-005/006, CHAIN-P2-006 (C-22) | PS-010 | backend/worker + governance | M |
| Soft-delete wired into DELETE endpoints; get_analytics_summary RPC defined | DATA-P1-003, SEC-P2-004, SEARCH-P2-005 | PS-009 / PS-010 | backend/data | M |
| RLS admin-gate helper + drift lint; definer RPC identity guard; dead-letter DELETE policy | RLS-P2-001/002/003, CHAIN-P2-004/005 (C-25, C-26, C-08) | PS-009 | backend/DB | M |
| RLS approved-membership predicate de-duplicated (6 copies); anon grant lockdown + lint | DATA-P1-001, DATA-P2-001, RLS-P3-001, SEC-P3-001 (C-09) | PS-009 | backend/DB | M |
| File security: AV scanning, MIME/size limits, arbitrary-bucket signing fix, CSV formula injection, avatars bucket declared | FILE-P2-001/002/003/004/005/006, FILE-P1-001/002/003 | PS-014 | API/backend + storage | M–L |
| Admin console guardrails: export audit logging, confirmation gates, bulk preview/elevation, admin rate limits | ADMIN-P2-001…006 | PS-009 | API platform | M |
| Search hardening: sanitize `.` operators, tenant-scope admin search, pagination | SEARCH-P1-001/002, SEARCH-P2-001…007, MT-P2-001 (C-10, C-23) | PS-009 | search/backend | M |
| Integration syncs report partial failures; `jsm-sync` retry; SDK `Idempotency-Key` | API-P2-002/004, BILL-P2-002/003/004 | PS-011 | API/billing | M |
| Observability wiring: declared-but-unwired metrics, worker/queue depth alerts, webhook/reconciliation alerts | IR-P2-001/003, WH-P2-003, RES-P2-002, BILL-P2-003 | PS-008 | platform/backend | M |
| Docs truth pass: ops docs vs pipeline, AGENTS.md, accessibility gate size, backup/DR runbook | INFRA-P2-005, AI-P1-001/002, TEST-P2-001, DR-P2-003 | PS-014 | docs/maintainers | S–M |
| Terraform fix landed and gated (≥1.10 or drop `use_lockfile`), plan-only PR trigger | INFRA-P1-002, CHAIN-P2-009 (C-04), CI-P2-003 | PS-013 | platform/infra | S |
| Secret env-var delivery completed; secret inventory/matrix refreshed; prod.tfvars untracked | SECRET-P1-002, INFRA-P2-006 (C-17), SECRET-P2-001/002/004, INFRA-P3-008 (C-12) | PS-006 | platform/security | M |

## Phase 4 — This quarter (60–90 days)

**Goal:** maturity, resilience drills, and low-severity cleanup.

| Item | Findings | Patch set | Owner | Effort |
|---|---|---|---|---|
| RLS inventory hygiene, status/communication surface, host/resource hardening | RLS-P2-003, RLS-P3-002/003/004, CTR-P2-005, IR-P2-002/005 | PS-009 / PS-013 | platform/DB | M |
| Scheduled drills D1–D7 with recorded evidence; PITR drill; full droplet-loss paper drill | DR-P1-006, IR-P3-001, RES-P2-006 | PS-010 | platform/ops | M |
| Release identity and notes: annotated tags, commit-bound SBOM, changelog refresh, Breaking Changes section, release-notes template, commitlint | REL-P1-001, REL-P2-001, REL-P2-002, REL-P2-003, REL-P3-001, REL-P3-002 | PS-015 | release owner | M |
| Supply-chain depth: SBOM validation/binding, image digest refresh, license rationale, Dependabot triage | SBOM-P2-001/002/003, SBOM-P3-001/002, SC-P2-002/005, SC-P3-001/002/003, CTR-P2-001 | PS-011 | supply-chain | M |
| Release workflow + changelog; branch-protection drift check + break-glass process | CI-P3-008, CI-P3-009, BP-P2-001…004, BP-P3-001/002 | PS-012 | platform/CI | M |
| Platform status page, IT break-glass runbook, rotation reminder workflow | IR-P2-005, SECRET-P3-003, SECRET-P2-002 | PS-006 | platform/security | M |
| UI-only permission tightening; public route inventory; dead `manage` predicate cleanup | ACM-P3-001/003/005, ADMIN-P3-001/002/004 | PS-009 | API platform | M |
| Documentation/devex consolidation; repo-map cleanup; search docs | AI-P3-001/002/003, DOC-adjacent rows, SEARCH-P3-002, FILE-P3-003 | PS-014 | maintainers | S–M |
| Worker/resilience depth: DLQ, real timeout, force-exit, queue-backend alignment, dispatcher idempotency | RES-P2-002/003, RES-P3-001/002/003/005 | PS-005 | platform/backend | M |
| Low-severity container/CI/infra polish | CTR-P3-001/002, CI-P3-005/006/007/010, INFRA-P3-010/011/012, DR-P3-001/002/003 | PS-013 | platform | S |

## Quick wins (≤ 0.5 day, high leverage)

| Quick win | Why it helps | Findings | Validation |
|---|---|---|---|
| Add restore-test assertions + drop `\|\| true` | Turns a decorative test into a real DR signal | DR-P0-002, CI-P2-002 | Truncated dump → job fails |
| Onboarding `requirePermission` wiring | Closes the clearest RBAC outlier | ACM-P1-001, SEC-P2-001 | client-viewer → 403 |
| Forgot-password uses `APP_BASE_URL` | Kills the reset phishing vector | CHAIN-P1-002, SEC-P2-003 | `Origin`-spoof test |
| Worker `unhandledRejection` handler | Stops silent scheduled-work loss | NOTIF-P2-003, RES-P2-001 | fired-rejection test |
| `enforce_admins:true` + protect `prod` | Closes admin bypass and prod gate | BP-P1-002/003, CI-P1-001 | dispatch prod deploy → pauses |
| Require `admin_ip_ranges` from a secret | Removes world-open SSH | INFRA-P1-001 | SSH from non-allowed IP times out |
| Fix rollback doc contradiction | Removes incident-time confusion | IR-P1-001 | literal walk by 2nd operator |
| Delete `M365_WEBHOOK_SECRET`, write `M365_CLIENT_STATE` | Removes dead config + restores auth | SECRET-P1-001, WH-P1-002 | M365 test webhook 2xx |

## Hardening backlog (all findings not in Phases 1–4 above)

The register holds the complete mapping. Every remaining finding in `risk_register.md` falls into one of:
- the P2 tenant/API hardening sets (`PS-009`),
- the P2 ops/backup/migration sets (`PS-010`, `PS-013`),
- the P2/P3 supply-chain/billing/webhook sets (`PS-011`),
- the P3 docs/UI/cleanup set (`PS-014`), and
- the release-identity/communications set (`PS-015`).

## Cross-cutting themes

1. **"Configured is not exercised."** Backups, restore tests, alerts, rotation, PITR, and drills all exist on paper but lack a captured exercise (P0 DR/IR; DR-P1-006, IR-P2-004, RES-P2-006).
2. **Monitoring cannot report its own death.** No Alertmanager, no external dead-man's switch, worker failures silent (C-18, C-11, C-07).
3. **Two trust models.** API role keys vs RLS admin gates diverge, producing both over-broad reads and blocked deletes (C-24, C-25).
4. **RLS is not a backstop.** Service-role is the default client and blanket grants mean RLS is the only gate (C-05, C-09).
5. **Environment/docs drift.** Ops docs, rollback docs, `AGENTS.md`, and Terraform assumptions contradict the code (INFRA-P2-005, IR-P1-001, AI-P1-001/002).
6. **Supply chain is artifact-only.** SBOM/scan/sign/license are generated or documented but not bound or enforced (C-20).

## Milestones and exit criteria

| Milestone | Window | Exit criteria |
|---|---|---|
| M0 — Recovery is real | 7 days | PS-001 green; a scheduled backup run and a failing-on-bad-dump restore test captured |
| M1 — Response is real | 7 days | PS-002 merged; timed tabletop passes using only `INCIDENT_RESPONSE.md` |
| M2 — P1 security closed | 30 days | C-01, C-04, C-06, C-14, C-15, C-16 all `verified-fixed`; PS-003…PS-013 green; PS-015 started || M3 — Depth hardening | 60 days | RLS rollout, storage backup, webhook/billing enforcement merged |
| M4 — Maturity | 90 days | Drills D1–D7 exercised with evidence; supply chain bound; docs reconciled |

## Open questions affecting sequencing

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is Supabase PITR actually enabled on the prod plan? | Determines whether the 5-min RPO claim is even achievable | Supabase plan/dashboard read-only |
| What is the Supabase Auth redirect allowlist? | Confirms whether CHAIN-P1-002 is escalated | Auth config read-only |
| Is the live GitHub `prod` environment protected? | Confirms C-16 runtime state | GitHub environment settings |
| Which bucket/region is funded for the offsite copy? | Blocks PS-010 scope | Owner decision |
| MSP operating-model decision (who may traverse tenants)? | Blocks PS-009 design | Product/security decision |
