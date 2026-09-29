# Changelog

All notable changes to the MCT Portal monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Entries are grouped by date until the first tagged release; commit SHAs are
short-form for traceability. Per-change detail (and remaining debt) lives in
[`AGENTS.md`](./AGENTS.md).

## [Unreleased]

### Added

- First-class MFA login second factor: `POST /auth/sign-in` reports
  `mfaRequired` (cached `userHasVerifiedFactor()`), the login form stores a
  10-minute `mct_mfa_pending` cookie and shows a verification step that
  completes `auth.mfaFactors` → `mfaChallenge` → `mfaVerify` before issuing the
  `aal2` session (`docs/MFA.md`).
- MFA recovery codes (migration `5302427`): 10 scrypt-hashed single-use codes
  generated after step-up (`POST /auth/mfa/recovery-codes`, status/report at
  `GET`, revoke at `DELETE`), spendable at the login step
  (`POST /auth/mfa/recovery`) to unenroll a lost authenticator and force
  re-enrollment; managed from `/portal/profile/security`.
- CSP violation reporting: unauthenticated `POST /api/v1/public/csp-report`
  accepts `application/csp-report` and `application/reports+json`, logs a
  sanitized/truncated summary and never persists; the web middleware emits
  `report-uri`, `report-to` and `Reporting-Endpoints` for the production CSP.
- OpenAPI response schemas + contract tests: `responseSchema` on 14 high-value
  routes (auth/MFA/tickets/store) with a `successStatus` builder field, and
  `openapi-contracts.test.ts` validating live responses against the spec
  (412 paths, 0 missing).
- Dead-letter webhook deliveries are now visible and actionable: admin list +
  retry/dismiss API (`/webhook-endpoints/dead-letters`), SDK methods and a
  `/admin/webhooks/dead-letters` page.
- Accessibility breadth triage: `A11Y_FULL=1` scans 68 routes with `wcag22aa`
  tags via the non-blocking weekly/manual `a11y-breadth.yml`.
- Architecture decision records 008–011 (RLS rollout, MFA model, dark-only
  theme, shared UI kit) and `docs/RELEASING.md`.
- **Prompt 17 — ethical FOMO conversion UX**: `store_campaigns` (migration
  `5302422`) persists seasonal readiness campaigns with an opt-in
  limited-capacity field; the public banner and admin manager are DB-backed and
  the capacity message is computed server-side and only shown when an admin
  enabled it with consistent numbers (`apps/api/src/lib/store-campaigns.ts`).
  New public components: `QuickWinLadder` (with the required
  "Start With a Quick Win" CTA), `TrustPanel`, `MiniPackageComparison`,
  `StickyMobileCta` (mobile-only, dismissible, non-blocking), and A/B copy
  variants (`lib/catalog/copy-variants.ts`). No fake scarcity, countdowns, or
  fear-based copy.
- Import/export is now backed by the live catalog: it exports the DB products and
  categories (JSON/CSV) and upserts them through the store API
  (`/admin/store/import-export`).
- MFA `aal2` enforcement behind `MFA_ENFORCEMENT_ENABLED`
  (`apps/api/src/lib/mfa.ts`, wired into `requireAuth`): an `aal1` session with a
  verified TOTP factor is rejected with `403 MFA_REQUIRED` on non-`/auth/*`
  routes; the web layouts redirect to the security step-up page. The factor
  lookup is cached 60s and fails open with a warning, and users without a factor
  are never blocked.
- Public storefront now reads the DB-backed store catalog (`store_products` /
  `store_categories`) through the store API, with the bundled JSON retained as an
  offline/empty-table fallback — admin catalog edits are now visible on the
  public store. New server-only `apps/web/lib/catalog/catalog-source.ts`.
- Quote submissions now also persist a structured `store_quote_requests` row and
  a scored `store_leads` row (`apps/api/src/lib/lead-scoring.ts`), with admin
  `GET /store/quote-requests` + `GET /store/leads` and matching SDK methods.
  These two tables were previously unwired.
- Admins can generate and review proposal drafts from a quote request
  (`store_proposal_drafts` via `apps/api/src/lib/proposal-generator.ts` +
  `POST /store/quote-requests/:id/proposal`, `GET`/`PATCH /store/proposal-drafts`),
  with new `/admin/store/quote-requests` and `/admin/store/leads` pages and
  sidebar links.
