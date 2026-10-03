# Release Notes — MCT Portal (draft)

> **Draft, not yet published.** Generated from real git history by audit prompt 40.
> No version tag exists yet (see finding REL-P1-001); release identity is the commit SHA.

- **Audit name:** `repo-deep-dive`
- **Run:** `20261002-0344-develop-6286137`
- **Repository:** `mainecybertech/mainecybertech`
- **Branch:** `develop`
- **Target commit:** `62861370` (`6286137017c4b7c77e83ee420ec11382d984f263`, "docs: record the widened a11y default gate", 2026-10-01)
- **Previous audited commit:** `75d39269` (2026-08-06)
- **Delta:** 371 commits · 1,225 files · +104,410 / −33,559 · 34 migrations
- **Proposed tag:** `v0.<n>.0` (placeholder — no tag scheme exists yet)

---

## Highlights

This cycle is dominated by **security, tenant-isolation, storefront, MFA, accessibility and CI hardening** rather than net-new surface alone. Notable outcomes:

- **Tenant isolation hardened** across API routes with `requirePermission` enforcement, org-scope guards, and multiple RLS policy fixes (`b887674c`, `fcdf5e19`, `d64efc6c`, migrations `5302129`, `5302412`, `5302418`, `5302420`, `5302428`).
- **MFA completed** end-to-end: opt-in TOTP management, `aal2` enforcement flag, and single-use recovery codes (`334d65f9`, `471b63ef`, `6d61694c`, `81b54a85`, migration `5302427`).
- **Storefront became DB-backed** with persistent campaigns, quote/lead capture, proposal drafts, visual assets, and intake→project handoff (`15717762`, `daf87333`, `d90176a0`, `f43aca7d`, `1c48b23d`, `d5aa0336`).
- **Seven GAP modules** completed end-to-end (client portal, knowledge base, compliance, CAB, hardware staging, device profiles, network diagrams).
- **Accessibility**: WCAG 2.2 contrast/target-size/select-name fixes; the fixed pages were promoted into the default scan and `wcag22aa` gate (`f0d79194`, `28b05215`, `43573d12`).
- **Reliability of deploys**: health-gate auto-rollback to the previous image tag, container-health deploy gate, Caddy config validation (`3cf876dc`, `4ee3537c`, `1301208f`, `23a8b71d`).
- **CI governance**: schema/RLS/docs guards, CodeQL, a11y breadth scan, secret scan, Terraform `pipefail` (`c409d5cb`, `9449af2c`).

## Added

- MFA recovery codes (10 scrypt-hashed, single-use) with generate/status/revoke endpoints and a security page (`81b54a85`, migration `5302427`).
- CSP violation reporting endpoint and middleware `report-uri`/`report-to` wiring (`81b54a85`).
- OpenAPI response schemas on 14 high-value routes + contract tests (`81b54a85`, `a3668602`).
- Dead-letter webhook delivery admin list + retry/dismiss API, SDK, and page (`81b54a85`, `cacb3b91`).
- Store: persistent campaigns (ethical-FOMO UX), quote requests + scored leads, proposal drafts, visual assets, import/export against the live catalog (`15717762`, `daf87333`, `d90176a0`, `f43aca7d`).
- Store intake → project handoff (project + 9-task checklist + handoff ticket) and linkage into the proposals/approvals stack (`1c48b23d`, `d5aa0336`, migration `5302421`).
- New modules: client-portal bootstrap, knowledge base, compliance readiness, mini-CAB, hardware staging, device profiles, network diagrams.
- Admin pages for knowledge base, compliance readiness, CAB, store operations/quote-requests/leads/visuals.
- MFA `aal2` enforcement behind `MFA_ENFORCEMENT_ENABLED`.
- Accessibility breadth scan (`A11Y_FULL=1`, 68 routes) and weekly/manual `a11y-breadth.yml`.
- Public status page; portal incident/runbook/feedback detail pages.
- ADRs 008–011 (RLS rollout, MFA model, dark-only theme, shared UI kit) and `docs/RELEASING.md`.

## Changed

- `apps/api/src/routes/store.ts` (~1,480 lines) split into `routes/store/{promotions,quotes,campaigns,visual-assets,catalog}.ts`.
- Public storefront pages now read the DB catalog (`store_products`/`store_categories`) with bundled JSON as fallback.
- `terraform-do` is now **manual-dispatch only**; the stale dev apply run was cancelled.
- Sentry tracing/release tunable via `SENTRY_TRACES_SAMPLE_RATE` / `SENTRY_RELEASE`.
- Toast handling consolidated onto `ToastProvider` + `useToast()`; money/date via `lib/format.ts`.
- CI: `pnpm audit` + Trivy + codeql + RLS/docs/DB-types guards added to the gate.

