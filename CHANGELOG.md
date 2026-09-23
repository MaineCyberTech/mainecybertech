# Changelog

All notable changes to the MCT Portal monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Entries are grouped by date until the first tagged release; commit SHAs are
short-form for traceability. Per-change detail (and remaining debt) lives in
[`AGENTS.md`](./AGENTS.md).

## [Unreleased]

### Added

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
  (1,163 tests) passes untouched.
- Store storefront pages (`/store`, `/store/[slug]`, `/store/category/[slug]`,
  `/store/quote`, `/store/compare/[slug]`, `/portal/store`) are now async server
  components backed by the catalog source; the store sidebar receives categories
  from the server layout.
- Second full audit of all six prompt packs; see `AGENTS.md` for the finding
  ledger.

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
