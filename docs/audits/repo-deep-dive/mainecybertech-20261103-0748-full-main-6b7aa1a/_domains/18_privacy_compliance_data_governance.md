# Privacy, Compliance and Data Governance — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: PRIV
- Scope limitations: read-only static review; no live DSAR execution, no database, no vendor-console verification of DPA/retention settings.

## Scope

Re-verified all 12 previous PRIV findings at `6b7aa1a`: consent capture/enforcement (public forms, store quotes), retention statements and purge paths, audit-log PII redaction, DSAR export/erasure and runbook, geo lookup transport, governance/vendor documentation, breach/IR wording and public-interaction batching. The diff added the store-quote retention targets and corrected the known-gaps section.

## Inventory — data classification, retention and deletion

| Data class | Primary stores | Retention / purge | Deletion path | State |
|---|---|---|---|---|
| Identity | `profiles`, `memberships`, `encrypted_pii` | Life of account | DSAR erase scrubs + deletes auth user | Working |
| Auth/security | `auth.users`, `mfa_recovery_codes`, `api_keys` | Supabase-managed; API-key prune | Auth admin delete; prune task | Working |
| Audit/activity | `audit_logs`, `impersonation_log` | 365 days (`audit_logs`), impersonation gap | archive/purge task; manual | `audit_logs` working; `impersonation_log` gap |
| Billing refs | `billing_customers`, `subscriptions`, `invoices`, `payments` | Business record (no purge) | Not in DSAR (tenant contract) | Documented |
| Uploaded docs | Storage buckets + `documents` | Tenant content | Module delete + DSAR | Working |
| User content | tickets/projects/comments/etc. | Tenant content | Module delete | Working |
| Prospect/lead | `public_interactions`, `store_quotes`, `store_quote_requests`, `store_leads` | 90 days (first three); leads gap | Purge task + DSAR SQL for first three | Quote stores working; **drafts copy open (P2-009)** |
| Analytics | `store_analytics_events` | 90 days | Purge task | Working (registry gap AN-P3-007) |
| Error telemetry | Sentry | Vendor setting | Vendor | Documented |
| Backups | DO snapshots/storage | 30 days | Expiry | Documented |