## Fixed

### Security
- Rate-limit key no longer trusts the unverified JWT `sub` claim (`9698315`).
- Project task-comment writes now verify the task belongs to the path project (`9698315`).
- Notification email HTML now escapes user content (API + worker) (`9698315`, `f4d5073d`, `c9f855af`).
- SSRF on API-side webhook fetches closed (`redirect: "manual"`); webhook retries scheduled; PII removed from logs (`ab2674d8`, `f8db21ba`).
- Upload content sniffing + 25 MB cap; cross-project tenant-isolation body-key bypass closed (`ab2674d8`).
- `client_portal_entitlements` RLS aligned with the API gate; entitlement/impersonation fixes (migrations `5302420`, `5302428`).
- Dependency advisories cleared to make the deploy gate green (`d799066a`, `47fd1a0b`, `de9e...`), `image-size` override tightened.

### Reliability / correctness
- Deploy: duplicate `env:` key + BOM removed; `GHCR_TOKEN`/`GHCR_ACTOR` forwarded; droplet IP resolution fixed (dev deploys red since 2026-08-30) (`e65ef821`, `4064626b`, `f3...`).
- Auto-rollback to the previously running tag when the health gate fails; container health used for the gate (`3cf876dc`, `4ee3537c`, `1301208f`).
- Worker: distributed lock for scheduled scans; batch notification lookups; dead-letter inline webhook rows instead of replaying truncated payloads (`4d4a7ce4`, `8656f64e`, `cacb3b91`).
- Web: failed loads now surface (`DataErrorNote`) on ~100 admin/portal pages instead of misleading zeros/empties (`05cd4ad`, `0bc295b`, `2203553`, `11cfdd0`, `1a6a56f7`).
- Real bugs from typed Supabase clients: `tickets.subject` → `title`, `webhook_deliveries.webhook_id` nullability, missing `domain_monitors.version`, satisfaction-pulse columns (`dfa607bf`, `a85b41fb`, `6da96f81`).

### Accessibility
- WCAG 2.2 contrast, target-size, and select-name fixes; dialog semantics and focus traps; `htmlFor/id` wiring on dozens of orphan labels (`f0d79194`, `28b05215`, `21daf537`, `7c737645`, `b3236c01`).

## Breaking Changes

> **None confirmed as customer-breaking**, but the following change *authorization behavior* and must be reviewed before promotion. This section is intentionally empty in the current `CHANGELOG.md` (see finding REL-P2-002).

- **RLS / entitlement policy changes** (behavior-affecting):
  - `5302412_rls_approved_status_gap.sql`, `5302418_rls_approved_status_gap_2.sql` — approved-status RLS fixes.
  - `5302420_rls_entitlements_and_impersonation_fix.sql` — entitlement/impersonation RLS fix (`impersonation_log.actor_user_id` made nullable for user deletion).
  - `5302428_client_portal_entitlements_platform_admin.sql` — `client_admin` dropped from entitlement write policies; platform `admin`/`super_admin` only, plus cross-org `with check`.
  - `5302132_store_rls_fix.sql`, `5302423_store_portal_scope.sql`, `5302408_store_tenant_scoping.sql` — store catalog tenant scoping.
- **`terraform-do` is manual-dispatch only** — any automation that relied on push/PR-triggered Terraform plans/applies must switch to `gh workflow run`.

## Migrations

34 migrations were added this cycle. Apply via CI only (`supabase db push --include-all`), never from a laptop:

```
5302129 supabase_rls_audit_fixes           5302419 fk_indexes
5302130 project_task_rpc_user_id           5302420 rls_entitlements_and_impersonation_fix
5302131 governance_manage_permissions      5302421 store_proposal_draft_proposal_link
5302132 store_rls_fix                      5302422 store_campaigns
5302133 impersonation_log                  5302423 store_portal_scope
5302134 store_catalog_tables               5302424 manage_actions
5302135 profiles_encrypted_pii             5302425 public_interactions_is_bot
5302402 knowledge_base                     5302426 status_actions
5302403 compliance                         5302427 mfa_recovery_codes
5302404 cab                                5302428 client_portal_entitlements_platform_admin
5302405 hardware_staging
5302406 device_profiles
5302407 network_diagrams
5302408 store_tenant_scoping
5302409 domain_monitors_version
5302410 webhook_deliveries_nullable_webhook_id
5302411 satisfaction_pulse_columns
5302412 rls_approved_status_gap
5302413 incident_runbook_link
5302414 client_portal_entitlements
5302415 website_monitor_seo
5302416 business_os_snapshots
5302417 phishing_targets
5302418 rls_approved_status_gap_2
```