- `store_visual_assets` wired: admin CRUD API (`/store/visual-assets`), SDK
  methods, and a DB-backed section on `/admin/store/visuals` alongside the
  design-map reference.
- Intake → project handoff: `POST /store/quote-requests/:id/convert` creates the
  project, a 9-task fulfilment checklist and a handoff ticket, flips the quote
  request/lead to converted, audits and dispatches `project.created`
  (`apps/api/src/lib/intake-handoff.ts`). Driven from
  `/admin/store/operations`, with SDK `convertQuoteRequest`.
- Store intake linked to the first-class proposals stack: generating a proposal
  draft with an organization creates a `proposals` row plus a line item per
  requested service and links it via `store_proposal_drafts.proposal_id`
  (migration `5302421`), so store quotes enter the approvals/publish workflow.
  The convert step carries `proposalId` onto the project metadata, and
  `/admin/store/quote-requests` links through to `/admin/proposals/[id]`.

### Security

- Deploy now injects the Turnstile keys (`TURNSTILE_SECRET_KEY` into the droplet
  `.env`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as the web build arg) so the
  production contact form is captcha-protected (`e6bb073`).
- Rate-limit buckets no longer trust the unverified JWT `sub` claim; the key is
  now a SHA-256 hash of the whole Bearer token, with the global IP limiter as the
  authoritative ceiling (`9698315`).
- Project task-comment POST/PATCH/DELETE verify the task belongs to the path
  project before writing, closing a cross-project tamper path (`9698315`).
- Notification email HTML escapes user content — API `lib/notify.ts` and the
  worker's scheduled notifications (`9698315`, `f4d5073`).
- CodeQL static analysis (`codeql.yml`, JS/TS, `security-and-quality`,
  push/PR/weekly) added alongside the existing dependency/SBOM scanning.
- `client_portal_entitlements` RLS insert/update policies aligned with the API
  gate: platform `admin`/`super_admin` only (`client_admin` dropped) plus a
  `with check` so a row cannot be moved across organizations (migration
  `5302428`). The API writes with the service role, so nothing depended on the
  wider policy.

### Fixed

- Proposal creation lost the phase association for nested items — items declared
  inside a phase were written with `phase_id: null`. They now link to the phase
  they were declared under (`apps/api/src/routes/proposals.ts`).
- CycloneDX 1.5 SBOM generation: `scripts/generate-sbom.mjs` + `SBOM` workflow
  (artifact `sbom-cyclonedx`).
- `docs/audits/` output contract and run directories
  (`docs/audits/README.md`).
- Committed branch-protection configuration
  (`.github/branch-protection/*.json`).
- Explicit `permissions:` blocks on every GitHub Actions workflow.

### Changed

- Split the ~1,480-line `apps/api/src/routes/store.ts` into
  `routes/store/{promotions,quotes,campaigns,visual-assets,catalog}.ts` with a
  thin aggregator (same `registerXxxRoutes(router)` pattern as `routes/final/`).
  Registration order and all 34 route definitions are unchanged; the API suite
  (1,186 tests) passes untouched.
- Store storefront pages (`/store`, `/store/[slug]`, `/store/category/[slug]`,
  `/store/quote`, `/store/compare/[slug]`, `/portal/store`) are now async server
  components backed by the catalog source; the store sidebar receives categories
  from the server layout.
- Second full audit of all six prompt packs; see `AGENTS.md` for the finding
  ledger.
- UI/docs completeness remediation from the 2026-09-27 audit
  (`docs/audits/ui-ux-docs-completeness/2026-09-27/report.md`): admin/portal
  detail pages now return real 404s and rethrow 5xx, auth helpers no longer
  redirect on transient failures, toasts consolidated onto
  `components/ui/ToastProvider` + `useToast()`, page-level empties use
  `EmptyState`, 12 status badges moved onto `StatusPill`, money/date formatting
  goes through `lib/format.ts`, 83 dynamic pages export `generateMetadata`, and
  `docs/openapi.yaml` was completed to 406 paths with a new blocking coverage
  audit (`scripts/openapi-audit.js`) in `test.yml` and `validate.yml`.
- UI consistency follow-through: `StatusPill` gained a `tone`/`label` API and
  the last four store badge helpers were converted; `lib/format.ts` added
  UTC/month-day helpers and the remaining `toLocale*` call sites moved onto it.
- `terraform-do` plan failures are no longer masked by the `tee` pipeline
  (`set -o pipefail`).
- `docs/module-matrix-mapping.md` maps the 60-module prompt-pack matrix to the
  real feature/runbook/API/SDK/UI paths.
