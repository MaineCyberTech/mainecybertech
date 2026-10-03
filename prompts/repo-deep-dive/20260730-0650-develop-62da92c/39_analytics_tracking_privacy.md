# Analytics, Tracking, and Privacy Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo advisor
- Area code: AN
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/39_analytics_tracking_privacy.md
- Scope limitations: Static analysis. No runtime verification of actual GA/Tawk.to traffic. No network capture. Cookie consent behavior ACCEPTED as configured (banner-less).

## Scope

Audited analytics scripts, tracking pixels, events, product analytics, error telemetry, session replay, cookie banner, consent mechanism, opt-in/out, user/tenant IDs, sensitive payloads, page views, admin tracking, marketing lead tracking, privacy policies, data retention, vendor list, do-not-track, and corresponding tests/docs.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/web/app/(public)/layout.tsx` | Source | Public layout loads GA + Tawk.to | Unconditional script loading |
| `apps/web/components/analytics/GaClient.tsx` | Source | GA4 client component | gtag.js initialization |
| `apps/web/components/chat/TawkToClient.tsx` | Source | Tawk.to live chat widget | Widget script |
| `apps/web/middleware.ts` | Source | CSP headers | Nonce-based CSP allows GA/Tawk.to |
| `apps/web/app/layout.tsx` | Source | Root layout | No analytics there |
| `apps/web/app/(portal)/portal/layout.tsx` | Source | Portal layout | No analytics |
| `apps/web/app/(admin)/admin/layout.tsx` | Source | Admin layout | No analytics |
| `apps/api/src/main.ts` | Source | API entry point | Sentry, helmet, CORS |
| `apps/api/src/lib/audit.ts` | Source | Audit logging | Tracks user actions |
| `apps/api/src/routes/public.ts` | Source | Marketing webhooks | Teams + JSM lead tracking |
| `packages/sdk/src/index.ts` | Source | SDK | No analytics tracking |
| `docs/COOKIE_CONSENT.md` | Doc | Cookie consent strategy | Banner-less approach documented |
| `apps/web/next.config.mjs` | Config | Next.js config | No analytics config |
| `apps/web/instrumentation.ts` | Config | Sentry instrumentation | Error telemetry |

## Executive Summary

**Analytics and tracking are minimal and well-contained (score ~3.5/5).** The platform uses only two third-party scripts (GA4 and Tawk.to), both restricted to the marketing site (public route group). Error telemetry uses Sentry across API and Web. No session replay, no product analytics, no tracking pixels. Audit logging serves as first-party event tracking.

**Key gaps:**
1. **GA/Tawk.to load without consent** — ACCEPTED (by design, per COOKIE_CONSENT.md)
2. **No do-not-track (DNT) header respect** — ACCEPTED (by design)
3. **No analytics opt-out mechanism** — ACCEPTED (by design)
4. **No cookie consent banner or preference center** — ACCEPTED (by design, per COOKIE_CONSENT.md)
5. **No analytics in portal/admin** — this is a positive privacy outcome, but no documentation of this design decision

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| GA4 script | `GaClient.tsx` | Analytics | ✅ Loads (public only) | Low | env-gated by NEXT_PUBLIC_GA_ID |
| Tawk.to script | `TawkToClient.tsx` | Live chat | ✅ Loads (public only) | Low | env-gated by NEXT_PUBLIC_TAWKTO_ID |
| Sentry (API) | `apps/api/src/main.ts` | Error telemetry | ✅ Complete | Low | env-gated by SENTRY_DSN |
| Sentry (Web) | `instrumentation.ts` | Error telemetry | ✅ Complete | Low | env-gated by NEXT_PUBLIC_SENTRY_DSN |
| Cookie consent | `docs/COOKIE_CONSENT.md` | Consent strategy | ✅ Documented (banner-less) | Low | Accepted design |
| Lead tracking | `routes/public.ts` | Teams + JSM webhooks | ✅ Complete | Low | Lead form submission |
| Audit events | `lib/audit.ts` | First-party tracking | ✅ Complete | Low | 27+ endpoints |
| CSP | `middleware.ts` | Script restrictions | ✅ Complete | Low | Nonce-based |
| Session replay | — | Not present | ❌ Absent | Low | Positive |
| Tracking pixels | — | Not present | ❌ Absent | Low | Positive |
| Product analytics | — | Not present | ❌ Absent | Low | Positive |
| DNT handler | — | Not present | ❌ Absent | Medium | No DNT respect |
| Opt-out | — | Not present | ❌ Absent | Medium | No disable option |
| Consent record | — | Not present | ❌ Absent | Medium | No preference DB |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Analytics scripts | 4 | GA4 on marketing only, env-gated | No consent gate | Add consent check |
| Tracking pixels | 5 | None present | None | — |
| Events | 4 | Audit logging covers mutations | No front-end events | Add optional page-view events |
| Product analytics | 5 | None present | None | — |
| Error telemetry | 5 | Sentry on API + Web | None | — |
| Session replay | 5 | None present | None | — |
| Cookie banner | 4 | Documented banner-less approach | ACCEPTED (by design) | None needed |
| Consent | 4 | Banner-less design per COOKIE_CONSENT.md | ACCEPTED (by design) | None needed |
| Opt-in/out | 4 | Banner-less design per COOKIE_CONSENT.md | ACCEPTED (by design) | None needed |
| User/tenant IDs | 4 | Audit logs use user_id, org_id | No event telemetry | None needed |
| Sensitive payloads | 4 | No PII in analytics events | None verified | Audit Sentry events |
| Page views | 2 | GA4 captures marketing page views | Portal/admin not tracked | By design (good) |

## Detailed Review

### Item: GA4 Analytics

- **Evidence:** `apps/web/components/analytics/GaClient.tsx:1-30` — GA4 client component that initializes gtag with `NEXT_PUBLIC_GA_ID`
- **What it does:** Tracks page views, user interactions on marketing site
- **How it works:** Mounted in `(public)/layout.tsx`; conditionally renders based on `NEXT_PUBLIC_GA_ID` env var being set
- **Dependencies:** NEXT_PUBLIC_GA_ID env var
- **Current controls:** Only loads on marketing pages (public route group); env-gated
- **Missing controls:** No consent gate, no opt-out, no DNT check — ACCEPTED (by design)
- **Risks:** Low — Accepted design decision per COOKIE_CONSENT.md
- **Recommended improvement:** None — current design intentional
- **Suggested tests:** Verify GA not loaded when env var absent
- **Suggested docs:** Already documented in COOKIE_CONSENT.md

### Item: Tawk.to Live Chat

- **Evidence:** `apps/web/components/chat/TawkToClient.tsx:1-40` — Tawk.to widget component
- **What it does:** Provides live chat widget on marketing site
- **How it works:** Mounted in `(public)/layout.tsx`; conditionally renders based on `NEXT_PUBLIC_TAWKTO_ID`
- **Current controls:** env-gated, marketing-only
- **Missing controls:** No consent gate — ACCEPTED (by design)
- **Risks:** Low — Accepted design decision per COOKIE_CONSENT.md
- **Recommended fix:** None — current design intentional

### Item: Error Telemetry (Sentry)

- **Evidence:** `apps/web/instrumentation.ts`, `apps/api/src/sentry.ts`
- **What it does:** Captures unhandled exceptions, route errors
- **How it works:** Sentry SDK initialized in API (main.ts) and Web (instrumentation.ts); skips init when DSN unset
- **Current controls:** env-gated; no PII in default capture scope
- **Risks:** Low — Sentry is privacy-aware and configurable; no session replays enabled

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| AN-001 | Analytics on marketing | `GaClient.tsx` | GA4, env-gated | ACCEPTED (by design) | — | — |
| AN-002 | Analytics on portal/admin | — | Not tracked | None (positive) | — | Document decision |
| AN-003 | Live chat | `TawkToClient.tsx` | Tawk.to, env-gated | ACCEPTED (by design) | — | — |
| AN-004 | Error telemetry | `instrumentation.ts` | Sentry, env-gated | None | — | — |
| AN-005 | Consent mechanism | — | Banner-less, doc'd | ACCEPTED (by design) | — | — |
| AN-006 | DNT respect | — | Not checked | ACCEPTED (by design) | — | — |
| AN-007 | Lead tracking | `routes/public.ts` | Teams + JSM webhooks | None | — | — |
| AN-008 | Session replay | — | Not present | None (positive) | — | — |
| AN-009 | Tracking pixels | — | Not present | None (positive) | — | — |
| AN-010 | Audit logging | `lib/audit.ts` | First-party events | None | — | — |

## Findings

### Finding ID: AN-P2-001 - GA and Tawk.to scripts load without user consent — ACCEPTED

- Severity: — (Accepted)
- Confidence: High
- Area: Analytics consent
- Evidence: `GaClient.tsx` and `TawkToClient.tsx` mount unconditionally in public layout
- What is happening: Third-party tracking/chat scripts load on first visit without user consent
- Why it matters: ePrivacy Directive requires opt-in consent for non-essential cookies; GA cookies are non-essential
- User / business impact: Potential GDPR/ePrivacy violation — ACCEPTED as design decision
- Status: ACCEPTED

### Finding ID: AN-P2-002 - No do-not-track header respect — ACCEPTED

- Severity: — (Accepted)
- Confidence: High
- Area: DNT
- Evidence: No DNT header check in any component
- What is happening: Browsers with DNT enabled still load tracking scripts
- Status: ACCEPTED

### Finding ID: AN-P2-003 - No analytics opt-out mechanism — ACCEPTED

- Severity: — (Accepted)
- Confidence: High
- Area: Opt-out
- Evidence: No opt-out link, cookie, or preference in any component
- What is happening: Users who do not want tracking have no way to disable it
- Status: ACCEPTED

### Finding ID: AN-P3-001 - Portal/admin analytics decision undocumented

- Severity: P3
- Confidence: High
- Area: Documentation
- Evidence: No mention of why portal/admin deliberately avoid analytics
- What is happening: The intentional decision to not track portal/admin usage is not documented anywhere
- Recommended fix: Add note to `docs/COOKIE_CONSENT.md` explaining that portal/admin pages intentionally omit analytics
- Effort estimate: Trivial (30 min)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| GDPR/ePrivacy violation | — (Accepted) | Low | High | Unconsented GA/Tawk.to | ACCEPTED — banner-less design per COOKIE_CONSENT.md |
| User privacy erosion | — (Accepted) | Low | Medium | No opt-out | ACCEPTED — banner-less design per COOKIE_CONSENT.md |
| DNT non-compliance | — (Accepted) | Low | Medium | No DNT check | ACCEPTED — banner-less design per COOKIE_CONSENT.md |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Document portal/admin analytics decision (AN-P3-001)

### This Month

None.

### Later / Platform Evolution

1. None — banner-less design accepted per COOKIE_CONSENT.md

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Document analytics decision | Developer awareness | `docs/COOKIE_CONSENT.md` | PR review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Consent gate for GA/Tawk.to | — (Accepted) | — | — | — |
| DNT check | — (Accepted) | — | — | — |
| Cookie settings link + opt-out | — (Accepted) | — | — | — |
| Consent preference page | — (Accepted) | — | — | — |

## Suggested Tests

- **E2E:** Visit marketing page with GA_ID unset → verify no GA errors

## Suggested Documentation Updates

- `docs/COOKIE_CONSENT.md` — add portal/admin analytics policy documentation

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|

## Appendix

### Analytics Script Loading Flow

```
Browser → (public)/layout.tsx
  → GaClient (if NEXT_PUBLIC_GA_ID set)
  → TawkToClient (if NEXT_PUBLIC_TAWKTO_ID set)
  → CSP allows both via nonce

Proposed flow:
  Check consent cookie
  Check DNT header
  → if both OK: load scripts
  → if not: skip
```

### Third-Party Vendor List

| Vendor | Purpose | Data shared | Jurisdiction | Cookie type |
|--------|---------|-------------|-------------|-------------|
| Google Analytics 4 | Page view analytics | Page URL, browser info, IP (anonymized) | US | Analytics (non-essential) |
| Tawk.to | Live chat | Chat messages, email if provided, IP | US | Functional (non-essential) |
| Sentry | Error telemetry | Error stack traces, URL, browser info | US | Essential (no cookies) |
| Supabase | Database + auth | All app data | US (multi-region) | Essential |
| Cloudflare | CDN + WAF | Request metadata | Global | Essential |
| GitHub | Source code + CI | Build events | US | Essential |
| DigitalOcean | Hosting | Infrastructure metrics | US (NYC region) | Essential |
| Stripe | Billing | Payment data | US | Essential |
| Atlassian (JSM) | Ticket integration | Ticket data | US | Essential |
| Microsoft (M365) | Calendar sync | Calendar data | US/region | Essential |
