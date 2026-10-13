# Duplicate finding map + finding-identity policy

Added 2026-10-12 as the merge/refresh pass for `FINAL-P3-001` and the
identity note for `ORCH-P3-001`.

## Duplicate map

61 titles appear under more than one domain ID (the same
underlying issue reported by two lenses). The first ID listed is the
canonical row used for status tracking; the aliases carry the same status
and cross-reference the canonical ID.

| Canonical | Alias(es) | Title |
|---|---|---|
| ACM-P1-001 | SEC-P1-007 | client-onboarding mutations run without any `requirepermission` gate |
| ACM-P2-001 | SEC-P2-016 | `platform_admin_keys` (org traversal) and `admin_bypass_keys` (permission bypass) are inconsistent trust sets |
| ACM-P2-004 | WH-P2-007 | webhook endpoint and delivery reads are available to any org member (not manage-gated) |
| ACM-P2-005 | SEC-P2-017 | api keys store `expires_at` but nothing enforces or prunes expiry |
| ACM-P2-006 | WH-P2-008 | webhook signing secrets are stored plaintext with no rotation or expiry |
| ACM-P3-005 | RLS-P3-005 | rls policies reference `manage` permissions that no role holds (dead predicates) |
| ADMIN-P1-001 | SEC-P1-003 | org-agnostic `requireadmin` lets a tenant admin read other tenants' admin data |
| ADMIN-P1-002 | SEC-P1-004 | impersonation/cross-tenant access is logged but not reviewable or alerted |
| ADMIN-P2-004 | SEC-P2-015 | bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) |
| ADMIN-P3-002 | SEC-P3-011 | active-org cookie setter performs no server-side authorization |
| AN-P2-001 | PRIV-P2-001 | google analytics and tawk.to load on public pages with no cookie-consent or opt-out gate |
| API-P3-004 | OBS-P3-003 | `/metrics` is fully public when `metrics_token` is unset |
| ARCH-P2-002 | RLS-P2-004 | api defaults to the service-role db client (rls bypass) |
| ARCH-P3-001 | SEC-P3-012 | web middleware gates routes on an unverified jwt `exp` |
| BILL-P3-001 | WH-P3-004 | webhook raw body typed as `string` but consumed as `buffer` |
| BP-P3-002 | SC-P3-010 | dependabot has no security-update separation or triage sla, and pr template has no enforced link to required checks |
| CHAIN-P1-001 | SEC-P1-005 | low-trust msp role key composes into a cross-tenant read pivot |
| CHAIN-P1-002 | SEC-P1-006 | caller-controlled reset redirect composes into an account-takeover assist |
| CI-P2-002 | SC-P2-008 | deploy-gate secret scan is a no-op on pushes to main |
| CI-P3-005 | SC-P3-009 | secret scanner misses the platform's own token formats and scans diffs only |
| CTR-P1-002 | SBOM-P1-001 | sbom is lockfile-only, not an image sbom or attestation |
| CTR-P1-003 | SBOM-P1-002 | unsigned images with no provenance/attestation |
| DATA-P1-001 | RLS-P1-002 | approved-membership rls predicate reintroduced six times; pending/suspended members could access tenant data |
| DOC-P2-001 | INFRA-P2-003 | operations documentation contradicts the current pipeline and configuration |
| DOC-P2-002 | REL-P2-004 | rollback documentation is stale (terraform push flow) and repeats the false approval claim |
| DOC-P2-003 | SBOM-P2-003 | `docs/ci.md` documents the sbom workflow as "blocking" but it gates nothing |
| DOC-P3-002 | RES-P3-003 | `agents.md` documents the worker consumer incorrectly and omits the queue backend divergence |
| DR-P2-004 | NOTIF-P2-008 | backup-failure alerting is present but cannot be trusted to deliver |
| DR-P3-005 | IR-P3-001 | terraform state restore guidance lacks a tested procedure |
| EVOL-P3-003 | WH-P3-002 | no committed event catalog or webhook documentation for consumers |
| EXEC-P1-001 | FINAL-P1-001 | p0 data-loss path and unverified "fixed" claim block a clean release |
| EXEC-P2-001 | FINAL-P2-002 | residual authorization/secret defaults need explicit decisions |
| EXEC-P2-003 | FINAL-P2-001 | governance and observability gaps mean the platform cannot yet detect or control production failure |
| FEAT-P2-001 | SEC-P2-018 | api keys cannot authenticate; the feature is dead |
| IR-P0-003 | OBS-P0-001 | total loss of the monitoring/alerting path has no independent dead-man's-switch receiver |
| IR-P1-006 | OBS-P1-001, RLS-P1-001 | no runtime detection or alerting for tenant-isolation (rls) regressions |
| IR-P2-001 | OBS-P2-004 | several prometheus metrics are declared but not wired, limiting incident diagnosis |
| IR-P2-002 | OBS-P2-005 | no alerting on audit-trail gaps or privileged (impersonation/admin) abuse |
| IR-P2-003 | OBS-P2-006, WH-P2-010 | no alerting when webhook dead-letters accumulate or payment reconciliation drifts |
| IR-P2-004 | SECRET-P2-006 | secrets rotation is documented but has no exercised evidence |
| IR-P3-002 | OBS-P3-002 | monitoring doc and health endpoint disagree on check semantics; redis severity undocumented in alerts |
| MT-P1-003 | SEC-P1-010 | public file-request upload authorizes with a permission unioned across all orgs |
| MT-P2-004 | NOTIF-P2-007 | realtime/sse notification channel is scoped by user only, with no org assertion |
| NOTIF-P3-004 | SEC-P3-007 | `notification-preferences` put accepts a body `organizationid` without `assertorgscopematches` |
| OBS-P2-007 | SEC-P2-014 | `/health` publicly discloses provider configuration and redis errors |
| OBS-P2-008 | RES-P2-005 | availability detection lives inside the failed domain; no external dead-man's switch or alert delivery |
| REL-P1-001 | SBOM-P1-003 | no version identity: no tags, no product version, no commit binding in generated artifacts |
| RES-P3-002 | WH-P3-003 | worker queued webhook dispatcher inserts deliveries without an idempotency key |
| SBOM-P2-004 | SC-P2-002 | no artifact provenance, attestation, or signing; `id-token: write` requested but unused |
| SBOM-P2-005 | SC-P2-003 | license policy not enforced in ci; non-osi and lgpl licenses present |
| SBOM-P2-006 | SC-P2-004 | sbom is generated but not bound to a commit or attached to releases/images |
| SBOM-P2-007 | SC-P2-005 | dependabot pr backlog is large and not triaged; one stale update conflicts with resolved versions |
| SBOM-P2-008 | SC-P2-006 | `licenses.json` is committed but unenforced and unverified |
| SBOM-P3-003 | SC-P3-001 | root package license remains "isc" |
| SBOM-P3-004 | SC-P3-006 | sbom is produced as a transient artifact, not bound to a release |
| SC-P2-009 | SECRET-P2-003 | secret scanning is diff-scoped only; no full-history scan artifact |
| SC-P2-010 | SECRET-P2-004 | produced terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it |
| SC-P3-008 | SEC-P3-004 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) |
| SEC-P1-008 | SECRET-P1-001 | m365 webhook secret is dead config while the real m365 auth value is undocumented and undeployed |
| SEC-P1-009 | SECRET-P1-002 | deploy pipeline does not write several secret-class env vars the api schema and compose reference |
| SEC-P2-007 | WH-P2-009 | webhook ssrf guard has a dns-rebinding toctou window |

## Finding-identity policy (`ORCH-P3-001`)

- IDs are `AREA-SEVERITY-NNN` where AREA is the lens code (legacy area
  codes such as `EXEC`, `FINAL`, `DET` are retained for traceability).
- A finding's identity is its (canonical ID, title) pair; aliases from
  overlapping lenses are merged into the canonical row above rather than
  renumbered, so historical references stay resolvable.
- Deterministic-seed IDs (`DET-*`) are regenerated per run and are not
  stable across runs by design; treat them as run-local.
- Cross-run status carry-over should key on the canonical ID + title;
  where a run changes the AREA prefix, the map in that run's folder is the
  bridge. Framework-level identity hardening remains a pack follow-up.

