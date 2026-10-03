# Privacy, Compliance, and Data Governance Audit — Verification Run

## Audit Metadata

- **Run ID:** 20260729-0025-develop-bc76370
- **Previous Run:** 20260728-0142-develop-21a10d6
- **Finding Area Code:** PRIV
- **18 commits between runs** — key remediation commits affecting privacy:
  - 34a4d65 — Add privacy/terms pages
  - 879c058 — Add Turnstile CAPTCHA to contact form
  - dfb5ef8 — Resolve critical audit findings (P0/P1)

## Executive Summary

**Previous Score: 4.25/10** → **Current Score: 6.25/10** (+2.0)

Three critical findings resolved (privacy policy, terms of service, contact form consent + CAPTCHA). Three critical findings remain open (cookie consent banner, user deletion endpoint, data portability endpoint).

## Finding Resolution Status

| ID               | Description                            | Previous Severity | Status         | Evidence                                                                                                                                                                                         |
| ---------------- | -------------------------------------- | ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PRIV-008/020/021 | GA/Tawk.to load without cookie consent | HIGH              | **STILL OPEN** | (public)/layout.tsx lines 57-75: GA4 and Tawk.to scripts load via strategy="afterInteractive" with no consent gate. No CookieConsent component found anywhere in the codebase.                   |
| PRIV-009         | No Privacy Policy page                 | HIGH              | **RESOLVED**   | pps/web/app/(public)/privacy/page.tsx created — comprehensive 147-line policy covering data collection, usage, third-party sharing, retention, GDPR/CCPA rights, and contact info.               |
| PRIV-015         | No user account deletion endpoint      | HIGH              | **STILL OPEN** | No DELETE /api/v1/account or similar endpoint found. No grep match for user-account-level deletion routes.                                                                                       |
| PRIV-016         | No data portability endpoint           | HIGH              | **STILL OPEN** | No GET /api/v1/account/export or data export endpoint found.                                                                                                                                     |
| PRIV-018         | Contact form missing consent + CAPTCHA | HIGH              | **RESOLVED**   | ContactForm.tsx now has consent checkbox (line 240-254), privacy policy link (/privacy), Cloudflare Turnstile CAPTCHA integration. Submit disabled until both consent and CAPTCHA are satisfied. |
| PRIV-004         | Audit CSV export raw JSONB             | MEDIUM            | **STILL OPEN** | No change detected. Audit export still sends raw metadata JSONB.                                                                                                                                 |
| PRIV-012         | Retention policy limited               | MEDIUM            | **STILL OPEN** | Retention task covers only audit_logs (365d) and notifications (90d).                                                                                                                            |
| PRIV-017         | No soft-delete patterns                | MEDIUM            | **STILL OPEN** | All deletes are hard deletes. No deleted_at columns or soft-delete logic found.                                                                                                                  |
| PRIV-022         | Lead data shared without notification  | MEDIUM            | **RESOLVED**   | Privacy policy now explicitly discloses Teams, JSM, and ip-api.com data sharing.                                                                                                                 |
| PRIV-023         | IP geolocation without consent         | MEDIUM            | **RESOLVED**   | Privacy policy discloses ip-api.com usage. Contact form has consent checkbox.                                                                                                                    |

## New Findings

### PRIV-NEW-001: Privacy Policy Exists But No Cookie Consent Mechanism

**Severity:** HIGH
**Evidence:** Privacy policy (line 104-108) states users have GDPR/CCPA rights to refuse cookies, but no technical mechanism exists to implement those choices. GA4 and Tawk.to load immediately without any consent gate.
**Recommendation:** Implement a cookie consent banner that blocks GA4/Tawk.to scripts until user opts in. Add GA4 IP anonymization.

### PRIV-NEW-002: Privacy Policy Lists Data Rights But No API to Exercise Them

**Severity:** MEDIUM
**Evidence:** Privacy policy lines 100-109 list rights (access, correct, delete, port) but only provides email contact. No automated API or portal UI exists.
**Recommendation:** Create account deletion and data export features, even as manual-process pages initially.

## Score Breakdown

| Dimension               | Previous    | Current     | Notes                                |
| ----------------------- | ----------- | ----------- | ------------------------------------ |
| Cookie consent          | 0/10        | 0/10        | No banner                            |
| Privacy policy          | 0/10        | 10/10       | ✅ Complete                          |
| Terms of service        | 0/10        | 10/10       | ✅ Complete                          |
| Deletion endpoint       | 2/10        | 2/10        | No API                               |
| Portability             | 2/10        | 2/10        | No API                               |
| Contact form consent    | 2/10        | 10/10       | ✅ CAPTCHA + consent                 |
| Data sharing disclosure | 4/10        | 8/10        | ✅ Policy now covers all 3rd parties |
| Retention               | 5/10        | 5/10        | Still limited                        |
| Soft-delete             | 2/10        | 2/10        | Still hard deletes                   |
| **Overall**             | **4.25/10** | **6.25/10** | **+2.0**                             |

## Priority Recommendations

1. **Cookie consent banner** — blocking GA4/Tawk.to until opted in (P0, 1-2 days)
2. **User account deletion endpoint** — DELETE /api/v1/account (P1, 1 day)
3. **Data portability endpoint** — GET /api/v1/account/export (P1, 1 day)
4. **Soft-delete for organizations/documents/projects** — add deleted_at columns (P2, 2 days)
5. **Audit CSV export redaction** — filter metadata JSONB for PII (P2, 1 day)

---

_Report generated for run 20260729-0025-develop-bc76370. Cross-referenced against previous run 20260728-0142-develop-21a10d6._
