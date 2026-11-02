# Privacy & Data Governance

> Platform-level privacy reference: data classification, the retention schedule
> actually enforced by the platform, encryption assumptions, and the procedures
> for data-subject rights. This is the internal accountability document — it
> complements (and must stay consistent with) the public policy at
> `apps/web/app/(public)/privacy/page.tsx`, the breach plan at
> `docs/DATA_BREACH_RESPONSE.md`, the subprocessor list at
> `docs/SUBPROCESSORS.md` and the DSAR runbook at `docs/runbooks/dsar.md`.
>
> Owner: security lead / compliance sponsor · Last reviewed: 2026-10-14.
> Rows marked **gap** are known and owned, not promised controls.

## 1. Scope

Covers personal data processed by the platform itself (API, worker, web and
infrastructure): platform users and their invited members, public contact and
quote submissions, visitor analytics, and platform audit records. Tenant-loaded
client content (documents, tickets, chat, forms) is processed on the tenant's
behalf — see §5.

## 2. Data classification

| Class          | Definition                                                                       | Examples                                                                       |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Public         | Approved for public release                                                      | Marketing pages, published status pages, product catalog                       |
| Internal       | Business operations data; not tenant-identifying                                 | Aggregate metrics, module configuration, SOPs                                  |
| Confidential   | Tenant business records; disclosure is contract-limited                          | Documents, tickets, chat, project and asset records                            |
| Restricted     | Personal data, credentials, or security material                                 | `profiles`, `public_interactions`, `audit_logs`, `api_keys`, MFA material      |

## 3. Data inventory (repository-derived)

| Class        | Data                                                            | Primary stores                                                                 | Protection today                                                        |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Identity     | name, email, phone, title, avatar                               | `profiles` (+ `encrypted_pii` mirror), `memberships`, `contract_signers`       | RLS org-scoped; AES-256-GCM mirror (additive)                           |
| Prospect/lead| name, email, phone, company, message, IP, UA                    | `public_interactions`, `store_quotes`, `store_quote_requests` (90-day purge), `store_leads` | Insert-only by design; daily purge worker; `store_leads` holds lead scores only (no direct PII; gap) |
| Auth/security| email, password hash, MFA secrets, recovery code hashes, keys   | `auth.users` (Supabase-managed), `mfa_recovery_codes`, `api_keys`              | Supabase-managed; hashed codes; scoped API keys                         |
| Activity     | actor id, action, metadata, IP, UA                              | `audit_logs` (365-day purge), `impersonation_log`, `store_analytics_events`    | Org-scoped reads; key-level PII redaction at write. `audit_logs.ip_address`/`user_agent` columns exist but the runtime writer does not populate them — platform-admin IP/UA lives in `impersonation_log` (PRIV-P3-002). |
| Error telemetry | scrubbed error context (names/email/phone/credentials/IP redacted at the SDK) | Sentry (vendor) | `sendDefaultPii: false` + `beforeSend` scrub in all three apps (AN-P3-004); Sentry org retention setting |
| Billing      | billing email, Stripe ids, amounts                              | `billing_customers`, `subscriptions`, `invoices`, `payments`                   | Stripe-hosted card data; plaintext billing email                        |
| Backups      | full database + storage copies                                  | S3/Spaces backup buckets                                                       | AES-256-CBC when `BACKUP_ENCRYPTION_KEY` is set; 30-day retention       |

## 4. Retention schedule (platform-enforced)

| Store                            | Data                                              | Window              | Enforced by                                                                 |
| -------------------------------- | ------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| `public_interactions`            | Contact/lead form PII + visitor session           | 90 days             | `apps/worker/src/tasks/public-interaction-retention.ts` (daily)             |
| `audit_logs`                     | Audit trail incl. actor id and metadata           | 365 days            | `apps/worker/src/tasks/retention.ts` (daily, batched)                       |
| `notifications`                  | Notification bodies                               | 90 days             | `apps/worker/src/tasks/retention.ts` (daily, batched)                       |
| Backup buckets (DB + storage)    | Full platform copies                              | 30 days             | `scripts/backup-database.sh`, `scripts/backup-storage.sh`                   |
| Google Analytics                 | Usage/cookie data                                 | GA property setting | Google Analytics (operator-owned property configuration)                    |
| `store_analytics_events`         | Anonymous storefront events (no IP/UA)            | 90 days             | `apps/worker/src/tasks/retention.ts` (daily, batched; AN-P2-004)            |
| `store_quotes`                   | Public quote submissions (name/email/phone/notes) | 90 days             | `apps/worker/src/tasks/retention.ts` (daily, batched; PRIV-P2-008)          |
| `store_quote_requests`           | Structured quote requests incl. `customer` jsonb PII | 90 days          | `apps/worker/src/tasks/retention.ts` (daily, batched; PRIV-P2-008)          |
| Sentry (vendor)                  | Scrubbed error context                            | Sentry org setting  | Sentry organization retention (operator-owned); SDK `beforeSend` scrub (AN-P3-004) |
| `store_leads`, `impersonation_log` | Lead scores linked to a purged quote request; impersonation trail | **No automated purge — gap** | Owner decision pending (DATA-P2-006); do not promise a window |

