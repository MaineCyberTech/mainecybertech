# Analytics, Tracking, and Privacy Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 39) · Area code: AN
- Scope limitations: static read-only review at 7dd0402. No browser session, GA/Tawk.to property, or live Vercel/droplet env inspected; GA/Tawk ID delivery in the production deployment is `unverified` (the DO pipeline does not pass `NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_TAWKTO_ID`; the docs describe a Vercel project). No test suite executed.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (9 AN findings).

## Executive Summary

All nine previous AN findings are `verified-fixed` at 7dd0402. The public site is default-deny: GA and Tawk.to load only after an explicit, persisted grant, with Consent Mode v2 default-deny and a withdrawal signal; consent is recorded server-side with a policy version; first-party storefront events are captured through the API with a CSRF bootstrap, carry no IP/user-agent (columns dropped), are purged at 90 days, and cannot be inserted anonymously via PostgREST. Error telemetry is scrubbed at the SDK with `sendDefaultPii:false` and disclosed.

Two new P3s: consent withdrawal does not unload the already-executed Tawk.to widget (GA is handled via Consent Mode), and the public track endpoint accepts arbitrary event names and unbounded metadata, so the registry's privacy rules are not enforced server-side.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| AN-P2-001 | P2 | Google Analytics and Tawk.to load with no cookie-consent gate | verified-fixed |
| AN-P2-002 | P2 | Analytics API stores visitor IP and user-agent in plaintext | verified-fixed |
| AN-P2-003 | P2 | Storefront analytics capture is dead (no caller, CSRF-gated) | verified-fixed |
| AN-P2-004 | P2 | First-party analytics events have no retention or purge path | verified-fixed |
| AN-P2-005 | P2 | Visitor-alert tracking collects IP/geo before consent; plaintext ip-api.com | verified-fixed |
| AN-P3-001 | P3 | No consent-mode signalling and no event/retention governance | verified-fixed |
| AN-P3-002 | P3 | Anonymous direct inserts to `store_analytics_events` bypass the API | verified-fixed |
| AN-P3-003 | P3 | Consent not recorded; policy omits first-party tracking stores | verified-fixed |
| AN-P3-004 | P3 | Error telemetry has no explicit PII scrubbing/retention/vendor disclosure | verified-fixed |
| AN-P3-005 | P3 | Consent withdrawal does not unload Tawk.to | **open (new)** |
| AN-P3-006 | P3 | Track endpoint accepts arbitrary event names and unbounded metadata | **open (new)** |

### Re-verification evidence (headline rows)

- **AN-P2-001 / AN-P3-001** — `components/consent/AnalyticsScripts.tsx:17-77`; `ConsentProvider.tsx:33-58`.
- **AN-P2-002 / AN-P3-002** — `routes/analytics.ts:39-58` (no PII written); `5302446_remove_analytics_pii_columns.sql`; `5302458_close_analytics_anon_insert.sql`.
- **AN-P2-003** — call sites `StoreAnalyticsTracker.tsx:21`, `ServiceFinderQuiz.tsx:68`, `QuoteBuilderClient.tsx:208`; CSRF bootstrap `lib/catalog/analytics.ts:22-70` + `routes/analytics.ts:29-34`.
- **AN-P2-004** — `apps/worker/src/tasks/retention.ts:140-160`; `docs/PRIVACY.md:48`.
- **AN-P2-005** — `routes/public.ts:104-160` (consent gate, HTTPS-only geo, IP-free visitor alert).
- **AN-P3-004** — `api/lib/sentry-scrub.ts`, `web/lib/sentry-scrub.ts`, `instrumentation-client.ts:17-24`; vendor/retention in `docs/SUBPROCESSORS.md`, `docs/PRIVACY.md:49`.
- **AN-P3-005 (new)** — withdrawal signal only covers GA (`AnalyticsScripts.tsx:23-36`); Tawk embed has no shutdown path.
- **AN-P3-006 (new)** — `routes/analytics.ts:15-27` (unconstrained `metadata`, no registry validation); registry only in `apps/web/lib/catalog/data/analytics-events.json`.

## Recommendations

1. **This quarter (new P3s):** call `Tawk_API` hide/shutdown on consent withdrawal (and document reload semantics); validate `event` against a shared registry and cap/sanitise `metadata` server-side.
2. **This quarter:** decide whether GA/Tawk IDs should be delivered by the DO pipeline or the Vercel project, and record the answer in `docs/MARKETING_SITE_INTEGRATION.md` (currently `unverified`).
3. **Later:** consider honoring DNT/GPC as a default-deny signal.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Tawk shutdown on withdrawal | Makes withdrawal effective without a reload | `components/consent/AnalyticsScripts.tsx` |
| Shared event-name validation | Prevents registry drift and junk events | `routes/analytics.ts`, `packages/sdk` |

## Suggested Tests

- Component: withdrawal calls the Tawk shutdown path (new).
- API: unknown event name / oversized metadata rejected (new).
- E2E: no third-party request before grant; GA consent update on withdrawal (exists/expand).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are GA/Tawk.to IDs actually configured in production? | Determines whether the consent-gated feature is live | Operator env/Vercel dashboard |