- CI schema guards: `node scripts/generate-db-types.js --check` (generated types
  must be current) and `node scripts/verify-rls.mjs` (every table RLS-enabled,
  policy idempotency for new migrations) run in `test.yml` + `validate.yml`;
  `docs/RLS-coverage-matrix.md` notes the script as the live source.
- Sentry tracing/release are tunable via `SENTRY_TRACES_SAMPLE_RATE` and
  `SENTRY_RELEASE` (web client: `NEXT_PUBLIC_SENTRY_*`), defaulting to the
  previous 0.2 production / 0 development behaviour.

## 2026-09-21

### Fixed

- **Security (P0):** `requireOrgAccess` only compared the camelCase body key, so a
  snake_case `organization_id` body bypassed the cross-org guard
  (`edu-automation` scorecards/evaluate). Both spellings are now checked
  (`ab2674d`).
- **Security (P1):** API-side webhook fetches followed redirects after the SSRF
  check — now `redirect: "manual"` (`ab2674d`).
- **Security (P2):** `client_portal_entitlements` RLS allowed any approved member
  to write entitlements the API gates to admins; `impersonation_log.actor_user_id`
  `NOT NULL` broke user deletion (migration `5302420`).
- File-request uploads were 50 MB and unsniffed; `validateUploadContent` was
  extracted to `lib/upload-validation.ts` and reused (25 MB cap).
- Worker: fetch timeouts, notification dedupe on retry, PII removed from logs,
  SSRF-blocked webhook deliveries marked `dead_letter` (`f8db21b`).
- CI: `github.ref_name`/`repository` are no longer interpolated into the remote
  root shell; the worker health check authenticates; the E2E push trigger was
  removed; `terraform fmt -check -recursive` is blocking (`9449af2`).
- Deploy: duplicate `env:` key + unforwarded `GHCR_TOKEN`/`GHCR_ACTOR` broke every
  dev deploy ("workflow file issue" / empty docker username); UTF-8 BOMs stripped
  from `deploy-do.yml` and `e2e.yml` (`4064626`, `e65ef82`).
- Web: failed loads now surface via `DataErrorNote` on ~100 admin/portal pages
  instead of rendering misleading zeros (`05cd4ad`, `0bc295b`, `2203553`,
  `11cfdd0`).

## 2026-09-20

### Added

- Seven GAP modules completed end-to-end (client portal, knowledge base,
  compliance readiness, CAB, hardware staging, device profiles, network
  diagrams).

### Fixed

- Tenant-isolation bypass via `?organization_id=A` + body `organizationId=B`;
  RLS approved-status regression (migration `5302418`); webhook retries never
  scheduled (`next_retry_at`); Stripe reconciliation suspending on non-terminal
  states; SSRF; Redis URL no longer logged.
- Reliability: deploy health gate + auto-rollback to the previous tag, Terraform
  state locking, compose log rotation, fail-closed `IMAGE_TAG`, FK indexes
  (migration `5302419`).

## 2026-09-18

### Added

- MFA (TOTP) management backend + SDK (`GET/POST/DELETE /auth/mfa/*`) and an
  opt-in enrollment UI at `/portal/profile/security`. Non-enforcing by design.
- Nonce-based CSP for `script-src` (production), replacing `unsafe-inline`.

### Fixed

- Real bugs surfaced by typed Supabase clients: `tickets.subject` → `title`;
  `webhook_deliveries.webhook_id` nullability; `satisfaction_pulses` /
  `satisfaction_pulse_templates` missing columns; `domain_monitors.version`
  missing (optimistic locking wrote `NaN`).
- `deploy-do` droplet IP resolution (dev deploys had been red since 2026-08-30).

## 2026-08-26

### Security

- Stored XSS via `javascript:` URL in `CommentBody`; `NODE_ENV=test` auth
  bypasses removed; JWT secret minimum length 32; `users`/`search`/`profiles`
  routers gained `requireOrgAccess`; rate-limit `trust proxy` spoofing; permissive
  `store_*` RLS; PII redacted from email logs; upload cap reduced to 2 MB.

### Added

- Database types generated from migrations (`packages/sdk/src/database.types.ts`)
  and adopted across the worker; prompt-pack provenance pinning
  (`scripts/verify-prompts.js`); runtime OpenAPI generation.

[Unreleased]: https://github.com/MaineCyberTech/mainecybertech/commits/develop
