# Patch plan

## DATA-P0-001 — Orphan cleanup can recursively delete a bucket's contents

Keep the folder-aware recursion + unsafe-path abort; add the storage integration fixture (nested objects + true orphan) suggested in the previous run to prove remove() is only ever handed concrete keys.

## DR-P0-001 — No successful backup has ever run: every db-backup, storage-backup and db-restore-test CI run fails

Operator: provision SUPABASE_DB_URL, BACKUP_ENCRYPTION_KEY and the backup bucket in the `dev` environment (or move the workflows to the environment that actually holds them) and set SCHEDULE_DISPATCH_TOKEN or retire the dispatcher; then run db-backup and db-restore-test manually and record the green run URLs in docs/RELEASE_GATE.md. Repo: correct docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md so the documented environment matches the workflows, and add a CI guard that fails fast with an actionable message when a required secret is missing.

## DR-P0-002 — Scheduled backup and restore-test workflows never run because they are absent from the default branch

No change for this row; the operational intent (a successful backup) is tracked in the new P0 finding.

## DR-P0-003 — The restore test never asserts integrity and therefore cannot fail on a bad backup

No change for this row; fix the baseline-load step so the assertions actually execute.

## IR-P0-001 — No platform-level incident response plan, roles, or postmortem process

Keep the plan current: fill the rota, fix the referenced template paths, and re-review after every exercise (see new IR findings).

## IR-P0-002 — No data breach response / notification process

Exercise the plan once (breach tabletop) and record the after-action; keep the 'Known detection gap' paragraph in sync with the deployed alerting path.

## IR-P0-003 — Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

Provision the external heartbeat (healthchecks.io-style) secret for the prod environment, deploy once, then perform and record the documented exercise: stop alertmanager, confirm the external service pages within its grace period, and store the artifact.

## OBS-P0-001 — Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

Record one observed heartbeat and one deliberate missed-heartbeat drill (stop alertmanager, confirm the external page) as a release artifact; keep the prod fail-closed guard.

## ACM-P1-001 — Client-onboarding mutations run without any `requirePermission` gate

Add an explicit denial regression test (client_viewer → 403 on POST/PATCH/DELETE) — the existing client-onboarding-command-center.test.ts mocks requirePermission, so the gate itself is not exercised end-to-end.

## ACM-P1-002 — `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag)

Lock the column at the database: revoke UPDATE on public.profiles from authenticated (API writes use service role) or add a BEFORE UPDATE trigger raising unless current_user = 'service_role' when NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin; alternatively move the flag to a service-role-only table. Add a regression test that a user-scoped client cannot change the flag.

## ADMIN-P1-001 — Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

Keep the shared admin-scope helper as the single decision point; add a regression test asserting that every new `requireAdmin` read route either calls resolveAdminTenantScope/applyOrgScope or uses requireOrgAccessByParam.

## ADMIN-P1-002 — Impersonation/cross-tenant access is logged but not reviewable or alerted

Add a web admin page for the impersonation trail and audit the impersonation export itself (see the exports finding residual); keep the alert rule threshold reviewed.

## ADMIN-P1-003 — Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation)

Centralize role-assignment authorization in one helper (e.g. assertCanAssignRole): assigning any CROSS_TENANT_KEYS role requires profile.is_super_admin; block self-role changes for non-super-admins; validate roleId against an assignable allowlist per caller; apply it to memberships POST/PATCH, users PATCH /role, bulk invite and organizations/onboard; add negative tests for each path.

## AI-P1-001 — Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain

Either vendor prompts 41–45 (and refresh prompt 20) into prompts/repo-deep-dive/, or keep the pin and (a) add a pinned-version/source header to each pack README (repo-deep-dive README carries no status banner today), (b) reconcile the committed run manifests' prompt lists with the vendored pack or add a note that the manifests were produced by the upstream pack, and (c) add a dependency-free guard (e.g. scripts/check-prompt-packs.mjs) that fails when a run manifest entry or pack-README script path does not resolve.

## AI-P1-002 — `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers

No further action; keep the a11y assertions in check-docs-counts.mjs when promoting pages between BASE_PAGES and FULL_PAGES.

## BILL-P1-001 — Module entitlements are derived but not enforced server-side

Keep as-is. Residual to track (not a regression): entitlement-resolution failure fails open by design (middleware/entitlement.ts:88-94); add an alert on the error-level log if plan-boundary bypasses must be observable.

## BILL-P1-002 — `payments` table is never populated; payment history is silently empty

Keep as-is. Address the unchecked-write gap tracked in the new finding 'Stripe webhook DB writes ignore errors and still mark the event processed'.

## BILL-P1-003 — Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded

Keep as-is. Remaining coverage gaps (best-effort refund update, no charge.dispute/credit_note/trial_will_end) are tracked under BILL-P2-001.

## BP-P1-001 — `main` requires a context (`Dependency Review`) that no job emits

Keep the guard wired and extend it to the PR path (see the new guard-coverage finding). Re-run `node scripts/check-required-checks.mjs` whenever a job is renamed. Apply the committed JSON to GitHub (`gh api -X PUT .../branches/main/protection --input .github/branch-protection/main.json`).

## BP-P1-002 — `enforce_admins:false` lets administrators bypass all required checks and reviews

Apply both JSON files to GitHub and confirm `gh api .../branches/main/protection` shows enforce_admins=true. Pair with the break-glass runbook so a stuck required check does not become an ad-hoc UI bypass.

## BP-P1-003 — Production deploy path uses the unguarded `prod` environment, not `prod-approval`

Configure >=1 required reviewer on prod-approval and prove the pause with a dispatched prod deploy. Until then the environment attachment is inert (documented as CI-P1-001).

## CHAIN-P1-001 — Low-trust MSP role key composes into a cross-tenant read pivot

None required. Keep isCrossTenantKey as the only cross-tenant predicate and keep the roles.ts doc-comment split; add a regression test asserting an ELEVATED_TENANT_KEYS membership is scoped.

## CHAIN-P1-002 — Caller-controlled reset redirect composes into an account-takeover assist

None required. Keep the allowlist-only behavior and the CORS_ORIGIN='*' special case; add a regression test with an attacker Origin asserting the APP_BASE_URL fallback.

## CHAIN-P1-003 — Branch-protection bypass + missing prod gate compose into unattended production change

Operator: add 1+ required reviewers to prod-approval AND prod, then dispatch deploy-do deploy_target=prod and confirm it pauses. Code: fail the setup job when deploy_target=prod and github.ref != refs/heads/main (or split prod dispatch into a main-only workflow); add security-scan/CodeQL to the required contexts (BP-P2 open).

## CHAIN-P1-004 — Delegated user-manager self-escalation to cross-tenant admin (role-assignment policy gap)

Centralize role-assignment authorization in one helper (assertCanAssignRole): assigning any CROSS_TENANT_KEYS role requires profile.is_super_admin; block self-role changes for non-super-admins; validate roleId against an assignable allowlist per caller; apply it to memberships POST/PATCH, users PATCH /role, bulk invite and organizations/onboard. Add a DB trigger rejecting super_admin/admin membership inserts unless the write is service-context with an explicit super-admin assertion. Add negative tests for each path.

## CHAIN-P1-005 — Forgeable `profiles.is_super_admin` composes into full permission bypass and all-tenant RLS reads

Lock the column: revoke UPDATE on public.profiles from authenticated (API writes already use service role) or add a BEFORE UPDATE trigger raising unless current_user = 'service_role' when NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin; alternatively move the flag to a service-role-only table. Add a regression test that a user-scoped client cannot change the flag. Also audit/alert any is_super_admin transition.

## CHAIN-P1-006 — Tenant-blind response cache keys compose into cross-tenant aggregate disclosure

Include the resolved scope in the cache key (hash of scope.allTenants + sorted scope.orgIds, or the impersonation flag) and never serve an allTenants response from an org-keyed entry; add a unit test that two callers with the same active org but different membership sets do not share a cache entry.

## CI-P1-001 — Production application deploys have no working manual-approval gate

Operator: configure 1+ required reviewers on `prod-approval` and `prod` in GitHub Settings -> Environments, then dispatch deploy-do deploy_target=prod and confirm it pauses at 'Waiting for approval'; alternatively migrate supabase-migrations to `prod-approval` after moving its environment-scoped values. Record the verification in docs/RELEASING.md.

## CI-P1-002 — Branch-protection-as-code has a likely-mismatched required check and permits admin bypass

Keep the check-required-checks guard. Add a scheduled read-only drift check comparing live branch protection (gh api) to the committed JSON, and document the repo-admin apply step in docs/CI.md. (Live application itself is tracked by the branch-protection domain.)

## CI-P1-003 — Production deploy path cannot run; prod environment lacks secrets and protection rules

Operator: provision the prod/prod-approval environment secrets and variables per the matrix and RELEASING.md exit criteria, then run one dispatch deploy to prod and record the result.

## CTR-P1-001 — No Container Image Vulnerability Scan in CI

Keep the gate; extend scanning to the pinned third-party images (new finding) and add a scratch-branch test proving the gate fails on a known-vulnerable base.

## CTR-P1-002 — SBOM Is Lockfile-Only, Not an Image SBOM or Attestation

Keep; retain the lockfile SBOM as a secondary artifact and re-verify the attestation on a real deployed digest.

## CTR-P1-003 — Unsigned Images With No Provenance/Attestation

Keep; close the pull-by-tag TOCTOU (new finding) so the verified digest is the artifact that actually runs.

## DATA-P1-001 — Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data

Add a follow-up migration that rewrites notifications_insert_system_or_admin with public.user_has_role(organization_id, array['super_admin','admin']) (or an explicit m.status='approved' filter); consider raising the check-rls-predicate baseline once the historical policy set is clean.

## DATA-P1-002 — `retention` worker task performs unbounded deletes and reports success on partial failure

Keep the bounded batching; close the remaining test gap on age-boundary behaviour (see the separate retention-boundary finding).

## DATA-P1-003 — Soft-delete columns remain dead schema; DELETE endpoints hard-delete

None required; keep the documented hard-delete contract in ROLLBACK_PROCEDURES.md aligned with the API.

## DR-P1-001 — The weekly restore test fails at baseline load (invalid GITHUB_ENV format) so no restore verification ever executes

Strip comments/blank lines before appending to $GITHUB_ENV (e.g. `grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .github/restore-test-baseline.env >> "$GITHUB_ENV"`), or `set -a; . .github/restore-test-baseline.env; set +a` and write the values explicitly. Add a lint/unit test that every line written to $GITHUB_ENV is KEY=VALUE, and re-run the workflow to capture the first green run.

## DR-P1-002 — No backup or restore path exists for uploaded files in Supabase Storage

No change for this row.

## DR-P1-003 — Restore-test backup location contract (`S3_BACKUP_BUCKET`) is undocumented and can silently mismatch the backup script

No change for this row.

## DR-P1-004 — Database backups are unencrypted and stored in a single location with no offsite copy

Provision BACKUP_ENCRYPTION_KEY (strong passphrase) and S3_OFFSITE_BUCKET, then run db-backup + db-restore-test once and record the encrypted object keys and the green run as evidence.

## DR-P1-005 — The restore test has no failure alert

No change for this row; delivery trust is tracked under DR-P2-001 and the new 'no independent alarm' finding.

## DR-P1-006 — No automated migration reverse/rollback and no bad-migration drill

Author and version a reverse migration for the last risky migration as a template, run the bad-migration drill (D4 in the drill plan) on a throwaway project, and record the result + timing.

## DR-P1-007 — RPO/RTO targets are documented but unvalidated, and the Postgres RPO conflates PITR with the daily dump

Fix the restore-test baseline bug, get the dump path green, then record one dated PITR exercise and one dated dump-restore measurement; state which environment each number was measured in.

## EXEC-P1-001 — P0 data-loss path and unverified "fixed" claim block a clean release

Either (a) run and record the deployed-commit regression artifact once a dry `main` deploy exists, or (b) owner-accept the code-level regression tests as closure, update docs/RELEASE_GATE.md:30 to cite them, and reconcile follow_up_register.md and REAUDIT_REPORT_20261004.md to one status.

## FILE-P1-001 — Public file-request upload is permission-gated and unreachable for anonymous uploaders

No action; keep the anonymous-path regression test.

## FILE-P1-002 — File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them

No action; add cross-org download tests (see test-gap finding).

## FILE-P1-003 — Document version history objects are deleted at replace and by orphan cleanup

No action; define a deliberate retention/reclamation policy before ever pruning superseded versions.

## FINAL-P1-001 — P0 data-loss path and unverified "fixed" claim block a clean release

Keep the orphan-cleanup regression suite wired into the required CI test job and re-run the P0 re-verification after any storage-layer change.

## INFRA-P1-001 — SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)

Keep the fail-closed variable and guard. Operator action remains: set ADMIN_IP_RANGES (office/VPN CIDRs) in the dev and prod environments before the next apply; re-verify the live DO firewall + UFW after apply.

## INFRA-P1-002 — Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9)

No change; keep the version pin and required_version in sync if the toolchain is bumped.

## IR-P1-001 — Rollback documentation contradicts itself on SHA-targeted rollback

None beyond keeping both docs edited together when the rollback flow changes.

## IR-P1-002 — Bad-migration recovery is manual-only with no automated reverse or staging proof

Record one dated reverse-migration or PITR drill on a Supabase branch (time-to-restore + data comparison) and link it from ROLLBACK_PROCEDURES §3 and RTO_RPO.

## IR-P1-003 — Worker health failure during deploy is non-fatal

None; optionally add a Prometheus alert on worker_task_queue_depth for post-deploy detection.

## IR-P1-004 — Backups are not verified deeply enough to prove the documented RPO/RTO

Record one dated green restore-test run URL and, separately, one PITR drill to prove the 5-minute RPO (see IR-P1-002 residual).

## IR-P1-005 — Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test

None; keep the contract documented in one place if it changes.

## IR-P1-006 — No runtime detection or alerting for tenant-isolation (RLS) regressions

Run the promtool rule tests in CI (new finding) and keep the alert's 'confirm genuine platform-level read' annotation in the on-call runbook.

## MT-P1-001 — Audit log list and export are not org-scoped by default

None required; keep the applyOrgScope pattern as the reference for other tenant tables and add a route-level regression test asserting an org B ?organization_id is 403 for an org A admin.

## MT-P1-002 — Platform dashboards expose all-tenant aggregates to any single-org admin

None required; consider auditing the allTenants read path (the metric/impersonation trail) so a platform-wide dashboard read is visible in the review surface.

## MT-P1-003 — Public file-request upload authorizes with a permission unioned across all orgs

None required; add a regression test that an org A JWT cannot consume an org B token's quota (or is rejected) and that the stored path always starts with the request row's org id.

## MT-P1-004 — Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members

Include the resolved scope in the cache key (e.g. hash of orgScope.allTenants + sorted scope.orgIds, or scope.impersonation) and never serve an allTenants response from an org-keyed entry; add a unit test that two callers with the same active org but different membership sets do not share a cache entry.

## NOTIF-P1-001 — Notification preferences are stored and displayed but never enforced on any send path

Keep the enforcement; fix the preference write path (separate finding) so the enforced state can actually be set from the UI.

## NOTIF-P1-002 — API-originated notifications bypass the dedup unique index

None required for the original finding; keep the key scheme covered by tests.

## NOTIF-P1-003 — No delivery observability: email/notification failures are silent and unalerted

Add a Prometheus rule on notification/email failure and skipped rates (e.g. failure ratio > 5% for 30m, or a sustained SMTP-skip counter) routed through Alertmanager, and wire the notification panel into a real dashboard; document the runbook.

## NOTIF-P1-004 — Notification preference writes from the web UI omit organization_id (NOT NULL) so toggles cannot persist

Default organization_id to req.orgId (or req.query.organization_id, which requireOrgAccess already injects) in the PUT handler, and/or require organizationId in the schema and pass it from the web client; return a real error the UI surfaces. Add an API test asserting the upsert payload contains organization_id when the client omits it, and an E2E that toggles, saves, reloads and asserts the toggle stuck.

## OBS-P1-001 — No runtime detection or alerting for tenant-isolation (RLS) regressions

Wire prometheus.rules.test.yml into the CI validate workflow (docker run promtool test rules) so rule reachability is regression-tested.

## ORCH-P1-001 — Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory)

Republish the run from the pack's canonical copy — either ship the 43 domain reports, or regenerate the lens with the register's IDs and re-render INDEX/EXECUTIVE_SUMMARY/RELEASE_GATE from the same generation — and add a publish/CI guard that scans report files and fails when their IDs do not match findings.json/register (lib_findings.collect_with_dupes already computes exactly this).

## REL-P1-001 — No version identity: no tags, no product version, no commit binding in generated artifacts

Either (a) bump VERSION per promotion and pass it into the web build so badge/version.json, SBOM and release notes agree, then cut an annotated tag/GitHub Release per promotion with the SBOM attached, or (b) record the SHA-authoritative decision explicitly in docs/RELEASING.md and remove the split identity by deriving the web badge from VERSION+sha.

## REL-P1-002 — Documented production deploy path is stated as non-functional and the approval gate claim is false

None for the doc side. Operator: configure required reviewers on prod-approval and prod, then dispatch deploy-do deploy_target=prod and confirm it pauses at 'Waiting for approval'.

## RLS-P1-001 — No runtime detection or alerting for tenant-isolation (RLS) regressions

Wire promtool check/test into CI (a pinned prom/prometheus image), add the DB_ERROR/empty-result regression signal, and add the multi-tenant isolation E2E assertion from the 20261002 test plan.

## RLS-P1-002 — Approved-membership RLS predicate reintroduced six times; pending/suspended members could access tenant data

Keep the guard; extend it (or verify-rls.mjs) with an effective-state pass that replays drop/create across all migrations and fails on any live policy using the raw predicate.

## SBOM-P1-001 — SBOM Is Lockfile-Only, Not an Image SBOM or Attestation

Keep as-is; no action. Future work: validate image SBOMs before attestation (new finding) and cover third-party runtime images (new finding).

## SBOM-P1-002 — Unsigned Images With No Provenance/Attestation

Keep; close the residual TOCTOU (verification is not bound to the pulled artifact) captured as a new finding.

## SBOM-P1-003 — No version identity: no tags, no product version, no commit binding in generated artifacts

Owner/release decision: either cut annotated tags on prod promotion and attach the lockfile SBOM to the GitHub Release, or keep the documented commit-SHA-as-identity model and delete the remaining 'tagged release' language from CHANGELOG/RELEASING where it implies tags.

## SBOM-P1-004 — No license allow/deny policy in dependency review or any CI gate

Keep. Fix the exception-matching, expiry, and doc-mismatch residuals captured as new findings.

## SBOM-P1-005 — SBOM carries no license data and no dependency graph, limiting triage and license review

Keep; regenerate the licenses.json via scripts/collect-licenses.mjs in local runbooks (new docs-drift finding).

## SC-P1-001 — Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped

Keep the override scoped as-is and refresh the policy allowlist expiry handling (see the new 'expires dates are not enforced' finding).

## SEARCH-P1-001 — `sanitizeSearchTerm` does not strip PostgREST `.` operator separators

No action required; keep the regression tests and the documented dot tradeoff.

## SEARCH-P1-002 — Admin global search exposes profile PII and never tenant-scopes the organizations query

No action required for the filed finding; optionally stop matching on `email` for non-super callers (see residual).

## SEC-P1-001 — super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard

Centralize role-assignment authorization in one helper (reject role key super_admin unless the caller profile is_super_admin) and use it from memberships invite/PATCH, bulk invite, organizations/onboard, and users/:id/role. Add regression tests for each path. Consider a DB trigger rejecting super_admin membership inserts/updates unless performed by a service context that carries an explicit super-admin assertion.

## SEC-P1-002 — PII field encryption silently degrades to reversible plaintext

Keep the fail-closed guards; complete the plaintext cutover (see the new additive-encryption finding).

## SEC-P1-003 — Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data

None required; keep new admin reads on resolveAdminTenantScope/applyOrgScope.

## SEC-P1-004 — Impersonation/cross-tenant access is logged but not reviewable or alerted

None required; add alerting on unusual impersonation volume (observability backlog).

## SEC-P1-005 — Low-trust MSP role key composes into a cross-tenant read pivot

None required.

## SEC-P1-006 — Caller-controlled reset redirect composes into an account-takeover assist

None required; extend the same resolver to sign-up (new P3 finding).

## SEC-P1-007 — Client-onboarding mutations run without any `requirePermission` gate

None required.

## SEC-P1-008 — M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

None required; cover M365_CLIENT_STATE in the rotation inventory (SECRET domain).

## SEC-P1-009 — Deploy pipeline does not write several secret-class env vars the API schema and compose reference

None required; keep the env list and printf in sync (add a guard if possible).

## SEC-P1-010 — Public file-request upload authorizes with a permission unioned across all orgs

None required.

## SECRET-P1-001 — M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed

None required. Keep the retirement note in sync if Graph ever adds payload signing; re-verify the key remains absent in future runs.

## SECRET-P1-002 — Deploy pipeline does not write several secret-class env vars the API schema and compose reference

None required; add the proposed env-parity CI check (new finding) so this cannot silently regress when new keys are added.

## SECRET-P1-003 — Rotation and emergency procedures target the wrong GitHub environment for the prod deploy and backup workflows

Rewrite the rotation/emergency steps to name the consuming environment per job (deploy + terraform apply → prod-approval; migrations/plan → prod; backups → dev), or make the prod secrets repo-wide and say so; add a post-rotation verification step (`gh secret list --env <env>`, then a deploy/run that proves the value landed) and a note that a value set on an environment the job does not use is a silent no-op.

## USE-P1-001 — Self-service password reset dead-ends: the email link lands on a page that cannot complete the reset

Route the reset link through /auth/callback (or have /password-reset read the `code`/fragment, exchange it, then call reset-password with the resulting session). Add an E2E test that follows the actual emailed URL shape.

