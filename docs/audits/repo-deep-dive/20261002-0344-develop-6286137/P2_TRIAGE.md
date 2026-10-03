# P2 Triage — repo-deep-dive audit (develop @ 6286137)

Source: `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/findings.json`
(269 findings: 5 P0, 56 P1, 132 P2, 76 P3).

Scope note (per explicit instruction): **the project judges only `develop`.** There is
no production environment and no infrastructure yet, so no P2 here is a `develop`
blocker. The categories below are about *when it starts to matter*, not whether the
branch can merge.

---

## How to read this

- **P2 does not block `develop`.** All 132 are real, none are release-gating today.
- Several were **already fixed incidentally** by the PR #30 work (they are P2s that
  happened to sit inside P0/P1 fixes). Those are listed first so they are not
  re-triaged as open.
- The rest are grouped by theme, with a recommended batch order. Effort is a rough
  size, not a promise.

Counts: **132 total — 14 addressed/closed by PR #30, 118 genuinely open.**

---

## A. Already addressed by PR #30 (do not re-open)

| ID | Finding | How it was closed |
| --- | --- | --- |
| API-P2-001 | Mutations unguarded by `requirePermission` | `requirePermission` added across the routers the audit named; enforced by a test guard. |
| CHAIN-P2-003 | Intra-tenant escalation via unguarded mutations | Same root cause as API-P2-001; closed by the same change. |
| SEC-P2-001 | Client-onboarding mutations without `requirePermission` | `requirePermission` added to the onboarding mutations. |
| SEC-P2-002 | MSP roles cross-tenant for org access but not permissions | Unified trust model: cross-tenant reach now requires `is_super_admin` **AND** a cross-tenant role key. |
| SEC-P2-003 | Forgot-password redirect uses attacker-controlled `Origin` | Origin no longer trusted blindly; redirect is bound to the configured app URL. |
| SEARCH-P2-001 | Raw search terms persisted in plaintext `audit_logs.metadata` | Search terms no longer written verbatim into audit metadata. |
| MT-P2-001 | Admin global search lists all orgs / falls through unscoped | Shared scope helper; `.find()`→`.some()` and org scoping applied. |
| MT-P2-002 | By-id org filters fail open if the gate is not reached | Scope helper is now applied unconditionally before the query. |
| SC-P2-003 | License policy not enforced in CI | `license-gate.mjs` wired into `security-scan`; policy + documented exceptions added. |
| SBOM-P2-003 | `docs/CI.md` says SBOM is "Blocking" but gates nothing | SBOM workflow now actually runs and validates in CI; doc reconciled. |
| WH-P2-005 / RLS-P2-002 | `webhook_dead_letters` has no DELETE policy while API deletes via RLS client | Policy added (same defect recorded twice by two reports). |
| SC-P2-004 / SBOM-P2-001 | SBOM not bound to commit | SBOM now records the commit SHA. **Attestation is still open — see E.** |

*(Cross-checked against the branch diff and commit messages; where a claim depends on a
specific file I verified the file is in the diff. Two duplicate IDs across reports —
`WH-P2-005`/`RLS-P2-002` — count once.)*

---

## B. Fix before first real deploy — security / correctness that is cheap now, costly later

These are the ones worth doing as the **next PR after #30**, because they are small,
well-scoped, and become harder once real tenants exist.

| ID | Finding | Why now |
| --- | --- | --- |
| FILE-P2-002 | Free-form `storageBucket`/`storagePath` lets a caller sign arbitrary in-bucket objects | Cross-tenant object access; a direct isolation hole. |
| FILE-P2-001 | `avatars` bucket used by code, declared nowhere, no storage RLS | Undeclared bucket = unknown policy = unknown blast radius. |
| DATA-P2-001 | Blanket `anon` DML grant makes every future table anon-writable unless RLS stops it | Default-allow; every new table inherits the risk. |
| SEC-P2-005 / ACM-P2-003 | RLS bypassed on API requests (service-role default client) | Means the RLS work only protects what the API remembers to filter. |
| RLS-P2-001 | MSP platform-admin role keys missing from post-5302129 admin-gate policies | Known gap in the exact area PR #30 touched. |
| RLS-P2-003 | `approve_project_task` / `add_project_task_comment` trust a caller-supplied user id | Forgery; composable (see CHAIN-P2-004). |
| SECRET-P2-004 | Terraform `prod.tfvars` tracked despite `.gitignore` | Secret-adjacent; a one-line fix. |
| CTR-P2-003 / INFRA-P2-007 | Redis password exposed in process argument vector | Trivially observable via `ps`. |
| API-P2-004 | SDK retries unsafe requests without `Idempotency-Key` | Duplicate creates on transient failure. |
| DATA-P2-003 | `orphan-cleanup` deletes storage objects from a truncated listing | Data loss; currently latent. |

