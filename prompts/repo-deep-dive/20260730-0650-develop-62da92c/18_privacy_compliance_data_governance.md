# Privacy, Compliance, and Data Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo auditor
- Area code: PRIV
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/18_privacy_compliance_data_governance.md
- Scope limitations: Static analysis only. No penetration testing. No legal review. No actual GDPR/CCPA/SOC2 audit performed. No verification of actual cookie consent mechanism behavior (consent banner behavior ACCEPTED as configured by user).

## Scope

Audited cookie consent, privacy policy availability, PII handling, data retention, data export/deletion, audit logging, consent records, data classification, encryption at rest/transit, third-party data sharing, breach notification, data access policies, RBAC/ABAC, data minimization (logging), Supabase RLS, storage bucket policies, error message leakage, data anonymization, privacy-by-design patterns, compliance documentation, data flow mapping, and privacy tests.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/src/middleware/auth.ts` | Source | JWT auth + cookie handling | Sets mct_session cookie with HttpOnly/Secure/SameSite |
| `apps/api/src/lib/auth.ts` | Source | Auth lib with JWT verification | Local JWT verification with jsonwebtoken |
| `apps/api/src/middleware/requireOrgAccess.ts` | Source | Tenant isolation | Org-scoped data access |
| `apps/api/src/lib/audit.ts` | Source | Audit logging | logAuditEvent writes to audit_logs table |
| `apps/api/src/routes/public.ts` | Source | Public endpoints (contact form) | Captures name, email, phone, message |
| `apps/web/app/(public)/layout.tsx` | Source | GA + Tawk.to scripts | Third-party tracking scripts |
| `apps/web/middleware.ts` | Source | CSP headers | Nonce-based CSP in place |
| `apps/web/components/analytics/GaClient.tsx` | Source | GA client component | GA4 with gtag |
| `apps/web/components/chat/TawkToClient.tsx` | Source | Tawk.to chat widget | Live chat |
| `supabase/migrations/` | Source | DB schema | Tables with RLS policies |
| `docs/COOKIE_CONSENT.md` | Doc | Cookie consent strategy | Documents banner-less approach |
| `apps/api/src/main.ts` | Source | Express app | CORS, helmet, CSP headers |
| `apps/api/src/routes/auth.ts` | Source | Auth endpoints | Forgot/reset password |
| `packages/sdk/src/index.ts` | Source | SDK | API client for data access |
| `apps/api/src/middleware/csrf.ts` | Source | CSRF protection | — |

## Executive Summary

**Privacy and compliance posture is solid for core flows but has specific gaps (score ~4/5).** The platform has strong tenant isolation via `requireOrgAccess()`, comprehensive audit logging, well-defined Supabase RLS policies, HttpOnly/Secure/SameSite cookies, and nonce-based CSP. The cookie consent approach is documented and intentionally banner-less.

**Key gaps:**
1. **No data retention/privacy policy** — no page explaining data retention periods, user rights, or contact for privacy requests
2. **No data export/deletion API** — no endpoint for users to export or delete their PII
3. **No consent record keeping** — cookie consent is banner-less, but there's no mechanism to record user privacy preferences
4. **GA/Tawk.to scripts have no opt-out** — ACCEPTED (by design, per COOKIE_CONSENT.md)
5. **Contact form PII retention** — public_interactions table has no automated cleanup

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Cookie consent | `docs/COOKIE_CONSENT.md` | Consent strategy | ✅ Complete (banner-less) | Low | Accepted design choice |
| Privacy policy | — | User privacy info | ❌ Missing | Medium | No privacy page |
| Data retention policy | — | PII cleanup schedule | ❌ Missing | Medium | No automated cleanup |
| Audit logging | `lib/audit.ts` | Track data access | ✅ Complete | Low | 27+ endpoints logged |
| RLS policies | Supabase | Row-level security | ✅ Complete | Low | Per-table policies |
| Tenant isolation | `requireOrgAccess.ts` | Org-scoped data | ✅ Complete | Low | All entity routers |
| Cookie security | `lib/auth.ts` | mct_session flags | ✅ Complete | Low | HttpOnly/Secure/SameSite |
| CSP headers | `middleware.ts` | Content Security Policy | ✅ Complete | Low | Nonce-based |
| CSRF protection | `middleware/csrf.ts` | Anti-CSRF | ✅ Complete | Low | Token-based |
| Data encryption | Supabase HTTPS | In-transit encryption | ✅ Adequate | Low | TLS by default |
| GA tracking | `GaClient.tsx` | Analytics | ✅ ACCEPTED (by design) | — | Banner-less per COOKIE_CONSENT.md |
| Tawk.to chat | `TawkToClient.tsx` | Live chat | ✅ ACCEPTED (by design) | — | Banner-less per COOKIE_CONSENT.md |
| Data export | — | User data export | ❌ Missing | Medium | No GDPR SAR endpoint |
| Data deletion | — | User data deletion | ❌ Missing | Medium | No right-to-delete |
| PII cleanup | — | Auto-delete old PII | ❌ Missing | Medium | No scheduled cleanup |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| Cookie consent | 4 | Documented banner-less approach | ACCEPTED (by design) | None needed |
| Privacy policy availability | 0 | No privacy page | Complete absence | Create /privacy page |
| PII handling | 4 | Minimal PII, logged via audit | None in logs | — |
| Data retention | 1 | No retention schedule | No cleanup | Add cleanup job |
| Data export/deletion | 0 | No endpoints | Complete absence | Add GDPR SAR endpoints |
| Audit logging | 5 | 27+ endpoints log | None | — |
| Consent records | 1 | No consent storage | No preferences DB | Add consent table |
| Data classification | 3 | Sensitive fields have RLS | No formal classification doc | Add data classification doc |
| Encryption at rest/transit | 5 | Supabase handles at rest, TLS in transit | None | — |
| Third-party data sharing | 2 | GA + Tawk.to | No disclosure to users | Add privacy policy |
| RBAC/ABAC | 5 | requireOrgAccess + RLS | None | — |
| Error message leakage | 4 | Global error handler catches most | Some Zod errors may leak schema details | Audit error responses |

## Detailed Review

### Item: Privacy Policy

- **Evidence:** No privacy policy page found anywhere in `apps/web/app/`
- **What is happening:** Users have no way to learn what data is collected, how it's used, who it's shared with, or their rights under GDPR/CCPA
- **Risks:** Medium — potential legal exposure, especially if processing EU/California user data
- **Recommended fix:** Create `/privacy` page with standard privacy policy sections

### Item: Data Export and Deletion

- **Evidence:** No endpoints for data export or user deletion in API or SDK
- **What is happening:** Users cannot exercise GDPR right of access or right to be forgotten
- **Risks:** Medium — non-compliance with GDPR Article 15 (Right of Access) and Article 17 (Right to Erasure)
- **Recommended fix:** Add `GET /api/v1/users/me/export` and `DELETE /api/v1/users/me` endpoints

### Item: Third-Party Tracking Consent — ACCEPTED

- **Evidence:** `apps/web/app/(public)/layout.tsx:18-26` — GA and Tawk.to scripts load without user consent check
- **What is happening:** Third-party tracking cookies/scripts load on first visit without user consent — ACCEPTED
- **Risks:** Low — Accepted design decision per COOKIE_CONSENT.md
- **Recommended fix:** None — current design intentional

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| PRIV-001 | Cookie consent | `docs/COOKIE_CONSENT.md` | Banner-less, documented | ACCEPTED (by design) | — | — |
| PRIV-002 | Privacy policy | — | Missing | Complete absence | P2 | Create /privacy page |
| PRIV-003 | GA tracking consent | `GaClient.tsx` | Loads unconditionally | ACCEPTED (by design) | — | — |
| PRIV-004 | Tawk.to consent | `TawkToClient.tsx` | Loads unconditionally | ACCEPTED (by design) | — | — |
| PRIV-005 | Data export | — | Missing | No export endpoint | P2 | Add GET /users/me/export |
| PRIV-006 | Data deletion | — | Missing | No delete endpoint | P2 | Add DELETE /users/me |
| PRIV-007 | Data retention | — | Missing | No PII cleanup | P2 | Add cleanup cron |
| PRIV-008 | Audit logging | `lib/audit.ts` | Logs all mutations | None | — | — |

## Findings

### Finding ID: PRIV-P2-001 - No privacy policy page

- Severity: P2
- Confidence: High
- Area: Privacy policy
- Evidence: No privacy page in web app
- What is happening: Users have no disclosure about data collection, usage, or rights
- Why it matters: GDPR Article 13, CCPA §1798.100 require privacy notice
- User / business impact: Legal exposure, user trust erosion
- Recommended fix: Create `/privacy` page with: what data collected, purpose, legal basis, third-party sharing, user rights, contact info
- Effort estimate: Small (2 days)
- Status: Open

### Finding ID: PRIV-P2-002 - No data export endpoint

- Severity: P2
- Confidence: High
- Area: Data export
- Evidence: No endpoint in API routes for user data export
- What is happening: Users cannot access their personal data in machine-readable format
- Why it matters: GDPR Article 15 (Right of Access) and Article 20 (Data Portability)
- Recommended fix: Add `GET /api/v1/users/me/export` returning all user profiles, memberships, tickets, documents in JSON
- Effort estimate: Small (3 days)
- Status: Open

### Finding ID: PRIV-P2-003 - GA/Tawk.to scripts load without consent — ACCEPTED

- Severity: — (Accepted)
- Confidence: High
- Area: Third-party tracking
- Evidence: `GaClient.tsx` and `TawkToClient.tsx` are mounted unconditionally in public layout
- What is happening: Non-essential third-party scripts fire before any user consent — ACCEPTED
- Why it matters: ePrivacy Directive requires prior consent for non-essential cookies
- Status: ACCEPTED

### Finding ID: PRIV-P2-004 - No data retention or PII cleanup

- Severity: P2
- Confidence: Medium
- Area: Data retention
- Evidence: No cron job or cleanup mechanism for stale PII in public_interactions, audit_logs, etc.
- What is happening: PII accumulates indefinitely with no automated deletion
- Recommended fix: Add worker task to delete audit_logs > 12 months, public_interactions > 24 months, old password reset tokens
- Effort estimate: Small (2 days)
- Status: Open

### Finding ID: PRIV-P3-001 - No data classification documentation

- Severity: P3
- Confidence: Medium
- Area: Data classification
- Evidence: No doc classifying PII vs non-PII fields across the database
- What is happening: No formal understanding of which fields contain sensitive data
- Recommended fix: Create data classification matrix document
- Effort estimate: Small (1 day)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| GDPR/CCPA non-compliance | P2 | Medium | High | No privacy policy, no export, no deletion | Add missing features |
| ePrivacy violation | — (Accepted) | Low | Low | Unconditional GA/Tawk.to | ACCEPTED per COOKIE_CONSENT.md |
| Data accumulation | P2 | Medium | Low | No retention schedule | Add cleanup cron |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Create `/privacy` page with standard privacy policy sections (PRIV-P2-001)

### This Month

1. Add data export endpoint (PRIV-P2-002)
2. Add data deletion endpoint
3. Add PII cleanup worker task with configurable retention periods (PRIV-P2-004)

### Later / Platform Evolution

1. None — banner-less design accepted per COOKIE_CONSENT.md
2. Conduct formal Data Protection Impact Assessment (DPIA)

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Create privacy page | Legal compliance, user trust | `apps/web/app/(public)/privacy/page.tsx` | Content review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| Privacy policy page | P2 | UI engineer | 2 days | Legal review |
| Data export endpoint | P2 | Backend engineer | 3 days | None |
| Data deletion endpoint | P2 | Backend engineer | 3 days | None |
| PII cleanup worker | P2 | Full-stack | 2 days | None |
| Consent record storage | — (Accepted) | — | — | — |
| Data classification doc | P3 | Security engineer | 1 day | None |

## Suggested Tests

- **E2E:** Visit public page → verify GA not loaded when env var absent
- **API:** Call export endpoint → verify response contains all user data
- **API:** Call delete endpoint → verify user is anonymized/deleted

## Suggested Documentation Updates

- Create `docs/PRIVACY_COMPLIANCE.md` tracking GDPR/CCPA status
- Create `docs/DATA_CLASSIFICATION.md` with field-level classification
- Update `docs/INDEX.md` with new privacy docs

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Does MCT process EU or California user data? | Determines legal obligations | Business intelligence |
| Is there a Data Processing Agreement with Supabase? | GDPR Article 28 compliance | Legal review |
| What is the intended jurisdiction? | Determines applicable law | Product decision |

## Appendix

### Data Flow Summary

| Flow | PII captured | Storage location | Retention |
|------|-------------|-----------------|-----------|
| User registration | Email, name, phone | `profiles` table (Supabase) | Indefinite |
| Contact form | Name, email, phone, message | `public_interactions` table (Supabase) | Indefinite (no cleanup) |
| Audit logging | user_id, IP, action | `audit_logs` table (Supabase) | Indefinite (no cleanup) |
| GA tracking | Page views, behavior | Google Analytics servers | Per GA policy |
| Tawk.to chat | Chat messages, email | Tawk.to servers | Per Tawk.to policy |
