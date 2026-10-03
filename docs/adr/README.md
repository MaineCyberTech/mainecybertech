# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting key technical decisions made during the development of the Maine CyberTech Portal.

ADRs 008–011 below follow the standard format:

- **Title** — What was decided
- **Status** — Proposed, Accepted, Deprecated, Superseded
- **Context** — Why this decision was needed
- **Decision** — What was chosen
- **Consequences** — Trade-offs, risks, and impact

ADRs 001–007 (May 2026) predate this directory and exist only as the table
entries on this page, not as full records.

---

| #   | Title                                                                                                | Status   | Date       |
| --- | ---------------------------------------------------------------------------------------------------- | -------- | ---------- |
| 001 | Switch from AWS ECS to DigitalOcean Droplet                                                          | Accepted | 2026-05    |
| 002 | Use BullMQ (Redis) over SQS for job queuing                                                          | Accepted | 2026-05    |
| 003 | PKCE Auth with JWT Cookie                                                                            | Accepted | 2026-05    |
| 004 | In-Memory Cache over Redis                                                                           | Accepted | 2026-05    |
| 005 | Hosted Supabase over Self-Hosted                                                                     | Accepted | 2026-05    |
| 006 | Custom SDK over Generated API Client                                                                 | Accepted | 2026-05    |
| 007 | Turborepo Monorepo Structure                                                                         | Accepted | 2026-05    |
| 008 | RLS rollout via `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` + `getScopedClient`                         | Accepted | 2026-09-27 |
| 009 | MFA: Supabase-native TOTP, opt-in `aal2` enforcement, login step, recovery codes, no trusted devices | Accepted | 2026-09-27 |
| 010 | Dark-only theme pinned                                                                               | Accepted | 2026-09-27 |
| 011 | Shared web UI kit is the only sanctioned pattern                                                     | Accepted | 2026-09-27 |

---

## 008 — RLS rollout via `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` + `getScopedClient`

**Status:** Accepted
**Date:** 2026-09-27

**Context:** Most API reads and writes go through the service-role Supabase
client, which bypasses Row-Level Security, so tenant isolation rests on
`requireOrgAccess`/`requirePermission` in application code. Switching every
route to RLS at once would be a high-risk big-bang change, and platform admins
legitimately need cross-tenant reads (org switcher / impersonation) that a
user-scoped client cannot perform.

