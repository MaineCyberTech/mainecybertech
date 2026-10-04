# Security, Authorization, and Tenancy Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: SEC
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/06_security_authz_tenancy_audit.md
- Scope limitations: Static only; no live probing. Secret values never printed.

## Scope

Authn/authz, sessions/JWT, CSRF/CORS, rate limiting, security headers, input validation, file handling, API/admin permissions, tenant isolation, RLS, public/webhook routes, API keys, secrets, lifecycle, audit logging, IDOR/SSRF/mass-assignment/sensitive logs.

## Evidence Reviewed

- `apps/api/src/middleware/{auth,csrf,org-access,permissions,rate-limit,security,security-headers,admin}.ts`.
- `apps/api/src/config/env.ts`, `lib/{field-encryption,ssrf-guard,upload-validation,webhook-signature,service-role}.ts`.
- `apps/api/src/routes/{public,webhooks,api-keys,documents,analytics}.ts`.
- `supabase/migrations/5302129_*`, `5302434_*`, `5302435_*`; `scripts/verify-rls.mjs`.
- `infra/terraform/digitalocean/firewall.tf`; `infra/digitalocean/.env.example`.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `app.ts` middleware order | source | controls | CSP nonce, CSRF, idempotency present |
| read `field-encryption.ts` | source | PII at rest | `plain:` fallback when key absent |
| read `org-access.ts` | source | tenancy | platform-admin cross-tenant audited |
| read `5302129`, `5302434` | SQL | RLS | earlier public_interactions/anon issues addressed |
| `git ls-files` on `.env`/`secrets` | command | secret leakage | only `*.env.example` tracked; `.temp` secrets untracked |
| grep `security definer` + `set search_path` | source | RLS definer safety | helper fns pin `search_path=public` |

## Executive Summary

Security posture is strong for a project of this size: JWT algorithm pinned to HS256 with a Supabase fallback, Redis-backed atomic idempotency, double-submit CSRF with cross-subdomain cookie scoping, SSRF guard with DNS resolution, byte-sniffed uploads with markup rejection, org-scoped access checks, platform-admin impersonation logging, `security definer` helpers with pinned `search_path`, and a static RLS hygiene CI gate. Residual issues: field encryption silently degrades to reversible plaintext if `FIELD_ENCRYPTION_KEY` is unset (it is optional in the env schema), Turnstile/CAPTCHA is bypassable when the secret is unset, and `/health` publicly discloses provider configuration and Redis error text. No P0 was reproduced; the prior `public_interactions` RLS-disable and blanket-`anon`-grant issues are remediated by migrations `5302129`/`5302434` at this commit.

## Inventory

| Control | Path | State | Risk |
|---|---|---|---|
| JWT verify (HS256 pinned) | `middleware/auth.ts:43-96` | implemented | Low |
| Supabase session fallback | `middleware/auth.ts:98-139` | implemented | Low |
| CSRF double-submit | `middleware/csrf.ts` | implemented | Low |
| CORS allowlist/reflect | `app.ts:90-109` | implemented | Low |
| Rate limits (IP+user+email) | `middleware/rate-limit.ts` | implemented | Low/Medium (in-memory) |
| Security headers/CSP | `middleware/security-headers.ts` | implemented | Low |
| SSRF guard | `lib/ssrf-guard.ts` | implemented | Low |
| Upload validation | `lib/upload-validation.ts` | implemented | Low |
| Tenant gate | `middleware/org-access.ts` | implemented | Low |
| Permission gate | `middleware/permissions.ts` | implemented | Medium |
| Field encryption | `lib/field-encryption.ts` | partial | High |
| Turnstile | `routes/public.ts:26-40,129-138` | conditional | Medium |
| API keys | `routes/api-keys.ts` | non-functional | Medium |
| RLS | `supabase/migrations` | enabled (CI-gated) | Low |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Auth provider | 4 | Supabase GoTrue + MFA | — | keep |
| Session tokens/cookies | 4 | `mct_session`, csrf cookie | — | keep |
| JWT validation | 4 | HS256 pinned, exp check | — | keep |
| CSRF/CORS | 4 | `csrf.ts`, `app.ts` | — | keep |
| Rate limits | 3 | per-user/IP/email | in-memory multi-replica | external store |
| Security headers | 4 | helmet + explicit headers | deprecated X-XSS | cleanup |
| Input/output validation | 4 | Zod + sanitizer | — | keep |
| File handling | 4 | sniffing + bucket pin | — | keep |
| API permissions | 4 | `requirePermission` | route coverage varies | audit coverage |
| Admin permissions | 3 | `admin.ts`, role bypass | platform-admin breadth | keep audited |
| Tenant/org/workspace isolation | 3 | `org-access.ts` | service-role default | ARCH-P2-002 |
| RLS policies | 4 | 5302129/5302434 | — | keep |

