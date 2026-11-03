# 39_analytics_tracking_privacy — Prompt 39 - Analytics, Tracking, and Privacy Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `39_analytics_tracking_privacy.md` (area AN, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5. 10/11 previous AN findings are verified fixed, 1 partially fixed (AN-P3-006), 0 regressed. AN-P3-005 closed: consent withdrawal now hides and shuts down the Tawk.to widget immediately (the executed script tag still unloads only on reload, documented). AN-P3-006 only partially closed: event names are now allowlisted and metadata is bounded/key-filtered, but metadata values are not pattern-scanned and keys are not restricted per event, so PII can still be parked under a harmless-looking key. Two new P3s: the store-analytics purge is the only target that bypasses the retention_policies registry (AN-P3-007), and ANALYTICS_GOVERNANCE.md still describes the pre-fix Tawk.to behaviour (AN-P3-008). Executed: read the consent components, public tracking routes, analytics registry/sanitizer, retention task/policy code and the storefront callers.

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
| AN-P3-007 | P3 | store_analytics_events is the only purge target that ignores the retention_policies registry |
| AN-P3-008 | P3 | Analytics governance doc still says Tawk.to stops only on the next page load |