**Decision:** `getScopedClient(req, moduleKey, kind)`
(`apps/api/src/services/supabase.ts`) returns a **user-scoped** client (anon key

- the request's JWT, so Postgres RLS is enforced) when the module key is listed
  in `RLS_READS_ENABLED` (kind `"read"`) or `RLS_WRITES_ENABLED` (kind `"write"`)
  **and** the request carries `req.userJwt`. Otherwise it returns the service-role
  client. Platform admins acting cross-tenant (`req.orgScope.platformAdmin`) keep
  the service-role client — their access is already audited by `requireOrgAccess`.
  The allow-lists are repo-level GitHub secrets (set 2026-08-30) enabling ~44 read
  and ~17 write modules, injected into the API container `.env` by `deploy-do.yml`;
  an environment secret (`--env dev|prod`) overrides the repo value.

**Consequences:** RLS is enabled one module at a time and rolled back by removing
the key and redeploying — no code change or migration. Enabling a module requires
complete approved-aware RLS policies (prefer `public.is_org_member()`; see the
preconditions in `docs/RLS-rollout.md`) and the validation checks in that
runbook. Public routes are unaffected (no JWT → service-role client).
Platform-admin cross-tenant access remains RLS-bypassing by design, mitigated by
impersonation logging. Covered by `get-scoped-client.test.ts`.

## 009 — MFA: Supabase-native TOTP, opt-in `aal2` enforcement, login step, recovery codes, no trusted devices

**Status:** Accepted
**Date:** 2026-09-27

**Context:** The portal needed a second factor and a lost-device recovery path
without owning TOTP secret material. Supabase (GoTrue) already ships TOTP
factors and authenticator assurance levels (`aal1`/`aal2`), and its factor
verification is session-bound.

**Decision:** Use GoTrue TOTP end-to-end; no TOTP secrets are stored in our
database (`auth.mfa_factors` is GoTrue-owned). The only MFA table we own is
`public.mfa_recovery_codes` (migration `5302427`), holding scrypt hashes of 10
single-use codes per user. Enforcement is opt-in behind
`MFA_ENFORCEMENT_ENABLED` (default `false`): `requireAuth` rejects an `aal1`
session that has a verified factor with `403 MFA_REQUIRED` on non-`/auth/*`
routes (factor lookup cached 60s, fails open with a warning; users with no
factor are never blocked). Sign-in is a first-class two-step flow:
`POST /auth/sign-in` returns `mfaRequired`, the web stores the `aal1` token in a
10-minute `mct_mfa_pending` cookie, and only after `challenge` + `verify` is it
swapped for the `aal2` session. A recovery code spent at the login step cannot
mint an `aal2` session, so it unenrolls the factors and forces re-enrollment.
"Remember this device" is intentionally **not** implemented: GoTrue derives
`aal2` from an in-session factor verification, so a device bypass would either
weaken enforcement or require a parallel session model.

**Consequences:** No secret storage and no per-factor schema; the feature stays
dark until TOTP is enabled on the hosted Supabase project and the API flag is
set, so rollout is safe and reversible. Recovery codes are single-use;
generation and revocation require an `aal2` session when a factor exists, and
self-service factor removal or a password reset remains available on the `aal1`
`/auth/*` surface. Remaining work: SSO (SAML/OIDC), which needs a paid Supabase
plan and per-org provider config. See `docs/MFA.md`.

## 010 — Dark-only theme pinned

**Status:** Accepted
**Date:** 2026-09-27

**Context:** The theme provider supports `light`/`dark`/`system`, but the
product is designed and tested only in dark mode. The light token set in
`packages/ui/src/styles.css` is a stub (`--cyber-base`, `--cyber-card`,
`--cyber-card-hover`, `--cyber-accent`) while most utilities (`cyber-page-bg`,
`cyber-input`, `glass-card`, status text) hard-code dark colors, so light mode
renders unreadable.

**Decision:** Pin the app to dark mode:
`<ThemeProvider defaultTheme="dark" storageKey="mct-theme-dark">` in
`apps/web/app/layout.tsx`, with no user-facing toggle.
`docs/WEB_UI_CONVENTIONS.md` and `docs/ui-kit.md` record the pin.

**Consequences:** One consistent, readable look; no half-styled light mode is
reachable. Reintroducing a toggle requires completing the light token set and
auditing every hard-coded dark color — a deliberate future task, not a config
flip.

## 011 — Shared web UI kit is the only sanctioned pattern

**Status:** Accepted
**Date:** 2026-09-27

**Context:** Admin and portal pages had duplicated toast renderers, status
badge helpers, empty states, load-failure handling and local date/currency
formatters. The duplicates drifted, and a11y or consistency fixes could not be
applied globally.

**Decision:** Use the shared kit for all of it:
`components/ui/ToastProvider` + `useToast()` (mounted once in the root layout),
`components/admin/StatusPill` (extend `STATUS_TONES`, or pass `tone`/`label`),
`components/EmptyState` for page-level empty lists,
`components/admin/DataErrorNote` for load failures, and `lib/format.ts` for all
date/currency output. Per-page equivalents are not allowed. When a load fails,
render `DataErrorNote` (or rethrow) — never an empty/zero state.

**Consequences:** One place for a11y and styling fixes; the "list page masked a
failure as an empty state" class of bug is structurally prevented. Contributors
extend the shared maps/components instead of copy-pasting; nested
section/sub-list empties stay inline by design. Documented in
`docs/WEB_UI_CONVENTIONS.md` and catalogued in `docs/ui-kit.md`.