## Detailed Review

### Item: PII field encryption

- Evidence: `config/env.ts:27` (`FIELD_ENCRYPTION_KEY` optional); `lib/field-encryption.ts:32-43` returns `plain:<value>` when the key is missing/wrong length.
- What it does: AES-256-GCM when configured; reversible plaintext otherwise.
- Risks: production may silently store “encrypted” PII in cleartext; the `plain:` prefix is indistinguishable at rest as safe.

### Item: CAPTCHA

- Evidence: `routes/public.ts:26-40` (`verifyCaptcha` returns `true` if `TURNSTILE_SECRET_KEY` unset); `:129-138` requires token only when secret present.
- Risks: form abuse/spam if the secret is not configured; silent because it only logs.

### Item: Remediated prior findings (self-consistency)

- Evidence: `supabase/migrations/5302129_supabase_rls_audit_fixes.sql:33-79` re-enables RLS on `public_interactions` and revokes anon/authenticated DML; `5302434_anon_privilege_least_privilege.sql` revokes the blanket `anon` grant on all tables. These are `verified-fixed` at this commit (static evidence).

## Findings

### Finding ID: SEC-P1-001 - PII field encryption silently degrades to reversible plaintext

- Severity: P1
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/config/env.ts:27` — `FIELD_ENCRYPTION_KEY: z.string().optional()`
  - `apps/api/src/lib/field-encryption.ts:32-43` — returns `` `plain:${plaintext}` `` when the key is absent or not 32 bytes
  - `apps/api/src/lib/field-encryption.ts:11-14` — doc states application to `profiles` is an unfinished follow-up
  - `.github/workflows/deploy-do.yml` — forwards `FIELD_ENCRYPTION_KEY` from secrets, but env validation does not require it
- What is happening: encryption is best-effort; a missing/mis-sized key does not fail startup or writes, it stores reversible plaintext tagged `plain:`.
- Why it matters: the control meant to protect PII at rest can be absent in production without any error, and operators may assume profiles are encrypted.
- User / business impact: compliance exposure (GDPR/CCPA), breach blast radius.
- Security / privacy / reliability impact: high privacy.
- Recommended fix: when `NODE_ENV=production`, require a valid 32-byte `FIELD_ENCRYPTION_KEY` at boot and refuse to write PII if absent; never write new `plain:` values in prod; log a metric for legacy plaintext rows.
- Suggested validation: boot API in prod mode without the key and assert startup fails; unit test that `encryptField` throws in prod without a key.
- Owner suggestion: security/API
- Effort estimate: S
- Dependencies: key provisioning
- Status: open
- Data path: profiles PII write/read via `field-encryption`

### Finding ID: SEC-P2-002 - CAPTCHA/Turnstile is bypassed when the secret is unset

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/public.ts:26-30` — `verifyCaptcha` returns `true` when `TURNSTILE_SECRET_KEY` is unset
  - `apps/api/src/routes/public.ts:129-138` — token required only when `captchaSecret` is truthy
- What is happening: absent configuration silently disables the anti-bot control instead of failing closed.
- Why it matters: the public lead endpoints (`/init`, `/submit`) are spam/abuse vectors and write rows + trigger external webhooks/tickets.
- User / business impact: spam, JSM ticket spam, notification noise.
- Security / privacy / reliability impact: medium abuse/DoS.
- Recommended fix: in production require `TURNSTILE_SECRET_KEY` (boot assertion) or fail closed with 503 when unconfigured.
- Suggested validation: submit without token in prod config and expect 400/503.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: Turnstile account
- Status: open
- Endpoint / data path: `POST /api/v1/public/submit`, `GET /api/v1/public/init`

