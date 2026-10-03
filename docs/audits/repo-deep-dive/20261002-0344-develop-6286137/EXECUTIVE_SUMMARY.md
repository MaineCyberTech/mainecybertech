# Executive Summary — MaineCyberTech Portal

- Audit name: `repo-deep-dive`
- Run: `20261002-0344-develop-6286137`
- Repository: `C:\temp\mainecybertech`
- Branch / Commit: `develop` @ `62861370` (default branch is `main`; `main..develop` = **662** commits)
- Generated at: 2026-10-02
- Auditor: principal-level repository auditor (prompt 23 — synthesis of 25 sibling domain reports)
- Area code: `EXEC`
- Output path: `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/EXECUTIVE_SUMMARY.md`
- Companion: `RELEASE_GATE.md` (same folder)
- Gate decision: **NO-GO** (audit opinion — see `RELEASE_GATE.md`; unresolved P0s)

> **This document is an audit opinion.** It does not grant, revoke, or replace any program verdict, gate, review, or adoption record. Reconciliation is stated in `RELEASE_GATE.md § Reconciliation With Existing Verdicts`.

---

## 1. What this system is (plain English)

Maine CyberTech Portal is a **multi-tenant SaaS operations platform for managed-service providers (MSPs)**. It is a TypeScript/Turborepo monorepo with four deployable packages:

| Package | Path | What it is |
|---|---|---|
| API | `apps/api` | Express + TypeScript REST API; auth, RBAC, tenant scoping, billing, webhooks |
| Web | `apps/web` | Next.js 15 client portal + admin console |
| Worker | `apps/worker` | Background/scan/notification/integration jobs (28 registered task handlers) |
| SDK | `packages/sdk` | Typed API client with retry logic |

Backend data lives in **Supabase/PostgreSQL** with row-level security (RLS), object storage for documents/avatars/logos, Redis for queues/cache, DigitalOcean droplets + Terraform for infrastructure, Cloudflare for DNS/CDN/TLS, and Stripe for billing.

MSP client organisations use it for onboarding, tickets, projects, secure documents, contracts, billing visibility, messaging, and audit. **Tenant isolation is the product's central security promise** — one MSP tenant must never see another tenant's clients, financials, or documents.

## 2. Overall posture

**The engineering is strong and improving; the operations around it are the weak half.**

Across the 25 domain reports in this run, the *code* domains are largely production-ready (mostly 3.4–4/5), and the run documents a **large, genuine remediation delta since the 2026-08-06 audit** (`75d3926`): RBAC moved from "UI-only" to API-enforced at ~240 sites; RLS is enabled on 134/134 live tables; the previously critical `public_interactions` RLS hole is closed; the Kali/IDOR by-id family fails closed; SSRF, webhook signature/HMAC, idempotency, and circuit breakers are implemented and tested; 397 unit suites, coverage gates, OpenAPI contract tests, CI secret scanning, SHA-pinned actions, digest-pinned images, and a health-gated deploy with auto-rollback all exist.

But this run surfaced **five P0 findings**, and they are all in the *operations / preparedness* half of the system, not the code half:

| P0 | One-line summary |
|---|---|
| `DR-P0-001` | Scheduled backup and restore-test workflows exist **only on `develop`**. GitHub schedules fire from the default branch (`main`), which does not contain them. **Automated backups have never run and are dormant now.** |
| `DR-P0-002` | The restore test **cannot fail**: it prints table counts and echoes "completed successfully"; the `_migrations` check ends in `\|\| true`. A truncated or empty backup still reports green. |
| `IR-P0-001` | **No platform-level incident-response plan**, roles, severity taxonomy, comms plan, or postmortem process. (The repo's "incident response" docs are a *feature for tenants*, not MCT's own IR.) |
| `IR-P0-002` | **No data-breach response / notification process** for tenant or customer data. |
| `IR-P0-003` | **No independent dead-man's switch.** Prometheus runs on the same droplet it monitors; the `Watchdog` rule has no receiver (no Alertmanager). If the monitoring path fails, nothing outside it alerts. |

None of these five is a remotely exploitable code bug. All five share the same root cause: **controls that exist on paper or on a non-default branch but have never been exercised end-to-end.** The repo's own `AGENTS.md` and `docs/RELEASING.md` already acknowledge the backup half of this ("scheduled … runs only fire from the default branch and recent backup runs have failed"), so the audit is *confirming* the program's own known debt with direct evidence, not discovering a surprise.