## USE-P1-002 — Signup email-confirmation link points at the API host and 404s, blocking first login

Build emailRedirectTo from APP_BASE_URL (as forgot-password already does via resolveTrustedRedirectOrigin) so it targets the web /auth/callback. Verify the Supabase redirect allow-list contains that URL.

## USE-P1-003 — Admin approval queue cannot approve or reject memberships (roleId sent as empty string)

Resolve the membership's current role (or make roleId optional in the PATCH schema) and return/display the API error; add a test that approval from the queue transitions status to approved.

## USE-P1-004 — Every SDK delete reports failure after succeeding because the client cannot parse empty 204 bodies

In executeFetch, treat 204/empty bodies as `null` (e.g. check status 204 or content-length 0 before res.json()). Add SDK tests with truly empty bodies, and have the web delete actions surface per-item results.

## WH-P1-001 — Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher

Keep the atomic claim as the single idempotency authority; add a regression test that asserts the claim is per-endpoint (fan-out to N endpoints yields N deliveries, 1 per endpoint).

## WH-P1-002 — M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config

No further code action; confirm the GitHub secret M365_CLIENT_STATE is set in the prod environment (deploy fails closed to 501 if unset).

## ACM-P2-001 — `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

Add the suggested unit test pinning CROSS_TENANT_KEYS === ADMIN_BYPASS_KEYS and asserting ELEVATED_TENANT_KEYS never grants traversal, so a future edit cannot silently re-widen either set.

## ACM-P2-002 — RLS is not a database backstop on API requests (service-role is the default client)

Extend the rollout to writes for high-risk modules (tickets, documents, profiles, client-portal) and add a CI check that new requireOrgAccess routes use getScopedClient; record the deployed allow-list in the repo (e.g. checked-in env template) so it is auditable.

## ACM-P2-003 — Write and state-transition actions gated by `view` permissions (action mismatch)

Either change the guard to requirePermission('ai','create') or record the exception in the permission guide; add the static test that no requirePermission(m,'view') appears on a mutating route (with an allow-list for this documented exception).

## ACM-P2-004 — Webhook endpoint and delivery reads are available to any org member (not manage-gated)

Gate the read routes with requirePermission('webhooks','view') (the catalog defines it), or explicitly accept and document the posture.

## ACM-P2-005 — API keys store `expires_at` but nothing enforces or prunes expiry

Add a scheduled pruner (or an index/partial cleanup) for expired+inactive api_keys rows and consider defaulting expiresAt in the create schema; document the lifecycle.

## ACM-P2-006 — Webhook signing secrets are stored plaintext with no rotation or expiry

Store an encrypted/KMS-wrapped secret (or a hashed verifier where feasible), add a rotation endpoint + runbook, and consider timestamps to bound replay.

## ACM-P2-007 — Profiles are enumerable by email/id for any authenticated user

Restrict GET / to caller-visible ids (same-org members), drop or gate the ?email= filter behind users:view, and stop returning select('*') (exclude encrypted_pii).

## ACM-P2-008 — API-key `permissions` are decorative: keys act with the creator's full permissions and the column is never enforced

Either enforce the intersection of the key's permissions with the creator's effective permissions in requirePermission (checking req.apiKey), or remove the column/display and document that API keys always act as their creator. Add a test for whichever contract is chosen.

## ADMIN-P2-001 — Sensitive admin exports are not audit-logged

Route every export through a helper that writes the *.export audit event (actor, entity, row count, filters) before streaming; add a test per export route.

## ADMIN-P2-002 — Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable

Require the confirmation body (or an elevation token) on every destructive DELETE, add a typed org-name/slug confirmation for organization delete, and either restore soft-delete for organizations or document the PITR-only recovery in the admin UI; add a CI check that new DELETE routes call assertDeleteConfirmed.

## ADMIN-P2-003 — Bulk document operations apply without a per-row preview or elevation guardrail

Add a preview/dry-run that returns the resolved row set and field diffs, require a second explicit apply step (or typed confirmation) for visibility/ownership-changing bulk ops, and consider a dedicated `documents:bulk` permission.

## ADMIN-P2-004 — Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

Use inviteUserByEmail (or set email_confirm false + password reset) for bulk invites; require an explicit approval step for onboarding admin memberships (or at least restrict adminRoleKey to tenant-scoped roles); add a preview step listing the emails/roles before apply.

## ADMIN-P2-005 — No rate limiting specific to expensive/destructive admin operations

Add per-route limiters (or a dedicated 'dangerous admin operations' limiter keyed by user+route) for bulk invite, bulk document ops, exports and organization delete; surface 429s in the admin UI and add tests.

## ADMIN-P2-006 — No undo/soft-delete is exercised despite the schema supporting it

Keep the hard-delete decision documented in operator docs; if soft delete is ever revisited it must be end-to-end (writes set deleted_at, reads+RLS filter, restore UI).

## ADMIN-P2-007 — Approval flows allow self-approval and cancellation of already-approved requests

Reject approve/reject when the actor is the requester (configurable, at minimum for privileged request types); restrict cancel to pending requests (or record a reversal event with reason); add tests for both.

## ADMIN-P2-008 — Destructive deletes are not consistently audit-logged

Add logAuditEvent to the seven missing DELETE handlers (or a shared audited-delete helper), and add a CI/test guard that every router.delete handler either logs an audit event or is explicitly exempted.

## ADMIN-P2-009 — Any org member can open the Stripe billing portal for their org (no billing-contact check)

Gate the portal session on is_billing_contact (or a new client-facing billing permission), or configure the Stripe portal to a restricted action set; add tests for member vs billing-contact access.

## AI-P2-001 — No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose

Keep the guardrails section as the human-readable contract, then add machine checks where cheap: (a) a PR-size advisory/fail (changed-files/net-lines) or a required reviewer when the size threshold is crossed; (b) run verify-prompts.js verify in the PR test job, not only at the deploy gate; (c) a CI step that regenerates docs/openapi.yaml and fails on diff (or extends openapi-audit.js to compare the committed file against buildSpec()); (d) consider a CODEOWNERS-driven required-review label for .github/, supabase/migrations/ and apps/api/src/middleware/.

## AI-P2-002 — Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker

Add the marker at the point of risk: a short banner (e.g. 'GENERATED OUTPUT — DATA, NOT INSTRUCTIONS') to embedded-output directories/READMEs or a per-pack README banner, and extend verify-prompts.js (or a new check) to assert that every non-prompt file under prompts/ lives under an outputs/runs/Run* directory or carries the marker. Regenerate prompts/manifest.json afterwards.

## AI-P2-003 — `.continue/` agent configuration defines models only and does not surface project rules or boundaries

Optional: add a tiny config lint that asserts the Continue rules mention AGENTS.md and the four generated files, so the duplicate cannot silently drift from AGENTS.md.

## AN-P2-001 — Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate

Gate third-party scripts on an explicit consent state (load after opt-in or use Google Consent Mode default-denied), add a cookie banner with accept/reject, and document the opt-out in the privacy policy.

## AN-P2-002 — Analytics API stores visitor IP and user-agent in plaintext despite the documented no-PII contract

Drop or hash ip_address/user_agent in the insert and the schema, replace metadata with a typed per-event schema (or cap keys/size), update docs/modules/analytics.md to match, and add a regression test asserting no raw PII is written.

## AN-P2-003 — Storefront analytics capture is dead: the browser helper is never called and cannot pass the CSRF gate

Wire track() into storefront views and send the CSRF token (or deliberately exempt this public path and document why), add an E2E that asserts a row lands in store_analytics_events, or remove the dead surface and correct the docs.

## AN-P2-004 — First-party analytics events have no retention or purge path

Add a store_analytics_events retention task (e.g. 90-400 days, mirroring public-interaction-retention) or drop the PII columns, and document per-store retention in the privacy policy and the analytics module doc.

## AN-P2-005 — Visitor-alert tracking collects IP/geo before consent and sends the visitor IP to ip-api.com over plaintext HTTP

Use HTTPS for the geo lookup (or remove the third-party lookup), defer /public/init until consent is captured (or make the tracking explicitly consent-independent and document it), record consent server-side, and add a test that no pre-consent third-party call occurs.

## API-P2-001 — Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition)

Extend requirePermission (or an explicit documented exception) to the residual mutating routes; extend route-authorization-guard.test.ts to assert a permission key on every mutating route outside a documented allowlist; add a dedicated limiter or documented intent for the public surfaces.

## API-P2-002 — External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry

Mirror the jsm-sync result contract in jira-sync and stripe-reconcile: return { ok: false, error } when errors > 0 (or a structured partial result); retry 5xx in fetchJiraIssue; add unit tests injecting a failing per-item write.

## API-P2-003 — Published error-handling contract contradicts the implementation (codes, 422, and `request_id`)

Keep the doc in lockstep with error.ts when new codes are added; add the contract test asserting representative AppError/ZodError shapes.

## API-P2-004 — SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure)

None required; keep the same-key-across-retries regression test as new SDK methods are added.

## API-P2-005 — Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency)

None required; keep the concurrency regression tests when the dispatcher is refactored.

## API-P2-006 — Search falls through to an unscoped cross-tenant query

None required; keep the fail-closed test as new search surfaces are added.

## API-P2-007 — OpenAPI schema is public and the Swagger UI is blocked by CSP

None required.

## ARCH-P2-001 — Single-droplet, single-instance runtime is a hard SPOF

Keep the runbooks. Budget a second droplet or at minimum a documented blue/green or `up -d` without `down` deploy path to remove the per-deploy outage; state the availability target and the deploy downtime window in docs/SLO.md. Redis remains a shared SPOF (see the shared-Redis finding).

## ARCH-P2-002 — API defaults to the service-role DB client (RLS bypass)

Record the deployed allow-list contents and date in docs/RLS-rollout.md (or emit it as a startup log line) so the rollout state is reviewable; extend the rollout to the remaining write paths; keep the IR-P1-006 bypass metrics and MCTTenantScopeRegression rule as the runtime backstop.

## ARCH-P2-003 — Prometheus loads rules but has no alert routing

No code change required. Keep the watchdog URL + basic-auth secrets provisioned per environment and re-run the IR-P0-003 fail-closed check on every prod deploy (already enforced).

## ARCH-P2-004 — API always enqueues to BullMQ while the worker backend is a separate setting with no parity check

Give the API the same QUEUE_BACKEND contract and fail closed on a producer/consumer mismatch (or derive both from one deployment value); add a startup/health assertion that a test task enqueued by the API is observed by the worker; document the coupling in the deployment docs.

## ARCH-P2-005 — One non-replicated Redis backs queue, cache, idempotency and scan locks; failure degrades silently

Separate the queue from the cache (or enable Redis persistence/replication) and raise the memory cap; make idempotency degrade loudly (metric + alert) rather than silently, and document the degraded-mode semantics in the failure runbooks; add a Prometheus alert on Redis OOM/eviction and queue depth (worker_task_queue_depth is exported but has no rule).

## BILL-P2-001 — No refund and incomplete trial/cancel state handling

Add trial_start/trial_end/cancel_at_period_end/canceled_at/interval to subscriptions and persist them in webhook + sync upserts; store refund amount/date; handle charge.dispute.* and credit_note.* if refunds/disputes matter to finance.

## BILL-P2-002 — `POST /billing/sync` does not paginate Stripe results

Loop on has_more/starting_after (bounded), report per-object synced/error counts, and return a non-2xx or explicit errors[] when any Stripe call fails.

## BILL-P2-003 — Reconciliation job has no drift detection, alerting, or tests

Emit drift metrics (per-org subscription status mismatch, invoice/payment counts and sums), write fetched Stripe state back to the mirror, return failure when errors>0, alert on drift/failure, and add tests for terminal vs past_due suspension and partial failures.

## BILL-P2-004 — Failed payments produce no notification or dunning visibility

Create a billing-module notification (plus optional email) on invoice.payment_failed with a link to the Stripe portal, and surface a past-due banner on the portal billing page.

## BILL-P2-005 — Subscription/invoice schema lacks trial, interval, and void-lifecycle fields

Add interval, trial_start, trial_end, cancel_at_period_end (and quantity/seat count) to subscriptions; add voided_at to invoices; populate from webhook + sync.

## BILL-P2-006 — Stripe webhook DB writes ignore errors and still mark the event processed

Check every Supabase write result; log and throw (or record a failed delivery metric) on error so the claim is released and Stripe retries; optionally add a dead-letter/reprocess path.

## BILL-P2-007 — Out-of-order or late-retried Stripe events can overwrite terminal payment states

Make payment status monotonic (never downgrade refunded/partially_refunded), or compare event.created/updated before writing; treat refunded/voided as terminal states in the upsert.

## BILL-P2-008 — Billing read endpoints fall back to all-tenant scope for cross-tenant roles without an admin-scope guard or audit

Adopt resolveAdminTenantScope + applyOrgScope/applyRequestedOrg on the billing GETs (fail closed for empty scope) and audit implicit cross-tenant reads.

## BP-P2-001 — `require_code_owner_reviews:false` makes the committed CODEOWNERS advisory only