Forwarded copies of contact-form submissions (Microsoft Teams, Atlassian JSM)
are outside the 90-day platform purge and are retained under those providers'
settings — the public policy states this explicitly. The public policy figure
for contact-form retention is guarded against the worker constant by
`apps/api/src/__tests__/privacy-retention-doc.test.ts`.

## 5. Roles (controller / processor)

- For tenant-loaded client data (documents, tickets, chat, forms), the tenant
  is the controller and MCT is the processor; MCT acts on documented
  instructions.
- For platform account data, public submissions and platform audit records,
  MCT determines the purposes and is the controller.
- Vendor terms and transfer wording: **confirm with counsel**; DPA status is
  tracked per vendor in `docs/SUBPROCESSORS.md`.

## 6. Encryption

- Transport: HTTPS/TLS everywhere; third-party lookups over HTTPS only.
- At rest: Supabase/DigitalOcean provider-level encryption plus a field-level
  AES-256-GCM `encrypted_pii` mirror for `full_name`/`email`/`phone`/`title`
  (`apps/api/src/lib/field-encryption.ts`, migration `5302135`). The plaintext
  columns remain the response source of truth — the mirror is additive
  defence-in-depth, not a replacement.
- Backups: AES-256-CBC (openssl, PBKDF2) when `BACKUP_ENCRYPTION_KEY` is set;
  CI sets `REQUIRE_BACKUP_ENCRYPTION=1` so a missing key fails the job.
- Key management: `FIELD_ENCRYPTION_KEY` / `BACKUP_ENCRYPTION_KEY` follow
  `docs/SECRETS_ROTATION.md`. Escrow location and last restore drill must be
  recorded by the operator (open question in `docs/DATA_BREACH_RESPONSE.md`).

## 7. Data-subject rights (access / export / erasure)

The operator procedure — intake, identity verification, response clock,
export query set, erasure/anonymisation and offboarding — is
`docs/runbooks/dsar.md`. Tooling:

- `GET /api/v1/users/:id/export` — audited identity/membership export
  (`user.data.export`); self or an admin sharing the subject's org.
- `DELETE /api/v1/users/:id` — audited erasure (super admin only): profile PII
  is scrubbed, then the auth user is deleted (`user.account.erased`).
- Tenant-content exports use the module admin surfaces; audit records are
  exportable from `/api/v1/audit/export` (itself audited).
- **Public submitters are not platform users**, so the erasure endpoint above
  cannot reach their quote/contact rows. Erasure for a non-user submitter is a
  manual runbook action (`docs/runbooks/dsar.md` §4.4): identify the rows by the
  verified email in `public_interactions`, `store_quotes` and
  `store_quote_requests`, delete them, and record the action in the privacy
  register.

## 8. Known gaps / decisions pending

- `store_leads` and `impersonation_log` have no automated purge; an owner must
  set a window (DATA-P2-006). `store_leads` rows are operational lead scores
  (no direct PII) that can outlive the quote request they reference. The public
  quote stores (`store_quotes`, `store_quote_requests`) are purged at 90 days
  (PRIV-P2-008); `store_analytics_events` is likewise purged at 90 days
  (AN-P2-004).
- Public quote/contact submitters are not platform users, so the DSAR erasure
  endpoint cannot cover their submissions; erasure for them is the manual
  runbook path in `docs/runbooks/dsar.md` §4.4 (PRIV-P2-008).
- Consent withdrawal pushes a GA Consent Mode denial and shuts the Tawk.to
  widget down via `Tawk_API` (AN-P3-005), but an already-executed third-party
  script tag is only fully unloaded by a page reload; the widget stops running
  immediately, the script remains loaded until then.
- `audit_logs.ip_address` / `user_agent` are never populated at runtime, so
  breach scoping cannot rely on them (PRIV-P3-002).
- IP/geo collection and consent gating for public visitors is tracked by
  PRIV-P2-001/002 and AN-P2-005.
- The public vendor list and `docs/SUBPROCESSORS.md` must be updated together
  when a new outbound processor is added.

## 9. Change control

- Any change to a purge window must update the public policy text and pass
  `apps/api/src/__tests__/privacy-retention-doc.test.ts`.
- Any new outbound vendor (env var, SDK) must be added to
  `docs/SUBPROCESSORS.md` and the public policy list.
- Review this document at least quarterly alongside the DSAR tabletop and the
  breach-register review.