## 3. Severity counts and themes

Counts are aggregated from the 25 sibling reports (per-report counts were not re-derived by this synthesis; see `RELEASE_GATE.md § Verification Performed` for the aggregation caveat).

| Severity | Count (this run, from sibling reports) |
|---|---:|
| **P0** | 5 (2 × `DR`, 3 × `IR`) |
| **P1** | ~45–50 across 18 domains (largest clusters: tenant isolation/admin, CI/CD & branch protection, backups/DR, notifications, secrets/env, supply chain) |
| **P2** | ~90+ |
| **P3** | ~40+ |

**Recurring themes:**

1. **"Configured ≠ exercised."** Backups, restore tests, rotation, drills, break-glass, and PITR all exist as documents or scripts but have **no artifact proving a real exercise**. This is the run's dominant theme.
2. **Human / governance gates are the weakest axis.** CI automation is strong; approvals, required-check integrity (`Dependency Review` context no job emits), and `enforce_admins:false` are not verifiably enforced.
3. **Trust-model inconsistency around platform-admin keys.** 8 keys (`PLATFORM_ADMIN_KEYS`) grant cross-tenant traversal at `requireOrgAccess`, while only 2 (`ADMIN_BYPASS_KEYS`) are trusted by `requirePermission`/`requireAdmin` — the composition root of the top cross-tenant read chain (`CHAIN-P1-001`).
4. **Detection is thin and in-domain.** Several high-value signals (RLS regressions, audit-log gaps, webhook dead-letters, worker health, backup staleness) have no alert; the alert pipeline itself has no off-box receiver.
5. **Documentation drift that operators and AI agents will trust.** Stale repo paths, a11y gate width (19 vs 25), "Blocking" labels on non-blocking workflows, rollback docs that contradict each other, and vendored prompt packs older than the run manifest assumes.

## 4. What changed since the 2026-08-06 audit (`75d3926`)

The run is explicit that the delta is **large and positive**. Selected verified movement (each cited in its sibling report at commit `6286137`):

**Genuinely closed / materially hardened**
- RBAC: `requirePermission` applied at ~240 sites; prior "UI-only permissions" headline closed (`06`, `24`, `08`).
- RLS: every prior RLS-audit finding fixed or mitigated; migration `5302129` is a direct forward-fix citing the prior report; RLS on 134/134 live tables (`37`).
- Tenant isolation: prior CRITICAL by-id IDORs remediated; `loadOwned`/`assertResourceOrg` fail closed (`25`, `45`).
- SSRF guard end-to-end, webhook HMAC + raw-body signatures + dead-letter queue, atomic idempotency claims (`13`, `27`).
- Deploy: health gate + auto-rollback to previous tag; digest-pinned, non-root, read-only, cap-dropped containers; CSP nonce; Prometheus tmpfs fixed; UFW 2376 removed (`12`, `36`).
- Supply chain: `.npmrc` pinned, prod `pnpm audit` is a hard deploy gate, all Actions SHA-pinned, working SBOM generator (1,481/1,481 components), pre-commit + CI secret scanning (`11`, `35`).
- Test estate: 397 suites matching docs; coverage gates in PR and deploy; OpenAPI contract tests; 25-page WCAG 2.2 a11y gate (`09`).
- Stripe billing reconciliation worker fixed; amounts in minor units with a 100× regression test (`29`).

**New or regressed since last run (introduced by the remediation itself)**
- `INFRA-P1-002` **regressed**: Terraform `use_lockfile = true` requires Terraform ≥ 1.10, but every workflow pins `1.9` → `terraform init` will fail. The state-locking "fix" is inoperative and pipeline-breaking.
- `INFRA-P3-009` **regressed**: the read-only rootfs the prior scorecard credited was removed for Redis.
- `CHAIN-P1-008` **regressed**: branch-protection bypass + missing prod approval compose into an unattended production-change path.
- **The two DR P0s are newly *characterized*, not newly created** — the workflows were likely always develop-only; this run is the first to prove the scheduling consequence directly.

Full per-domain diffs are in each sibling report's "Diff vs prior audit" / "Continuity" section.

## 5. Strengths (worth preserving)

