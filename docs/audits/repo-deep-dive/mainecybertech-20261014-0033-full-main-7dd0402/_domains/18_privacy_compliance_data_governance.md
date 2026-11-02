# Privacy, Compliance, and Data Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 18) · Area code: PRIV
- Scope limitations: repository-only evidence at 7dd0402. Supabase/Google/Tawk.to/Sentry/Stripe provider-side controls, the off-repo breach register and production data volumes were not inspected. No test suite executed. Compliance frameworks are used as readiness lenses only — no formal compliance claim.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (10 PRIV findings).

## Executive Summary

All ten previous PRIV findings are `verified-fixed` at 7dd0402: consent is default-deny and recorded server-side with a policy version; the published retention statement matches the enforced 90-day contact-form purge; audit-log redaction recurses over names/titles; DSAR export/erasure endpoints + runbook exist; visitor geolocation is consent-gated and HTTPS-only; and the governance set (`docs/PRIVACY.md`, `docs/SUBPROCESSORS.md`, IR/breach corrections) is present and consistent.

Two new items remain. **PRIV-P2-008 (P2):** public store quote/lead PII (`store_quotes`, `store_quote_requests.customer`) still has no automated retention/purge and is excluded from the published retention statement — `docs/PRIVACY.md:54,102-104` acknowledges it as an owner-pending gap, but no window or purge task exists and the DSAR erasure path cannot reach non-user submitters. **PRIV-P3-004 (P3):** `docs/PRIVACY.md` §8 contradicts its own §4 by listing `store_analytics_events` among the un-purged stores, although the worker purges it at 90 days.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| PRIV-P2-001 | P2 | GA/Tawk.to load with no cookie-consent gate | verified-fixed |
| PRIV-P2-002 | P2 | Consent captured only in the browser; store quote form collects PII with no consent | verified-fixed |
| PRIV-P2-003 | P2 | Published retention statement contradicts the 90-day purge | verified-fixed |
| PRIV-P2-004 | P2 | Audit-log PII redaction is a shallow key-name filter | verified-fixed |
| PRIV-P2-005 | P2 | No data-subject access/export/erasure path or DSAR runbook | verified-fixed |
| PRIV-P2-006 | P2 | Visitor IPs sent to ip-api.com over plaintext HTTP | verified-fixed |
| PRIV-P2-007 | P2 | Privacy governance documentation set missing; vendor list incomplete | verified-fixed |
| PRIV-P3-001 | P3 | Breach/IR plans claim Alertmanager is not deployed | verified-fixed |
| PRIV-P3-002 | P3 | DATA_BREACH_RESPONSE claims audit_logs records source IP/UA | verified-fixed |
| PRIV-P3-003 | P3 | public-interaction-retention uses an unbounded delete | verified-fixed |
| PRIV-P2-008 | P2 | Public store quote/lead PII has no automated retention or purge and is excluded from the published retention statement | **open (new)** |
| PRIV-P3-004 | P3 | PRIVACY.md known-gaps section contradicts its own retention schedule | **open (new)** |

### Re-verification evidence (headline rows)

- **PRIV-P2-001** — `components/consent/ConsentProvider.tsx:33-58` (default-deny), `AnalyticsScripts.tsx:17-77` (grant-only injection + Consent Mode v2), `app/(public)/layout.tsx:55-66`.
- **PRIV-P2-002** — `routes/public.ts:177-181,210-217`; `routes/store/quotes.ts:94-99,111-112,137-138`; `5302449_consent_recording.sql`; `lib/consent.ts`.
- **PRIV-P2-004** — `services/audit.ts:12-70` recursive redaction.
- **PRIV-P2-005** — `routes/users.ts:394-460` export, `:657-724` erasure; `docs/runbooks/dsar.md:58-60`.
- **PRIV-P2-006** — `routes/public.ts:14-40` (HTTPS fail-closed, minimal fields).
- **PRIV-P2-008 (new)** — `5302105_store_quotes.sql:1-11` (name/email/phone); retention targets limited to audit_logs/notifications/public_interactions/webhook_deliveries/webhook_dead_letters (`tasks/retention.ts`, `lib/retention-policy.ts` TARGET_ALIASES); `docs/PRIVACY.md:54,102-104` (acknowledged gap); `app/(public)/privacy/page.tsx:200-211` (omitted).
- **PRIV-P3-004 (new)** — `docs/PRIVACY.md:48` vs `:102-104`; purge exists at `apps/worker/src/tasks/retention.ts:140-160`.

## Recommendations

1. **This month (new P2):** set an owner-approved retention window for `store_quotes`/`store_quote_requests`/`store_leads`, implement a batched purge task, register it in `retention_policies`, and add the matching line to the public policy + PRIVACY.md.
2. **This quarter (new P3):** correct the PRIVACY.md known-gaps list.
3. **Later:** add a DSAR procedure for non-user submitters (quote/lead data) to `docs/runbooks/dsar.md`.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Fix the PRIVACY.md gap list | Removes a self-contradiction auditors flag | `docs/PRIVACY.md` |
| Add the quote PII row to the retention schedule as `operator decision` | Makes the gap explicit and tracked | `docs/PRIVACY.md`, public policy |

## Suggested Tests

- Worker: quote retention purge deletes only rows past the window, in batches (new).
- API: store quote submit without consent → 400 (exists); consent recorded with version (exists).
- Docs: retention-doc test extended to quote PII once a window is set (new).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| What retention window applies to quote/lead PII? | GDPR storage-limitation compliance | Owner decision |
| Are quote submitters informed of retention? | Policy completeness | Policy update |
