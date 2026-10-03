# Privacy, Compliance, and Data Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01 02:33 UTC
- Auditor: principal-level repo auditor
- Area code: PRIV
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/18_privacy_compliance_data_governance.md
- Prior audit: 20260730-0650-develop-62da92c (4 P2, 1 P3 — PRIV-P2-001 privacy page fixed, PRIV-P2-004 retention partially fixed)
- Scope limitations: Static analysis only. No penetration testing. No legal review. No actual GDPR/CCPA/SOC2 audit performed.

## Scope

Audited PII handling in logs, email, and audit metadata; privacy policy; cookie consent; GA/Tawk.to scripts; data retention; data export/deletion; public_interactions table; .env.example files for stray secrets; IP address collection; CSP headers; audit log PII redaction; logger redaction configuration across API and Worker.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/src/lib/logger.ts` | Source | Pino redaction config | Strong — redacts email, phone, password, token, secret, authorization, cookie, fullName/full_name with wildcards |
| `apps/api/src/lib/email.ts` | Source | Email sending logs PII | Logs `{ to, subject }` — `to` key NOT caught by `*.email` redaction |
| `apps/api/src/services/audit.ts` | Source | Audit log PII redaction | Has field-based PII redaction for metadata; covers email, full_name, phone, password, token, secret |
| `apps/api/src/routes/auth.ts` | Source | Auth endpoints store email in audit | Sign-in/sign-up/forgot-password/reset-password all pass `email` in metadata |
| `apps/api/src/routes/public.ts` | Source | Contact form collects full PII | Stores name, email, phone, company, IP, user-agent |
| `apps/api/src/routes/audit.ts` | Source | Audit log viewer | Admin-only; exports metadata column which may contain redacted fields |
| `apps/api/src/config/env.ts` | Source | API env schema | Includes all SMTP, Stripe, JSM, Jira secrets as optional |
| `apps/api/.env.example` | Source | Example env file | Has 28 vars with placeholder values, no real secrets |
| `apps/api/.env` | Source | Local dev env | Contains local Supabase dev keys (expected, local-only) |
| `apps/api/.env.local` | Source | Local env | Empty placeholder values |
| `apps/web/.env.example` | Source | Web env example | 7 vars, all safe |
| `apps/worker/.env.example` | Source | Worker env example | 28 vars with placeholder values |
| `apps/worker/src/logger.ts` | Source | Worker shared logger | Has redaction config matching API logger |
| `apps/worker/src/email.ts` | Source | Worker email sender | Creates OWN pino WITHOUT redaction; logs `{ to, subject }` |
| `apps/worker/src/tasks/scheduled-notifications.ts` | Source | Notification task | Creates OWN pino WITHOUT redaction; logs `email: profile.email` at lines 103, 127, 152 |
| `apps/worker/src/tasks/retention.ts` | Source | Retention cleanup task | Creates OWN pino WITHOUT redaction; only purges audit_logs + notifications |
| `apps/web/app/(public)/privacy/page.tsx` | Source | Privacy policy page | ✅ Now exists — was missing in prior audit |
| `apps/web/app/(public)/layout.tsx` | Source | GA + Tawk.to scripts | Conditional via env vars, no consent gate |
| `apps/web/middleware.ts` | Source | CSP headers, domain routing | Nonce-based CSP but allows `'unsafe-inline'` scripts |
| `apps/web/lib/cookie-domain.ts` | Source | Cookie options | HttpOnly, Secure (when not localhost), SameSite=Lax |
| `apps/web/components/marketing/ContactForm.tsx` | Source | Contact form consent UX | Has consent checkbox linking to /privacy |
| `apps/web/app/(public)/contact/actions.ts` | Source | Contact form server action | Validates consent boolean before submission |
| `supabase/migrations/5302026_*.sql` | Source | Audit logs + notification_preferences schema | audit_logs: id, org_id, actor_user_id, actor_type, action, entity_type, entity_id, ip_address, user_agent, metadata(jsonb), created_at |
| `supabase/migrations/5302038_*.sql` | Source | public_interactions RLS disabled | RLS off, anon + service_role INSERT policies only |
| `supabase/migrations/5302108_*.sql` | Source | audit_logs FK cascade fix | Changed from SET NULL to CASCADE on org delete |
| `docs/COOKIE_CONSENT.md` | Doc | Cookie consent strategy | Documents banner-less approach |

## Executive Summary

**Privacy posture improved since prior audit (20260730) but has a critical P1 gap: 6 of 8 Worker logger instances lack pino redaction, leaking email addresses to logs.** The API logger is correctly configured with comprehensive redaction (email, phone, password, token, secret, authorization, cookie, fullName, full_name), but the Worker's per-task logger instances create fresh pino() without redact config. The `email.ts` sender in both API and Worker logs `{ to, subject }` where `to` is the raw email address — and the key name `to` is NOT matched by any redaction pattern (only `*.email` is covered).

**New since prior audit (all improvements):**
- Privacy policy page created at `/privacy` (PRIV-P2-001 fixed)
- Retention worker task created (PRIV-P2-004 partially fixed — covers audit_logs + notifications, NOT public_interactions)
- API audit service has PII field redaction in metadata (email, full_name, phone, password, token, secret)
- API logger has pino redaction (email, phone, password, token, secret, authorization, cookie, fullName/full_name)
- Contact form has consent checkbox linked to privacy policy

**Remaining from prior audit:**
- SAME: No data export/deletion API endpoints (PRIV-P2-002 still open)
- PARTIAL: Worker retention task covers audit_logs + notifications but NOT public_interactions
- SAME: Cookie consent is banner-less — GA/Tawk load unconditionally (accepted by design)
- SAME: No terms of service page
- SAME: No formal data classification documentation

**New critical finding:**
- Worker log PII leak: 7 files create pino() without redact config, logging emails in plaintext

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| API logger redaction | `api/lib/logger.ts` | PII redaction in logs | ✅ Strong | Low | Covers email, phone, password, token, secret, authorization, cookie, fullName/full_name |
| Worker logger redaction | `worker/src/logger.ts` | PII redaction in logs | ✅ Strong (shared) | Low | Shared logger has redaction |
| Worker task loggers | `worker/src/email.ts`, `worker/src/tasks/*.ts` | Per-task logging | ❌ NO REDACTION | P1 | 7 files create pino() without redact |
| API email sender logs | `api/lib/email.ts:38` | Email delivery logging | ⚠️ PII leak | P1 | Logs `{ to, subject }` — `to` key not redacted |
| Worker email sender logs | `worker/src/email.ts:40` | Email delivery logging | ❌ PII leak (no redact + wrong key) | P1 | Logs `{ to, subject }` — no redaction at all |
| Notification task logs | `worker/src/tasks/scheduled-notifications.ts:103,127,152` | User email in logs | ❌ PII leak | P1 | Logs `email: profile.email`, no redaction |
| Audit metadata PII redaction | `api/services/audit.ts:33-44` | Redact PII before audit insert | ⚠️ Partial | P2 | Key-based matching; misses compound keys like `actorEmail`, `client_email` |
| Privacy policy page | `web/app/(public)/privacy/page.tsx` | Legal disclosure | ✅ Complete | Low | Created since prior audit |
| public_interactions table | `supabase/migrations/5302033_*.sql` | Contact form PII storage | ⚠️ Raw PII, RLS off | P1 | Stores name/email/phone/company/IP; no retention cleanup |
| retention worker | `worker/src/tasks/retention.ts` | PII cleanup | ⚠️ Incomplete | P1 | Only covers audit_logs (365d) + notifications (90d), NOT public_interactions |
| Cookie consent | `docs/COOKIE_CONSENT.md` | Consent strategy | ⚠️ Banner-less | P2 | GA/Tawk load unconditionally (accepted by design) |
| Consent records | — | Store user consent | ❌ Missing | P2 | No DB table for consent records |
| Data export endpoint | — | GDPR right of access | ❌ Missing | P2 | No `GET /users/me/export` |
| Data deletion endpoint | — | GDPR right to erasure | ❌ Missing | P2 | No `DELETE /users/me` |
| Terms of service | — | Terms page | ❌ Missing | P3 | No /terms page |
| Data classification doc | — | Field-level classification | ❌ Missing | P3 | No doc classifying PII fields |
| IP address collection | `api/routes/public.ts:45` | Geo-lookup + storage | ⚠️ Stored in DB | P2 | IP is GDPR PII, stored indefinitely |
| CSP headers | `web/middleware.ts:27-45` | Content Security Policy | ⚠️ `unsafe-inline` | P2 | Allows inline scripts in production |
| Stray secrets in .env files | 4 `.env.example` files | Placeholder values only | ✅ Clean | Low | All use `<placeholder>` or empty |
| GA/Tawk.to tracking | `web/app/(public)/layout.tsx` | Analytics/chat | ⚠️ No consent gate | P2 | env-gated but no user opt-out |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Personal/sensitive data | 4 | RLS protected, auth gated | `public_interactions` table stores raw PII with RLS off | Add RLS or cleanup |
| Auth records | 5 | Supabase-managed, local JWT verify | None | — |
| Audit logs | 4 | PII redaction in metadata, all mutations logged | Compound key names not caught; IP stored | Strengthen redaction to value-based |
| Admin actions | 5 | Admin-only audit viewer, role gated | None | — |
| Billing/payment refs | 5 | Stripe handled externally, env vars gated | None | — |
| Uploaded docs | 5 | Supabase storage, private bucket, RLS | None | — |
| User content | 5 | RLS scoped per user/org | None | — |
| Export/deletion | 0 | No endpoints | Complete absence | Add SAR + deletion endpoints |
| Retention | 2 | Worker task exists but incomplete | Missing public_interactions cleanup, no IP purge | Add public_interactions to retention task |
| Consent/cookie flows | 2 | Banner-less, no consent storage | No opt-out for GA/Tawk; consent checkbox on form only | Add consent DB table |
| Policies/terms | 3 | Privacy policy exists | No terms of service | Add /terms page |
| Access controls | 5 | requireOrgAccess + RLS on all entities | None | — |

## Detailed Review

### Item: PII in Logs — API Logger

- **Evidence:** `apps/api/src/lib/logger.ts:6-33`
- **What it does:** Creates pino logger with `redact.paths` covering `password`, `*.password`, `secret`, `*.secret`, `token`, `*.token`, `authorization`, `*.authorization`, `cookie`, `*.cookie`, `req.headers.authorization`, `req.headers.cookie`, `email`, `phone`, `fullName`, `full_name`, `*.email`, `*.phone`, `req.body.email`, `req.body.phone`
- **How it works:** Uses pino's built-in redaction which matches object key paths. The `*` wildcard matches one path segment, so `*.email` matches `{ something: { email: "..." } }` but does NOT match flat keys named anything other than `email`/`phone`/etc.
- **Current controls:** Comprehensive key-based redaction for known PII field names
- **Missing controls:** `apps/api/src/lib/email.ts:38` logs `logger.info({ to, subject }, "Email sent")` — the key `to` is NOT in the redact path list, so the email address in `to` is logged in plaintext
- **Risks:** Medium — email addresses logged in plaintext when SMTP is configured and email sending succeeds
- **Recommended improvement:** Change `{ to, subject }` to `{ recipient: to, subject }` and add `recipient` to redact paths. Or remove the `to` field from the log entry entirely.
- **Suggested tests:** Unit test that email.ts does NOT log raw email addresses when SMTP is configured
- **Suggested docs:** Update `docs/ENVIRONMENT_VARIABLES.md` logging section with PII redaction policy

### Item: PII in Logs — Worker Task Loggers

- **Evidence:**
  - `apps/worker/src/email.ts:4` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/scheduled-notifications.ts:6` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/retention.ts:6` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/stripe-reconcile.ts:5` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/jira-sync.ts:5` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/jsm-sync.ts:5` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
  - `apps/worker/src/tasks/m365-calendar-sync.ts:5` — `const logger = pino({ level: env.LOG_LEVEL });` — NO redact
- **What is happening:** 7 of 8 Worker modules create their own pino instances without `redact` configuration. The shared logger at `worker/src/logger.ts` HAS redaction, but task modules and `worker/src/email.ts` ignore it and create bare pino instances.
- **Why it matters:** `worker/src/email.ts:40` logs `{ to, subject }` — email address in plaintext. `worker/src/tasks/scheduled-notifications.ts:103,127,152` logs `{ email: profile.email, ... }` — email in plaintext.
- **User/business impact:** Email addresses (GDPR PII) are written to log files, log aggregators, and any log shipping destinations in plaintext. Violates data minimization and could expose customer emails in breach scenarios.
- **Recommended fix:** Replace all bare `pino({ level: env.LOG_LEVEL })` calls with imports of the shared logger from `worker/src/logger.ts`. Export the logger and use it consistently.
- **Suggested validation:** `grep -r "pino({" apps/worker/src/ --include="*.ts"` should return exactly one match (the shared logger).
- **Effort estimate:** Small (1 day)

### Item: public_interactions Table — Raw PII Storage

- **Evidence:**
  - `supabase/migrations/5302038_disable_rls_public_interactions.sql` — RLS disabled on table
  - `supabase/migrations/5302037_public_interactions_insert_policies.sql` — anon + service_role INSERT policies
  - `apps/api/src/routes/public.ts:62-69` — inserts IP, location, user_agent, platform, referrer
  - `apps/api/src/routes/public.ts:132-146` — inserts company_name, client_name, client_email, client_phone, services, employees, urgency, message
- **What it does:** Stores full contact form PII (name, email, phone, company, message) plus session metadata (IP, user-agent, platform, referrer, location)
- **Current controls:** RLS disabled (public data). Only INSERT policies exist — anon can insert, service_role can insert. No SELECT policy means anon cannot read, but the data is still stored in plaintext with no access controls for subsequent reads by service_role.
- **Missing controls:**
  1. No retention cleanup — the retention worker (`worker/src/tasks/retention.ts`) only purges `audit_logs` and `notifications`, NOT `public_interactions`
  2. IP addresses are GDPR PII — stored indefinitely
  3. Privacy policy says "3 years" retention but this is not enforced in code
- **Risks:** P1 — Raw PII accumulates indefinitely. If a database backup is compromised, all contact form submissions are exposed in plaintext.
- **Recommended improvement:** Add `public_interactions` to the retention worker task with a 3-year (1095 day) retention period. Consider encrypting PII fields at rest or using a separate, more restricted table for PII.
- **Suggested tests:** Integration test verifying retention worker deletes public_interactions rows older than cutoff date.
- **Suggested docs:** Update `docs/PRIVACY_COMPLIANCE.md` with retention enforcement details.

### Item: Audit Log PII Redaction

- **Evidence:** `apps/api/src/services/audit.ts:33-44`
- **What it does:** Before inserting audit events, scans metadata keys against a PII field list (`full_name`, `email`, `phone`, `password`, `token`, `secret`) and replaces matching values with `"[REDACTED]"`
- **How it works:** `key.toLowerCase().includes(f.toLowerCase())` — substring match on field names
- **Current controls:** Catches exact field names like `email`, `phone`, `token`, `secret` and variations like `fullName`/`full_name`
- **Missing controls:** Compound keys like `client_email`, `actorEmail`, `user_email_address`, `billingEmail` are NOT caught because the match checks if the key contains a PII keyword, not the other way around. Wait — it checks `key.toLowerCase().includes(f.toLowerCase())` for each PII field, so `client_email` would match `email`. Actually the check IS robust for compound names containing the PII keyword. But the issue is different: the `public.ts` route passes `name` as a metadata key, not `full_name`. The key `name` does NOT match any PII field in the list. So client names are stored in plaintext in audit metadata.
- **Risks:** P2 — Client names stored in plaintext in audit logs. Since the privacy policy already states names are collected, this is more of a defense-in-depth gap than a compliance violation.
- **Recommended improvement:** Add `name` and `ip_address` to `piiFields` array. Consider value-based PII detection (regex for email patterns) in addition to key-based detection.
- **Suggested tests:** Unit test verifying audit metadata with `name: "John Doe"` gets redacted.

### Item: GA/Tawk.to and Cookie Consent

- **Evidence:**
  - `apps/web/app/(public)/layout.tsx:55-75` — GA and Tawk.to scripts conditionally loaded via `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_TAWKTO_ID`
  - `docs/COOKIE_CONSENT.md` — documents banner-less approach
  - `apps/web/components/marketing/ContactForm.tsx:238-256` — consent checkbox for contact form, linking to /privacy
- **What is happening:** GA and Tawk.to scripts load on first page visit without any user consent interaction. The `COOKIE_CONSENT.md` documents this as an intentional design choice. The contact form has its own consent checkbox.
- **Current controls:** Scripts are env-gated (if ID not set, scripts don't load). Nonce-based CSP applied.
- **Missing controls:** No cookie consent banner. No mechanism for users to opt out of GA tracking or Tawk.to chat. No consent record stored in database.
- **Risks:** P2 — ePrivacy Directive requires prior consent for non-essential cookies. This is documented as an accepted risk.
- **Status:** ACCEPTED (by design, per `docs/COOKIE_CONSENT.md`)

### Item: Data Export and Deletion Endpoints

- **Evidence:** No `export` or `delete` endpoints found in `apps/api/src/routes/` for user PII
- **What is happening:** Users cannot exercise GDPR Article 15 (Right of Access) or Article 17 (Right to Erasure) via automated means. The privacy policy directs users to email `contact@mainecybertech.com`.
- **Current controls:** Manual process via email (documented in privacy policy at line 106-109)
- **Risks:** P2 — No automated SAR fulfillment. At current scale (small MSP), manual process is acceptable but not scalable.
- **Recommended improvement:** Add `GET /api/v1/users/me/export` (JSON export of profile, memberships, tickets, documents) and `DELETE /api/v1/users/me` (anonymize/delete user data)
- **Effort estimate:** Medium (3 days)

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| PRIV-001 | PII in API logs | `api/lib/logger.ts` — pino redact | Key-based redaction | `{ to, subject }` key `to` not covered | P1 | Add `to`/`toAddress`/`recipient` to redact paths |
| PRIV-002 | PII in Worker logs | `worker/src/email.ts`, 6 task files | NO redaction (bare pino) | All Worker per-task loggers | P1 | Use shared logger with redaction |
| PRIV-003 | public_interactions PII | `api/routes/public.ts`, `supabase/migrations/5302038` | RLS disabled, no retention | Raw PII stored indefinitely | P1 | Add to retention task + encrypt |
| PRIV-004 | Audit metadata PII | `api/services/audit.ts:33-44` | Key-based redaction | `name` key not redacted | P2 | Add `name`, `ip_address` to piiFields |
| PRIV-005 | Data export/deletion | — | Missing endpoints | Manual only (email) | P2 | Add automated SAR endpoints |
| PRIV-006 | Cookie consent | `docs/COOKIE_CONSENT.md` | Banner-less, documented | No consent storage | P2 | ACCEPTED by design |
| PRIV-007 | Terms of service | — | Missing | No /terms page | P3 | Create /terms page |
| PRIV-008 | Data classification | — | Missing doc | No formal classification | P3 | Create data classification matrix |

## Findings

### Finding ID: PRIV-P1-001 — Worker task loggers lack pino redaction, leaking PII

- Severity: P1
- Confidence: High
- Area: PII in logs
- Evidence:
  - `apps/worker/src/email.ts:4` — bare `pino({ level: env.LOG_LEVEL })` without redact
  - `apps/worker/src/tasks/scheduled-notifications.ts:6` — bare pino without redact
  - `apps/worker/src/tasks/retention.ts:6` — bare pino without redact
  - `apps/worker/src/tasks/stripe-reconcile.ts:5` — bare pino without redact
  - `apps/worker/src/tasks/jira-sync.ts:5` — bare pino without redact
  - `apps/worker/src/tasks/jsm-sync.ts:5` — bare pino without redact
  - `apps/worker/src/tasks/m365-calendar-sync.ts:5` — bare pino without redact
  - Symbol: `const logger = pino({ level: env.LOG_LEVEL });` in each file
- What is happening: 7 of 8 Worker source files create pino loggers with no `redact` configuration. When `scheduled-notifications.ts` logs `logger.info({ email: profile.email, ... }, "...")` at lines 103, 127, 152, the email address is written to logs in plaintext. When `worker/src/email.ts` logs `logger.info({ to, subject }, "Email sent")` at line 40, the recipient email is also plaintext.
- Why it matters: Email addresses are personal data under GDPR/CCPA. Logging them in plaintext violates data minimization principles and exposes customer PII in log files, log aggregators, and SIEM systems.
- User / business impact: If logs are breached or subpoenaed, customer email addresses are exposed. Undermines trust and could result in regulatory penalties.
- Security / privacy / reliability impact: Privacy violation. No immediate security exploit, but data leakage via logs is a common finding in security audits.
- Recommended fix: Replace all bare `pino()` calls with imports of the shared logger from `../logger` (or `../../logger`). The shared logger at `apps/worker/src/logger.ts` already has comprehensive pino redaction. Alternatively, add `redact` config to each bare pino call.
- Suggested validation: `rg "pino\(\{" apps/worker/src/ --include="*.ts"` should return exactly 1 match (the shared logger at `worker/src/logger.ts`).
- Owner suggestion: Backend/Platform engineer
- Effort estimate: Small (1 day)
- Dependencies: None
- Status: Open

### Finding ID: PRIV-P1-002 — API email sender logs recipient address via unredacted `to` key

- Severity: P1
- Confidence: High
- Area: PII in logs
- Evidence:
  - `apps/api/src/lib/email.ts:38` — `logger.info({ to, subject }, "Email sent");`
  - `apps/api/src/lib/email.ts:42` — `logger.error({ error: msg, to, subject }, "Failed to send email");`
  - `apps/api/src/lib/logger.ts:6-33` — redact paths include `*.email`, `req.body.email` but NOT `to`
- What is happening: The API logger has strong redaction but uses key-based matching. The key `to` (used as the log property name) is not in the redact path list. The email address is therefore logged without redaction on every successful email send.
- Why it matters: Email addresses logged in plaintext on every transactional email (password reset, ticket notification, etc.)
- User / business impact: Same as PRIV-P1-001 — PII leakage via logs
- Recommended fix: Either change `{ to, subject }` to `{ recipient: to, subject }` and add `recipient` to redact paths, or remove the recipient from the log entry entirely and log only `{ subject, success: true }`.
- Suggested validation: Verify email.ts tests check that email addresses are not present in log output.
- Owner suggestion: Backend engineer
- Effort estimate: Trivial (15 min)
- Dependencies: None
- Status: Open

### Finding ID: PRIV-P1-003 — public_interactions PII has no retention enforcement

- Severity: P1
- Confidence: High
- Area: Data retention
- Evidence:
  - `apps/worker/src/tasks/retention.ts:42-62` — only purges `audit_logs` and `notifications`, NOT `public_interactions`
  - `supabase/migrations/5302038_*.sql` — RLS disabled on public_interactions
  - `apps/web/app/(public)/privacy/page.tsx:89-91` — privacy policy states "3 years" retention
- What is happening: Contact form submissions (name, email, phone, company, message, IP, location) are stored in the `public_interactions` table with no automated cleanup. The privacy policy promises 3-year retention, but this is not enforced in code. RLS is disabled on the table.
- Why it matters: Indefinite PII retention violates GDPR storage limitation principle. RLS disabled on a table containing raw PII creates unnecessary exposure surface.
- User / business impact: If the privacy policy's 3-year claim is audited, the absence of automated enforcement would be a finding.
- Recommended fix: Add `public_interactions` purge to the retention worker task with a 1095-day (3-year) cutoff. Consider re-enabling RLS with appropriate policies.
- Suggested validation: Integration test verifying public_interactions rows older than 1095 days are deleted.
- Owner suggestion: Backend engineer
- Effort estimate: Small (1 day)
- Dependencies: PRIV-P1-001 (shared logger fix for the retention task)
- Status: Open

### Finding ID: PRIV-P2-001 — Audit metadata `name` field not redacted

- Severity: P2
- Confidence: High
- Area: Audit log PII
- Evidence:
  - `apps/api/src/services/audit.ts:33` — `const piiFields = ["full_name", "email", "phone", "password", "token", "secret"];`
  - `apps/api/src/routes/public.ts:244-246` — passes `name: parsed.name` in audit metadata
  - `apps/api/src/routes/auth.ts:79,89,148,219,285,335` — multiple endpoints pass `email` in metadata (correctly redacted)
- What is happening: The PII field list in `audit.ts` omits `name`. When `public.ts` logs a lead submission audit event with `name: parsed.name`, the client's full name is stored in audit_logs.metadata in plaintext.
- Why it matters: Client names in audit logs are PII. While less sensitive than emails, consistent redaction is important for defense-in-depth.
- Recommended fix: Add `"name"` and `"ip_address"` to the `piiFields` array in `audit.ts:33`.
- Effort estimate: Trivial (5 min)
- Status: Open

### Finding ID: PRIV-P2-002 — No data export/deletion API endpoints

- Severity: P2
- Confidence: High
- Area: Data subject rights
- Evidence: No `export` or `delete` routes in `apps/api/src/routes/` for user PII
- What is happening: Users must email `contact@mainecybertech.com` to exercise GDPR/CCPA rights (documented in privacy policy at `/privacy` page lines 106-109). No automated fulfillment exists.
- Why it matters: GDPR Articles 15 and 17, CCPA right to know/delete. Manual process is acceptable at current scale but doesn't scale.
- Recommended fix: Add `GET /api/v1/users/me/export` returning JSON of all user data and `DELETE /api/v1/users/me` with account anonymization.
- Effort estimate: Medium (3 days)
- Status: Open (carried forward from prior audit)

### Finding ID: PRIV-P2-003 — No terms of service page

- Severity: P2
- Confidence: High
- Area: Legal documentation
- Evidence: No `/terms` route or terms-of-service page in `apps/web/app/`
- What is happening: The platform has a privacy policy but no terms of service or acceptable use policy.
- Why it matters: Terms of service establish the legal relationship with users and limit liability.
- Recommended fix: Create `/terms` page covering service description, user obligations, liability limitations, dispute resolution.
- Effort estimate: Small (1 day, primarily legal content)
- Status: Open

### Finding ID: PRIV-P3-001 — No formal data classification documentation

- Severity: P3
- Confidence: Medium
- Area: Data governance
- Evidence: No data classification matrix or field-level PII inventory in `docs/`
- What is happening: The codebase has implicit PII awareness (redaction, RLS, auth gates) but no formal documentation classifying which fields contain PII, PHI, PCI, or confidential business data.
- Why it matters: Formal data classification is a prerequisite for SOC2 and ISO27001 readiness.
- Recommended fix: Create `docs/DATA_CLASSIFICATION.md` with field-level classification for all database tables.
- Effort estimate: Small (1 day)
- Status: Open (carried forward from prior audit)

### Finding ID: PRIV-P3-002 — Production CSP allows `'unsafe-inline'` scripts

- Severity: P3
- Confidence: High
- Area: Security headers
- Evidence:
  - `apps/web/middleware.ts:42` — `script-src 'self' 'unsafe-inline'` in production CSP
- What is happening: The production CSP (non-localhost) allows `'unsafe-inline'` for scripts, which disables the primary XSS protection of CSP. Nonce-based CSP exists but inline scripts are still permitted.
- Why it matters: CSP without nonce-only enforcement allows any inline script injection to execute.
- Recommended fix: Remove `'unsafe-inline'` from production `script-src`. Ensure all inline scripts use nonces. This may require verifying that GA/Tawk.to/Turnstile scripts work with nonce-only CSP.
- Effort estimate: Medium (2 days — requires testing third-party script compatibility)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| Worker PII in logs | P1 | High | Medium | 7 bare pino instances | Replace with shared logger |
| API email `to` in logs | P1 | High | Medium | email.ts:38 logs `to` | Change key name or remove |
| public_interactions PII retention | P1 | Medium | Medium | No automated cleanup | Add to retention worker |
| GDPR SAR non-compliance | P2 | Medium | High | No export/deletion endpoints | Add SAR endpoints |
| Audit metadata name leak | P2 | Medium | Low | `name` not in piiFields | Add to redaction list |
| CSP unsafe-inline | P3 | Low | Medium | middleware.ts:42 | Remove unsafe-inline |

## Recommendations

### Immediate / Release Blocking

None — no critical security vulnerabilities identified.

### This Week

1. **Fix Worker logger PII leakage (PRIV-P1-001):** Replace 7 bare `pino()` calls with shared logger import. One-line change per file, high impact.
2. **Fix API email `to` log key (PRIV-P1-002):** Change `{ to, subject }` to `{ subject }` or add `to`/`recipient` to redact paths.
3. **Add `name` to audit PII fields (PRIV-P2-001):** One-line addition to `piiFields` array.

### This Month

1. **Add public_interactions to retention worker (PRIV-P1-003):** Add 3-year purge to retention task.
2. **Add data export endpoint (PRIV-P2-002):** `GET /api/v1/users/me/export`.
3. **Create terms of service page (PRIV-P2-003).**

### Later / Platform Evolution

1. **Add data deletion endpoint (PRIV-P2-002 companion).**
2. **Create data classification documentation (PRIV-P3-001).**
3. **Harden CSP to remove `'unsafe-inline'` (PRIV-P3-002).**
4. **Add consent record storage table for cookie consent tracking.**

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Switch Worker tasks to shared logger | Stops PII leak in 7 files | `worker/src/email.ts`, `worker/src/tasks/*.ts` | grep for bare `pino({` |
| Drop `to` from email.ts log | Stops email PII leak in API | `api/src/lib/email.ts:38,42` | Verify no email in log output |
| Add `name` to audit piiFields | Redacts client names | `api/src/services/audit.ts:33` | Unit test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Fix Worker PII log leakage | P1 | Backend engineer | 1 day | None |
| Fix API email `to` log key | P1 | Backend engineer | 15 min | None |
| Add public_interactions retention | P1 | Backend engineer | 1 day | Worker logger fix |
| Add `name` to piiFields | P2 | Backend engineer | 5 min | None |
| Data export endpoint | P2 | Backend engineer | 3 days | None |
| Data deletion endpoint | P2 | Backend engineer | 3 days | Export endpoint |
| Terms of service page | P2 | UI engineer + legal | 1 day | Legal review |
| Data classification doc | P3 | Security engineer | 1 day | None |
| CSP unsafe-inline removal | P3 | Platform engineer | 2 days | Third-party script testing |

## Suggested Tests

- **Unit:** `audit.test.ts` — verify `name` and `ip_address` fields are redacted in metadata
- **Unit:** `email.test.ts` — verify log output does NOT contain raw email addresses
- **Unit:** `retention.test.ts` — verify retention worker deletes public_interactions rows beyond cutoff
- **Integration:** End-to-end test of logger output verifying no PII in any log line
- **E2E:** Visit marketing page with GA disabled, verify no GA script loads
- **Manual:** Verify third-party scripts (GA, Tawk.to, Turnstile) work with nonce-only CSP before removing `'unsafe-inline'`

## Suggested Documentation Updates

- Create `docs/DATA_CLASSIFICATION.md` — field-level PII/PCI/confidential classification
- Create `docs/LOGGING_POLICY.md` — logging standards including PII redaction requirements
- Update `docs/PRIVACY_COMPLIANCE.md` (create if absent) — GDPR/CCPA readiness status
- Update `docs/ENVIRONMENT_VARIABLES.md` — document logging redaction behavior
- Update `docs/INDEX.md` — add new docs

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Does MCT process EU or California resident data? | Determines GDPR/CCPA applicability | Business intelligence |
| Is a Data Processing Agreement (DPA) signed with Supabase? | GDPR Article 28 requirement | Legal review |
| Is a DPA signed with Google (GA), Tawk.to, Microsoft (Teams)? | Third-party data processor compliance | Legal review |
| Are production logs shipped to a centralized logging service? | Determines blast radius of PII log leakage | Infrastructure review |
| Is there a data breach notification procedure? | GDPR Article 33-34, various state laws | Policy review |

## Appendix

### Data Flow Summary (PII Tracking)

| Flow | PII captured | Storage location | Retention configured | Retention enforced |
|------|-------------|-----------------|---------------------|-------------------|
| User registration | Email, name, phone | `profiles` (Supabase) | Indefinite | No automated cleanup |
| Contact form | Name, email, phone, company, message, IP | `public_interactions` (Supabase) | 3 years (policy) | NO — not in retention worker |
| Audit logging | user_id, IP, metadata (may contain PII) | `audit_logs` (Supabase) | 365 days | YES — retention worker |
| Notifications | user_id, title, body | `notifications` (Supabase) | 90 days | YES — retention worker |
| GA tracking | Page views, behavior | Google Analytics | Per GA settings | N/A (third party) |
| Tawk.to chat | Messages, IP, browsing context | Tawk.to | Per Tawk.to policy | N/A (third party) |
| Transactional email | Email address (to), subject | SMTP server logs | Depends on SMTP provider | N/A |
| Worker task logs | Email address (plaintext) | Container logs | Depends on log shipping | NO — PII in plaintext |

### PII Redaction Coverage Matrix

| Component | Logger | Redact config | email key covered | `to` key covered | `name` key covered | Notes |
|-----------|--------|--------------|-------------------|-----------------|-------------------|-------|
| API shared logger | `api/lib/logger.ts` | ✅ Yes | ✅ `*.email` | ❌ No | ❌ No | Strong, but `to` leaks in email.ts |
| API email sender | (uses shared) | ✅ Yes | — | ❌ `{ to }` logged | — | Key name mismatch |
| API audit service | N/A (field-based) | N/A | ✅ `email` | N/A | ❌ No | Field-based PII list in audit.ts |
| Worker shared logger | `worker/src/logger.ts` | ✅ Yes | ✅ `*.email` | ❌ No | ❌ No | Good, but not used by tasks |
| Worker email sender | `worker/src/email.ts` | ❌ None | ❌ | ❌ `{ to }` logged | ❌ | Bare pino, no redaction |
| Worker scheduled-notifications | `tasks/scheduled-notifications.ts` | ❌ None | ❌ `{ email }` logged | — | ❌ | Bare pino, no redaction |
| Worker retention | `tasks/retention.ts` | ❌ None | — | — | — | Bare pino, no redaction |
| Worker stripe-reconcile | `tasks/stripe-reconcile.ts` | ❌ None | — | — | — | Bare pino, no redaction |
| Worker jira-sync | `tasks/jira-sync.ts` | ❌ None | — | — | — | Bare pino, no redaction |
| Worker jsm-sync | `tasks/jsm-sync.ts` | ❌ None | — | — | — | Bare pino, no redaction |
| Worker m365-calendar-sync | `tasks/m365-calendar-sync.ts` | ❌ None | — | — | — | Bare pino, no redaction |
| Web logger | `web/lib/logger.ts` | ❌ None | ❌ | — | — | No redact config |