> No down-migrations exist. Rollback is forward-only for schema; application rollback uses the previous image tag (see Rollback below).

## Security Notes (admins / operators)

- **Deploy:** Turnstile keys are now injected (`TURNSTILE_SECRET_KEY` into droplet `.env`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as web build arg) so the production contact form is captcha-protected (`e6bb0735`).
- **Do not rely on a prod approval gate yet.** `docs/ROLLBACK_PROCEDURES.md:167` claims `prod-approval` reviewers exist; reports 34/10 and `docs/RELEASING.md:92-107` contradict this. Treat prod promotion as ungated until fixed (finding REL-P1-002).
- **Webhook secrets** (`JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`) and `M365_CLIENT_STATE` are **not written by the deploy pipeline** for the droplet `.env` (report 38, SECRET-P1-002); Jira/JSM/M365 webhooks fail closed with `501` until configured.
- **SBOM** is artifact-only and not release-bound (report 35, SBOM-P2-001). Do not treat it as a signed release artifact.

## Operator Actions

1. **Before promoting `develop` → `main`:** resolve the prod blockers in `docs/RELEASING.md:92-107` (`prod` environment secrets, `DO_API_TOKEN` 401 / `DROPLET_IP` fallback, backup secrets).
2. **Migrations** are applied by `supabase-migrations.yml` on `main` pushes touching `supabase/**`; verify the `migrate-gate` job is green.
3. **Verify after deploy:** `curl -sf https://api.<domain>/health` and the `/login` HTTPS check.
4. **Known issue:** E2E has run-to-run flakiness under CI/Supabase contention — re-run before treating a failure as a regression (`RELEASING.md:106-107`).
5. **Record the current image tag / commit SHA** before promoting, for rollback.

## Rollback

- **Automated:** dispatch `deploy-do` with `rollback_sha` (7–40 lowercase hex); build jobs are skipped and the droplet redeploys the existing GHCR image tagged with that SHA.
- **Automatic on failure:** if the health gate fails during a normal deploy, the deploy step already redeploys the previously running tag before exiting non-zero.
- **Terraform:** `terraform-do` is manual-dispatch only — use `gh workflow run terraform-do.yml -f apply=true --ref <branch>` (correct the stale push-based steps in `docs/ROLLBACK_PROCEDURES.md:116-120`).
- **Verification:** `curl -sf https://api.<domain>/health` and the deploy run's health gate.

## Known Issues

- `main` is **662 commits behind `develop`** and is the merge-base (i.e. `main` is an ancestor of `develop`); scheduled `db-backup`/`db-restore-test`/`sbom` runs only fire from the default branch.
- `DO_API_TOKEN` returns HTTP 401; dev falls back to `DROPLET_IP`, prod has no fallback set.
- Dependency-review required context on `main` likely never matches (report 34, BP-P1-001); `enforce_admins:false` and `require_code_owner_reviews:false` (BP-P1-002/BP-P2-001).
- One low `elliptic` dev-only advisory remains (no upstream fix).

## Upgrade / Rollback Notes (summary)

| Aspect | Guidance |
|---|---|
| Schema upgrade | Forward-only; 34 migrations applied by CI. No down-migrations. |
| App rollback | Previous SHA-tagged GHCR image via `rollback_sha`. |
| Data compatibility | RLS/entitlement changes are additive at the schema level but change authz behavior; verify admin/client write paths after upgrade. |
| Config changes | Turnstile keys now required for the contact form; webhook secrets must be set manually until the deploy writer is fixed (report 38). |

## Verification

- [ ] `test`, `lint`, `typecheck`, `codeql`, `e2e` green on the promotion PR.
- [ ] `CHANGELOG.md` `[Unreleased]` reflects this delta (currently **stale** — finding REL-P2-001).
- [ ] `validate` deploy gate green.
- [ ] Prod blockers resolved (REL-P1-002).
- [ ] Previous image tag / SHA recorded.

---

*Generated read-only by audit prompt 40 at commit `62861370`. Companion files: `changelog_draft.md`, `branch_protection_recommendation.md`, `sbom_license_policy_recommendation.md`, `secret_rotation_runbook.md`.*