**Recommended as PR #31.** Reasonable to land as one change set because they share a
theme (isolation + credential hygiene) and most are small edits plus a test.

---

## C. Observability & alert delivery — matters when you have an ops surface

Currently alerts are emitted but cannot be trusted to arrive. This is one coherent
project rather than ten tickets.

| ID | Finding |
| --- | --- |
| INFRA-P2-003 | Prometheus rules have no delivery path (no Alertmanager) |
| RES-P2-005 / DR-P2-001 | Availability detection inside the failed domain; backup-failure alert delivery unproven |
| IR-P2-002 | No alerting on audit-trail gaps or privileged/impersonation abuse |
| IR-P2-003 | No alerting on webhook dead-letter growth or reconciliation drift |
| WH-P2-003 | Outbound/DLQ delivery outcomes not metered |
| IR-P2-001 | Several Prometheus metrics declared but not wired |
| RES-P2-006 / CI-P2-002 | Restore test verifies only table counts, not integrity |

**Recommended as a single "alerting is real" milestone before any on-call rota.**
Note `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is already an operator action in PR #30.

---

## D. Data integrity, durability, and lifecycle

| ID | Finding |
| --- | --- |
| DATA-P2-002 | Destructive table-replacement migrations not transaction-wrapped |
| DATA-P2-005 | `audit_logs` org-delete cascade destroys compliance history; 365-day purge has no archive |
| DATA-P2-006 | Several stores lack a retention policy and owner |
| CHAIN-P2-006 | Retention + cascade compose into silent destruction of audit evidence |
| FILE-P2-004 | No backup/restore path for uploaded objects |
| DR-P2-002 | Terraform state bucket versioning claimed but not backed by a resource |
| DR-P2-004 | Manual restore has no env guardrail; transient dump unencrypted in `/tmp` |
| BILL-P2-005 | Subscription/invoice schema lacks trial/interval/void-lifecycle fields |
| BILL-P2-001 | No refund handling; incomplete trial/cancel states |
| BILL-P2-002 | `POST /billing/sync` does not paginate Stripe results |
| BILL-P2-003 | Reconciliation job has no drift detection, alerting, or tests |
| BILL-P2-004 | Failed payments produce no notification or dunning visibility |
| CHAIN-P2-006 | Retention + cascade compose into silent destruction of audit evidence |
| CHAIN-P2-007 | Internet-open SSH composes into service-role exfiltration / tenant takeover |
| CHAIN-P2-009 | Terraform version/lockfile conflict composes into un-gated infra change |
| CHAIN-P2-010 | Silent worker failures + in-stack monitoring compose into undetected degradation |
| DR-P2-005 | Product `backup_status` module not wired to a real platform backup heartbeat |
| SC-P2-005 | Dependabot PR backlog large and untriaged; one stale update conflicts with resolved versions |

*(CHAIN-P2-007/009/010 are compositions — they close when their constituents
(CTR-P2-003, CI-P2-003, RES-P2-003, C) close, not as standalone work.)*

---

## E. Supply chain, SBOM, container hardening

| ID | Finding |
| --- | --- |
| SC-P2-001 | No image-level scanning; Trivy scans filesystem only |
| SC-P2-002 | No artifact provenance/attestation/signing; `id-token: write` unused |
| SBOM-P2-002 | No container/image SBOM; base-image OS packages untracked |
| SC-P2-004 / SBOM-P2-001 | SBOM is now commit-bound but still not attested or release-attached (the commit-binding half is done; see A) |
| CTR-P2-001 | Pinned base-image digests have no automated refresh |
| CTR-P2-005 | No container resource/PID limits beyond memory |
| CTR-P2-004 | Deploy health gate ignores worker health |
| CTR-P2-002 | Local compose ships default credentials and a repo-wide bind mount |
| INFRA-P2-004 | Dev droplet capacity under-provisioned; CI value drifts from `dev.tfvars.example` |

**Sequencing note:** this cluster is the natural home for the RLS-P2-001 label gap's
container sibling. Low urgency until an image is actually published.

---

## F. API contract, idempotency, integrations

| ID | Finding |
| --- | --- |
| API-P2-002 | Integration syncs report success while dropping items; `jsm-sync` has no retry |
| API-P2-003 | Published error-handling contract contradicts implementation |
| API-P2-005 | Outbound webhook dispatcher uses a non-atomic idempotency check |
| WH-P2-001 | M365 inbound notifications have no replay window |
| WH-P2-002 | Inline dispatcher records fixed `retry_count`, duplicates worker logic |
| WH-P2-004 | Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` absent |
| WH-P2-006 | No per-provider payload schema or size cap on webhook ingress |
| NOTIF-P2-004 | Scheduled reminder inserts/sends not atomic; retries can double-send |
| NOTIF-P2-006 | API inline email fallback has no retry, ignores send result |

