# Analytics, Tracking, and Privacy Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** ANL

## Executive Summary

**Overall Score: 5.2/10.** Strong foundations: hardened session cookies, comprehensive pino PII redaction, nonce-based CSP, audit logging with PII redaction, clean Prometheus metrics. **Three critical gaps:** no cookie consent mechanism, no privacy policy, no data retention policy.

**17 findings** (1 Critical, 1 High, 11 Medium, 4 Low)

## Critical Finding

### ANL-001: No Cookie Consent Banner — GA + Tawk.to Loaded Without Consent

**Severity:** CRITICAL
**Evidence:** `(public)/layout.tsx:55-75` — GA4 and Tawk.to scripts loaded unconditionally via `next/script` with `strategy="afterInteractive"`. No consent banner, no `gtag('consent', ...)` call.
**Risk:** GDPR/ePrivacy Directive violation. Fines up to 4% of global turnover.
**Recommendation:** Implement cookie consent banner blocking GA/Tawk.to until consent obtained.

## High Finding

### ANL-002: No Privacy Policy Page

**Severity:** HIGH
**Evidence:** No `/privacy` or `/privacy-policy` route exists. Contact form has no privacy notice.
**Recommendation:** Create privacy policy page covering data collected, third-party sharing, user rights.

## Medium Findings

- **ANL-003:** GA `anonymize_ip` not set — full IP sent to Google
- **ANL-004:** Visitor IP sent to ip-api.com geo-lookup without consent (unencrypted HTTP)
- **ANL-005:** Visitor PII forwarded to Teams webhook + JSM API without notice
- **ANL-006:** `public_interactions` table has no purge/retention policy
- **ANL-008:** `name` and `company` not in audit log PII redaction list
- **ANL-010:** Contact form has no consent checkbox — user not informed about data processing
- **ANL-011:** PII stored in plaintext in `public_interactions`
- **ANL-012:** RLS disabled on `public_interactions` table
- **ANL-013:** Tawk.to sets own tracking cookies with no consent

## Good Practices

- `mct_session` cookie: HttpOnly, Secure, SameSite=Lax
- Pino logger with 15+ redacted paths
- Nonce-based CSP blocks inline scripts
- Prometheus metrics contain no PII
- Audit logging with PII redaction (partial)

## Quick Wins

1. Enable GA `anonymize_ip: true` — 5 min
2. Add `name`/`company` to audit redaction list — 5 min
3. Add `ip_address` to pino redaction paths — 5 min
4. Add privacy notice to contact form — 1 hour
5. Implement cookie consent banner — 4 hours