Apply the JSON to GitHub; verify each @mainecybertech/* team exists and has members (cannot be checked from the repo); add a CODEOWNERS validator (see the CODEOWNERS-validation finding).

## BP-P2-002 — No break-glass / bypass process for branch protection, and no bypass audit trail

Add docs/RUNBOOK_EMERGENCY_MERGE.md: trigger conditions, incident ticket reference, named approver (owner), time-box, exact steps, mandatory post-incident review; record each bypass from the GitHub audit log (`gh api /orgs/{org}/audit-log` filtered to protected_branch events) in the incident. Consider GitHub Rulesets with an explicit bypass-actor list so bypasses are attributed and logged.

## BP-P2-003 — No drift detection between committed branch-protection JSON and live GitHub settings

Add a scheduled (weekly) + workflow_dispatch drift job that fetches `branches/{main,develop}/protection`, normalizes it to the committed JSON shape, and fails on diff (store both as artifacts); a token with administration:read is required (default GITHUB_TOKEN cannot read protection). Optionally open an issue or PR with the live state.

## BP-P2-004 — Path-filtered required checks can leave `main`/`develop` protected by checks that never run

Remove the `paths:` filter from e2e.yml's pull_request trigger (matching test/lint/typecheck), or add an always-running companion job that reports success when the real suite is intentionally skipped. Update docs/CI.md:132-135 to state that E2E is required on main and unfiltered. A CI test should assert that every context in *.json comes from a workflow whose pull_request trigger has no paths filter.

## BP-P2-005 — Required-check guard is not run on pull requests or on branch-protection-only changes

Run `node scripts/check-required-checks.mjs` in the PR gate (a step in test.yml, or add it to the unit-tests composite used by both test.yml and validate.yml), and/or add `.github/branch-protection/**` to a validate trigger. Document the script in scripts/README.md.

## BP-P2-006 — `deploy-do` manual dispatch can target prod from an arbitrary ref, bypassing the develop->main promotion model

Fail the setup job when deploy_target=prod and github.ref != refs/heads/main (with an explicit, logged owner override if needed), or move prod dispatch to a separate workflow restricted to main; ensure prod-approval reviewers are configured and test the pause.

## BP-P2-007 — Security scan jobs are not required checks, so failing scans do not block merges

Add the security contexts (Test / security-scan, Test / secrets-scan, and the CodeQL analyze check) to the required lists, or adopt a GitHub Ruleset with 'Require code scanning results'; otherwise correct docs/CI.md's Gate column to 'Best-effort/alerting'. Verify the live ruleset state when applying protection.

## CHAIN-P2-001 — Intra-tenant capability escalation via unguarded mutations

Extend requirePermission (or a documented exception) to the residual mutating routes; extend route-authorization-guard.test.ts to assert a permission key on every mutating route; close the role-assignment gap with a central assertCanAssignRole.

## CHAIN-P2-002 — Definer RPC identity trust composes into forged approvals/comments

None required. Add a DB-level regression test asserting a user-scoped call with a foreign p_user_id raises, and keep the service-role path covered by an API test.

## CHAIN-P2-003 — RLS admin-gate regression composes with the API trust model into MSP admin denials

None required for these four gates. Add a static drift check that any admin-gate policy created after 5302436 uses user_has_role with the shared key list, so the literal-list regression cannot recur.

## CHAIN-P2-004 — Retention + cascade compose into silent destruction of audit evidence

Write audit rows to an archive sink before org deletion and before the 365-day purge, or change the FK to on delete set null and archive on retention; record the decision in the data-governance docs.

## CHAIN-P2-005 — Internet-open SSH composes into service-role exfiltration and tenant takeover

Operator: set secrets.ADMIN_IP_RANGES to the office/VPN CIDRs and run terraform-do apply; then verify SSH is unreachable from the public internet and record it. Consider moving long-lived secrets off the droplet (e.g. instance-scoped short-lived credentials).

## CHAIN-P2-006 — Terraform version/lockfile conflict composes into un-gated infrastructure change

None for the version conflict. For the un-gated half: configure prod-approval required reviewers (shared with CHAIN-P1-008) and re-enable the weekly drift plan; consider a plan-required CI check for terraform changes once the DO token is rotated.

## CHAIN-P2-007 — Silent worker failures + in-stack monitoring compose into undetected degradation

Add an alert on the webhook/DLQ counters and on BullMQ failed-job counts; give generic tasks a dead-letter path; make Redis degradation loud (metric + alert) rather than silently changing semantics; document the degraded-mode semantics.

## CHAIN-P2-008 — Decorative API-key permissions compose into over-privileged, RLS-bypassing machine credentials

Enforce the intersection of req.apiKey.permissions with the resolved permissions in requirePermission (checking req.apiKey), or remove the column/display and document that keys always inherit the creator's permissions; add permissions to the create schema + admin UI if scoping is intended. Require a permission on GET /api-keys and document the service-role behavior for keys.

## CHAIN-P2-009 — Unclaimed webhook retries and dedup gaps compose into duplicate outbound deliveries

Claim each row atomically before sending (UPDATE ... SET next_retry_at = lease WHERE id=? AND retry_count=? / SELECT ... FOR UPDATE SKIP LOCKED) and/or claim the delivery idempotency key in the retry path; skip the email in notifyAndEmail when inApp.deduped is true (mirroring claimNotificationEmail); make Redis-degraded idempotency loud (metric + alert). Add a concurrency test with two overlapping webhookRetry calls.

## CHAIN-P2-010 — Guard-then-fetch worker monitoring composes into droplet-internal SSRF

Route uptime/website checks through pinnedFetch (or an equivalent pinned dispatcher) and pin the TLS socket in fetchSslExpiry to the validated address; share one SSRF/pinned-fetch module between apps/api and apps/worker so the guard cannot drift per call site. Add a regression test with a rebinding resolver.

## CI-P2-001 — World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port

No code change required. Residual documentation drift is tracked in the workflow-docs finding.

## CI-P2-002 — Deploy-gate secret scan is a no-op on pushes to main

No code change required. Keep the composite as the single definition for both gates.

## CI-P2-003 — Production approval environment documented as having no required reviewers

No further doc change; close when CI-P1-001/CI-P1-003 are provisioned.

## CI-P2-004 — DB restore test reports success without asserting restore integrity

No code change required; keep the baseline in sync with migrations (the file documents this).

## CI-P2-005 — Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only)

Operator: rotate DO_API_TOKEN, set TF_DRIFT_PLAN_ENABLED=true, then re-enable a PR/push plan trigger (plan-only; apply stays input-gated) so infra changes get a reviewable plan.

## CI-P2-006 — Chromatic visual-regression job is permanently non-blocking

Fix the Storybook build (SB_BUILDER-WEBPACK5_0002), then remove continue-on-error and add Chromatic (or a Storybook build job) to the required checks; until then align AGENTS.md:635 with the config.

## CI-P2-007 — Branch protection permits admin bypass and ignores CODEOWNERS

No change to the payload; apply it (repo-admin) and add the live-vs-committed drift check recommended in the related finding.

## CI-P2-008 — Terraform apply is manual and drift detection is not automated

Operator: rotate DO_API_TOKEN and set TF_DRIFT_PLAN_ENABLED=true (and provision ADMIN_IP_RANGES) so the weekly drift plan actually runs and alerts; then keep the schedule.

## CI-P2-009 — E2E is a required check on main but path-filtered, so PRs that miss its paths can never satisfy branch protection

Remove the `paths:` filter from e2e.yml's pull_request trigger (keep it for push/workflow_call if desired), or make E2E non-required on main and rely on the deploy gate, or add a companion 'e2e skipped' job that reports success on non-matching PRs. Extend scripts/check-required-checks.mjs (or a new check) to flag path-filtered required workflows.

## CI-P2-010 — Backup dispatcher duplicates the backup workflows now that they exist on the default branch

Keep one trigger source: either delete backup-dispatch.yml now that the workflows are on main, or remove the schedule blocks from the three workflows if dispatching to develop is preferred. Record the choice in docs/CI.md; if the dispatcher stays, gate it so it does not double-run.

## CTR-P2-001 — Pinned Base-Image Digests Have No Automated Refresh

Keep; pair with the third-party image scan so a pinned digest is also checked for known CVEs between bumps.

## CTR-P2-002 — Local Compose Ships Default Credentials and Repo-Wide Bind Mount

Keep the profile + required-variable pattern; document the local-only constraint in README.dev.md; consider sourcing the CI seed password from a secret for parity.

## CTR-P2-003 — Redis Password Exposed on Process Argument Vector

Keep. Note the remaining env exposure (REDIS_PASSWORD in the container environment, visible to host root) is inherent to compose env injection and same-trust as /opt/mct-portal/.env (0600).

## CTR-P2-004 — Deploy Health Gate Ignores Worker Health

Keep; include the observability services in a post-deploy probe (new finding).

## CTR-P2-005 — No Container Resource/PID Limits Beyond Memory

Keep; consider adding pids_limit to the local dev compose for parity (optional).

## CTR-P2-006 — Deploy verifies attestations by digest but pulls and runs images by tag (TOCTOU)

Emit each verified digest from verify-attestations ($GITHUB_OUTPUT) and pass it to the deploy job; pull/run image@sha256:… (compose image refs can interpolate per-image digest variables), or re-verify on the droplet immediately before `up`.

## DATA-P2-001 — Blanket `anon` DML grant + default privileges make every future table anon-writable unless RLS happens to stop it

Keep the allowlist comment pattern; add a regression check that asserts information_schema.role_table_grants for anon matches the allowlist.

## DATA-P2-002 — Destructive table-replacement migrations are not transaction-wrapped

Wrap every destructive migration in begin;/commit; (or rename/replace via create-new + transactional swap), archive data before drop, and correct the 'safe to re-run' comments; consider adding a static check that fails any migration containing `drop table`/`drop column` outside begin/commit.

## DATA-P2-003 — `orphan-cleanup` deletes storage objects based on a truncated listing

Keep the pagination + refusal semantics; add the real-storage integration fixture to prove no object outside the listing is removed.

## DATA-P2-004 — Migration CI dry-run diff is non-blocking; drift is never gated

Keep the post-push diff gate; optionally add a required-review note when allow_drift=1 is used.

## DATA-P2-005 — `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive

Either change the FK to `on delete set null` (column is nullable) or write audit rows to an archive sink before org deletion and before the 365-day purge; record the retention/archive decision in the data-governance docs.

## DATA-P2-006 — Several stores lack a retention policy and owner

Publish a retention inventory (table → policy → owner → last exercised) and extend the retention task to the listed stores; either wire retention_policies into the worker or document why internal purges are hardcoded.

## DATA-P2-007 — Generated DB types / schema can drift from migration intent

Keep the --check gate; add a spot-check test for exotic DDL if new syntax appears (e.g. rename column).

## DATA-P2-008 — Orphan cleanup reference query is unbounded in the object list

Keep chunking; no further action.

## DATA-P2-009 — `updated_at` is frozen on 69 module tables (no trigger; generic PATCH drops it)

Add one idempotent migration installing the existing public.set_updated_at() trigger on every public table with an updated_at column, or set updated_at centrally in the crudRoute factories; add a test asserting an update changes updated_at.

## DATA-P2-010 — Scheduled database dump and restore test target the dev environment only; production long-term backup is unproven

Run the dump/restore-test against a prod-scoped environment (or a prod DB URL secret) with the same baseline assertions, or explicitly document that S3 dumps cover dev only and correct RTO_RPO.md / ROLLBACK_PROCEDURES.md.

## DOC-P2-001 — Operations documentation contradicts the current pipeline and configuration

Update the handbook and README.dev to the manual terraform-dispatch model, queue semantics, actual variable/firewall counts, and printf-based env delivery; add the missing alertmanager/env-delivery details in one pass.

## DOC-P2-002 — Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

Replace §4 with the actual path: `gh workflow run terraform-do.yml --ref <branch> -f apply=true` (plan first), noting prod-approval reviewers must be configured; keep the corrected approval section.

## DOC-P2-003 — `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing

None beyond keeping the wording in sync if sbom.yml is ever promoted to a gate.

## DOC-P2-004 — Incident-response and breach docs still describe the alerting dead-man's switch as undeployed and list closed gaps

Rewrite the 'Known gap' sections to the deployed state (Alertmanager + watchdog receiver live; restore test asserts integrity/freshness) and keep only genuinely open gaps (on-call rota unassigned, IR-P2-002/IR-P1-006 effectiveness). Add a doc guard/checklist step that re-reads the register when an IR finding closes.

## DOC-P2-005 — docs/RELEASE_GATE.md is a stale status artifact contradicting the current verified-fixed register

Regenerate docs/RELEASE_GATE.md from the current register (or replace it with a pointer to the latest run's RELEASE_GATE + AGENTS.md Known Debt) and add the run/commit binding to the header so staleness is visible.

## DOC-P2-006 — Alert-delivery secrets (NTFY_ALERTS_*, ALERTMANAGER_*) are missing from the canonical secret docs, which still name Slack as the only channel

Add NTFY_ALERTS_URL/USER/PASS and the seven ALERTMANAGER_* values to docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md and the docs/SECRETS_ROTATION.md inventory; change CI/RELEASING/breach wording to 'ntfy primary, Slack fallback'.

## DOC-P2-007 — docs/GAP_ANALYSIS.md is an AWS-era historical draft presented as current

Mark it historical with the same banner style as docs/API_ENDPOINT_INVENTORY.md:3-6 (or rewrite to current state) and remove the machine-local path.

## DOC-P2-008 — docs/technical-writing/migration-guide.md documents commands and a release process that do not exist

Rewrite the guide against the current workflow (or mark it historical) and fix scripts/dev-setup.sh:332 to `supabase db reset`.

## DR-P2-001 — Storage backups can be silently partial or empty: listings are truncated at 1000 objects and a zero-object archive is accepted

Paginate the list endpoint until an empty page and compare the number of downloaded objects against the manifest/total; fail the job when OBJECT_COUNT is 0 or when the download count does not match the listing; add a `VERIFY_BACKUP`-equivalent check (tar -tzf the archive, assert MANIFEST present).

## DR-P2-002 — Storage backups are never restore-tested and the restore script asserts nothing

Add a weekly storage restore-test job (mirroring db-restore-test.yml): fetch the newest archive into a throwaway environment, assert the MANIFEST object_count equals the extracted file count and the archive decrypts, and record a green run as the exercise artifact.

## DR-P2-003 — No independent backup-staleness alarm; notifier delivery failures are swallowed

Add an independent 'no successful backup in 24/48h' check that does not depend on the backup job (external heartbeat service, or a Prometheus rule on a backup-success timestamp/metric), and make the notifier step fail (or emit ::error::) when no channel is configured instead of swallowing delivery errors.

## DR-P2-004 — Backup-failure alerting is present but cannot be trusted to deliver

No change for this row; address the new residual finding.

## DR-P2-005 — Terraform state bucket versioning is claimed but not backed by any resource

Import/declare both state buckets as digitalocean_spaces_bucket resources with `versioning { enabled = true }` (DO Spaces supports it via API/provider), or record a verified manual setting with a check; correct the bucket name in ROLLBACK_PROCEDURES.md and add a state-restore drill (IR-P3-001).

## DR-P2-006 — The backup/DR runbook and module docs describe a client-facing product, not the platform's own recovery, and the module doc is stale

Rewrite docs/modules/backup-dr.md against the real /final/backups* surface and backup_status schema (or delete the stale sections); add a doc/route existence check.

## DR-P2-007 — Manual restore has no environment guardrail and the transient dump is written unencrypted to `/tmp`

Decrypt-and-stream directly into psql (or use an encrypted temp volume) and shred the temp file on every exit path; keep the ALLOW_PROD_RESTORE gate.

## DR-P2-008 — The product `backup_status` module is not wired to any real platform backup heartbeat

Record the last successful platform backup (small heartbeat table or metric) and alert on staleness; keep the client-facing module separate and clearly labelled.

## EVOL-P2-001 — No module registry: module metadata is duplicated across six disconnected catalogs with no drift guard

Introduce a single module manifest (e.g. packages/config/modules.ts or a modules table) consumed by app.ts mounts, the SDK factory, nav catalogs, the permission-catalog migration generator, entitlements and docs; add scripts/check-module-registry.mjs to CI that fails when manifest keys, mounted routes, permission catalog keys and nav keys diverge; promote the pack templates into a live templates/ directory plus an "adding a module" checklist in docs/.

## EVOL-P2-002 — Webhook UI advertises 11 event types but only 2 are ever dispatched; no event catalog exists

Define a shared event catalog (typed union + payload schemas) used by the dispatcher, all emitters, the API validator and the web UI; add a CI test asserting every catalog event has at least one emitter and every emitted event is catalogued; document delivery semantics per event.

## EXEC-P2-001 — Residual authorization/secret defaults need explicit decisions

Update docs/RELEASE_GATE.md:43-49 with per-control closure evidence (commit/PR + test) and explicit `fixed-in-prod` / `owner-accepted` status; add a dated decision-record section so owner acceptance is a first-class artifact.

## EXEC-P2-002 — In-repo release gate binds a stale commit and cannot produce a verdict

Re-issue docs/RELEASE_GATE.md bound to 8d299b8d (or to the future go-live SHA) with per-criterion status + evidence link; add explicit GO / GO-WITH-CONDITIONS / NO-GO rules; add gate owner and review-by date; mark the 2295958d version superseded; and replace deployed-commit criteria with a pre-deploy staging equivalent until the first prod deploy exists.

## EXEC-P2-003 — Governance and observability gaps mean the platform cannot yet detect or control production failure

Commit the evidence artifacts (gh api environment capture, dry-deploy run URL, synthetic alert delivery, dated restore-test run) under docs/audits/.../evidence/ and reconcile docs/RELEASING.md, docs/FINAL_OPERATOR_MAP.md and REAUDIT_REPORT_20261004.md to one live-state record; then mark the FINAL-P2-001 exit row green.

## FEAT-P2-001 — API keys cannot authenticate; the feature is dead

No change required; keep the api-key regression tests and the expired-key check when touching middleware/auth.ts.

## FEAT-P2-002 — Demo/test data can be seeded into a fresh production database

No change required; if new demo migrations are added, keep the same app.seed_demo guard (there is no CI check that enforces it).

## FEAT-P2-003 — Store analytics is unwired end-to-end: no client call sites, no admin UI consumer, and the summary RPC is undefined

Either wire the feature (call track() from storefront components, build a live admin view on analytics.list/summary, and add the get_analytics_summary migration) or mark the module as not implemented in docs/modules/analytics.md and remove the dead helper/endpoints. The RPC gap is also tracked under the previous register row SEC-P2-006 (area SEC); this row records the UI/backend mismatch.

## FEAT-P2-004 — Feature docs promise AI draft review gates, but `ai_draft_outputs` has no write path

Either wire the AI routes to persist/review drafts in ai_draft_outputs (and add tests) or correct the four feature docs to describe ticket_triage_drafts and remove the unused table from the shared-tables migration comment.

## FEAT-P2-005 — Three tables are served by two divergent API surfaces (sop_library, insurance_evidence, satisfaction_pulses)

Pick one owner surface per table (e.g. satisfaction_pulse module owns satisfaction_pulses; governance owns sop_library) and remove or hard-deprecate the duplicate registration; add a repo guard that fails when two route files register the same table.

## FILE-P2-001 — `avatars` bucket is used by code but declared nowhere with no storage RLS policy

No action; keep the public-by-design rationale in the bucket matrix docs.

## FILE-P2-002 — Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects

No action; consider removing the admin-supplied-path flow entirely in favour of uploads.

## FILE-P2-003 — No content/AV scanning and no bucket-level MIME/size limits on the documents bucket

Add bucket-level allowed_mime_types/file_size_limit in a migration and an asynchronous scan-on-upload hook (e.g. ClamAV sidecar) with quarantine; record scan status on the document row.

## FILE-P2-004 — No backup or restore path for uploaded objects (durability for files)

No action on the code; exercise the restore path (see the new storage-restore-drill finding).

## FILE-P2-005 — Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads

Sniff zip/OOXML (PK\x03\x04) and gzip (\x1f\x8b) magic, enforce declared-vs-detected agreement for all families, and scan the full buffer (not just 512 bytes) for markup.

## FILE-P2-006 — CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted

No action; optionally add Cache-Control: private, no-store to export responses.

## FILE-P2-007 — Document download authorization bypasses the `can_read_document` visibility model

Apply the can_read_document predicate to list/get/signed-url/version endpoints (SQL filter or RPC), authorize downloads with documents:view instead of documents:create, and add documents to the RLS allow-lists where the user-scoped client is used; add private/internal cross-role tests.

## FILE-P2-008 — Members with `documents:create` can write objects straight to the documents bucket, bypassing upload validation

Set bucket-level allowed_mime_types/file_size_limit and/or remove the authenticated insert policy so all writes flow through the API (service role); keep the org-prefix check as defense in depth.

## FINAL-P2-001 — Governance and observability gaps mean the platform cannot yet detect or control production failure

Record the operator artifacts (prod/prod-approval provisioning, one dry main deploy, a dated green db-restore-test with row assertions) and then close CI-P1-001/CI-P1-003/OBS-P2-003.

## FINAL-P2-002 — Residual authorization/secret defaults need explicit decisions

Reconcile docs/RELEASE_GATE.md:43-49 with the register (fixed / owner-accepted / open per row) and close or re-scope API-P2-001.

## FINAL-P2-003 — The full run's patch plan is a placeholder and the roadmap has no 7/30/60/90-day sequencing

Generate the patch sets from the reconciled register using the grouping rules, and add 7/30/60/90-day windows, quick wins and cross-cutting themes to the roadmap; if the run is intentionally register-only, remove the placeholder.

## FINAL-P2-004 — Release-gate artifacts contradict the reconciled register (published gate says GO WITH CONDITIONS vs manifest NO-GO; in-repo gate doc is stale and mis-bound)

Regenerate the published run's gate/summary/index from the reconciled register+manifest, rebind and reconcile docs/RELEASE_GATE.md to the current commit, and add a guard (manifest.releaseGate == gate verdict; companion IDs ⊆ findings.json; gate commit resolves from main).

## HYGIENE-P2-001 — Committed prompt/audit corpus bloats the repo and review surface

Owner decision: keep the pinned corpus but move it to a separate read-only repo or a release artifact, and drop the two remaining generated binaries from the pin; at minimum add a note to CONTRIBUTING.md that prompts/ is historical data, not product code.

## HYGIENE-P2-002 — Duplicate product catalogs have diverged

Pick one canonical source (suggest apps/web copy + a build/seed step), delete the API duplicate and the prompt-pack data copies, and add a CI check that any remaining copy is byte-identical or generated from the canonical file.

## HYGIENE-P2-003 — 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail

None; keep the validate.yml guard.

## HYGIENE-P2-004 — AdminDocumentsCenterClient.tsx is a 2,322-line single component

Extract the row/thumbnail/confirm-modal helpers and the upload/preview state machines into sibling files (AdminDocumentsTable, DocumentUploadDialog, useDocumentFilters); target <600 lines per file.

## INFRA-P2-001 — Prometheus alert rules have no delivery path (no Alertmanager)

No code change. Operator: provision ALERTMANAGER_CRITICAL_WEBHOOK_URL + ALERTMANAGER_WEBHOOK_USER/PASS (ntfy relay) and confirm a test alert lands in the portal topic.

## INFRA-P2-002 — Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example

No change; if the compose stack grows, revisit the 2GB floor in both places together.

## INFRA-P2-003 — Operations documentation contradicts the current pipeline and configuration

Do one docs-sync PR: fix FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md (concurrency, terraform trigger, firewall ports, migration gating, health checks, prune, redis health), fix ROLLBACK_PROCEDURES.md §4 state paths and push-to-apply step, add alertmanager + metrics-token to infra/digitalocean/README.md, and add ALERTMANAGER_*/NTFY_ALERTS_*/METRICS_TOKEN rows to GITHUB_SECRETS_AND_VARIABLES_MATRIX.md. Add a doc guard (grep-based check) for the handful of load-bearing facts (concurrency value, terraform trigger, 2376 absence).

## INFRA-P2-004 — Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline

No change. Optional follow-up: a small CI check that diffs the two Zod schemas against the deploy envs list so a future schema var cannot be added without delivery.

## INFRA-P2-005 — Redis container hardening was weakened and its password remains in process arguments

No change; keep the entrypoint and the REDISCLI_AUTH healthcheck together if Redis is upgraded.

## INFRA-P2-006 — Manual rollback script cannot authenticate to GHCR and defaults to the wrong image prefix

Fix the script in one PR: default GHCR_PREFIX to `ghcr.io/mainecybertech/mainecybertech` (or read it from the compose/.env), pass GHCR_TOKEN/GHCR_USER as ssh arguments (or require `docker login` on the droplet first), make worker health fatal, require 200/301/302/307 for the API/web checks, and use StrictHostKeyChecking=yes with a pinned host key (or explicitly document it as the last-resort path). Add a CI shellcheck/lint pass and keep it in parity with deploy-do's health gate.

## INFRA-P2-007 — Deploy health gate ignores the monitoring and reverse-proxy containers

Extend the health gate to assert `container_health alertmanager` (and optionally prometheus/caddy), or add a post-up `docker compose ps` assertion that every service with a healthcheck is healthy, failing the deploy (and triggering the existing rollback) otherwise. Also consider a `promtool check config`-style pre-flight in the deploy or CI.

## INV-P2-001 — Committed generated artifacts drift without a gate

Extend the artifact-drift gate: add a CI step that runs `pnpm --filter=api generate:openapi` plus `git diff --exit-code docs/openapi.yaml`, and either untrack apps/web/public/version.json (generate it in predev/prebuild) or add a check that it was regenerated. Keep the existing untracked gate for licenses.json/sbom*.json.

## INV-P2-002 — Duplicate schema bootstrap SQL can be mistaken for the source of truth

Keep the header; optionally move the file under a docs/archive/ path in a future docs restructure.

## IR-P2-001 — Several Prometheus metrics are declared but not wired, limiting incident diagnosis

Update the docs/MONITORING_AND_ALERTING.md §4 table, which still labels these metrics 'defined, not wired' (new finding).

## IR-P2-002 — No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

Emit a counter on the final audit-insert failure (and/or a metric from audit_logs continuity) and add a warning rule; then update the breach plan's detection table.

## IR-P2-003 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

Add rules on increase(portal_webhook_dead_letters_total[1h]) and a reconciliation error/suspension metric + rule; record one forced-failure exercise.

## IR-P2-004 — Secrets rotation is documented but has no exercised evidence

Perform and log one low-risk rotation drill in dev (e.g. JWT or Stripe test key) with the Actions run URL, or record why it is deferred.

## IR-P2-005 — No platform status/communication surface for MCT's own outages

Stand up an MCT-owned status page (or an internal-only instance of the product) and add status-update templates to the incident plan; fix the runbook reference.

## IR-P2-006 — Migration dry-run result is discarded in CI

None.

## IR-P2-007 — Platform IR and breach plans are stale on the deployed alerting path and reference template files that do not exist in docs/

Refresh both plans' alerting sections to the deployed state (Alertmanager + ntfy; watchdog unset until provisioned), move the postmortem/comms/rotation/drill templates into docs/templates/ (or fix the references to the audit path), and index both plans in docs/INDEX.md.

## IR-P2-008 — On-call rota and escalation contacts are unassigned, so the incident plan is not operational

Record a minimal rota (names + contact channel + backup) for each role in INCIDENT_RESPONSE.md §8 and the breach plan, even if one person holds several roles.

## IR-P2-009 — No tabletop exercise has been run and the scenario catalog is stale

Move the catalog under docs/ (e.g. docs/INCIDENT_TABLETOP_SCENARIOS.md), refresh the 12 scenarios against 8d299b8d, run and record one exercise (start with Scenario 11), and store the after-action report.

## IR-P2-010 — Prometheus alert-rule unit tests are not wired into CI

Add a CI job that runs promtool check rules + test rules against infra/digitalocean/prometheus.rules*.yml (pin the prom/prometheus image already used in compose).

## MOB-P2-001 — Service worker apps/web/public/sw.js is never registered, so PWA/offline support is inert

Either delete apps/web/public/sw.js and record the product decision, or implement registration (e.g. a small client component in the root layout) together with the safe cache design in the companion finding.

## MOB-P2-002 — sw.js cache strategy would persist authenticated API responses and all GET 200s if registered as-is

Rewrite the fetch handler to allowlist static assets only, bypass /api/ and non-GET requests, respect no-store, precache an offline HTML route, purge user-scoped caches on logout, and serve /sw.js with Cache-Control: no-cache so updates propagate.

## MOB-P2-003 — No mobile-viewport E2E or accessibility coverage (Desktop Chrome only)

Add Pixel 7 / iPhone 13 Playwright projects, run a representative a11y subset at 360x800, and assert document.documentElement.scrollWidth <= viewport width on key routes.

## MOB-P2-004 — About 41% of form controls render below 16px and trigger iOS Safari focus zoom

Set a 16px mobile floor: .cyber-input { @apply text-base sm:text-sm; } and use the same text-base sm:text-sm pattern for ad-hoc inputs and selects.

## MOB-P2-005 — Several modal dialogs have no max-height or vertical scroll and clip on small screens

Adopt one scroll-safe modal shell (max-h-[90vh] overflow-y-auto, items-start on mobile, sticky action row) in the shared Dialog component and migrate the ad-hoc modals.

## MT-P2-001 — Admin global search lists all organizations and can fall through unscoped

None required; keep the search-tenant-scope suite as the template for other cross-tenant search surfaces.

## MT-P2-002 — By-id org filters are conditional, so they fail open if the org gate is not reached

Migrate conditional `if (orgId)` reads to the mandatory predicate helper (applyOrgScope/applyRequestedOrg) or a tenantQuery(req, table) helper that throws when a non-platform caller has no resolved org; then shrink the KNOWN_UNSCOPED allowlist to only genuinely global/user-scoped modules.

## MT-P2-003 — Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`)

None required; add a unit test asserting storage_path_org_id('<uuid>/x') returns the UUID and that every writer path starts with the org UUID.

## MT-P2-004 — Realtime/SSE notification channel is scoped by user only, with no org assertion

None required; optionally also scope the REST list endpoints (GET /notifications, /unread-count) to the resolved org for consistency with the stream (currently user-scoped only — see the notification-recipient finding).

## MT-P2-005 — Platform-admin cross-tenant access is role-key based, broad, and unalerted

Make impersonation_log writes awaited/queued-durable for cross-tenant requests (or fail closed on log failure), add a low-volume alert for first-seen actor→org pairs, and decide one policy for `admin` cross-tenant reach (either split the role keys or make requireAdmin ordering irrelevant by asserting the pinned org in requireOrgAccess).