---

## G. Search (self-contained, user-visible)

| ID | Finding |
| --- | --- |
| SEARCH-P2-002 | Portal search omits documents despite SDK/docs contract |
| SEARCH-P2-003 | Admin search UI silently discards documents results |
| SEARCH-P2-004 | No pagination/counts; hard 5-result ceiling |
| SEARCH-P2-005 | Search analytics metric dead; summary RPC missing |
| SEARCH-P2-006 | Prefix/wildcard mismatch: no btree on prefix cols, no `tsvector` |
| SEARCH-P2-007 | Typeahead hits full search endpoints without rate limiting |

Good candidate for a focused feature PR if search UX is on the roadmap.

---

## H. Access-control consistency (residual)

| ID | Finding |
| --- | --- |
| ACM-P2-002 | `PLATFORM_ADMIN_KEYS` and `ADMIN_BYPASS_KEYS` are inconsistent trust sets |
| ACM-P2-004 | Write/state-transition gated by `view` permissions |
| ACM-P2-005 | Webhook reads available to any org member, not manage-gated |
| ACM-P2-006 | API keys store `expires_at` but nothing enforces/prunes expiry |
| ACM-P2-007 | Webhook signing secrets plaintext, no rotation/expiry |
| ACM-P2-008 | Profiles enumerable by email/id for any authenticated user |
| MT-P2-003 | Storage writer path vs RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`) |
| MT-P2-004 | Realtime/SSE channel scoped by user only, no org assertion |
| MT-P2-005 | Platform-admin cross-tenant access broad and unalerted |
| MT-P2-006 | Platform-wide report generators run service-role with no tenant guard |
| SEC-P2-004 | `GET /analytics/summary` calls a `get_analytics_summary` RPC no migration defines |
| INFRA-P2-006 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline |
| CHAIN-P2-004 | Definer RPC identity trust composes into forged approvals |
| CHAIN-P2-005 | RLS admin-gate regression composes with API trust model into MSP admin denials |

---

## I. CI/CD, release, and governance

| ID | Finding |
| --- | --- |
| CI-P2-003 | Infra changes no longer gated in CI (terraform-do manual dispatch only) |
| CI-P2-004 | Chromatic visual-regression job permanently non-blocking |
| DATA-P2-004 / IR-P2-006 | Migration dry-run diff non-blocking; result discarded |
| BP-P2-001 | `require_code_owner_reviews:false` makes CODEOWNERS advisory |
| BP-P2-002 | No break-glass/bypass process or audit trail |
| BP-P2-003 | No drift detection between committed branch-protection JSON and live settings |
| BP-P2-004 | Path-filtered required checks can protect a branch with checks that never run |
| REL-P2-001 | `CHANGELOG.md` stale relative to HEAD |
| REL-P2-002 | No Breaking Changes/upgrade manifest despite 34 migrations + RLS changes |
| REL-P2-003 | No release-notes / GitHub Release template |
| REL-P2-004 | Rollback docs stale and repeat the false approval claim |
| TEST-P2-001 | Accessibility gate width contradicts the code (docs 19 vs code 25) |
| TEST-P2-002 | Worker mutating scan tasks lack a test suite; branch threshold is a no-op |
| TEST-P2-003 | E2E flakiness documented but unresolved, masked by prod-only gate |
| TEST-P2-004 | Load tests manual-only, no thresholds or failure injection |
| SECRET-P2-001 | Rotation inventory lags schema/compose; seven keys uncovered |
| SECRET-P2-002 | Rotation reminder workflow referenced but nonexistent |
| SECRET-P2-003 | Secret scanning diff-scoped only; no full-history artifact |

---

## J. Admin guardrails, AI-agent readiness, product gaps

| ID | Finding |
| --- | --- |
| ADMIN-P2-001 | Sensitive admin exports not audit-logged |
| ADMIN-P2-002 | Destructive deletes inconsistently confirmation-gated; org delete unrecoverable |
| ADMIN-P2-003 | Bulk document ops apply without per-row preview/elevation guardrail |
| ADMIN-P2-004 | Bulk invite creates pre-confirmed auth accounts; onboarding auto-approves admin |
| ADMIN-P2-005 | No rate limiting on expensive/destructive admin operations |
| ADMIN-P2-006 | No undo/soft-delete exercised despite schema support |
| AI-P2-001 | No machine-enforced agent guardrails (paths, approvals, batch limits are prose) |
| AI-P2-002 | Prompt packs embed generated outputs without a "not instructions" marker |
| AI-P2-003 | `.continue/` defines models only; no project rules/boundaries |
| NOTIF-P2-001 | Web Push entirely absent |
| NOTIF-P2-002 | SMTP optional; email silently degrades to no-op in prod |
| NOTIF-P2-003 / RES-P2-001 | Worker lacks `unhandledRejection` handler |
| NOTIF-P2-005 | Sensitive ticket content stored/emailed verbatim with no sensitivity filter |
| RES-P2-002 | `WORKER_TIMEOUT` is not a real timeout; no DLQ for generic failures |
| RES-P2-003 | `QUEUE_BACKEND` default `inline` diverges from prod; can silently stall work |
| RES-P2-004 | External `fetch` without `AbortController` in `public.ts` / `auth.ts` |
| INFRA-P2-005 / DR-P2-003 | Ops docs contradict the current pipeline |
| FILE-P2-003 | No content/AV scanning, no bucket-level MIME/size limits |
| FILE-P2-005 | Content sniffing misses Office/archive/text/JSON/polyglot |
| FILE-P2-006 | CSV exports don't neutralize formula injection; default to all rows |
| IR-P2-004 | Secrets rotation documented but never exercised |
| IR-P2-005 | No status/communication surface for MCT's own outages |

---

## P3 (76) — not triaged here

P3 is mostly polish and hardening-in-depth. Default: leave open, revisit after the
P2 batches below. Offered on request.

---

## Recommended sequence

1. **PR #31 — isolation + credential hygiene** (Section B). Small, thematically
   coherent, becomes harder with real tenants. *Highest value per unit effort.*
2. **Alerting milestone** (Section C). One project: deliver alerts, wire the missing
   metrics, prove the restore test. Prereq for any on-call commitment.
3. **CI/release governance** (Section I: BP-*, CI-P2-003/004, DATA-P2-004, REL-*).
   Cheap, self-contained, unblocks meaningful branch protection.
4. **Data lifecycle** (Section D) before the first backup/restore is relied upon.
5. **Admin guardrails + worker resilience** (Section J subset) before giving clients
   admin access.
6. Search (G) and supply chain (E) when those surfaces are prioritised.

## What I would *not* do

- Do not bulk-fix P2 as one PR. The audit's own verdict is that residual risk is in
  interaction effects; a 130-finding PR is unreviewable.
- Do not treat **CHAIN-P2-\*** as separate tickets. They are compositions of the
  individual findings and close when their constituents close.
- Do not set a rotation/expiry policy (ACM-P2-006/007, SECRET-P2-001) before the
  rotation workflow itself exists (SECRET-P2-002).

## Open design decisions needing an owner (from PR #30)

- `bulk_update_with_version` RPC org argument (shared-function design change).
- `check-rls-predicate.mjs` file-scoped `SAFE_NEARBY` weakness (mixed files evade it).
- CSRF on cookie-authenticated routes — now tracked as **issue #31** (pre-existing
  CodeQL high, split out of PR #30).