### Finding ID: SEC-P2-003 - `/health` publicly discloses provider configuration and Redis errors

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/routes/health.ts:74-113` — unauthenticated; returns `checks.stripe.status` (`not_configured`), `checks.jsm`, and `checks.redis.error`
  - `apps/api/src/app.ts:138-143` — rate-limit skip for `/health`
- What is happening: an unauthenticated caller learns whether Stripe/JSM are configured and receives raw Redis error strings.
- Why it matters: reconnaissance aid; error strings can leak internal hosts/ports.
- User / business impact: low direct.
- Security / privacy / reliability impact: low/medium information disclosure.
- Recommended fix: return only `{status}` publicly; expose detailed checks on an authenticated/allow-listed internal endpoint or behind `METRICS_TOKEN`.
- Suggested validation: unauthenticated `/health` contains no provider names/errors.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: none
- Status: open
- Endpoint / data path: `GET /health`

### Finding ID: SEC-P3-001 - Deprecated header and broad API CSP style directive

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `apps/api/src/middleware/security-headers.ts:7` — `X-XSS-Protection: 1; mode=block` (deprecated, can introduce legacy filter issues)
  - `apps/api/src/middleware/security-headers.ts:27-31` — `style-src 'self' 'unsafe-inline'`
- What is happening: a deprecated header is retained; style CSP is permissive.
- Why it matters: minor hardening hygiene; API returns JSON so impact is minimal.
- Recommended fix: drop `X-XSS-Protection`; tighten style-src if feasible.
- Suggested validation: header scan in CI.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: none
- Status: open

### Finding ID: SEC-P3-002 - M365 webhook `clientState` is compared non-constant-time

- Severity: P3
- Confidence: Medium
- Area: SEC
- Evidence:
  - `apps/api/src/routes/webhooks.ts:454` — `notification.clientState !== clientState`
- What is happening: the only M365 authentication secret is compared with a normal string equality.
- Why it matters: theoretically timing-observable; practically low due to network jitter and provider-only delivery.
- Security / privacy / reliability impact: low.
- Recommended fix: use `crypto.timingSafeEqual` on equal-length buffers.
- Suggested validation: unit test reuse of `timingSafeCompare`.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Unencrypted PII | P1 | Medium | Breach/compliance | SEC-P1-001 | require key |
| Spam without CAPTCHA | P2 | Medium | Abuse | SEC-P2-002 | fail closed |
| Info disclosure | P2 | High | Recon | SEC-P2-003 | trim health |
| Timing on clientState | P3 | Low | Theoretic | SEC-P3-002 | timingSafeEqual |

## Recommendations

### Immediate / Release Blocking
- Require `FIELD_ENCRYPTION_KEY` in production (SEC-P1-001).
- Require Turnstile in production (SEC-P2-002).

### This Week
- Trim `/health` public payload (SEC-P2-003).

### This Month
- Header cleanup + constant-time compare (SEC-P3-001/002); audit `requirePermission` coverage per write route.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Prod env boot assertions | fail closed | `config/env.ts` | unit |
| Trim health | remove recon | `routes/health.ts` | unit |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Require encryption key | P1 | sec/API | S | key |
| CAPTCHA fail-closed | P2 | API | S | Turnstile |
| Permission coverage audit | P2 | API | M | catalog |

## Suggested Tests

- Unit: `encryptField` throws in prod without key; `verifyCaptcha` fails closed.
- Integration: public submit without token → 400.
- Regression: `public_interactions` direct PostgREST SELECT as `anon`/`authenticated` → denied.

## Suggested Documentation Updates

- `docs/SECURITY.md` note on required prod secrets; API-key limitation (FEAT-P2-001).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is `FIELD_ENCRYPTION_KEY` set in the prod environment today? | live PII risk | environment config (read-only) |
| Is `profiles` actually wired to field encryption yet? | control effectiveness | route source |

## Appendix

- Prior RLS issues (`5302038` disable, `5302116` blanket anon grant) are superseded by `5302129` + `5302434` at this commit — recorded `verified-fixed` (static).
- `security definer` helper functions (`is_super_admin`, `user_has_permission`, `is_org_member`, `is_org_approved_member`, `storage_path_org_id`) pin `set search_path = public`.