## MT-P2-006 — Platform-wide report generators run as service role with no tenant guard on scope inputs

Validate task payloads at the registry boundary (reject org-scoped payload fields for global tasks; require and verify an org for tenant tasks), keep destructive tasks scheduled-only, and add a test that an unknown/widening payload is rejected.

## MT-P2-007 — Client-portal entitlement routes order requireAdmin before requireOrgAccess, bypassing the org-pinned admin check

Swap the order to requireOrgAccess, requireAdmin on both routes (or assert the pinned org inside the handlers), and add a test that a plain admin of org A receives 403 on org B entitlements while a super_admin succeeds.

## MT-P2-008 — Platform-wide store intake and analytics endpoints are readable by any tenant admin with no cross-tenant gate

Gate these endpoints on resolveAdminTenantScope().allTenants (or add organization_id + org RLS and scope by it), or document them as platform-staff-only and move them under a platform-admin surface; add regression tests mirroring store-tenant-isolation.test.ts.

## NOTIF-P2-001 — Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker)

Either implement Web Push (web-push + VAPID keys, push_subscriptions table with RLS, service worker, permission UX, worker fan-out) or record an explicit product decision that push is out of scope and remove it from roadmap docs.

## NOTIF-P2-002 — SMTP remains optional; email silently degrades to no-op in production

Once SMTP is configured on the droplet, re-introduce a production fail-closed assertion (or make the deploy gate fail when SMTP_HOST is empty) and add a health/readiness signal for email. Until then, alert on the email/skipped counter.

## NOTIF-P2-003 — Worker lacks an `unhandledRejection` handler (independently verified)

None required; keep the log-and-continue policy covered by tests.

## NOTIF-P2-004 — Scheduled reminder inserts and email sends are not atomic; retries can double-send

None required for the original finding; consider exposing the claim outcome in the delivery metric labels for debugging.

## NOTIF-P2-005 — Sensitive ticket content is stored and emailed verbatim with no sensitivity filter

Adopt a notification-body policy: email an abstract ('New comment on ticket #1234') plus a deep link, or run a redaction/sensitivity pass before storing/emailing; consider a sensitivity flag on the row. Add a test that a secret-like string never appears in the email body.

## NOTIF-P2-006 — API inline email fallback has no retry and ignores the send result

None required; the worker queue remains the primary retry owner.

## NOTIF-P2-007 — Realtime/SSE notification channel is scoped by user only, with no org assertion

None required; keep the scope assertions unit-tested.

## NOTIF-P2-008 — Backup-failure alerting is present but cannot be trusted to deliver

Keep the ntfy path; record the next real exercise (date + run URL) in the DR runbook, and consider removing `|| true` (or alerting on notify failure) so a broken relay cannot hide.

## NOTIF-P2-009 — notifyAndEmail enqueues email even when the in-app notification was deduped (no email-side idempotency on the API path)

In notifyAndEmail, skip the email when inApp.deduped is true (mirroring claimNotificationEmail), or claim an email idempotency key from the same notificationKey; add a unit test that a second identical notifyAndEmail call sends no email.

## NOTIF-P2-010 — Notification delivery SLO counts a queued email hand-off as success and excludes worker send outcomes

Record the API-side enqueue as a hand-off (separate label/value, e.g. status='queued'), keep terminal success/failure on the worker counter, and compute the SLO from worker outcomes per channel; add an alert rule on that ratio.

## NOTIF-P2-011 — Alertmanager→ntfy critical alert delivery is optional in production and has no in-repo exercise evidence

Fail the prod deploy when ALERTMANAGER_CRITICAL_WEBHOOK_URL is empty (as done for the watchdog), or explicitly document the accepted risk; record one real critical-alert exercise (alert + run URL) in the monitoring runbook.

## OBS-P2-001 — Prometheus alert rules are not routed anywhere

Keep the routing as-is; close the verification gap by dispatching one synthetic alert (amtool/Prometheus UI) and recording the ntfy delivery as a release artifact.

## OBS-P2-002 — No committed dashboards or SLO/error-budget definitions

Either add a Grafana service to the compose stack and provision the JSON, or document the SSH-tunnel workflow in MONITORING_AND_ALERTING.md; also add the missing latency/webhook/notification alert rules promised by the SLO table.

## OBS-P2-003 — Backup/restore is scheduled but not verified on the deployed branch

Run db-restore-test against a production-derived snapshot (or add a prod-environment restore job with approval), record the green run URL in RELEASE_GATE, and assert row counts/checksums, not just table presence.

## OBS-P2-004 — Several Prometheus metrics are declared but not wired, limiting incident diagnosis

Update the metric tables in docs/MONITORING_AND_ALERTING.md and docs/SLO.md; no code change needed.

## OBS-P2-005 — No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

Add a counter for failed/skipped audit writes and an alert on non-zero rate; add a daily reconciliation of expected vs written audit rows where feasible.

## OBS-P2-006 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

Add alert rules on rate(portal_webhook_dead_letters_total)/rate(worker_webhook_dead_letters_total) > 0 and on reconciliation error counts; export a stripe-reconcile metric (reconciled/errors/suspended) and alert on errors>0 or drift>0.

## OBS-P2-007 — `/health` publicly discloses provider configuration and Redis errors

None; keep the gate. (The doc still describes the old response — see the doc-drift finding.)

## OBS-P2-008 — Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery

Keep; record one synthetic delivery and one missed-heartbeat drill.

## OBS-P2-009 — Most golden-signal and SLO metrics have no alert rules (latency, circuit breaker, auth failures, notification/webhook failures, worker jobs, queue depth)

Add rules: worker_task_executions_total{status=~'failure|error'} rate>0; worker_task_queue_depth > N or queue='unavailable'; portal_circuit_breaker_status==2; portal_auth_attempts_total{result='failure'} spike; notification/webhook failed-rate and dead-letter rate; p95 latency >2s/10m. Add promtool tests for each and run them in CI.

## OBS-P2-010 — HTTP metric labels use the raw request path, creating unbounded Prometheus series cardinality

Label with the Express route template (req.baseUrl + req.route?.path) or an allow-list of normalized routes; add a unit test asserting ids do not appear as labels.

## OBS-P2-011 — Web error tracking is silently disabled in production (code reads NEXT_PUBLIC_SENTRY_DSN; deploy provides SENTRY_DSN)

Pass NEXT_PUBLIC_SENTRY_DSN (Sentry DSNs are public by design) into the web image build and/or the web container env; add a boot warning in production when it is missing; update docs.

## OBS-P2-012 — Alerting configuration is not validated in CI and the deploy health gate ignores Prometheus/Alertmanager

Add a CI job running promtool check rules + promtool test rules (prometheus.rules.test.yml) and amtool check-config on a rendered template; extend the deploy gate to require prometheus and alertmanager healthy and assert up{job=~'mct-api|mct-worker'}==1 after deploy.

## OBS-P2-013 — Empty METRICS_TOKEN has no deploy guard and is documented as optional; it breaks the API scrape and fires a false service-down alert

Fail the prod deploy when METRICS_TOKEN is empty (mirror the watchdog guard), require a non-empty file, update the secrets matrix/env docs to 'required for monitoring', and assert up{job='mct-api'}==1 in the post-deploy health check.

## OBS-P2-014 — Alert delivery and the dead-man's switch are configured but never exercised end-to-end; no monitoring-of-monitoring rules

Dispatch one synthetic alert and record the ntfy delivery; run one missed-heartbeat drill and record the external page; add meta-alerts (rule-evaluation failures, Alertmanager notification failures) and a freshness check on the watchdog heartbeat.

## OBS-P2-015 — Container logs are not persisted off-box and are destroyed by the deploy's `compose down`

Ship logs off-box (DO agent/Loki/vector) or snapshot `docker compose logs` to an artifact before `down`; enable Caddy access logs with rotation; document the retention window in MONITORING_AND_ALERTING.md.

## OBS-P2-016 — No repository evidence of external uptime checks for platform endpoints; an edge/proxy failure is undetected in-stack

Add an external uptime check (DO Uptime, healthchecks-style probe, or blackbox_exporter) for https://api.<domain>/health and the app login page, delivered to the same ntfy topic, and record its configuration in MONITORING_AND_ALERTING.md.

## ORCH-P2-001 — docs/audits/README.md documents a run contract that contradicts the pack and the actual runs, and its Runs table omits all three repo-deep-dive runs

State one canonical contract in docs/audits/README.md (the pack's naming + finals, with the manual packs' shape called out as legacy), add all three repo-deep-dive runs plus REAUDIT_REPORT_20261004.md to the Runs table, replace machine-local evidence paths with repo-relative ones, and add a small guard that fails when a docs/audits/<pack>/<run>/ directory is not indexed.

## PERF-P2-001 — Request metrics label uses the raw URL path, so Prometheus cardinality grows with every resource ID

Normalize the label to the matched route template (e.g. compute the label in a middleware that runs after routing, or map req.path with a normalizer that replaces UUID/numeric segments and unknown paths with a bounded bucket), then add a recording/alert rule on prometheus_tsdb_head_series and a test asserting the label set stays bounded.

## PERF-P2-002 — Public storefront pages are force-dynamic and uncached; each page view costs two Supabase reads

Either add responseCache(60..300) to the public catalog routes (and invalidate on admin catalog writes), or switch the public store pages from force-dynamic to ISR (export const revalidate = 300) with on-demand revalidation after catalog edits. Add a test that a second page request is served from cache (X-Cache: HIT / static build).

## PERF-P2-003 — resolveEffectivePermissions is uncached and fans out 4–6 queries per gated request

Add a short-TTL cache keyed by (userId, orgId) with explicit invalidation on membership/role/override writes, plus request-scoped memoization so requirePermission + requireEntitlement share one resolution. Mirror the existing entitlementCache pattern (entitlement.ts:48) and record cache hit/miss metrics.

## PERF-P2-004 — Bulk invite performs 4 sequential Supabase calls per invite and cannot finish 500 invites inside the 30s request timeout

Cap the synchronous batch (e.g. 25-50) and enqueue the rest as a worker task, or batch the profile/membership lookups with .in() and create users with bounded concurrency; return a job id and progress. Add a test that asserts the endpoint returns within budget for the max accepted batch.

## PERF-P2-005 — Each SSE notification stream opens its own Supabase Realtime channel with no connection cap

Use one shared server-side subscription/fan-out (e.g. a single Postgres change listener or Redis pub/sub) and broadcast to local SSE clients, cap concurrent streams per process, add jittered reconnect backoff on the client, and fix the polling-fallback cleanup. Load-test with a few hundred concurrent EventSource clients before enabling RLS_READS_ENABLED for notifications.

## PERF-P2-006 — POST /billing/sync does not paginate Stripe results

Page through Stripe with starting_after/auto-pagination until exhausted (report the page cap as a failure, mirroring the jsm-sync fix), and batch the Supabase upserts (single multi-row upsert or a bounded-concurrency helper).

## PRIV-P2-001 — Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate

Gate GA/Tawk.to behind a consent manager: default-deny (Google Consent Mode v2 with analytics_storage denied by default), load the Tawk.to script only after opt-in, persist the choice, and expose a visible opt-out. Add a cookie table to the privacy page.

## PRIV-P2-002 — Consent is captured only in the browser and never recorded or enforced server-side; the store quote form collects PII with no consent at all

Add a `consent` (boolean) plus `consent_at`/`consent_version` to public_interactions (and the quote path), require and persist it server-side in POST /public/submit and POST /store/quotes, and add the consent checkbox + privacy link to QuoteBuilderClient.

## PRIV-P2-003 — Published retention statement (three years) contradicts the 90-day contact-form PII purge

Either align the policy text to the enforced 90-day platform purge (and state the retention of the Teams/JSM copies separately), or change the purge window to the published period. Add the platform retention schedule to docs and reference it from the policy.

## PRIV-P2-004 — Audit-log PII redaction is a shallow key-name filter; person names and job titles are persisted for 365 days

Replace the substring key filter with an explicit allowlist (or value-level scrubbing) that covers `name`/`title`/`job_title` and recurses into nested values; add a regression test that logs a metadata object with nested PII and asserts it never reaches audit_logs.

## PRIV-P2-005 — No data-subject access/export/erasure path or DSAR runbook; offboarding never removes profile or auth records

Add an operator runbook for DSAR handling (identity verification, export query set, erasure/anonymisation steps, response clock), implement an admin-triggered account deletion/anonymisation path (Supabase auth.admin.deleteUser + profile scrub), and record the procedure in docs.

## PRIV-P2-006 — Visitor IP addresses are sent to ip-api.com over plaintext HTTP for geolocation

