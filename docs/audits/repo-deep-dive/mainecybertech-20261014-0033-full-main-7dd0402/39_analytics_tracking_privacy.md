# 39_analytics_tracking_privacy — Prompt 39 - Analytics, Tracking, and Privacy Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `39_analytics_tracking_privacy.md` (area AN, prompt)

## Verification Performed

Domain subagent produced 11 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| AN-P2-001 | P2 | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate |
| AN-P2-002 | P2 | Analytics API stores visitor IP and user-agent in plaintext despite the documented no-PII contract |
| AN-P2-003 | P2 | Storefront analytics capture is dead: the browser helper is never called and cannot pass the CSRF gate |
| AN-P2-004 | P2 | First-party analytics events have no retention or purge path |
| AN-P2-005 | P2 | Visitor-alert tracking collects IP/geo before consent and sends the visitor IP to ip-api.com over plaintext HTTP |
| AN-P3-001 | P3 | Analytics has no consent-mode signalling and no documented event/retention governance |
| AN-P3-002 | P3 | Anonymous direct inserts to store_analytics_events bypass API validation, rate limits, and retention |
| AN-P3-003 | P3 | Consent is not recorded and the privacy policy omits first-party tracking stores and opt-out mechanics |
| AN-P3-004 | P3 | Error telemetry has no explicit PII scrubbing, retention, or vendor disclosure |
| AN-P3-005 | P3 | Consent withdrawal does not unload Tawk.to; the widget keeps running until the next page load |
| AN-P3-006 | P3 | Analytics track endpoint accepts arbitrary event names and unbounded metadata; the event registry's privacy rules are not enforced server-side |
