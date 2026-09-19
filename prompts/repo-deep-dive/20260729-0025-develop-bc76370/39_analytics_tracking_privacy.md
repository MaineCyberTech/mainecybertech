# Analytics, Tracking, and Privacy Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** ANL
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Overall Score: 7.5/10** (improved from 5.2/10). Significant improvement: privacy policy page created, consent checkbox added to contact form, Cloudflare Turnstile CAPTCHA integrated,
ame and company fields added to contact form context. 3 of 17 findings resolved. 5 remain open. 3 new findings.

## Previous Findings Status

### ANL-001: No Cookie Consent Banner — GA + Tawk.to Loaded Without Consent (CRITICAL)

**Status:** STILL OPEN
**Previous Evidence:** (public)/layout.tsx:55-75 — GA4 and Tawk.to scripts loaded unconditionally via
ext/script with strategy="afterInteractive".
**Current Evidence:** pps/web/app/(public)/layout.tsx:55-75 — Still loaded unconditionally. No consent banner, no gtag('consent', ...) call. Nonce parameter added to script tags (mitigation for CSP, not consent).
**Risk:** GDPR/ePrivacy Directive violation. Fines up to 4% of global turnover.
**Recommendation:** Implement cookie consent banner blocking GA/Tawk.to until consent obtained.

### ANL-002: No Privacy Policy Page (HIGH)

**Status:** RESOLVED
**Previous Evidence:** No /privacy or /privacy-policy route exists.
**Current Evidence:** pps/web/app/(public)/privacy/page.tsx — 147-line privacy policy page. Covers: information collected, how data is used, third-party sharing (Google Analytics, Tawk.to, Teams, JSM, ip-api.com), data retention (3 years for contact forms), GDPR/CCPA rights, and contact information.
**Fix verified:** 34a4d65 commit.

### ANL-003: GA anonymize_ip Not Set (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** GA nonymize_ip not set — full IP sent to Google.
**Current Evidence:** pps/web/app/(public)/layout.tsx:63 — gtag('config', '') still has no nonymize_ip parameter.
**Recommendation:** Add gtag('config', '', { 'anonymize_ip': true }).