Use an HTTPS-capable geolocation provider (or ip-api's paid HTTPS endpoint), or perform geo lookups only after consent; document the vendor and retention in the subprocessor list.

## PRIV-P2-007 — Privacy governance documentation set is missing and the published vendor list omits processors used in code

Create docs/PRIVACY.md (classification + retention schedule + DSAR pointer), docs/SUBPROCESSORS.md (vendor, purpose, data categories, region, DPA status), and a tenant-facing DPA template; link them from the privacy page and SECURITY.md.

## REL-P2-001 — `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta

Keep the per-commit changelog habit; consider a CI check that fails a PR touching apps/** without a CHANGELOG diff (or an explicit N/A label).

## REL-P2-002 — No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes

Extend the upgrade note to the full window (5302420-5302436), explicitly flag 5302432 (column drops) and 5302434 (anon grant removal), and add a 'no migrations in this delta' line to the delta's release notes. Keep the template's Migrations list as the per-release source of filenames.

## REL-P2-003 — No release-notes or GitHub Release body template; release body must be authored ad hoc

Exercise the template for the next promotion and attach the SBOM artifact to the resulting GitHub Release.

## REL-P2-004 — Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

Update section 4 to the manual flow: revert, then dispatch terraform-do with apply=true (dev auto-applies only via the gated weekly plan), and note the TF_DRIFT_PLAN_ENABLED gate.

## REL-P2-005 — Release docs claim `main` is far behind `develop`; the repo state is the opposite

Update docs/RELEASING.md:149 and AGENTS.md:100 to the current state (last promotion PR #168 @ 8d299b8d; origin/develop is an ancestor of main), keeping the backup-verification advice.

## RES-P2-001 — Worker process has no `unhandledRejection` handler

No code action; keep the log-and-continue semantics documented so a future edit does not turn every rejection into an exit.

## RES-P2-002 — `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ

Either pass an AbortSignal into handlers so WORKER_TIMEOUT cancels work (and document the semantics in docs/ENVIRONMENT_VARIABLES.md), and add a task_dead_letters table (type, payload keys, error, attempts, last_attempt_at) written from the consumer's failed handler plus a metric/alert. Suggested validation: a test that a handler exceeding the timeout is aborted and a permanently failing task lands in the dead-letter set.

## RES-P2-003 — `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work

No code action; keep the guard covered by tests (done).

## RES-P2-004 — External `fetch` calls without `AbortController` in `public.ts` and `auth.ts`

No code action; add a lint/test guard if desired so a new raw fetch without a timeout is caught in review.

## RES-P2-005 — Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery

Run and record the documented drill (docker compose stop alertmanager → confirm the external service pages within its grace period) with date/operator/result in docs/PLATFORM_FAILURE_RUNBOOKS.md §5, and fix the stale IR-P0-003 paragraph in docs/INCIDENT_RESPONSE.md:124-128. Confirm ALERTMANAGER_WATCHDOG_WEBHOOK_URL is provisioned in prod (deploy fails closed without it).

## RES-P2-006 — Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts

Record a dated restore drill (dispatch db-restore-test, or a full single-host restore to a scratch droplet per PLATFORM_FAILURE_RUNBOOKS §0) with operator/variant/result/evidence in the §5 table, and add a PITR exercise before claiming the 5-minute RPO.

## RES-P2-007 — Inbound webhook handlers ACK 200 while ignoring persistence errors, dropping events during DB degradation

Check the {error} of every write and return 5xx (releasing the claim) when a persistence step fails, or perform the state change through a single RPC; add a regression test that stubs a failing write and asserts a non-2xx response and a released claim.

## RES-P2-008 — Worker queue degradation is invisible to health checks and alerting

Expose a boolean queue-connectivity gauge (e.g. worker_queue_connected) and alert on == 0 for 5m plus a backlog-growth rule; optionally add a /ready endpoint (or 503 from /health) when the queue is disconnected so the compose healthcheck and deploy gate can act. Add a chaos test that stops Redis and asserts the alert fires.

## RES-P2-009 — Graceful shutdown is not effective in production: Redis handles are never closed and Docker's 10s stop timeout kills the worker before its 30s drain budget

Set stop_grace_period (>= WORKER_SHUTDOWN_TIMEOUT_MS, e.g. 60s) on the worker and API services; close scan-lock/idempotency/producer connections during drain and exit(0) explicitly on a clean drain; add an integration test that SIGTERMs mid-task and asserts a clean exit and no duplicate side effect.

## RES-P2-010 — Deploys are stop-the-world: `docker compose down` before `up` takes the whole stack offline with no rolling replace

Replace down/up with per-service recreate after a pre-pull (`docker compose up -d --no-deps api` etc.) so only one service restarts at a time, or schedule/document the maintenance window; keep the current rollback behavior.

## RLS-P2-001 — MSP platform-admin role keys missing from post-5302129 admin-gate RLS policies

Keep 5302436 as the canonical fix. Add the role-gate drift lint suggested in the 20261002 report (every r.key in (...) admin gate must be a superset of the 8-key platform set, or route through user_has_role) so the regression cannot recur.

## RLS-P2-002 — webhook_dead_letters has no user-scoped DELETE policy while the API deletes via the RLS client

Add a DELETE policy on public.webhook_dead_letters mirroring the update policy (endpoint org + webhooks:manage), or pin the two delete call sites to getSupabaseAdmin() explicitly; fix the AGENTS.md/review.md sentence to describe the conditional scoped-client behavior.

## RLS-P2-003 — approve_project_task / add_project_task_comment trust a caller-supplied user id and are granted to authenticated

None required; optionally add the RPC-abuse behavioral test from the 20261002 test plan so the guard cannot regress silently.

## RLS-P2-004 — API defaults to the service-role DB client (RLS bypass)

Keep the per-module rollout; additionally make the write allow-list non-empty a production boot requirement once the 17 write modules are confirmed, and add a per-module coverage assertion (see the partial-adoption finding) so the rollout can be audited from the repo.

## RLS-P2-005 — document_versions UPDATE policy still uses the raw unfiltered membership predicate

New migration: drop/recreate dv_update using public.is_org_member(document org) plus the documents permission vocabulary (mirror document_versions_insert_with_permission in 5302129:600-613, e.g. can_read_document(document_id) for read paths and documents:edit for the update). Add an effective-state predicate scan so pre-baseline leftovers are caught.

## RLS-P2-006 — store_quotes public INSERT policy allows arbitrary organization_id after tenant scoping

Replace the public insert policy with WITH CHECK (organization_id IS NULL) for anon/public (and keep service_role for org-scoped writes), or require is_org_member(organization_id) for org-tagged inserts. Add a behavioral test: authenticated user inserts with a foreign organization_id => denied.

## RLS-P2-007 — Auth write endpoints call GoTrue admin APIs through the RLS-scoped client

Use getSupabaseAdmin() (or a dedicated admin client) for auth.admin.* calls; keep getScopedClient only for table reads/writes (e.g. the profiles self-read at auth.ts:75). Document that 'auth' write scoping is unsupported.

## SBOM-P2-001 — SBOM is artifact-only: not release-bound, not commit-bound, not attested

Either attest the lockfile SBOM too (actions/attest-sbom with the commit subject) or upload it to durable storage/Spaces per run; if releases are adopted, attach sbom.cdx.json to the GitHub Release (REL-P1-001).

## SBOM-P2-002 — No container/image SBOM; base-image OS packages untracked

Keep. Add a validation step for the image SBOMs (new finding) and cover the third-party runtime images (new finding).

## SBOM-P2-003 — `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing

Keep the corrected wording; refresh the stale half of the same row (image SBOMs are emitted by build-push.yml — deploy-do.yml also emits them) per the new docs-drift finding.

## SBOM-P2-004 — No artifact provenance, attestation, or signing; `id-token: write` requested but unused

Keep; add --predicate-type checks and digest-pinned pulls (new finding).

## SBOM-P2-005 — License policy not enforced in CI; non-OSI and LGPL licenses present

Keep; enforce the exception package scope and expiry dates (new findings).

## SBOM-P2-006 — SBOM is generated but not bound to a commit or attached to releases/images

Keep; release attachment is not applicable until tags/releases exist (REL-P1-001).

## SBOM-P2-007 — Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions

Either document a triage SLA with a scheduled reminder (pattern: secret-rotation-reminder.yml) or add dependabot grouping/auto-merge for patch updates after CI passes; record the decision in docs/DEPENDENCY_POLICY.md.

## SBOM-P2-008 — `licenses.json` is committed but unenforced and unverified

Keep.

## SBOM-P2-009 — License exceptions are matched by license string only — documented package scope and UNKNOWN fail open

Match exceptions on (license string, package name): compare pkg.name against entry.packages and fail when a license is excepted for a different package. Treat UNKNOWN as a violation by default with per-package exceptions. Update the security/license-policy.json comment and docs/LICENSE_POLICY.md to match. Add unit fixtures for: new package with an excepted license string → fail; excepted package → pass; unlicensed new package → fail.

## SBOM-P2-010 — Exception `expires` dates are documentation-only and never enforced by the gates

Parse `expires` (ISO date) in both gates and fail (or ::warning:: + job-summary) when past due; add a CI test with a fixture policy whose date is in the past. Keep a documented renewal process in docs/LICENSE_POLICY.md and docs/DEPENDENCY_POLICY.md.

## SBOM-P2-011 — Deploy verifies the tag's attestation but pulls by mutable tag; the SBOM predicate is never verified

Have verify-attestations output the resolved digests and pass them to the deploy job; pull and run by @sha256:... (compose image with digest), or re-resolve + re-verify the digest on the droplet immediately after pull. Add --predicate-type checks for both SLSA provenance and the CycloneDX SBOM predicate, and validate the SBOM content.

## SBOM-P2-012 — No scheduled dependency vulnerability re-scan — advisories are only evaluated on PRs and deploys

Add a weekly scheduled job that runs `node scripts/audit-gate.mjs` (enforcing) or `--report` plus a deduplicated issue (pattern: secret-rotation-reminder.yml), or document explicitly that Dependabot security alerts are the compensating control and record the last triage date.

## SC-P2-001 — No image-level container scanning; Trivy scans filesystem only

No change required; keep Trivy DB caching and re-scan on base-image bumps (Dependabot docker entries already create those PRs).

## SC-P2-002 — No artifact provenance, attestation, or signing; `id-token: write` requested but unused

No change required for the current threat model. Optional hardening: add an independent cosign/SLSA verification note or move to SLSA Build L3 via a reusable build workflow (backlog).

## SC-P2-003 — License policy not enforced in CI; non-OSI and LGPL licenses present

No change required; enforce the `expires` dates (see the new expiry finding) so accepted exceptions are re-reviewed on schedule.

## SC-P2-004 — SBOM is generated but not bound to a commit or attached to releases/images

No change required. Residual (documented in docs/SBOM_PROCESS.md): the lockfile SBOM is artifact-only, not attached to a GitHub Release, because no tags/releases exist yet (tracked under REL-P1-001).

## SC-P2-005 — Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions

Triage/close the stale PRs (start with next-16.2.9, superseded by next-16.3.8), add a triage SLA or auto-merge for patch/minor behind required checks, and keep groups enabled.

## SC-P2-006 — `licenses.json` is committed but unenforced and unverified

No change required.

## SC-P2-007 — Swagger UI loads an unpinned third-party script without SRI

No change required; bump URL and both hashes in the same commit as documented in the file comment.

## SC-P2-008 — Deploy-gate secret scan is a no-op on pushes to main

No change required.

## SC-P2-009 — Secret scanning is diff-scoped only; no full-history scan artifact

No change required; add failure alerting (see the new notification finding).

## SC-P2-010 — Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it

No change required.

## SC-P2-011 — Scheduled full-history secret scan has no failure notification

Add a failure step to secret-history-scan.yml that posts to the same ntfy topic (NTFY_ALERTS_URL/NTFY_ALERTS_USER, Slack fallback) used by db-restore-test.yml, and include the run URL.

## SEARCH-P2-001 — Raw search terms persisted in plaintext `audit_logs.metadata`

No action required; document the fingerprint scheme and retention in the search module doc.

## SEARCH-P2-002 — Portal search omits documents despite SDK and documentation contract

Either add a visibility-respecting documents query to search-portal.ts + portal UI, or remove `documents` from the SDK type and correct API_ENDPOINT_INVENTORY.md; add a contract test.

## SEARCH-P2-003 — Admin search UI silently discards the documents result set

Add `documents` to the UI type, count and render a Documents group (and surface `counts`/`limit` while there); add an E2E assertion.

## SEARCH-P2-004 — No search pagination or result counts; hard 5-result ceiling

Extend `?limit`/counts to search-portal.ts, document `limit` in OpenAPI, add an optional limit argument + counts to the SDK, and surface a 'show more' affordance; consider an offset/cursor and note that `count: 'exact'` on five parallel queries costs extra DB work at volume.

## SEARCH-P2-005 — Search query analytics metric is dead and the analytics summary RPC is missing

Call the metric (and consider a hashed-term audit) in search-portal.ts, rename or relabel the counter to cover both routes, implement or replace `get_analytics_summary` (see SEC-P2-004), and refresh docs/MONITORING_AND_ALERTING.md.

## SEARCH-P2-006 — Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search

Add indexes for organizations.slug and documents.name, evaluate btree indexes for the prefix-only columns, and a `to_tsvector('english', ...)` generated column + GIN for ticket/project descriptions; validate with EXPLAIN on seeded volume.

## SEARCH-P2-007 — Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface

Add a dedicated single-column autocomplete endpoint or a search-specific limiter/short-TTL cache, and increase debounce/min-length for typeahead; consider dropping `count: 'exact'` for the typeahead path.

## SEARCH-P2-008 — Admin global search returns private/internal documents without applying the `can_read_document` visibility filter

Restrict the admin-search documents query to documents the caller may read (e.g. add a `can_read_document`-equivalent predicate or an RPC, or require `documents:manage` and still filter `private`), and add a regression test asserting a private document is not returned to a non-granted admin.

## SEARCH-P2-009 — Search router bypasses the org-pinned admin check, so a tenant admin can read another tenant's search results

Decide the trust model and make it consistent: either mount `requireOrgAccess` before `requireAdmin` on /search (or replicate the pin inside the handler) so a non-super admin cannot widen scope, or explicitly document `admin` as a cross-tenant MSP role and align audit/bulk. Add an integration test for tenant-admin + foreign organization_id.

## SEC-P2-001 — Worker monitoring checks are guard-then-fetch (DNS-rebinding TOCTOU); webhook path is pinned but uptime/website checks and SSL probe are not

Route uptime/website checks through pinnedFetch (or an equivalent pinned dispatcher) and pin the TLS socket in fetchSslExpiry to the validated address. Share a single SSRF/pinned-fetch module between apps/api and apps/worker so the guard cannot drift per call site.

## SEC-P2-002 — PII field encryption is additive: plaintext profile columns remain the source of truth and are still returned

Complete the cutover the migration scaffold describes: read through decryptProfilePii, run scripts/backfill-profile-pii.mjs, then drop or null the plaintext columns (or replace them with a keyed hash for lookup), and add tests proving plaintext is not persisted. If the cutover is deferred, document it as a dated plan and stop advertising field-level encryption as effective at rest.

## SEC-P2-003 — Global role catalog is mutable by any org's roles:manage holder (roles are not org-scoped)

Gate global role/permission mutations on a platform-admin check (is_super_admin profile, matching resolveAdminTenantScope's allTenants rule) or make custom roles organization-scoped. Audit-log the actor's org context for every catalog mutation.

## SEC-P2-004 — API-key scopes are stored but never enforced; keys act with the creating user's full permissions and always bypass RLS

Enforce req.apiKey.permissions in requirePermission (intersect with resolved permissions) or drop the column and document that keys inherit the creator's permissions. Add permissions to the create schema + admin UI if scoping is intended. Require a permission on GET /api-keys. Document the RLS-bypass for API keys.

## SEC-P2-005 — MFA enforcement is opt-in and the deployed default is false

Enforce aal2 for admin/super_admin roles specifically (a role-aware policy in lib/mfa.ts), or flip the production default to true and document the rollout in docs/MFA.md. Add an alert when an admin session is aal1.

## SEC-P2-006 — Secret scanner echoes the matched secret value into CI logs

None required; keep the awk-based filename-only output.

## SEC-P2-007 — Webhook SSRF guard has a DNS-rebinding TOCTOU window

Extend pinnedFetch to the monitoring paths; keep the shared guard.

## SEC-P2-008 — Client-onboarding mutations run without `requirePermission` (authorization outlier)

None required.

## SEC-P2-009 — MSP platform roles are cross-tenant for org access but not for permissions (inconsistent trust model)

None required; keep the two sets distinct and documented.

## SEC-P2-010 — Forgot-password email redirect still uses attacker-controlled `Origin` header

None required; extend the same resolver to sign-up (new P3 finding).

## SEC-P2-011 — `GET /analytics/summary` calls a `get_analytics_summary` RPC that no migration defines

Either add the missing SQL function (with an explicit platform-scope decision) or remove the endpoint and its OpenAPI entry; add a schema check that every RPC called by the API exists in migrations.

## SEC-P2-012 — RLS is bypassed on API requests by default (service-role is the default client)

Verify the deployed RLS_READS_ENABLED/RLS_WRITES_ENABLED secret values against the rollout doc, extend the startup check to fail closed for writes once the rollout completes, and document the API-key/platform-admin bypasses.

## SEC-P2-013 — CAPTCHA/Turnstile is bypassed when the secret is unset

None required.

## SEC-P2-014 — `/health` publicly discloses provider configuration and Redis errors

None required.

## SEC-P2-015 — Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin)

Use invitation links (inviteUserByEmail) or mark accounts unconfirmed until the invitee accepts; validate adminRoleKey against an allowlist (reject super_admin) and require an approval step for the first admin.

## SEC-P2-016 — `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets

None required; keep the deprecation note and audit new uses of isPlatformAdminKey.

## SEC-P2-017 — API keys store `expires_at` but nothing enforces or prunes expiry

Add a worker task (or DB job) that prunes/deactivates expired keys and surfaces them in the admin UI; add a test for the expiry rejection path.

## SEC-P2-018 — API keys cannot authenticate; the feature is dead

None required for authentication; enforce or drop the stored scopes.

## SECRET-P2-001 — Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered

Reconcile both documents with the workflow secret set; add a CI parity check that fails when a secrets.X reference has no inventory row; reclassify non-secret config forwarded as secrets (RLS_*, MFA_ENFORCEMENT_ENABLED, SMTP_HOST/PORT, EMAIL_FROM, *_SERVICEDESK_ID, *_REQUEST_TYPE_ID) as variables or mark them 'config'. Document DO_SSH_HOST_FINGERPRINT/DO_SSH_HOST_KEY and the DO_SSH_FINGERPRINT naming split.

## SECRET-P2-002 — Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation

Run one real (dev) rotation drill, record date/operator/secret/environment/run URL in the Rotation Log, and add a drill checkbox to the reminder issue body; consider a `last_rotated` column so the log can be checked mechanically.

## SECRET-P2-003 — Secret scanning is diff-scoped only; no full-history scan artifact

None required for the scan itself. Consider adding a failure notifier (owned by the SC domain) and referencing the latest artifact in release evidence.

## SECRET-P2-004 — Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it

None required. Add a pre-commit/CI check that no *.tfvars (non-example) is tracked if not already covered.

## SECRET-P2-005 — Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy

None required; include it in the rotation drill coverage.

## SECRET-P2-006 — Secrets rotation is documented but has no exercised evidence

Exercise one rotation per quarter on a dev secret, record the run URL in the Rotation Log, and treat a missing log entry as a failed control.

## SECRET-P2-007 — Incident response points at a secret-rotation runbook that is not in docs/

Publish the runbook at a stable path (e.g. docs/SECRET_ROTATION_RUNBOOK.md) and reference it from INCIDENT_RESPONSE.md and docs/INDEX.md; add INCIDENT_RESPONSE.md to the docs-link guard and convert backticked references to links.

## SECRET-P2-008 — Terraform plan artifacts carry sensitive variable values off the runner

Apply from the same protected job that plans (no artifact upload), encrypt the plan artifact, or move infra auth to short-lived OIDC credentials; if the artifact must stay, document the exposure and reduce retention. Add a CI check that no plan/tfvars artifact is uploaded unencrypted.

## SECRET-P2-009 — JWT rotation runbook rotates the API verification copy, not the Supabase signing secret, and references a nonexistent JWT_EXPIRY

Rewrite the procedure around the Supabase project JWT secret: rotate it in the Supabase dashboard (invalidates sessions), keep the app comma-list only for the deploy overlap, remove the old value after the window, and verify that a token signed with the old secret is rejected. Replace JWT_EXPIRY with the actual Supabase token lifetime and document the concrete force-logout mechanism.

## TEST-P2-001 — Accessibility gate width contradicts the code (docs say 19 pages, code scans 25)

Keep the guard; when promoting pages update all four docs in the same PR (the guard now fails otherwise).

## TEST-P2-002 — Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op

Add a table-driven apps/worker/src/__tests__/module-tasks.test.ts covering each uncovered handler's success/empty/error paths with mock rows, then raise the worker branch threshold (~25%).

## TEST-P2-003 — E2E flakiness is documented but unresolved, and the prod-only gate masks it

Add a Playwright JSON reporter plus a small flake summary step, quarantine the named data-dependent specs with owner/expiry, and record one successful dry-run of the prod E2E gate.

## TEST-P2-004 — Load tests exist but are manual-only with no enforced thresholds or failure injection

Add a manual/scheduled k6 workflow (against a staging URL) that runs the existing scripts, uploads results and fails on the documented thresholds; add Redis/queue/Supabase failure-injection tests.

## TEST-P2-005 — Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug

Keep this suite as the reference boundary/negative test for the destructive helper; consider the storage-integration fixture recommended earlier.

## TEST-P2-006 — Route suites stub authorization middleware, so new routes can regress silently

Keep the guard; add a new route family to the allowlist only with a comment (the test forces that review).

## TEST-P2-007 — docs/testing.md coverage-threshold table contradicts the ratcheted jest configs

Update docs/testing.md:34-39 to the current values and add a thresholds check (parse coverageThreshold.global from each jest.config.mjs) to scripts/check-docs-counts.mjs; add a short 'what `pnpm test:coverage` does NOT cover' section (no E2E, load, visual, migration or prod smoke).

## TEST-P2-008 — Test/suite totals in AGENTS.md and README are stale and never verified against the tree

Extend check-docs-counts.mjs to enumerate suite files per package (matching jest testMatch) and fail on drift; re-measure the test totals from a CI run and update AGENTS.md/README.md with the commit they were measured at.

## TEST-P2-009 — E2E is a required check on `main` but its PR path filter can leave it unreported

Either remove the paths filter from e2e.yml's pull_request trigger (matching test/lint/typecheck) or reconcile branch-protection/main.json; extend check-required-checks.mjs to flag required checks whose workflow is path-filtered.

## USE-P2-001 — Bulk document operations report success without per-item results (false success on partial failure)

Plumb the API's per-item results through the SDK and web actions; render 'X succeeded, Y failed' with the failed ids/errors, and never report the requested count as the result.

## USE-P2-002 — Ticket lists and dashboard counts silently stop at 25 rows (no pagination) in portal and admin

Paginate the list endpoints (page/limit + total) in both ticket centers, or fetch with limit=100 and add server-side paging; derive the stat cards from the API total.

## USE-P2-003 — Admin 'Delete Ticket' only closes the ticket; copy promises a restorable soft-delete and Restore is unreachable

Either call the DELETE endpoint behind the typed confirmation and implement a real tombstone/restore, or relabel the action 'Close ticket' and drop the soft-delete copy.

## USE-P2-004 — Ticket notification deep links 404 in the portal (/portal/tickets/* does not exist)

Map portal ticket notifications to /portal/support/<id> (admin keeps /admin/tickets/<id>), and add a link-resolution test for each module.

## USE-P2-005 — Notification surfaces swallow failures: preferences save silently fails and a failed list load renders a false empty state

Show an inline error + retry on load and save failure; only show the empty state when the load succeeded; align the copy with the save-button model.

## USE-P2-006 — NotificationBell SSE fallback leaks a 30-second polling interval per component instance

Store the interval id in a ref and clear it in the effect cleanup (and before starting a new one); or replace SSE with a reconnect-with-backoff + single poller.

## USE-P2-007 — Client-onboarding create swallows the redirect: success shows a cryptic error and invites duplicate records

Rethrow redirect errors (or move redirect outside the try/catch) as done elsewhere; add a test that asserts navigation after create.

## USE-P2-008 — Onboarding checklist items cannot be completed anywhere in the web app

Wire the checklist PATCH into the portal/admin onboarding detail (checkbox + notes + completed_by), or seed items and provide an admin completion control.

## USE-P2-009 — Session/MFA expiry has no user-facing explanation and the ?mfa=required step-up redirect is ignored

Add ?reason=expired copy on /login and a visible 'Verify to continue' step-up banner (challenge+verify for any verified factor) when ?mfa=required is present.

## USE-P2-010 — Privileged membership/approval actions lack confirmation and success feedback (suspend/reject are one click)

Use ConfirmDialog for status transitions that remove access, and return a success/error result rendered as a toast or inline message.

## USE-P2-011 — Change Password form collects a Current Password it never checks and advertises a weaker rule than the API enforces

Remove the unused field or actually verify it (Supabase reauth), display the real strength rules up front, and reuse one shared password-policy component on signup/reset/profile.

## UX-P2-001 — Ticket-card bulk selection nests a checkbox and a status button inside a Link, so ticking a ticket also navigates

Move the checkbox and the status control out of the Link (card as a div with a title-only link or a stretched-link overlay) or add an onClick that calls preventDefault/stopPropagation on the controls. Add a Playwright regression test that clicks the row checkbox and asserts the URL is unchanged and the selection count updates.

## UX-P2-002 — Inline async action errors are not announced by assistive tech in ~44 components, contradicting the documented convention

Adopt a single InlineError primitive with role="alert" (or route action failures through useToast().pushToast('error', ...)), then sweep the ~44 call sites. Add a lint rule or code-review checklist item for new error renders.

## UX-P2-003 — Several dialogs have no max-height or internal scroll, so tall forms are clipped on small viewports

Add 'max-h-[90vh] overflow-y-auto' (or the overlay-scroll pattern) to every dialog, and fix the shared @mct/ui Dialog once so DocumentShareClient inherits it. Add a Playwright viewport test (e.g. 375x667) that opens each modal and asserts the submit button is visible.

## UX-P2-004 — 89 of 319 pages have no page-specific title (79 dynamic detail pages + 10 static), so browser and AT titles are generic

Add generateMetadata to detail routes (ticket subject, asset/record name, org name) and explicit titles for the five auth pages. Add a test that walks the route table and asserts a non-default title per route (the existing scripts/check-docs-counts.mjs already parses route counts and could host the check).

## UX-P2-005 — @mct/ui primitives are largely bypassed: 6 files import Button, 1 uses Input/Dialog/Badge, while the app hand-rolls 234 raw cyber-button* usages and four Chip copies

Pick one standard and enforce it: adopt Button/Input/Dialog in a pilot module and move Chip/ConfirmDialog/StatusPill into @mct/ui, or document that raw cyber-* utilities are the standard and delete the unused exports. Add a lint guard for new raw cyber-button* usages in new files.

## WH-P2-001 — M365 inbound notifications have no enforced timestamp/replay window

Preserve the claim TTL when marking the key done — e.g. storeIdempotencyKey(key, "done", ttlSeconds) with the same M365 window (or use claimIdempotencyKey's value update), and extend the test to assert the final TTL after a successful M365 request.

## WH-P2-002 — Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic

No action; keep the single-retry-owner rule when changing retry semantics.

## WH-P2-003 — Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter

Add a Prometheus rule on portal_webhook_dead_letters_total / failed-rate once alert thresholds are agreed.

## WH-P2-004 — Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent

No action; keep the fail-closed contract if the body parser is refactored.

## WH-P2-005 — `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client

Add a DELETE policy mirroring the insert/update policy (webhooks:manage or admin-role scoped) in a new migration, and add an RLS-client test asserting the delete removes one row for a non-super-admin org admin.

## WH-P2-006 — No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit)

Mount a tighter per-route JSON limit for /api/v1/webhooks/* (e.g. 256kb-1mb) and add per-provider Zod schemas that reject unknown/oversized payloads before side effects; consider a modest IP rate limit on inbound webhook paths.

## WH-P2-007 — Webhook endpoint and delivery reads are available to any org member (not manage-gated)

Add requirePermission('webhooks', 'view') to the read routes (list, get, deliveries, dead-letters) and cover it in the route tests; consider redacting request_body/response_body for view-only callers.

## WH-P2-008 — Webhook signing secrets are stored plaintext with no rotation or expiry

Document outbound endpoint secrets in SECRETS_ROTATION.md (90-day cadence, rotate via PATCH), add last_rotated_at + optional expiry and a rotation reminder, and consider encrypting the column at rest with FIELD_ENCRYPTION_KEY.

## WH-P2-009 — Webhook SSRF guard has a DNS-rebinding TOCTOU window

No action; add a regression test that a hostname re-resolving to 127.0.0.1 between guard and connect is still blocked.

## WH-P2-010 — No alerting when webhook dead-letters accumulate or payment reconciliation drifts

Add Prometheus rules: portal_webhook_dead_letters_total increase over 15-30m > 0 (warning) and sustained failure ratio > 50% (critical), routed via the existing Alertmanager receivers.

## WH-P2-011 — Admin dead-letter retry of inline-dispatched failures no-ops and deletes the DLQ row

Make retry truthful: keep the DLQ row until the retry task reports an actual attempt, and have webhook-retry re-insert a DLQ row (with a reason) when it skips a no-data row; alternatively have the inline dispatcher persist the replayable payload (or mark such rows as non-replayable and disable Retry in the UI).

## WH-P2-012 — `webhook-retry` has no row claim: concurrent retry runs can double-send deliveries

Claim each row atomically before sending (UPDATE ... SET next_retry_at = now() + lease WHERE id = ? AND retry_count = ? / SELECT ... FOR UPDATE SKIP LOCKED), or claim the delivery idempotency key in the retry path; add a concurrency test with two overlapping webhookRetry calls.

## ACM-P3-001 — Client-side permission hiding is UI-only for several module actions

Keep UI hiding as defense-in-depth and add the mutating-route guard-coverage CI test with an explicit allow-list after the ai/webhook gaps are resolved.

## ACM-P3-002 — No catalog-lint: referenced permission keys are not checked against the `permissions` table

Add permission-catalog.test.ts parsing requirePermission("a","b") and RLS user_has_permission(_, 'a','b') strings and asserting membership in the migration catalog; run it in CI.

## ACM-P3-003 — Public route surface is broad and has no single documented inventory

Generate a public-endpoints section from openapi.yaml (security: []) into docs, and add a test asserting every mutating route not on an allow-list is behind requireAuth.

## ACM-P3-004 — `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate

No action needed for roles; keep /me/permissions self-scoped and covered by tests.

## ACM-P3-005 — RLS policies reference `manage` permissions that no role holds (dead predicates)

Delete the dead clauses or add the intended permissions + grants deliberately; the catalog-lint test (ACM-P3-002) should cover RLS references so the set is machine-checked.

## ACM-P3-006 — `GET /api-keys` lists org keys for any org member (no `api-keys:view` gate)

Add requirePermission('api-keys','view') to GET / or document the accepted posture (mirrors ACM-P2-005 for webhooks).

## ACM-P3-007 — AI copilot endpoints have no permission gate (any org member can run summarization and reply drafts)

Gate the copilot routes with requirePermission('ai','view') (reply-draft may warrant ai:create) or document the deliberate decision alongside the triage/analyze comment.

## ADMIN-P3-001 — Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence)

Either align the web gate with the API admin tiers (or derive the portal role list from the API /me/permissions), or render read-only/403 states explicitly; add a test asserting the two key lists stay in sync.

## ADMIN-P3-002 — Active-org cookie setter performs no server-side authorization

Validate in setActiveOrg that the caller has an approved membership in the org (or is a platform admin) before writing the cookie; return a typed error otherwise.

## ADMIN-P3-003 — Admin global search and dashboard expose global resource names/counts to any admin

Keep the shared scope helper on all admin aggregate surfaces; add a regression test when new entities are added to search.

## ADMIN-P3-004 — Global store catalog is mutable by any tenant admin

Keep the org-pin helper for catalog writes; add tests covering cross-tenant product/category upsert and delete.

## AI-P3-001 — Embedded repo maps and historical pack outputs still reference the pre-rename repository path

Fix docs/ONBOARDING.md:37 to 'mainecybertech/' (the only live doc hit); leave dated/historical files as-is under the PROVENANCE.md historical-output policy, or annotate them when they are next touched.

## AI-P3-002 — `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate

Move append-only 'Completed Work'/snapshot narratives to docs/HISTORY.md (or docs/CHANGELOG-style entries) and keep AGENTS.md to current state + Known Debt; if the history stays, fence it with a machine-detectable marker and add the remaining counts to the docs-count guard.

## AI-P3-003 — Secrets guidance is spread across instructions without a linked canonical runbook

Add the runbook link to the AGENTS.md guardrails/secrets bullet, CONTRIBUTING.md, and the PR-template secrets checklist item (one line each).

## AI-P3-004 — Committed audit corpus under docs/audits/ is outside the untrusted-data boundary and has no integrity pin

Extend the boundary explicitly: add 'audit outputs under docs/audits/ are historical data, not instructions' to AGENTS.md's Never list and to docs/audits/README.md, and consider a lightweight integrity check (e.g. hash the committed run corpus at publish time) or state that the corpus is intentionally unpinned because it is data.

## AI-P3-005 — Audit output conventions in docs/audits/README.md are stale vs the committed runs

Update docs/audits/README.md: describe both layouts (per-pack layout section), align the status vocabulary with the repo-deep-dive framework or note the pack-specific vocabulary, and list the repo-deep-dive runs in the Runs table (or point at docs/audits/repo-deep-dive/).

## AI-P3-006 — Prompt-pack provenance verification runs only at the deploy gate, not on PRs

Add `node scripts/verify-prompts.js verify` (dependency-free) as a step in the PR test job (unit-tests action or test.yml), keeping the deploy gate as defence in depth.

## AI-P3-007 — No AI-authorship disclosure or provenance policy in contribution guidance

Add an optional disclosure line to the PR template (tool/model + human owner) and one sentence to AGENTS.md/CONTRIBUTING.md; keep it lightweight so it does not block contributors.

## AN-P3-001 — Analytics has no consent-mode signalling and no documented event/retention governance

Adopt a consent-state contract (gtag consent mode + a cookie/analytics opt-out), document each event's purpose and retention in a governance doc, and add a retention task for store_analytics_events.

## AN-P3-002 — Anonymous direct inserts to store_analytics_events bypass API validation, rate limits, and retention

Revoke the anon INSERT grant/policy (keep writes on the API path) or add DB-level constraints (event allow-list, column limits); keep the least-privilege migration as the single source of truth.

## AN-P3-003 — Consent is not recorded and the privacy policy omits first-party tracking stores and opt-out mechanics

Persist consent (flag, timestamp, policy version) on the interaction/lead record, add a cookie/analytics opt-out to the public site, and document the first-party tracking stores and their retention in the privacy policy.

## AN-P3-004 — Error telemetry has no explicit PII scrubbing, retention, or vendor disclosure

Set sendDefaultPii:false explicitly, add a beforeSend scrubber for PII fields, document Sentry (and any other error processor) in the vendor list with retention, and add a test that error payloads drop email/phone/IP.

## API-P3-001 — Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`)

Return failure("RATE_LIMIT", ..., 429) from all limiters, envelope CSRF/idempotency/timeout errors, align docs/API_RATE_LIMITING.md, and either adopt or delete lib/pagination.ts while converting remaining raw capped arrays.

## API-P3-002 — OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes

Embed the source commit (GIT_SHA) and generation date in docs/openapi.yaml; fail or allowlist EXTRA entries; update AGENTS.md:589 (and consider extending check-docs-counts.mjs to it).

## API-P3-003 — Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling

Add an auth_expired listener (redirect to login) and bounded reconnect-with-backoff for onerror, close polling once reconnected, and clear the fallback interval in the effect cleanup; document the stream's disconnect contract.

## API-P3-004 — `/metrics` is fully public when `METRICS_TOKEN` is unset

None required.

## API-P3-005 — Batch Jira/JSM/M365 sync tasks are registered but never dispatched (no scheduler or enqueue path)

Either add a scheduled scan with explicit per-tenant payload (project/organization) or an admin-triggered enqueue endpoint/runbook, and correct docs/JIRA_JSM_INTEGRATION.md to match the chosen dispatch model.

## API-P3-006 — M365 calendar sync recreates a calendar event for every task on each run (duplicate events, no idempotency)

Persist the created Graph event id per task and PATCH it on re-sync, or send a stable transactionId and reconcile existing events before creating; add a re-run test asserting no duplicates.

## API-P3-007 — M365 inbound webhook acknowledges but only processes the first notification of a batch

Iterate value[] and dedupe/audit each notification (aggregate the response), or explicitly document why only the first is processed; add a multi-notification test.

## ARCH-P3-001 — Web middleware gates routes on an unverified JWT `exp`

Keep the comment and add a unit assertion that no page or server action reads authorization state from middleware; if a true edge gate is ever wanted, verify the signature in middleware or move to a signed session cookie.

## ARCH-P3-002 — Architecture diagram and ADR 004 contradict the as-built runtime

Regenerate docs/ARCHITECTURE_DIAGRAM.md from the compose file and terraform; supersede ADR 004 with the Redis-backed cache decision; rewrite docs/PRODUCTION_VS_TESTING_DOMAINS.md for the droplet topology (overlaps INFRA-P2-005, owned by the infra domain).

## ARCH-P3-003 — `NEXT_PUBLIC_API_URL` runtime override is inert for server-side code; docs claim internal SSR routing

Read a server-only variable (e.g. API_INTERNAL_URL) at runtime for server-side code and keep NEXT_PUBLIC_API_URL for the browser only; or correct the docs and remove the inert compose value. Validate by logging the resolved base URL from the running web container.

## ARCH-P3-004 — Request timeout returns 408 but never cancels the handler

Either thread an AbortSignal into handlers and abort downstream work, or document that the 408 is advisory only and require Idempotency-Key on mutating routes; add a regression test asserting a mutation after 408 is not applied twice.

## ARCH-P3-005 — Worker metrics/health are unauthenticated while the API gates /metrics

Gate the worker /metrics with the same METRICS_TOKEN check (or bind the metrics listener to a separate authenticated port) and add the authorization block to the Prometheus worker scrape; keep /health minimal.

## BILL-P3-001 — Webhook raw body typed as `string` but consumed as `Buffer`

Capture req.rawBody as a Buffer (buf), type it consistently, and pass it to constructEvent without the cast; add a byte-mutation signature test.

## BILL-P3-002 — Billing email stored in plaintext and raw Stripe payment-method id rendered to users

Encrypt billing_email with the existing field-encryption helper (or store it in the encrypted PII pattern), and display a card brand/last4 descriptor fetched from Stripe instead of the raw pm id.

## BILL-P3-003 — `invoice.paid` paid_at handling writes epoch dates (sync) or throws when status_transitions is missing (webhook)

Guard both branches (paid_at = status_transitions?.paid_at ? new Date(paid_at*1000) : null) and add tests for paid invoices with and without status_transitions.

## BILL-P3-004 — Payments list uses an inner join, hiding payments not linked to an invoice

Use a left join (`invoices(invoice_number, status)`) so unlinked payments still list with a null invoice column.

## BILL-P3-005 — Entitlement override cannot revoke all modules (all-disabled falls back to the subscription set)

Treat the existence of provisioned rows (enabled or not) as an explicit override, or store an override flag; add a test for the all-disabled case.

## BILL-P3-006 — Subscription mirror ignores seat quantity and the billing summary excludes trialing plans

Persist item quantity and billing interval (or the computed total), use the shared isSubscriptionActive predicate in the summary, and render the billing period from stored interval data.

## BILL-P3-007 — Portal 'Sync from Stripe' button is shown to client roles that lack billing:manage

Hide/disable the button unless the caller holds billing.manage (or return a typed 403 the UI explains).

## BILL-P3-008 — Billing docs contradict the implementation (sync gate, webhook verification, reconcile source, payment statuses)

Refresh docs/BILLING.md and docs/modules/billing.md to the implemented behavior, including STRIPE_WEBHOOK_SECRET and the refund statuses.

## BP-P3-001 — Hotfix and emergency-deploy documentation is a stub and partially stale

Replace the stub with a real runbook (or link a new docs/RUNBOOK_EMERGENCY_MERGE.md): branch from main, scope limit, required reviews incl. CODEOWNERS, which gates may be skipped and why, approval record, backport to develop, post-incident review.

## BP-P3-002 — Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks

Add a triage SLA and owner to docs/DEPENDENCY_POLICY.md, label/route security updates (or enable Dependabot security updates + code scanning alerts), and optionally add a required-check reminder link. Keep the PR-template link to the required-checks table.

## BP-P3-003 — Operator checklists disagree on which prod environments need required reviewers (`prod` vs `prod-approval`)

Name both environments in docs/RELEASE_GATE.md's reviewer item, or complete the suggested migration of supabase-migrations to prod-approval once its environment-scoped secrets are confirmed there (GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:12-14).

## BP-P3-004 — check-required-checks guard mis-models explicit job names combined with matrices

Expand matrix values when building explicit job names, or restrict the guard to job ids and document the limitation; add a fixture test with a name+matrix job.

## BP-P3-005 — No CODEOWNERS validation; invalid team handles silently disable owner-review enforcement

Add a CI check that parses CODEOWNERS and verifies each @org/team handle exists (e.g. `gh api orgs/MaineCyberTech/teams/<slug>` with an administration:read token) plus a syntax check (codeowners-validator or equivalent); document required team membership.

## CI-P3-001 — actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015)

Quote the remaining GITHUB_OUTPUT appends (or write with printf), and add an actionlint (+ optionally zizmor) job to validate.yml/test.yml pinned by SHA.

## CI-P3-002 — Over-broad workflow token permissions (unused write scopes)

No change; continue scoping writes per job.

## CI-P3-003 — StrictHostKeyChecking=no in the deploy health check

No change; refresh DO_SSH_HOST_KEY when the droplet is rebuilt (already documented in the step comment).

## CI-P3-004 — `main` is far behind `develop`; scheduled jobs fire only from the default branch

Retire the dispatcher (or the duplicate schedule blocks) — see the backup-dispatcher finding; docs/RELEASING.md:149 still says main is behind develop and should be updated.

## CI-P3-005 — Secret scanner misses the platform's own token formats and scans diffs only

Extend the diff scanner patterns (or run gitleaks on the diff with the default ruleset) and document the coverage in docs/CI.md.

## CI-P3-006 — Unused permission grants across deploy/test workflows

Drop `security-events: write` from test.yml (or actually upload the SARIF to code scanning) and drop `pull-requests: write` from terraform-do.yml (or delete the unreachable step).

## CI-P3-007 — DB restore test uses an unpinned `postgres:16-alpine` image

Pin the image by digest (and add a Dependabot docker entry or a scheduled digest-refresh comment) or install a pinned postgres package.

## CI-P3-008 — No release/tagging workflow and no post-merge release artifact

Add a small release workflow (on prod promotion: create an annotated tag from VERSION+date, attach the SBOM and a release-notes body from templates/RELEASE_NOTES_TEMPLATE.md) or record the owner decision to stay SHA-only.

## CI-P3-009 — e2e is required on `main` but the documented flakiness makes it an unstable hard gate

Quarantine or retry the flaky specs, then keep E2E required; document the triage path in docs/CI.md.

## CI-P3-010 — Missing per-job timeouts and minor workflow hygiene gaps

Add explicit timeout-minutes to every job (5-15 for lint/typecheck/audit, 30-60 for terraform/migrations); keep command_timeout on the SSH steps as the inner bound.

## CI-P3-011 — Workflow documentation drift: docs list a removed workflow, omit a live one, and misstate gate behavior

Regenerate the workflow tables in docs/CI.md, README.md, AGENTS.md and review.md from the current 20-file inventory; add a doc check that cross-references .github/workflows filenames (extend scripts/check-docs-links.mjs or add a small script to validate.yml).

## CI-P3-012 — Badge/report generation is a stub and is not wired into CI

Either delete the stub scripts or implement a real report step (e.g., coverage summary and test counts) wired into validate.yml with an uploaded artifact; document it in docs/CI.md.

## CTR-P3-001 — Missing `--start-period` on API and Worker Healthchecks

Keep; add --start-period to the image-level healthchecks for parity with apps/web/Dockerfile:73.

## CTR-P3-002 — Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files

Narrow the patterns to known-unneeded paths (docs/, **/README.md, CHANGELOG.md) or add explicit ! re-includes for build-relevant files; add a build-time assertion for expected public assets.

