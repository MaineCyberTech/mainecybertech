# Changelog Draft — proposed additions

> **Draft.** These are the entries to insert into `CHANGELOG.md` (Keep a Changelog)
> for the delta `75d39269 → 62861370`. Generated read-only from real git history
> by audit prompt 40. Do not publish until the release-identity items in the
> main report (REL-P1-001/002) are resolved.

Baseline: `75d39269` (2026-08-06) · Target: `62861370` (2026-10-01) · 371 commits · 34 migrations.

---

## How to apply

Per `docs/RELEASING.md:53-58`:

1. Keep the `[Unreleased]` heading at the top.
2. Insert the dated heading below for shipped work, or keep entries under
   `[Unreleased]` until the first tagged release.
3. Add the new `### Breaking Changes` subsection (it does not exist today —
   see finding REL-P2-002).

---

## Proposed `## [Unreleased]` additions

### Added

- MFA recovery codes: 10 scrypt-hashed single-use codes generated after step-up
  (`POST /auth/mfa/recovery-codes`, status at `GET`, revoke at `DELETE`),
  spendable at login (`POST /auth/mfa/recovery`) to unenroll a lost
  authenticator; managed from `/portal/profile/security` (`81b54a85`,
  migration `5302427`).
- CSP violation reporting: unauthenticated `POST /api/v1/public/csp-report`
  accepts `application/csp-report` and `application/reports+json`, logs a
  sanitized/truncated summary and never persists; the web middleware emits
  `report-uri`, `report-to`, `Reporting-Endpoints` (`81b54a85`).
- Dead-letter webhook deliveries are visible and actionable: admin list +
  retry/dismiss API (`/webhook-endpoints/dead-letters`), SDK methods, and
  `/admin/webhooks/dead-letters` (`81b54a85`, `cacb3b91`).
- OpenAPI response schemas + contract tests on 14 high-value routes
  (`81b54a85`, `a3668602`).
- Accessibility breadth triage (`A11Y_FULL=1`, 68 routes, `wcag22aa` tags) via
  the non-blocking weekly/manual `a11y-breadth.yml` (`c409d5cb`, `43573d12`).
- Store: DB-backed seasonal campaigns with opt-in limited-capacity messaging
  (`15717762`, migration `5302422`); quote requests + scored leads
  (`daf87333`); proposal draft generation (`d90176a0`, migration `5302421`);
  `store_visual_assets` admin CRUD + page (`f43aca7d`); intake→project handoff
  (`1c48b23d`); store intake linked to the proposals/approvals stack
  (`d5aa0336`).
- Seven GAP modules completed end-to-end: client-portal bootstrap, knowledge
  base, compliance readiness, mini-CAB, hardware staging, device profiles,
  network diagrams.
- Public status page; portal incident/runbook/feedback detail pages.
- Architecture decision records 008–011 and `docs/RELEASING.md` (`e32fd5d0`).

### Security

- Rate-limit buckets no longer trust the unverified JWT `sub` claim; the key is
  a SHA-256 hash of the whole Bearer token, with the global IP limiter as the
  ceiling (`96983157`).
- Project task-comment POST/PATCH/DELETE verify the task belongs to the path
  project, closing a cross-project tamper path (`96983157`).
- Notification email HTML escapes user content in the API and the worker
  (`96983157`, `f4d5073d`, `c9f855af`).
- Webhook fetches no longer follow redirects after the SSRF check
  (`redirect: "manual"`); worker fetch timeouts, notification dedupe on retry,
  PII removed from logs, SSRF-blocked deliveries marked `dead_letter`
  (`ab2674d8`, `f8db21ba`).
- File uploads are content-sniffed with a 25 MB cap
  (`lib/upload-validation.ts`) (`ab2674d8`).
- Cross-org guard now checks both `organizationId` and `organization_id` body
  keys — a snake_case key could previously bypass it (`ab2674d8`).
- `client_portal_entitlements` RLS aligned with the API gate: platform
  `admin`/`super_admin` only (dropped `client_admin`) plus a cross-org
  `with check`; entitlement/impersonation fix (`5302420`, `5302428`).
- Deploy injects Turnstile keys so the production contact form is
  captcha-protected (`e6bb0735`).
- CodeQL SAST added; `image-size` override tightened; `pnpm audit` on `develop`
  is 0 critical/high (one low `elliptic` dev-only advisory remains) (`d799066a`,
  `47fd1a0b`).

### Fixed

- Deploy: duplicate `env:` key + UTF-8 BOM broke every dev deploy
  ("workflow file issue" / empty docker username); `GHCR_TOKEN`/`GHCR_ACTOR`
  now forwarded (`4064626b`, `e65ef821`).
- Auto-rollback to the previously running image tag when the health gate fails;
  container health is used for the deploy gate; Caddy healthcheck validates its
  config (`3cf876dc`, `4ee3537c`, `1301208f`, `23a8b71d`).