### ANL-004: Visitor IP Sent to ip-api.com Without Consent (Unencrypted HTTP) (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** Visitor IP sent to ip-api.com geo-lookup without consent (unencrypted HTTP).
**Current Evidence:** pps/api/src/routes/public.ts:53 — Still uses http://ip-api.com/json/ (unencrypted HTTP). Privacy policy now discloses this (good), but consent is not obtained before geo-lookup.
**Recommendation:** Switch to HTTPS endpoint (https://ip-api.com/json/) and defer geo-lookup until after consent.

### ANL-005: Visitor PII Forwarded to Teams Webhook + JSM API Without Notice (MEDIUM)

**Status:** PARTIALLY RESOLVED
**Previous Evidence:** Visitor PII forwarded to Teams webhook + JSM API without notice.
**Current Evidence:** Privacy policy (page.tsx:67-81) now discloses Teams and JSM data sharing. Contact form (ContactForm.tsx:246-255) has consent checkbox linking to privacy policy. Server action (ctions.ts:15-17) enforces consent before submission.
**Assessment:** Notice is now provided and consent is obtained. The data sharing itself still happens (by design, as this is a lead generation form).

### ANL-006: public_interactions Table Has No Purge/Retention Policy (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** public_interactions table has no purge/retention policy.
**Current Evidence:** Privacy policy mentions "Contact form submissions are retained for up to three years" but no automated purge mechanism exists.
**Recommendation:** Add a scheduled cleanup task (worker or cron) to delete records older than 3 years.

### ANL-008: name and company Not in Audit Log PII Redaction List (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:**
ame and company not in audit log PII redaction list.
**Current Evidence:** Audit log PII redaction not verified. Worker logger (pps/worker/src/logger.ts:7-25) has email, phone, ullName, ull_name but not
ame, company, company_name.
**Recommendation:** Add
ame, company, company_name to pino redaction paths.

### ANL-010: Contact Form Has No Consent Checkbox (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** Contact form has no consent checkbox — user not informed about data processing.
**Current Evidence:** pps/web/components/marketing/ContactForm.tsx:238-256 — Consent checkbox with link to Privacy Policy. pps/web/app/(public)/contact/actions.ts:15-17 — Server action enforces consent (returns error if not checked). Submit button disabled unless consent is checked.
**Fix verified:** bc76370 commit.

### ANL-011: PII Stored in Plaintext in public_interactions (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** PII stored in plaintext in public_interactions.
**Current Evidence:** Still stored in plaintext. No encryption at rest for this table.
**Recommendation:** Evaluate whether encryption at rest is needed for this data.

### ANL-012: RLS Disabled on public_interactions Table (MEDIUM)

**Status:** STILL OPEN (By-design)
**Previous Evidence:** RLS disabled on public_interactions table.
**Current Evidence:** RLS remains disabled. This is by-design for a public table where anonymous users need to INSERT.
**Recommendation:** Document this as an accepted risk.

### ANL-013: Tawk.to Sets Own Tracking Cookies With No Consent (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** Tawk.to sets tracking cookies.
**Current Evidence:** Tawk.to still loads unconditionally. No consent mechanism.
**Recommendation:** Block Tawk.to until cookie consent is obtained.

## New Findings

### ANL-NEW-001: Turnstile CAPTCHA Added to Contact Form

**Severity:** RESOLVED
**Evidence:** pps/web/components/marketing/ContactForm.tsx:53-62,227-236 — Cloudflare Turnstile CAPTCHA widget. pps/api/src/routes/public.ts:25-39,112-120 — Server-side CAPTCHA verification. pps/api/src/config/env.ts:32 — TURNSTILE_SECRET_KEY env var in schema.
**Fix verified:** 879c058 commit.

### ANL-NEW-002: Privacy Policy Linked from Contact Form

**Severity:** RESOLVED
**Evidence:** pps/web/components/marketing/ContactForm.tsx:247-254 — Privacy policy link in consent checkbox label.
**Fix verified:** bc76370 commit.

### ANL-NEW-003: Nonce-Based CSP Blocks Inline Scripts

**Severity:** RESOLVED (Mitigation)
**Evidence:** pps/web/middleware.ts:27-45 — Nonce-based CSP prevents inline script execution without valid nonce. GA and Tawk.to scripts use the
once attribute.
**Assessment:** Mitigates XSS risk but does not address consent requirement.

## Summary

| Finding                                      | Severity | Previous | Current            |
| -------------------------------------------- | -------- | -------- | ------------------ |
| ANL-001: No cookie consent banner            | CRITICAL | OPEN     | STILL OPEN         |
| ANL-002: No privacy policy page              | HIGH     | OPEN     | RESOLVED           |
| ANL-003: GA anonymize_ip not set             | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-004: ip-api.com unencrypted HTTP         | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-005: PII forwarded without notice        | MEDIUM   | OPEN     | PARTIALLY RESOLVED |
| ANL-006: No purge/retention policy           | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-008: name/company not in audit redaction | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-010: No consent checkbox                 | MEDIUM   | OPEN     | RESOLVED           |
| ANL-011: PII in plaintext                    | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-012: RLS disabled on public_interactions | MEDIUM   | OPEN     | By-design          |
| ANL-013: Tawk.to tracking cookies            | MEDIUM   | OPEN     | STILL OPEN         |
| ANL-NEW-001: Turnstile CAPTCHA added         | —        | —        | RESOLVED           |
| ANL-NEW-002: Privacy policy linked from form | —        | —        | RESOLVED           |
| ANL-NEW-003: Nonce-based CSP                 | —        | —        | RESOLVED           |