## CTR-P3-003 — Caddy runs with a writable rootfs and a writable Caddyfile bind mount

Mount the Caddyfile :ro, set read_only: true with tmpfs: [/tmp] (state is in the volumes), and consider user: caddy if the image can bind 80/443 with the granted capability.

## CTR-P3-004 — Prometheus has no healthcheck and observability is outside the deploy health gate

Add healthcheck: wget -qO- http://localhost:9090/-/healthy (30s interval, 20s start-period) and extend the compose gate or add a post-deploy probe covering prometheus/alertmanager/redis/caddy.

## CTR-P3-005 — Image-level HEALTHCHECK for api and worker lacks `--start-period`

Add --start-period=20s to both image healthchecks for parity with web and compose.

## CTR-P3-006 — infra/digitalocean operator docs and `.env.example` drift from the deployed stack

Update the README service table + supporting files, sync .env.example with the compose env keys, and correct the handbook mem_limit (secret-matrix portion cross-refs SECRET-P2-001).

## CTR-P3-007 — Third-party pinned images are not vulnerability-scanned in CI

Add a scheduled + workflow_dispatch job that pulls the four pinned refs and runs Trivy (CRITICAL,HIGH, exit-code 1), reporting through the existing alerting path; keep Dependabot for bumps.

## CTR-P3-008 — No Dockerfile lint gate in CI

Add a SHA-pinned hadolint (or docker buildx build --check) step to the PR/validate gate and document the expected rules.

## DATA-P3-001 — Pre-baseline policies created without a preceding `drop policy if exists`

Backfill drop-pairing into the affected historical files or document the exemption in docs/migrations; keep the 5302427 baseline.

## DATA-P3-002 — Migration version gaps undocumented; brief states 141 migrations, tree has 127

Add a migration-history table to docs/migrations listing retired/skipped versions and the reason.

## DATA-P3-003 — Retention purge boundary behaviour is untested; the mock ignores the age cutoff and the PII purge has no tests

Make the mock honour `.lt(col, cutoff)` and seed mixed fresh/expired rows on both sides of the boundary; add tests for public-interaction-retention (90d) with the same mixed fixtures.

## DATA-P3-004 — Status-like text columns are not constrained by CHECK/enum, so app vocabulary is not enforced by the DB

Add CHECK constraints or enum types per status vocabulary (or generate them from the Zod enums); prioritise the newest module tables and any status used for workflow routing.

## DATA-P3-005 — No down-migrations and destructive migrations lack rollback notes despite the repo's own naming guide

Add `-- Rollback:` blocks (re-create dropped tables/columns, re-grant) to destructive migrations and document the no-down-migration policy in docs/migrations.

## DATA-P3-006 — Generated DB types carry no commit/version binding

Embed the migrations digest (or commit SHA) in the generated header and assert it in --check.

## DET-P3-001 — [SEC] gitleaks not installed (secret scan skipped)

Install gitleaks in CI to enable the secret scan.

## DET-P3-002 — [SUPPLY] 3 container image(s) without a digest pin

Pin images by digest (`image@sha256:...`) for reproducible, tamper-evident deploys.

## DOC-P3-001 — Dated point-in-time audit reports are mixed with current runbooks with no archive/staleness marker

Add a 'historical — superseded' banner to each dated audit run directory and list all runs in docs/audits/README.md; replace machine-local paths; point incident-doc references at living runbooks (or the explicit audit path) and add a guard/lint that flags machine-local paths under docs/.

## DOC-P3-002 — `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence

Update the Worker section to describe the dispatcher (BullMQ in prod, inline default in dev, SQS legacy) and the real main.ts size.

## DOC-P3-003 — Migration/workflow/OpenAPI counts drift in README.md, docs/ONBOARDING.md and the endpoint inventory, and the count guard does not cover them

Correct to 134 migrations / 20 workflows / 418 paths and extend scripts/check-docs-counts.mjs to parse README.md and docs/ONBOARDING.md (or drop the hardcoded numbers).

## DOC-P3-004 — docs/MONITORING_AND_ALERTING.md contradicts the now-wired metrics and the fail-closed /metrics gate

Mark the five metrics 'live', describe the fail-closed gate ('404 unless METRICS_TOKEN is configured and presented'), note the Prometheus credentials-file dependency, and fix the memory table.

## DOC-P3-005 — docs/TROUBLESHOOTING.md and docs/ONBOARDING.md name wrong deploy secrets/containers and stale memory limits

Correct the secret name, prune order, memory figure and container names in both docs.

## DOC-P3-006 — docs/audits/README.md index omits the committed repo-deep-dive runs and its naming contract does not match them

Add all runs (with pack + date + commit) to the Runs table, update the layout contract to the pack's actual file set, and mark the dated runs historical.

## DOC-P3-007 — scripts/README.md omits 14 scripts, including every CI guard script