- **Test and self-consistency tooling is unusually mature:** `check-docs-counts.mjs`, `openapi-audit.js`, `verify-rls.mjs`, `generate-db-types.js --check`, `verify-prompts.js`, `sync-review-md.mjs` all run in CI.
- **Defense-in-depth in code:** RLS *and* application-layer org scoping *and* fail-closed by-id helpers; secrets never in image layers; PII-aware logging/redaction.
- **Deploy path is real:** internal health gate, automatic rollback to `PREV_TAG`, serialized prod-gated migrations.
- **CI supply-chain discipline:** SHA-pinned actions and images, hard prod dependency gate, secret scanning, provenance pin over the prompt pack.
- **Honest internal documentation of debt:** `AGENTS.md` / `docs/RELEASING.md` name the dormant backups and prod-environment gaps rather than hiding them.

## 6. Top actions (leadership-facing)

Ordered so the cheapest, highest-consequence items land first. Full detail and owners are in `RELEASE_GATE.md`.

1. **Make automated backups actually run (same day).** Put `db-backup.yml` and `db-restore-test.yml` on the default branch (or add a `main` dispatcher), then capture a green scheduled run artifact. *(DR-P0-001)*
2. **Make the restore test able to fail (same day).** Assert table/migration baselines and tenant isolation; remove `|| true`. Prove it fails on a deliberately truncated dump. *(DR-P0-002)*
3. **Write two short IR documents (this week).** `docs/INCIDENT_RESPONSE.md` (severity, roles, comms, postmortem) and `docs/DATA_BREACH_RESPONSE.md` (detect → contain → assess → notify). *(IR-P0-001/002)*
4. **Stand up an off-box dead-man's switch (this week).** Deploy Alertmanager with an external receiver and route the `Watchdog` rule; add an off-droplet uptime check. *(IR-P0-003)*
5. **Close the trust-model and pipeline gaps (this week).** Split `PLATFORM_ADMIN_KEYS`; require reviewers on the `prod` environment and set `enforce_admins:true`; restrict `admin_ip_ranges`; fix the Terraform 1.9/`use_lockfile` contradiction.

## 7. Investment recommendation

**Continue investing — the platform is a good asset with a fixable operational ceiling.**

- The engineering trajectory is strongly positive and the remediation velocity is high; this is not a rewrite situation.
- The P0s are **process/branch-placement defects, not architectural ones.** Three of the five are documents + a scheduler; two are a workflow reachable from `main` and an assertion block. A focused two-week operations sprint closes all five.
- The most valuable structural spend is **observability with an off-box receiver** and **a repeated DR/IR drill cadence**, because every "configured ≠ exercised" theme collapses once exercisable evidence exists.
- Do **not** treat the large P1 band (tenant-isolation breadth, branch protection, secrets wiring) as optional — it is the difference between "works" and "defensible to enterprise MSP clients and insurers."

## 8. How to read the rest of this run

- `RELEASE_GATE.md` — the formal audit opinion (GO / GO WITH CONDITIONS / NO-GO), conditions, and the reconciliation section against prior program verdicts.
- `32_backup_restore_drill.md` + `backup_restore_drill_plan.md` — the DR evidence and the drill plan.
- `33_incident_tabletop_exercise.md` + `incident_tabletop_scenarios.md` — the IR evidence and tabletop scenarios.
- `45_exploit_chain_attack_path_audit.md` — how domain findings compose into end-to-end paths.
- The other 22 domain reports — per-area findings, inventory, and remediation.
- `22_final_risk_register_roadmap.md` (sibling, may publish concurrently) — the consolidated register and roadmap.

## 9. Evidence gaps / open questions (synthesis-level)

| Question | Why it matters | Evidence needed |
|---|---|---|
| Have scheduled backups *ever* run from this repo? | Determines whether "dormant now" is also "never worked" | GitHub Actions run history for `db-backup` across all branches |
| Is Supabase PITR actually enabled on the prod plan? | The 5-minute RPO depends on it; the dump path cannot meet it | Supabase project plan/feature confirmation (read-only) |
| Are `prod`/`prod-approval` environment protection rules configured? | Chain `CHAIN-P1-008` severity hinges on this | GitHub environment settings screenshot/API (owner-held) |
| Are `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` non-empty in prod? | If empty, every tenant-isolation finding is read under a service-role default | GitHub secrets/state (redacted) |
| Was `22_final_risk_register_roadmap.md` available at synthesis time? | This summary aggregates from domain reports directly; a register may refine counts | The register file once published |

---

*Audit-only. This synthesis wrote no code, config, ledger, or gate. It reports what the repository proves at `62861370`.*