- Webhook retries are scheduled (`next_retry_at`); Stripe reconciliation no
  longer suspends on non-terminal states (`ab2674d8`).
- Worker: distributed lock for scheduled scans; batched notification lookups;
  dead-letter inline webhook rows instead of replaying truncated payloads
  (`4d4a7ce4`, `8656f64e`, `cacb3b91`).
- Web: failed loads surface via `DataErrorNote` on ~100 admin/portal pages
  instead of misleading zeros/empty states (`05cd4ad`, `0bc295b`, `2203553`,
  `11cfdd0`, `1a6a56f7`).
- Real bugs surfaced by typed Supabase clients: `tickets.subject` → `title`,
  `webhook_deliveries.webhook_id` nullability, missing `domain_monitors.version`,
  satisfaction-pulse columns (`dfa607bf`, `a85b41fb`, `6da96f81`).
- Terraform plan failures no longer masked by `tee` (`set -o pipefail`);
  Terraform state locking (`c409d5cb`, `ffaec956`).
- FK indexes added (migration `5302419`); RLS approved-status regression fixed
  (migration `5302418`).

### Changed

- `apps/api/src/routes/store.ts` (~1,480 lines) split into
  `routes/store/{promotions,quotes,campaigns,visual-assets,catalog}.ts` with a
  thin aggregator; registration order and all 34 route definitions unchanged
  (`509d2c10`).
- Public storefront pages are now async server components backed by the DB
  catalog; bundled JSON retained as fallback (`431692fc`).
- `terraform-do` is now manual-dispatch only; the `apply` input gates both apply
  jobs; a stale queued `terraform-apply-dev` run from 2026-06-08 was cancelled.
- Sentry tracing/release are tunable via `SENTRY_TRACES_SAMPLE_RATE` /
  `SENTRY_RELEASE` (`NEXT_PUBLIC_SENTRY_*` on the web client) (`4b160b80`).
- Toasts consolidated onto `ToastProvider` + `useToast()`; error toasts persist
  until dismissed and live regions are `aria-atomic` (`29d8755f`).
- `lib/format.ts` gained `formatRelativeTime` and the duplicated local wrappers
  were removed (`29d8755f`).
- CI schema guards added: `node scripts/generate-db-types.js --check` and
  `node scripts/verify-rls.mjs` run in `test.yml` + `validate.yml`
  (`c409d5cb`).

### Breaking Changes

> New subsection proposed (currently absent). Not confirmed customer-breaking,
> but these change **authorization behavior** and must be reviewed pre-promotion.

- RLS/entitlement policy changes: `5302412`, `5302418` (approved-status RLS),
  `5302420` (entitlement/impersonation), `5302428` (`client_admin` dropped from
  entitlement writes; platform admin only), `5302132`, `5302408`, `5302423`
  (store tenant scoping).
- `terraform-do` is manual-dispatch only; push/PR-triggered Terraform
  automation must migrate to `gh workflow run`.

---

## Proposed dated section (if promoting now)

```markdown
## 2026-10-01

### Added
- MFA recovery codes, CSP reporting, dead-letter webhook admin surface, OpenAPI
  response-schema contract tests, store campaigns/leads/proposals/visual assets,
  intake→project handoff, seven GAP modules, public status page.
### Security
- Rate-limit key no longer trusts unverified JWT `sub`; task-comment project
  binding; email HTML escaping; SSRF/webhook worker hardening; entitlement RLS
  alignment; Turnstile keys deployed; CodeQL + advisory cleanup.
### Fixed
- Deploy BOM/duplicate-env + GHCR credential fixes; health-gate auto-rollback;
  webhook retry scheduling; ~100 web pages now surface load errors; typed-client
  row-drift fixes; FK indexes; RLS approved-status regression.
### Changed
- `routes/store.ts` split; DB-backed storefront; `terraform-do` manual only;
  tunable Sentry; toast/format consolidation; CI schema/RLS guards.
### Breaking Changes
- RLS/entitlement policy changes (see migrations 5302412/5302418/5302420/5302428);
  terraform-do dispatch-only.
```

---

## Notes / caveats (do not publish)

- The existing `[Unreleased]` section already covers most of the store/MFA/CSP
  work merged before 2026-10-01; the **final** commits of this delta are **not**
  yet reflected (finding REL-P2-001):
  - `43573d12` — promote the seven fixed pages into the default a11y scan and
    gate `wcag22aa`.
  - `62861370` — record the widened a11y default gate.
  - `13e95482` — update test counts.
- No version tag exists; entries are anchored by short SHA only (REL-P1-001).
- Citations are real commits from `git log 75d3926..62861370`; short SHAs are
  as returned by git.
- Docs-only and audit-output commits were intentionally excluded from the
  user-facing sections.

*Generated read-only by audit prompt 40. Companion: `release_notes_draft.md`,
`40_release_notes_changelog_generator.md`.*