Regenerate the script index from the directory (or add a CI check that every scripts/* file is mentioned).

## DOC-P3-008 — AGENTS.md production compose table omits the alertmanager service

Add the alertmanager row (internal port 9093, mem 128m) to the table.

## DOC-P3-009 — Migration naming docs contradict each other and the repo's actual 5302xxx sequence

Pick one convention (the sequential 5302xxx form that practice uses) and align naming-guide, SUPABASE_MIGRATION_WORKFLOW and technical-writing/migration-guide; add a guard that rejects new files outside the chosen pattern.

## DR-P3-001 — Platform DR drill plan is only in a dated audit folder and the drill ledger is empty

Move the drill plan to a stable path (e.g. docs/runbooks/backup-restore-drill-plan.md) and fix the references; keep a dated drill ledger (docs/PLATFORM_FAILURE_RUNBOOKS.md table) and record the first green db-restore-test run URL plus a manual restore drill as the first entries.

## DR-P3-002 — Duplicate backup-script logic in bash and PowerShell risks drift

Make the PowerShell helper delegate to the bash script (WSL/Git Bash) or delete it; if kept, add a parity test/checklist.

## DR-P3-003 — Unpinned Postgres image in the restore test; no explicit jq/aws tool pinning in the backup job

Pin postgres:16.x-alpine by digest, document the required client version, and pin aws/jq or note the runner-provided versions.

## DR-P3-004 — Documented backup/DR export endpoints do not exist

Update docs/modules/backup-dr.md to the real routes and mark the export as not implemented (or implement it); add a doc/route consistency check.

## DR-P3-005 — Terraform state restore guidance lacks a tested procedure

Correct the bucket names, document the exact version-restore commands, and run a state-restore drill (D6) recording the result.

## EVOL-P3-001 — Feature flags are a hardcoded static map with no managed service, change log, or targeting

Either delete feature-flags.ts and document that flags are not used, or move flags to a managed store/versioned config with an audit log and tenant/percentage targeting plus a kill switch; add a test that any flag referenced by code exists in the catalog.

## EVOL-P3-002 — No catalog-lint: referenced permission keys are not checked against the permissions table

Add scripts/check-permission-catalog.mjs (CI) that extracts requirePermission literals and factory permissionModule values from route sources and fails when a key pair is absent from the migrations catalog; include the web-side permKey() usages; document the one intentional unguarded module (camera-calc) in an allowlist.

## EVOL-P3-003 — No committed event catalog or webhook documentation for consumers

Publish docs/EVENTS.md (or a generated catalog artifact) with event names, payload schema, sample delivery and retry/DLQ semantics; generate it from the same catalog introduced for the finding above; correct the M365 section of docs/modules/webhooks.md.

## EVOL-P3-004 — API versioning policy is documented but not enforced (no Sunset/Deprecation mechanism; spec version unrelated to the app version)

Implement a deprecation middleware that emits Sunset/Deprecation headers from route metadata, tie OpenAPI info.version to the release version, add a breaking-change checklist to the release template, and decide (ADR) whether an external SDK is in scope.

## EVOL-P3-005 — Config model is duplicated per app; there is no shared env-schema package

Extract @mct/config/env with shared schema fragments (supabase, smtp, sentry, integrations) and per-app composition; add a CI test that every key in the API/worker schemas is written by deploy-do.yml (and vice versa); generate docs/ENVIRONMENT_VARIABLES.md from the schemas.

## EVOL-P3-006 — Shared-package extraction is deferred: @mct/sdk and @mct/ui are source-only, and DB client setup is duplicated

Record an ADR deciding package-extraction scope; at minimum extract a shared Supabase client factory (@mct/db) and add a build step to @mct/sdk; consider generating the sub-API wiring from the module manifest.

## EVOL-P3-007 — Migration-strategy docs contradict each other and the tree (ISO vs sequential naming; seed.sql references)

Pick one convention (the 5302xxx sequential prefix the tree actually uses), correct the naming guide and cheatsheet, and add scripts/check-migration-naming.mjs to CI (unique, monotonic prefixes; no duplicate numbers; documented gaps).

## EVOL-P3-008 — Roles, plan-to-module mapping, and status vocabularies are hardcoded with no parity guard

Make catalogs single-sourced: generate role-key constants from the catalog migration (or assert parity in a test), add a plan→module mapping table/config instead of two code sets, and move shared status enums into @mct/sdk with server-side zod validation plus DB check constraints.

## EXEC-P3-001 — Committed portal-alignment gate outputs disagree and bind no verifiable SHA

Add a `historical: true` + `not_a_release_decision` marker (and full 40-char SHA when known) to both JSONs, or remove the outputs from the pack; if the engine is re-run, write the full SHA and a run id.

## FEAT-P3-001 — OpenAPI/Swagger surface is public and its UI is blocked by the API CSP

No change required. Residual (tracked as API-P3-002): the committed openapi.yaml is not commit-bound; keep regenerating it in the same PR as route changes.

## FEAT-P3-002 — Eleven admin Store pages are static JSON views with disabled 'Coming soon' actions but appear as first-class admin-nav features

Mark these nav entries/read-only pages explicitly (badge or disabled nav with a status note) or hide them behind a feature flag until endpoints exist; document in docs/modules/store.md which store pages are DB-backed vs bundled-JSON; implement minimal CRUD for the highest-value ones (lead magnets, SEO pages) if the features are wanted.

## FEAT-P3-003 — Duplicate scorecard docs; one documents a nonexistent /api/v1/scoreboard API and four tables

Delete scoreboard-gamification.md (or rewrite it to the real edu-automation/scorecards surface), correct the schema list in scoreboards-gamification.md, and add the doc-link guard (docs/INDEX.md) to flag docs that reference routes/tables that do not exist.

## FEAT-P3-004 — `portal_module_settings` is an orphaned table: per-org module configuration is never read or written

Either implement the per-org module settings API/UI on top of the table (it already has RLS) or drop the table and remove the seeding; document the entitlement derivation as the single source of module enablement.

## FEAT-P3-005 — Dead server action `updateProjectBasics` remains exported but is never imported

Delete updateProjectBasics (and its test mock) or wire it into the project detail page as intended.

## FEAT-P3-006 — Ticket status has no transition validation; any state can jump to any other

Define a transition map per module (tickets first) and reject invalid transitions with 409; record status transitions as distinct audit events; surface only allowed next states in the admin UI.

## FEAT-P3-007 — 2026-08-05 module audit docs still list fixed bugs and dead navigation as current

Add a dated status banner to docs/MODULE_AUDIT.md and docs/MODULE_SPECS_GAP_AUDIT_2026-08-05.md (or move them under docs/audits/) and reconcile the confirmed-bug table with per-row status; overlap with the previous register row DOC-P3-001 (dated audits mixed with current runbooks, area DOC) is noted, but the feature-status drift is specific to this domain.

## FILE-P3-001 — Share endpoint has no per-token rate limit

Add a limiter keyed by sha256(token) with a short window on the share route.

## FILE-P3-002 — Client logo accept list still advertises SVG that the server rejects

Update accept to image/png,image/jpeg,image/webp,image/gif and correct the helper text.

## FILE-P3-003 — Documentation drift on file types and size limits; no documents/upload runbook

Reconcile documented limits with the constants, fix the documents endpoint table, document the upload/download routes, and publish a bucket matrix with signed-URL/share semantics.

## FILE-P3-004 — Storage restore path exists but has never been exercised

Add a weekly or quarterly storage restore test (restore into a scratch bucket, or validate the manifest object count and a sample checksum), or record a dated manual drill artifact.

## FILE-P3-005 — Share revocation does not invalidate already-issued signed URLs

Shorten share-URL lifetime (e.g. 5-15 minutes), serve shares via an API download endpoint that re-checks revocation, or document the residual window in the share threat model.

## FILE-P3-006 — Oversized uploads return 500 instead of a validation error

Map MulterError (LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE) to a 400/413 VALIDATION response in middleware/error.ts.

## FILE-P3-007 — File-domain test gaps: no upload-validation unit tests and no file-request download coverage

Unit-test looksLikeMarkup/sniffImageType/validateUploadContent (including padded payloads), integration-test intake list/signed-URL with a foreign org (404), and extend the preview e2e.

## FILE-P3-008 — Previews render untrusted files inline without sandbox or disposition controls

Add sandbox to the preview iframes, drop svg from the image branch, and pass download/Content-Disposition for types that should never render inline.

## FINAL-P3-001 — Register retains duplicate findings and carried-unverified rows without a merge/refresh pass

Merge duplicate rows (keep provenance in the note) and re-verify or date-box the carried rows in the new register; use this run's CHAIN row for the Terraform composition status.

## HYGIENE-P3-001 — Stale and machine-specific generated documentation

Replace machine paths with repo-relative or URL references in the three files; extend scripts/check-docs-links.mjs (or a small grep gate) to fail on `C:\` / `file:///C:` in tracked markdown.

## HYGIENE-P3-002 — Generated artifacts are inconsistently tracked

None for this scope; keep the guard. Apply the same ignore-and-gate pattern to apps/web/public/version.json and __pycache__ (separate finding).

## HYGIENE-P3-003 — Dead modules and a dead component with zero references

Delete the three modules and the component in one cleanup PR; if any is planned work, move it to a tracked issue instead of shipping a stub.

## HYGIENE-P3-004 — Orphaned one-off catalog scripts and their 1.2 MB content-map pipeline

Move the seven scripts plus both content-map directories to an archive branch/tag, or delete them; if they are kept, list them in scripts/README.md under a clearly marked 'one-off / do not run' heading.

## HYGIENE-P3-005 — Committed Python bytecode and a stale build artifact are tracked

git rm the seven .pyc files, add __pycache__/ and *.pyc to .gitignore, regenerate prompts/manifest.json, and either untrack apps/web/public/version.json or generate it in CI before deploy.

## HYGIENE-P3-006 — Stray duplicate snippet file with local dev auth seed data

Delete supabase/snippets/Untitled query 314.sql (keep the seeds/ copy) or move it under supabase/seeds/ with a clear name if it is intentionally kept.

## HYGIENE-P3-007 — Root package script `sbom:licenses` is known-broken on the pinned pnpm

Change the script to "node scripts/collect-licenses.mjs --out licenses.json" (matching CI) and delete the `pnpm licenses list` invocation.

## HYGIENE-P3-008 — scripts/README.md index is stale: 14 scripts (10 active CI guards) are undocumented

Regenerate the script index (or add a small script that diffs scripts/ against the README table, similar to check-required-checks.mjs) and move one-off entries into a 'historical' subsection.

## HYGIENE-P3-009 — No circular-dependency guard; one live import cycle in the worker

Move the registry-length gauge read out of metrics.ts (pass the count in from the metrics endpoint caller) to break the cycle, and add madge --circular or eslint import/no-cycle as a non-blocking CI report, then make it blocking.

## HYGIENE-P3-010 — Explicit `any` is lint-disabled and 63 `supabase as any` casts sit at the typed-client boundary

Type loadOwned's client parameter as SupabaseClient<Database> (or a generic) and drop the casts; turn @typescript-eslint/no-explicit-any back to "warn" so new occurrences are visible in review.

## HYGIENE-P3-011 — AGENTS.md (120 KB) doubles as a historical changelog and is mirrored into review.md

Move the ledger/completed-work sections to CHANGELOG.md or docs/audits history and keep AGENTS.md as a current-state contract (<300 lines); review.md then shrinks automatically.

## HYGIENE-P3-012 — Audit run layout contract is not met by the committed repo-deep-dive runs

Either amend docs/audits/README.md to the actual layout (INDEX.md + registers) or rename the entry file to report.md; add the three runs to the Runs table and move/rename REAUDIT_REPORT_20261004.md into a run directory.

## HYGIENE-P3-013 — Two Redis client libraries coexist in apps/api

Consolidate on ioredis (already required by BullMQ) or document why node-redis is needed for health/cache; remove the other dependency.

## INFRA-P3-001 — `env/prod.tfvars` is tracked despite an ignore rule that names it

No change to the env/ rule; see the separate finding about the module-root tfvars path the CI workflow and one runbook use.

## INFRA-P3-002 — Restore test uses a different Postgres major than the backup script and verifies only table counts

Pin both sides to the same major (e.g. postgres:16 in scripts/backup-database.sh:48, or make the version a single variable), and state the Supabase server major in the runbook so the client is chosen deliberately.

## INFRA-P3-003 — `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable

Either enable AOF (`--appendonly yes` with the named volume, verify memory/disk impact on the 1-vCPU dev droplet) or correct RTO_RPO.md to state RDB-snapshot-only and that in-flight queue work is re-driven by producers/retries. Add a comment in compose recording the decision.

## INFRA-P3-004 — `infra/terraform/README.md` references an `aws/` directory that does not exist

No change.

## INFRA-P3-005 — Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op

Rewrite ROLLBACK_PROCEDURES.md §4 to "merge the revert, then dispatch terraform-do with apply=true (prod requires prod-approval)" and delete the push-to-trigger sentence. Optionally cross-link docs/CI.md.

## INFRA-P3-006 — infra/digitalocean/.env.example omits the alerting and internal-metrics variables the compose stack reads

Add the missing keys to infra/digitalocean/.env.example with explanatory comments (especially that ALERTMANAGER_WATCHDOG_WEBHOOK_URL must be an off-box URL and METRICS_TOKEN must match the API/Prometheus pair), and keep it in sync with compose. Optionally add a CI check that every ${VAR:?...} / ${VAR...} in the droplet compose appears in the example.

## INFRA-P3-007 — Terraform tfvars generated/referenced at the module root are not covered by the .gitignore rule

Widen the ignore to the whole module (e.g. `infra/terraform/**/*.tfvars` with `!*.example`) or change the workflow/runbook to always use env/<env>.tfvars. Extend validate-terraform-env.sh to scan both locations, and add a pre-commit/gitleaks rule for tfvars contents.

## INFRA-P3-008 — Cloud-init UFW SSH allowlist is applied only at droplet creation, so narrowed allowlists leave stale host rules

Either manage UFW out-of-band (a documented `ufw --force reset` + re-add procedure, or an ansible/ssh step in the deploy) or soften the firewall.tf comment and record the create-time-only behavior in docs. A small terraform `null_resource`/remote-exec is not recommended on the deploy path; documentation plus a runbook step is the low-risk fix.

## INFRA-P3-009 — METRICS_TOKEN has no fail-closed deploy guard; an empty token leaves the API scrape permanently down

Treat METRICS_TOKEN like the watchdog in prod: fail the deploy when it is empty (or when the written token file is empty), and/or make the Prometheus api scrape conditional. Add a post-deploy assertion that the mct-api target is up.

## INFRA-P3-010 — Prometheus alert-rule unit tests exist but are not run in CI

Add a small CI job (or a step in validate.yml's audit job) that runs `promtool check rules` and `promtool test rules` against the pinned prom/prometheus:v3.5.1 image (same command documented in the test file header). It is fast and needs no credentials.

## INV-P3-001 — Large committed prompt/audit corpus inflates the application repository

Optional: add a size/file-count budget for prompts/ and refresh the stale '787 files' comment in validate.yml; otherwise no action.

## INV-P3-002 — Stale, machine-specific repo path in the agent reference

No action required.

## INV-P3-003 — Committed build artifact apps/web/public/version.json is stale and unguarded

Either untrack apps/web/public/version.json (add a predev/prebuild generation step and keep it out of git), or add a CI check that regenerates it and fails on drift.

## INV-P3-004 — Vestigial Vercel deploy configs remain after the DigitalOcean migration

Delete both vercel.json files, or add a header note if Vercel previews are still intentionally supported; confirm no Vercel project auto-deploys from this repository.

## INV-P3-005 — Previous-run audit artifacts are amended in place without rebinding to the commit they now reflect

Either freeze run outputs and publish reconciliations as a new run directory, or add a per-finding verified_at_commit/reconciled_at field and update audit_manifest.json when a run is amended; also carry the reconciliation note into findings.json.

## INV-P3-006 — Committed Supabase Studio scratch snippet duplicates a dev seed

Delete supabase/snippets/Untitled query 314.sql (seeds/ is the source of truth) or, if it must be kept, rename it under seeds/ with an explicit purpose.

## INV-P3-007 — Service worker asset apps/web/public/sw.js is not registered anywhere

Either register it deliberately (versioned cache, update/activation flow, network-first for HTML) or delete it. MOB-P3-001 covers the related duplicate PWA manifest sources.

## IR-P3-001 — Terraform state restore guidance lacks a tested procedure

Add exact versioned-state restore commands (aws s3api / doctl), a plan-only verification step, and a scratch-backend drill result.

## IR-P3-002 — Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

Update §2/§3 to document the public-vs-/health/detail split, the non-degrading Redis rule, and the current redis healthcheck command.

## IR-P3-003 — Monitoring doc still reports wired metrics as 'defined, not wired' and omits the alert rules added for impersonation and RLS

Refresh the §4 metric table, §7 alert table and the rules-file header comment in one pass; add a doc-consistency check note to the alerting review checklist.

## IR-P3-004 — Alerting secrets are not documented in the secrets matrix or environment-variable reference

Add the alerting/notification secrets to the matrix (mark the watchdog URL as required-for-prod) and to ENVIRONMENT_VARIABLES.md.

## MOB-P3-001 — PWA manifest ships only an SVG icon and is duplicated across three sources

Keep one manifest source (the Next metadata route), add 192x192 + 512x512 PNG icons plus a maskable icon and a 180x180 apple-touch-icon, delete apps/web/public/manifest.json and manifest.webmanifest, and keep layout.tsx icon/manifest metadata in sync.

## MOB-P3-002 — Icon-only controls have touch targets well below the 44x44 recommendation

Give icon buttons min-h-11 min-w-11 (44px) hit areas while keeping glyph sizes, and add padding to the marketing hamburger and ProductForm close button.

## MOB-P3-003 — Notification dropdown is a fixed 320px panel anchored right-0 and clips on narrow phones

On small screens anchor the panel to the viewport (fixed inset-x-2 top-16 w-auto) or use w-[min(20rem,calc(100vw-2rem))].

## MOB-P3-004 — themeColor is declared in the deprecated metadata export, so the theme-color meta tag is not emitted

Add `export const viewport: Viewport = { themeColor: "#059669" };` to apps/web/app/layout.tsx and remove themeColor from metadata.

## MOB-P3-005 — favicon.ico contains SVG bytes and no apple-touch-icon is declared

Ship a real multi-size .ico (or remove it) and add a 180x180 apple-touch-icon PNG; declare icons.apple in layout metadata.

## MT-P3-001 — No automated cross-tenant isolation regression suite for application-layer scoping

Add a parameterized org A→org B suite per route module (known org B ids return 403/404; list endpoints without an explicit org return only org A rows), and shrink KNOWN_UNSCOPED to genuinely global/user-scoped modules so the guard has teeth.

## MT-P3-002 — Admin notification create accepts an arbitrary recipient and org-less rows bypass the SSE scope assertion

Require the recipient to share the caller's resolved org (assertSharesActiveOrg) or set organization_id = req.orgId on insert, and filter the REST list by the resolved org like the SSE stream does.

## NOTIF-P3-001 — No email template system; repetitive inline HTML diverges between senders

Introduce one shared template helper (subject prefix + layout + footer with a preferences/unsubscribe link) used by the API and worker senders, with tests asserting footer presence.

## NOTIF-P3-002 — `sms` channel is a dead preference option; UI copy misstates enforcement

Remove sms from the PUT enum and from the GET channels response (or implement an SMS sender); add a test asserting sms is rejected/no-op-documented.

## NOTIF-P3-003 — SSE polling fallback interval is not cleared on unmount

Store the fallback interval id in a ref and clear it in the effect cleanup (and before re-creating it); add a test that unmount clears the timer.

## NOTIF-P3-004 — `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

None required for the original finding; the route is covered by the middleware.

## NOTIF-P3-005 — No unsubscribe link or global opt-out in notification emails

Add a footer link to the preferences page (and optionally a signed one-click List-Unsubscribe header) and a global 'pause all notifications' toggle; document the consent model.

## NOTIF-P3-006 — Worker reminder preference lookups omit the organization, so any org's opt-out suppresses the channel for all orgs

Pass the notification's organizationId in the scheduled-notifications resolveChannels calls (task-due knows the project's org via the task/project; ticket/custom payloads carry organizationId) so worker and API paths share per-org semantics; add a multi-org preference test.

## NOTIF-P3-007 — No per-recipient send throttle on notification producers

Add a per-recipient notification/email bucket (e.g. max N emails per recipient per hour) shared by notifyAndEmail and the worker senders, with a suppression metric; document the limits.

## NOTIF-P3-008 — Worker ticket-responded email builds the deep link from unescaped payload metadata (latent XSS-in-email)

Apply the same encodeURIComponent on the id and escapeHtml on the final URL in the worker branches (ticket-responded, and audit custom/task-due links); add a test with a malicious id.

## OBS-P3-001 — Incident runbooks/tabletop evidence is partial

Create docs/incident_tabletop_scenarios.md and backup_restore_drill_plan.md (or fix the references), run and record one tabletop + one restore drill with date/participants/outcomes, and update INCIDENT_RESPONSE.md §8 to the deployed Alertmanager/Watchdog design.

## OBS-P3-002 — Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

Rewrite §2/§3 of MONITORING_AND_ALERTING.md to match health.ts (public vs detail, Stripe/JSM, Redis severity) and the actual healthcheck commands.

## OBS-P3-003 — `/metrics` is fully public when `METRICS_TOKEN` is unset

None for this finding; address the scrape/guard residual separately.

## OBS-P3-004 — API/worker Sentry release markers are not delivered (no SENTRY_RELEASE/GIT_SHA)

Add SENTRY_RELEASE (or GIT_SHA) to the deploy envs and compose api/worker services; mirror it for web server-side Sentry.

## OBS-P3-005 — Alertmanager secret provisioning gaps: matrix omits ALERTMANAGER_*; awk renderer breaks on '&' or backslash in values

Add the ALERTMANAGER_*/NTFY_* rows to the secrets matrix; render with a method that escapes replacement metacharacters (or reject values containing '&' at deploy time with a clear error); gate on alertmanager health.

## OBS-P3-006 — Metrics rate limiter leaves almost no headroom for the 15s scrape (max 5/min vs 4/min)

Skip the limiter for authenticated/internal scrapes or raise the limit well above the scrape rate; assert scrape success after deploy.

## OBS-P3-007 — SLO and monitoring docs drift from implemented metrics and alert rules

Refresh the metric tables, the Watchdog comment, and the alert-delivery section; add a doc check that the metric names in MONITORING_AND_ALERTING.md exist in the code.

## ORCH-P3-001 — Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry

Document and enforce carry-forward rules (re-emit the previous ID for a carried finding; keep deterministic check IDs stable per check/subcode), publish a legacy→current area mapping (SUPPLY→SC, HYG→HYGIENE, PORT→DET/CI, CONF→SECRET), and have the aggregator warn when a finding's area is not in the run's lens list.

## PERF-P3-001 — Unbounded list reads remain on compliance and time-entry endpoints; exports load up to 10k rows with select("*")

Apply parsePagination/applyPagination or LIST_HARD_CAP to the compliance and time-entry endpoints (aggregate time entries in SQL/RPC or per-day queries), and stream or batch export generation (chunked CSV, or a worker-generated artifact with a download link) instead of a single 10k-row select.

## PERF-P3-002 — Every paginated list request also runs an exact row count

Make the exact count opt-in (e.g. ?withTotal=1) or switch to a cheaper approximation/keyset pagination; keep count:"exact" only where the UI truly needs it, and project the columns the UI consumes.

## PERF-P3-003 — No bundle-size or performance budget gate; the analyzer is opt-in only

Add a size-limit (or Next build output) budget for the web app in CI, fail on threshold, and publish the analyzer report on PRs; commit a baseline so regressions are explicit.

## PERF-P3-004 — API routes broadly select all columns (`select("*")`) and pagination is ad hoc

Adopt the shared helper across the remaining list routes, project only the consumed columns (or add a repository layer that selects explicit fields), and add a lint/CI check that flags new bare select("*") on list endpoints.

## PRIV-P3-001 — Breach-response and IR plans still claim Alertmanager is not deployed and IR-P0-003 is open

Update the detection-sources and known-gaps sections of both docs to reflect the deployed Alertmanager/dead-man's-switch path, and state the last exercised test of that path.

## PRIV-P3-002 — DATA_BREACH_RESPONSE claims audit_logs records source IP/user-agent; no runtime writer populates them

Either populate ip_address/user_agent in logAuditEvent from the request, or correct the breach-response data map to say that only impersonation_log (and analytics/public_interactions) carry source IPs.

## PRIV-P3-003 — public-interaction-retention performs an unbounded single-statement delete and is not covered by the DATA-P1-002 batching fix

Reuse purgeInBatches for public_interactions (extract it to a shared helper), report the deleted count, and register the task in schedule-config with a test.

## REL-P3-001 — Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality

Keep conventional subjects for all non-merge commits; document merge-commit filtering in the notes tooling; treat the single-author risk as an organizational item (add a second committer or record the bus-factor acceptance).

## REL-P3-002 — PR template lacks changelog and versioned-artifact checkboxes

Add a 'release artifact/versioned output' checkbox and either wire a CI check for the changelog entry or replace the checkbox with a bot reminder so the checklist is not misleading.

## REL-P3-003 — CRITICAL dependency fix (handlebars override) shipped without a CHANGELOG entry

Add the handlebars override to the Security/Fixed entries and refresh the '0 critical/high' sentence to note the dev-only CRITICAL advisory that appeared and was cleared by the override.

## REL-P3-004 — Delta changelog entries are filed under `Fixed` only, mislabelling features and operator changes

Re-file the delta entries under Added/Changed/Security/Fixed as appropriate (or move them when cutting the next dated release section), and keep the convention for future entries.

## RES-P3-001 — Worker graceful shutdown has no force-exit fallback

No code action for the watchdog itself; see the new finding about stop_grace_period and unclosed Redis handles for the residual effectiveness gap.

## RES-P3-002 — Worker queued webhook dispatcher inserts deliveries without an idempotency key

No code action; the WH domain owns the remaining idempotency nuances (e.g. M365 replay TTL).

## RES-P3-003 — `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence

Update AGENTS.md:328 to state that production uses BullMQ (QUEUE_BACKEND=bullmq), with SQS/inline as fallbacks, and reference the production rejection of inline (env.ts:58-65).

## RES-P3-004 — Deploy health gate treats worker unhealthiness as non-fatal

No code action; note that the worker /health semantics themselves are weak (see the queue-visibility finding).

## RES-P3-005 — Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything

After remove(), re-list the affected prefixes (or compare the returned object set) and record removed/remaining counts; emit a metric when the 10k ceiling is hit so the operator knows cleanup is permanently skipped for that bucket.

## RES-P3-006 — Manual rollback script points at the wrong GHCR namespace and accepts non-2xx health codes

Derive the prefix from the same value as deploy-do (or delete the script and point operators at the workflow), require HTTP 200 from /health, make the worker check fatal, and pin the host key.

## RES-P3-007 — Circuit breaker leaks an uncleared timer per call and does not abort the timed-out operation

Clear the timeout in a finally block and/or thread an AbortSignal into the operation so the breaker timeout cancels the fetch; add a unit test asserting no pending timer survives a successful call.

## RES-P3-008 — Service worker is shipped but never registered — offline capability is dead code

Either register a versioned service worker with an explicit offline page and cache policy, or delete sw.js and document the offline stance in docs/PLATFORM_FAILURE_RUNBOOKS.md.

## RES-P3-009 — Failure-injection and load tests exist but are never executed by CI

Add a scheduled or manually dispatched CI job that runs the k6 smoke+spike scripts against dev, plus a small failure-injection suite (stop Redis; stub Supabase 5xx; make SMTP fail) asserting DLQ transitions, alert firing and clean shutdown.

## RES-P3-010 — `requestTimeout` responds 408 but does not abort the handler or close the connection

Thread the request deadline into handlers (AbortSignal) or destroy the socket on timeout, and document that 408 is advisory; alternatively return the 408 only after the handler settles.

## RLS-P3-001 — 5302116 grants anon UPDATE/DELETE on every table, amplified by no RLS-off × anon-write lint

Add a fourth verify-rls rule: fail when a live table has RLS disabled (or no policies) AND anon holds INSERT/UPDATE/DELETE; the grant state can be statically derived from 5302434 + explicit grants.

## RLS-P3-002 — No behavioral RLS allow/deny matrix test (static gate only)

Add a SQL-based behavioral suite after supabase db reset (pgTAP or a node script using the local service key) covering the 20261002 matrix for at least: public_interactions, documents/document_versions, memberships, client_portal_entitlements, phishing_targets, webhook_dead_letters, mfa_recovery_codes, store_quotes; wire it into test.yml/validate.yml.

## RLS-P3-003 — storage_path_org_id trusts a client-controlled object name

Bind the derived org to a server-side record where feasible (require/verify a matching documents or document_versions row for the (bucket,name) pair), and document the '<org_uuid>/' naming contract plus the name-derived helper in docs/RLS-coverage-matrix.md.

## RLS-P3-004 — Duplicate scoped-client tests and stale coverage-matrix snapshot

Delete or clearly split one of the two scoped-client suites; refresh the coverage-matrix counts from verify-rls.mjs and extend check-docs-counts.mjs to guard the table count too.

## RLS-P3-005 — RLS policies reference `manage` permissions that no role holds (dead predicates)

Either add the missing catalog rows (contracts/appointments/projects manage; documents upload/manage) and grant them to the intended roles, or rewrite the policies to the existing view/create/edit/delete vocabulary (as 5302129 already did for documents). Add the policy↔catalog lint.

## RLS-P3-006 — No static lint for RLS role-gate drift or policy↔permission-catalog drift

Extend scripts/verify-rls.mjs (or add scripts/verify-rls-effective.mjs) with: (1) replay drop/create across migrations and scan effective policy bodies; (2) fail on the raw unfiltered memberships predicate in any live policy; (3) fail when a policy's r.key list is a strict subset of the platform-admin set unless explicitly allowlisted; (4) fail when a policy references a (module,action) pair absent from the permission catalog.

## RLS-P3-007 — Scoped-client adoption is partial: several tenant modules have no RLS call sites and service helpers bypass the scoped client

Publish a non-secret enabled-module manifest in docs/RLS-rollout.md (list of module keys actually set), convert the remaining tenant services/CRUD factories to getScopedClient (or document why they stay service-role), and add a static check that every module key in the allow-list has at least one scoped call site.

## SBOM-P3-001 — Root license is ISC with no documented rationale

Keep. The license choice itself remains an owner decision tracked under SC-P3-001.

## SBOM-P3-002 — SBOM format/count not validated before upload; no regression guard

Keep. Extend the same guard to the Trivy image SBOMs (new finding).

## SBOM-P3-003 — Root package license remains "ISC"

Owner decision only: accept ISC explicitly (e.g. a dated line in docs/LICENSE_POLICY.md or the risk register) or relicense. No engineering work required.

## SBOM-P3-004 — SBOM is produced as a transient artifact, not bound to a release

Keep. Consider attesting the lockfile SBOM as well if a durable per-commit npm BOM is required.

## SBOM-P3-005 — Image SBOMs are attested but never validated (no floor or binding check)

Add a small validator for the image SBOM (non-empty components, expected component classes present, metadata.component.purl contains the image digest) and run it before attest-sbom / upload; reuse the check in both workflows.

## SBOM-P3-006 — Runbooks and script headers still document the broken `pnpm licenses list --json` command; docs/CI.md SBOM row is stale

Replace the command with `node scripts/collect-licenses.mjs --out licenses.json` in both docs and in the two script headers; update docs/SBOM_PROCESS.md:26 and docs/CI.md:29 to match the implemented pipeline.

## SBOM-P3-007 — Documented sharp license exception does not match the machine policy

Make the exception key match the real reported license string(s) and implement package scoping (see the exception-matching finding); then regenerate the docs table from security/license-policy.json, or add a CI check that the two artifacts list the same (license, package) pairs.

## SBOM-P3-008 — Shipped third-party images and GitHub Actions dependencies have no SBOM coverage

Extend the weekly SBOM job (or a new one) to produce and retain CycloneDX SBOMs for the third-party runtime images by digest, and add a generated actions inventory (name, pinned SHA, version) to the SBOM process docs or the lockfile SBOM.

## SBOM-P3-009 — PR license gate depends on the deprecated `deny-licenses` option and cannot fail on unknown licenses

Migrate to `allow-licenses` (mutually exclusive with deny-licenses) and/or rely on the full-tree license gate that already runs on PRs; add an explicit no-license failure to scripts/license-gate.mjs (see the exception-scoping finding) so unknown licenses cannot pass either gate.

## SC-P3-001 — Root package license remains "ISC"

No change required; if any package is ever published, re-open the license choice at that time.

## SC-P3-002 — e2e Docker image is not digest-pinned

No change required; refresh the digest intentionally when bumping Playwright.

## SC-P3-003 — Secret-scanner pattern sets diverge between `.sh` and `.ps1`

No change required for the pattern sets. Optional: align the file-exclusion lists (see note) and the cosmetic regex spelling.

## SC-P3-004 — Unpinned container images (test/local only); production app images tag-based by design

No change required; the tag-then-verify policy is documented in infra/digitalocean/README.md:21-42.

## SC-P3-005 — Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK

No change required. Residual: there is still no hadolint CI gate, so future Dockerfile lint regressions are not caught automatically (backlog item).

## SC-P3-006 — SBOM is produced as a transient artifact, not bound to a release

No change required; release-attaching the lockfile SBOM stays tracked under REL-P1-001.

## SC-P3-007 — A secrets file exists on disk outside git (should never be committed)

No change required.

## SC-P3-008 — gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

No change required; keep the verifier wired to any future gitleaks invocation.

## SC-P3-009 — Secret scanner misses the platform's own token formats and scans diffs only

Run gitleaks on the PR/push diff (or extend the grep list with the missing provider formats in the composite action, scan-secrets.sh and scan-secrets.ps1) so the fast gate covers the platform's own token formats.

## SC-P3-010 — Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks

Document a security-update triage SLA (e.g. critical/high within 7 days) in docs/DEPENDENCY_POLICY.md and enable Dependabot security updates in repo settings; confirm the setting with a repo-admin check.

## SC-P3-011 — Dependency and license policy `expires` dates are not enforced by the gates

In both gates, fail (or at minimum emit a blocking warning) when `expires` is in the past; add a unit test with a past-dated exception. Keep the JSON as the source of truth.

## SC-P3-012 — Docs instruct the broken `pnpm licenses list --json` workflow while CI uses collect-licenses.mjs

Replace both commands with `node scripts/collect-licenses.mjs --out licenses.json` (and note the same output shape).

## SC-P3-013 — SECURITY.md says neither SBOM is signed or attested, contradicting the attested image-SBOM process

Update SECURITY.md to state that the deploy-path image SBOMs are attested (digest-bound, pushed to the registry) while the lockfile SBOM remains artifact-only.

## SC-P3-014 — No automated unused/duplicate dependency check; lockfile carries 55 multi-version packages

Add a non-blocking advisory CI job running `pnpm dedupe --check` plus a depcheck-style scan, and record known intentional duplicates (major-version splits) in docs/DEPENDENCY_POLICY.md.

## SEARCH-P3-001 — Soft-delete columns are defined but never used by queries or deletes

No action required; optionally clean up the dead defensive `deleted_at` fallbacks in the web components.

## SEARCH-P3-002 — Search module documentation is stale relative to the code

Rewrite docs/modules/search.md and search-portal.md against the current routes; fix API_ENDPOINT_INVENTORY.md and MONITORING_AND_ALERTING.md; document the `?limit`/counts shape.

## SEARCH-P3-003 — Search SDK and OpenAPI contracts do not cover the implemented response (documents, counts, limit)

Update the SDK types and `admin(query, options?)`, add `queryParam("limit")` to the OpenAPI search routes, and add a contract test comparing the SDK/OpenAPI shape with the route response.

## SEC-P3-001 — Sign-up confirmation redirect is built from the caller-controlled Host header and targets a non-existent API route

Build emailRedirectTo from APP_BASE_URL (or resolveTrustedRedirectOrigin) plus the web callback path, mirroring the forgot-password fix; add a regression test asserting a spoofed Host cannot influence the redirect.

## SEC-P3-002 — Analytics admin reads are not tenant-scoped and expose platform-wide event data including visitor IPs

Restrict platform-wide analytics reads to super_admin (or apply resolveAdminTenantScope/allTenants), or add organization scoping to the events table if per-tenant analytics are intended.

## SEC-P3-003 — Auth rate-limit key uses the raw email string without normalization

Normalize the email key (trim + toLowerCase) in rateLimitAuth, matching rateLimitEmail; add a unit test for case variants.

## SEC-P3-004 — gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

None required.

## SEC-P3-005 — `5302116` grants anon/authenticated full DML on every public table (RLS is the only gate)

None required; keep the allowlist reviewable.

## SEC-P3-006 — CORS reflects any origin with credentials when `CORS_ORIGIN="*"`

Reject '*' at config validation when credentials are enabled (or when NODE_ENV=production), and document that allow-all CORS is not supported for the credentialed API.

## SEC-P3-007 — `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches`

None required; optionally call assertOrgScopeMatches in the handler as defense in depth.

## SEC-P3-008 — `resolveEffectivePermissions` is uncached and fans out 4–6 queries per gated request

Add a short-TTL per-user/org cache (as lib/mfa.ts does for factors) with invalidation on membership/role/permission mutations; measure before/after.

## SEC-P3-009 — Deprecated header and broad API CSP style directive

None required for the API; optionally drop X-XSS-Protection from infra/digitalocean/Caddyfile.prod:12,35 for consistency.

## SEC-P3-010 — M365 webhook `clientState` is compared non-constant-time

None required.

## SEC-P3-011 — Active-org cookie setter performs no server-side authorization

Validate the org against the caller's memberships in setActiveOrg (return an error for non-members) so the UI cannot enter an unauthorized org context.

## SEC-P3-012 — Web middleware gates routes on an unverified JWT `exp`

Keep the documentation; consider a signed/opaque session hint so the edge gate cannot be forged, or remove the exp pre-check entirely.

## SECRET-P3-001 — Worker `.env.example` omits `APP_BASE_URL`

None required; the proposed env-parity check keeps it that way.

## SECRET-P3-002 — Web runtime validator can silently fall back to a localhost API URL

Remove the localhost ENV defaults from the Dockerfile builder stage (keep an explicit dev-only default out of the production image), or make the guard assert the value is not the localhost fallback when NODE_ENV=production; add a CI build test that omits the arg and expects failure.

## SECRET-P3-003 — No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence

Publish docs/SECRET_ROTATION_RUNBOOK.md (or fold it into SECRETS_ROTATION.md) covering break-glass authorization, escrow location, and revocation steps; link it from docs/INDEX.md and INCIDENT_RESPONSE.md; run and record one revocation drill.

## SECRET-P3-004 — Secret rotation policy has no evidence any secret was ever rotated

Record every rotation (including drills) in the log with date, operator, environment and run URL; add a mechanical check that no key exceeds its cadence based on the log.

## SECRET-P3-005 — No automated `.env.example` ↔ runtime schema ↔ docs parity check

Add a dependency-free script to validate.yml that extracts keys from the three Zod schemas, the three .env.example files, and the docs tables, and fails on any mismatch; include workflow secrets.X against SECRETS_ROTATION.md.

## TEST-P3-001 — Visual regression is still non-blocking with a known-broken Storybook build

Fix the Storybook/Next build or replace Chromatic with Playwright `toHaveScreenshot()` baselines for the top pages already running in E2E.

## TEST-P3-002 — No scheduled production smoke check (health + login + critical read)

Add a cron workflow (e.g. every 15 min) that checks prod /health for api+worker, /login for web, and a read-only authenticated request, alerting on failure.

## TEST-P3-003 — Coverage thresholds remain modest and cannot be confirmed met at this SHA

Publish the coverage summary as a CI artifact (or job summary) from the unit-tests composite; raise the worker gate after TEST-P2-002's suite lands.

## TEST-P3-004 — Coverage thresholds are low and E2E stability is unproven on `main`

Record one successful prod-gate E2E run (or a staging equivalent) and add flake instrumentation; keep raising the worker gate.

## TEST-P3-005 — Shared packages/ui has no test runner and no lint/typecheck script

Add a minimal jest config + test script to packages/ui (render tests for Button/Dialog/Badge/Input/Avatar) and lint/typecheck scripts so turbo gates it; or explicitly document that web suites are the only gate.

## USE-P3-001 — Portal ticket creation gives no success confirmation and the tested action is dead code with a mismatched field name

Show a success toast with a link to the new ticket, delete the dead action (or align names), test the live action, and deep-link the dashboard CTA to an open create form.

## USE-P3-002 — Offline/poor-network support is absent from the running app (service worker never registered)

Register the service worker behind an env flag with a versioned cache, and add an online/offline banner plus a manual retry; or remove sw.js if offline is out of scope.

## USE-P3-003 — Document version history is display-only: no per-version download/restore and it hides itself for single-version documents

Add a per-version download (SDK method + UI action) and an inline error state; show the version section even for one version.

## USE-P3-004 — Web edit flows never send If-Match, so concurrent admin edits silently overwrite each other

Thread the row version into edit forms and send If-Match; render the API's 409 as 'modified by someone else — reload'.

## USE-P3-005 — Form error handling is lossy or missing: signup can hang, onboarding errors are generic, bulk invite says 'Request failed'

Wrap all submit handlers in try/finally, keep the API's message where it is user-safe, and map validation errors to the offending field.

## UX-P3-001 — Four Chip copies render a glyph-only '×' remove button with a sub-24px target size

Single Chip component in the design system with aria-label={`Remove ${label}`} and a min-h-6 min-w-6 (24px) hit area; delete the three copies.

## UX-P3-002 — Theme is documented dark-only but ships dead light/system code paths (CSS variables, ThemeProvider, Storybook toolbar)

Either delete the light/system branches, the light CSS block and the Storybook toolbar, or implement a real toggle (and fix cyber-page-bg to use the variable). Whichever is chosen, keep docs/WEB_UI_CONVENTIONS.md:83 in sync.

## UX-P3-003 — Sidebar group toggles declare aria-haspopup='true' for a popup that is a link list, not a menu

Remove aria-haspopup (keep aria-expanded + aria-controls), or promote the flyout to a real menu pattern with roving tabindex. Apply to both admin and portal sidebars.

## UX-P3-004 — Notification bell and store drawer toggles omit aria-expanded

Add aria-expanded to both toggles (and Escape-to-close plus focus return for the bell panel), matching the SidebarShell pattern.

## UX-P3-005 — Color-token drift: 66 files hardcode hex colors (80x #0A1118) and 45 arbitrary rgba card backgrounds instead of the design tokens

Replace hardcoded values with the existing utilities (text-cyber-base, glass-card, bg-cyber-card-*) in touched files, and add a lint/regex guard that rejects new hex colors in apps/web/app and apps/web/components outside the token files.

## UX-P3-006 — Heading order skips a level on the store import/export page

Promote the section headings to <h2> (or add an <h2> group heading).

## UX-P3-007 — ScorecardsEvaluateClient renders the only programmatically unlabeled input in the app and an unannounced error

Add aria-label="Organization ID (optional)" or a visible <label>, and role="alert" on the error span.

## UX-P3-008 — Signup form inputs lack autocomplete attributes

Add autoComplete="name", "email" and "new-password" to the signup fields.

## UX-P3-009 — Storybook covers only the 7 @mct/ui primitives; packages/ui has no test/lint scripts and the a11y addon runs nowhere

Add stories for the app primitives, wire @storybook/test-runner or jest-axe assertions for the existing 7 components, add test/lint/typecheck scripts to packages/ui, and make Chromatic blocking once the webpack build failure is fixed.

## UX-P3-010 — Full accessibility breadth scan (68 routes) is triage-only and not a required check

Ratchet the breadth set into BASE_PAGES in batches (start with the routes that are currently clean), record a violation baseline, and fix docs/CI.md:117 or add continue-on-error deliberately. Prefer failing the weekly run visibly over silently passing.

## UX-P3-011 — The a11y gate scans only initial page loads; interactive states (dialogs, drawers, filters, bulk bars) and client-fetched content are untested

Add a small interaction suite (open each dialog/drawer, apply a filter chip, bulk-select a row, run axe in the open state) and/or jest-axe unit tests for the shared primitives; keep the bounded-wait fallback but log when it triggers.

## WH-P3-001 — Test endpoint generates a random idempotency key and never dedups

Route the test ping through the shared dispatcher (or a deterministic test key) so the test exercises the real signing/idempotency/retry path; label test rows in the UI.

## WH-P3-002 — No committed event catalog or webhook documentation for consumers

Publish docs/WEBHOOKS.md (event catalog, {event,timestamp,data} envelope, X-Webhook-Signature: sha256=<hmac>, Idempotency-Key, 5x exponential retry, DLQ semantics) and fix docs/modules/webhooks.md:16,39 to state M365 is clientState-authenticated and unsigned; add a doc-lint that every dispatchWebhook('...') literal appears in the catalog.

## WH-P3-003 — Worker queued webhook dispatcher inserts deliveries without an idempotency key

No action.

## WH-P3-004 — Webhook raw body typed as `string` but consumed as `Buffer`

Store the raw bytes: req.rawBody = buf (Buffer), declare rawBody?: Buffer on the request type, and drop the `as Buffer` cast at webhooks.ts:153.

## WH-P3-005 — Retried deliveries replay a body without the envelope `timestamp` (payload drift)

Persist the full original body (including timestamp) in request_body and replay it verbatim, or document that retries carry {event,data} only; add a test asserting the retry body equals the first-attempt body.

## WH-P3-006 — Delivery inserts ignore unique-key conflicts, losing the successful-attempt record

Check the insert result and update/upsert the existing row on conflict (or log the conflict); add a test that a re-dispatch after failure records the successful attempt.

## WH-P3-007 — Outbound webhook response bodies are read without a size cap

Cap the response read (e.g. 64kb) in pinnedFetch and truncate/omit response_body beyond the cap; add a test with an oversized response.

## WH-P3-008 — M365 handler processes only the first notification in a batch (value[0])

Iterate all notifications (per-notification dedup key and audit/delivery record), or explicitly document and log that only value[0] is processed; add a multi-notification batch test.

## WH-P3-009 — No retention/cleanup for webhook_deliveries and webhook_dead_letters

Add webhook_deliveries/webhook_dead_letters to the retention task with documented windows (e.g. 90d deliveries, 180d DLQ) and bounded batch deletes; alert on DLQ depth first.

