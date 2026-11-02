# 18_privacy_compliance_data_governance — Prompt 18 - Privacy, Compliance, and Data Governance Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `18_privacy_compliance_data_governance.md` (area PRIV, prompt)

## Verification Performed

Domain subagent produced 12 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| PRIV-P2-001 | P2 | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate |
| PRIV-P2-002 | P2 | Consent is captured only in the browser and never recorded or enforced server-side; the store quote form collects PII with no consent at all |
| PRIV-P2-003 | P2 | Published retention statement (three years) contradicts the 90-day contact-form PII purge |
| PRIV-P2-004 | P2 | Audit-log PII redaction is a shallow key-name filter; person names and job titles are persisted for 365 days |
| PRIV-P2-005 | P2 | No data-subject access/export/erasure path or DSAR runbook; offboarding never removes profile or auth records |
| PRIV-P2-006 | P2 | Visitor IP addresses are sent to ip-api.com over plaintext HTTP for geolocation |
| PRIV-P2-007 | P2 | Privacy governance documentation set is missing and the published vendor list omits processors used in code |
| PRIV-P3-001 | P3 | Breach-response and IR plans still claim Alertmanager is not deployed and IR-P0-003 is open |
| PRIV-P3-002 | P3 | DATA_BREACH_RESPONSE claims audit_logs records source IP/user-agent; no runtime writer populates them |
| PRIV-P3-003 | P3 | public-interaction-retention performs an unbounded single-statement delete and is not covered by the DATA-P1-002 batching fix |
| PRIV-P2-008 | P2 | Public store quote/lead PII has no automated retention or purge path and is excluded from the published retention statement |
| PRIV-P3-004 | P3 | PRIVACY.md known-gaps section contradicts its own retention schedule (claims store_analytics_events has no purge) |
