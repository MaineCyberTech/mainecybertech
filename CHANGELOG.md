# Changelog

All notable changes to the MCT Portal monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Entries are grouped by date until the first tagged release; commit SHAs are
short-form for traceability. Per-change detail (and remaining debt) lives in
[`AGENTS.md`](./AGENTS.md).

## [Unreleased]

### Added

- Public storefront now reads the DB-backed store catalog (`store_products` /
  `store_categories`) through the store API, with the bundled JSON retained as an
  offline/empty-table fallback — admin catalog edits are now visible on the
  public store. New server-only `apps/web/lib/catalog/catalog-source.ts`.
- Quote submissions now also persist a structured `store_quote_requests` row and
  a scored `store_leads` row (`apps/api/src/lib/lead-scoring.ts`), with admin
  `GET /store/quote-requests` + `GET /store/leads` and matching SDK methods.
  These two tables were previously unwired.
- CycloneDX 1.5 SBOM generation: `scripts/generate-sbom.mjs` + `SBOM` workflow
  (artifact `sbom-cyclonedx`).
- `docs/audits/` output contract and run directories
  (`docs/audits/README.md`).
- Committed branch-protection configuration
  (`.github/branch-protection/*.json`).
- Explicit `permissions:` blocks on every GitHub Actions workflow.

### Changed

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