## Domain scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Personal data inventory | 4 | `docs/PRIVACY.md` classification | Draft copy not listed | P2-009 |
| Auth records | 4 | Supabase + DSAR erase | — | — |
| Audit logs | 4 | Redaction + 365-day purge | IP/UA absent (documented) | — |
| Admin actions | 4 | impersonation_log + audit | — | — |
| Billing/payment refs | 3 | Encrypted billing email; no retention | Finance retention policy absent | Document |
| Uploaded docs | 3 | Module controls | Content scanning is FILE domain | — |
| User content | 4 | Tenant-scoped | — | — |
| Export/deletion | 4 | User export/erase + DSAR runbook | Draft copy omitted | P2-009 |
| Retention | 3 | Registry-driven purges | Analytics registry gap | AN-P3-007 |
| Consent/cookies | 4 | Default-deny + server record | Anon quote insert bypass | P2-010 |
| Policies/terms | 4 | Privacy page + governance docs | Draft retention wording | P2-009 |
| Vendor inventory | 3 | SUBPROCESSORS table | Several DPAs "To confirm" | Operator verify |

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/web/components/consent/ConsentProvider.tsx`, `AnalyticsScripts.tsx`, `apps/web/app/(public)/privacy/page.tsx` | Read | Consent UI + published notice | Default deny; 90-day statements |
| `apps/api/src/routes/public.ts`, `apps/api/src/routes/store/quotes.ts`, `apps/api/src/lib/consent.ts` | Read | Server-side consent enforcement | `CONSENT_REQUIRED`; consent_at/version |
| `apps/api/src/services/audit.ts` | Read | Audit PII redaction | Recursive key scrub |
| `apps/api/src/routes/users.ts`, `docs/runbooks/dsar.md` | Read | DSAR export/erasure + manual path | User and public-submitter paths |
| `apps/worker/src/tasks/retention.ts`, `public-interaction-retention.ts`, `lib/retention-policy.ts`, `lib/purge.ts` | Read | Purge targets/windows | New store_quote targets |
| `supabase/migrations/5302105`, `5302132`, `5302434`, `5302448`, `5302449` | Read | Quote tables/consent/anon grants | PII + anon insert policy |
| `apps/api/src/lib/proposal-generator.ts` | Read | Proposal draft content | Name + free-text notes copied |
| `docs/PRIVACY.md`, `docs/SUBPROCESSORS.md`, `docs/INCIDENT_RESPONSE.md`, `docs/DATA_BREACH_RESPONSE.md` | Read | Governance docs | Retention/known gaps/vendors |
| `apps/api/src/__tests__/privacy-retention-doc.test.ts`, `apps/worker/src/__tests__/retention.test.ts` | Read | Retention guards | Doc/constant parity; quote purge |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| Retention task read | Read | Are quote stores actually purged? | Yes, `retention.ts:194-205` |
| Policy alias read | Read | Registry window resolution | `retention-policy.ts:31-44` |
| Proposal draft path read | Read | Does PII survive the purge? | Yes, `sections` copies name/notes |
| Anon grant/policy read | Read | Can consent be bypassed? | Yes, direct PostgREST insert |
| DSAR runbook read | Read | Does manual erasure cover copies? | No `store_proposal_drafts` |
| Consent route walk | Read | Is consent enforced on API paths? | Yes, lead/quote routes reject without it |
| No live DSAR/vendor call | Not run | Cannot prove vendor retention/DPA | Documented as scope limitation |

## Executive Summary

All 12 previous PRIV findings are **verified fixed**, including the two that were open:

- **PRIV-P2-008** closed for the source stores: the daily retention task now purges `store_quotes` and `store_quote_requests` in bounded batches at the registry-resolved 90-day window (`retention.ts:194-205`; aliases `retention-policy.ts:31-44`), with tests and matching policy text. The DSAR runbook now documents deletion of both tables for non-user submitters.
- **PRIV-P3-004** closed: `docs/PRIVACY.md` no longer contradicts itself about `store_analytics_events`; only `store_leads` and `impersonation_log` remain listed as un-purged, matching the code.

Two **new P2 findings** were identified in the new quote-retention path and its surroundings:

1. **PRIV-P2-009:** the 90-day purge and the DSAR deletion block omit `store_proposal_drafts`, whose `sections` jsonb contains the submitter's name and free-text notes. The published "quote data purged after 90 days" claim is false for that copy, and an erasure request leaves it behind.
2. **PRIV-P2-010:** `store_quotes` still grants INSERT to `anon` with an `organization_id is null` policy. The Supabase anon key is public, so a direct PostgREST insert can create name/email/phone rows with `consent_at` NULL, bypassing the API's consent gate, validation, Turnstile and rate limits.

## Findings

| ID | Sev | Status | Title |
|---|---|---|---|
| PRIV-P2-001 | P2 | verified-fixed | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate |
| PRIV-P2-002 | P2 | verified-fixed | Consent is captured only in the browser and never recorded or enforced server-side; the store quote form collects PII with no consent at all |
| PRIV-P2-003 | P2 | verified-fixed | Published retention statement (three years) contradicts the 90-day contact-form PII purge |
| PRIV-P2-004 | P2 | verified-fixed | Audit-log PII redaction is a shallow key-name filter; person names and job titles are persisted for 365 days |
| PRIV-P2-005 | P2 | verified-fixed | No data-subject access/export/erasure path or DSAR runbook; offboarding never removes profile or auth records |
| PRIV-P2-006 | P2 | verified-fixed | Visitor IP addresses are sent to ip-api.com over plaintext HTTP for geolocation |
| PRIV-P2-007 | P2 | verified-fixed | Privacy governance documentation set is missing and the published vendor list omits processors used in code |
| PRIV-P2-008 | P2 | verified-fixed | Public store quote/lead PII has no automated retention or purge path and is excluded from the published retention statement |
| PRIV-P3-001 | P3 | verified-fixed | Breach-response and IR plans still claim Alertmanager is not deployed and IR-P0-003 is open |
| PRIV-P3-002 | P3 | verified-fixed | DATA_BREACH_RESPONSE claims audit_logs records source IP/user-agent; no runtime writer populates them |
| PRIV-P3-003 | P3 | verified-fixed | public-interaction-retention performs an unbounded single-statement delete and is not covered by the DATA-P1-002 batching fix |
| PRIV-P3-004 | P3 | verified-fixed | PRIVACY.md known-gaps section contradicts its own retention schedule (claims store_analytics_events has no purge) |
| PRIV-P2-009 | P2 | open | Quote purge and DSAR erasure leave quote PII in store_proposal_drafts.sections |
| PRIV-P2-010 | P2 | open | Direct anon INSERT on store_quotes bypasses the consent gate, validation and rate limits |

Counts (all 14 findings in this report): **12 verified-fixed, 0 partially-fixed, 0 regressed, 2 new open P2.**

## Key fixes verified in this diff

### PRIV-P2-008 — store quote PII now has a purge and a DSAR path

`apps/worker/src/tasks/retention.ts:194-205` adds `store_quotes` and `store_quote_requests` to the bounded purge, using windows resolved through `resolveRetentionDays` (aliases `lib/retention-policy.ts:31-44`, defaults 90 days at `:27-29`). `docs/PRIVACY.md:50-55` and the public privacy page (`apps/web/app/(public)/privacy/page.tsx:200-213`) now state the 90-day window and name both stores; the DSAR runbook (`docs/runbooks/dsar.md:127-143`) deletes both for public submitters. Tests: `apps/worker/src/__tests__/retention.test.ts:268-285`.

### PRIV-P3-004 — retention documentation self-consistency

`docs/PRIVACY.md:100-110` now lists only `store_leads` and `impersonation_log` as un-purged and explicitly says the two quote stores and `store_analytics_events` are purged at 90 days, matching `retention.ts:190-205`.

## New findings

### PRIV-P2-009 — quote PII survives in proposal drafts (P2, open)

- **Evidence:** `apps/api/src/lib/proposal-generator.ts:113` writes `Draft proposal for ${customer.name}` and `:119` writes `Customer notes: ${request.notes}` into `sections`; `apps/api/src/routes/store/quotes.ts:355-365` persists that object in `store_proposal_drafts`. The table has no FK/cascade (`supabase/migrations/5302115_store_v5_sales_ops.sql:19-28`), no retention alias (`lib/retention-policy.ts:30-44`), and no line in the DSAR deletion block (`docs/runbooks/dsar.md:127-143`).
- **What is happening:** deleting `store_quote_requests` (and `store_quotes`) after 90 days leaves a derived copy of the submitter's name and free-text notes indefinitely.
- **Why it matters:** the published retention statement says quote data is purged after 90 days; that is untrue for the draft copy. An erasure request handled through the documented DSAR SQL also leaves it behind.
- **Recommended fix:** add `store_proposal_drafts` (and, if it carries customer text, generated proposal descriptions) to the retention targets and DSAR SQL; or store only non-PII derived text in draft sections.
- **Validation:** retention test seeds a 91-day-old quote + draft and asserts both are deleted; DSAR runbook test/check asserts every quote-derived table is covered.
- **Owner:** data governance/store backend · **Effort:** S–M · **Target:** this month.

### PRIV-P2-010 — anon INSERT on store_quotes bypasses consent (P2, open)

- **Evidence:** `supabase/migrations/5302448_store_quotes_insert_scope.sql:14-18` creates `anon_insert_quotes` with `with check (organization_id is null)`; `5302434_anon_privilege_least_privilege.sql:74` grants `insert` to `anon`. The API path requires `consent === true` and records `consent_at`/`consent_version` (`routes/store/quotes.ts:92-112`; migration `5302449:17-21`). Supabase anon keys are publishable by design (`docs/ENVIRONMENT_VARIABLES.md:51` calls it the "publishable/anon key").
- **What is happening:** a direct PostgREST insert can create a quote row with name/email/phone/notes and `consent_at = NULL`; the schema comment defines NULL as "no consent on record".
- **Why it matters:** the consent control, Turnstile and rate limits are bypassed; the platform stores PII with no consent evidence and no abuse ceiling. It also undermines the PRIV-P2-002 guarantee that consent is enforced server-side.
- **Recommended fix:** revoke the `anon` INSERT grant and drop the policy now that the storefront uses `POST /store/quotes`; if a direct-write path is required, enforce `consent_at IS NOT NULL` and a policy version via a trigger.
- **Validation:** migration test asserts `has_table_privilege('anon','store_quotes','insert')` is false and no anon policy exists; API test remains the only write path.
- **Owner:** data governance/platform security · **Effort:** S · **Target:** this month.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Quote PII retained past the published window | P2 | High (every quote with notes) | Misleading privacy notice; DSAR non-compliance | PRIV-P2-009 | Include drafts in purge/DSAR |
| PII written without consent evidence | P2 | Medium (anon key public) | Compliance breach; spam rows | PRIV-P2-010 | Revoke anon insert |
| Vendor DPA status unverified | P2 | Unknown | Processor compliance gap | `docs/SUBPROCESSORS.md` | Operator verify contracts |
| IP/UA absent from audit logs | P3 | Accepted | Breach scoping weaker | PRIV-P3-002 | Documented; impersonation_log covers admin |

## Recommendations

### Immediate / Release Blocking

None (both new findings are P2 and bounded), but fix PRIV-P2-010 before the next public marketing push.

### This Week

1. Revoke the `store_quotes` anon INSERT grant/policy (`PRIV-P2-010`).
2. Add `store_proposal_drafts` to the retention task and the DSAR SQL block (`PRIV-P2-009`).

### This Month

3. Update `docs/PRIVACY.md` and the public notice if proposal drafts are retained intentionally (with a window), or confirm they are purged with the quote.
4. Have the operator verify the "To confirm" DPA entries (SMTP, Tawk.to, ip-api).

### Later

5. Add a DSAR regression check that enumerates every table holding quote-derived PII, so new derived stores cannot silently escape.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Add drafts to retention | Closes the published-window gap | `retention.ts`, `retention-policy.ts` | Retention test |
| Revoke anon insert | Removes consent bypass in one migration | New migration | Privilege assertion |
| DSAR SQL update | Erasure completeness | `docs/runbooks/dsar.md` | Manual review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Add store_proposal_drafts to purge + DSAR (PRIV-P2-009) | P2 | data governance/store | S–M | Retention decision |
| Revoke anon INSERT on store_quotes (PRIV-P2-010) | P2 | platform security | S | Migration |
| Verify "To confirm" DPAs | P2 | compliance | M | Contracts |
| Finance/billing retention policy | P3 | finance/compliance | S | Legal input |

## Suggested Tests

- Retention: 91-day-old `store_quotes`, `store_quote_requests` and `store_proposal_drafts` rows all purged; recent rows retained; policy override changes all three.
- DSAR: erasure by email covers every quote-derived table; response states residual vendor copies.
- RLS: `anon` cannot INSERT/SELECT/UPDATE `store_quotes`; authenticated member insert still works where intended.
- Consent: API quote submit without consent → 400 `CONSENT_REQUIRED`; stored row has consent_at/version.

## Suggested Documentation Updates

- `docs/PRIVACY.md`: retention schedule + known gaps after draft handling is decided.
- `docs/runbooks/dsar.md` §4.4: add `store_proposal_drafts` (and any generated proposal rows).
- `docs/SUBPROCESSORS.md`: resolve the "To confirm" DPA rows.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Should proposal drafts be retained for a business period after the quote? | Drives whether to purge or document a longer window | Sales/legal decision |
| Is any client still writing `store_quotes` directly with the anon key? | Determines whether the grant can be revoked outright | Web/static form inventory |
| Which vendor DPAs are actually signed? | The doc marks several "To confirm" | Contract evidence |

## Appendix — evidence map

```
consent API:   routes/public.ts:177-181,217-234; routes/store/quotes.ts:94-112
retention:     worker/tasks/retention.ts:190-205; lib/retention-policy.ts:31-44
DSAR:          routes/users.ts:394-460,657-724; docs/runbooks/dsar.md:127-143
draft PII:     lib/proposal-generator.ts:113,119; routes/store/quotes.ts:355-365
anon insert:   5302448:14-18; 5302434:74; 5302449:17-21
```

No live database, DSAR execution or vendor console was accessed.
