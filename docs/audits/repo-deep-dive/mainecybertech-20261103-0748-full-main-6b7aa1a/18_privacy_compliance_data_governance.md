# 18_privacy_compliance_data_governance — Prompt 18 - Privacy, Compliance, and Data Governance Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `18_privacy_compliance_data_governance.md` (area PRIV, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5. 12/12 previous PRIV findings are verified fixed, 0 partially fixed, 0 regressed. The two open items closed: public store quote/lead PII now has a bounded 90-day purge with registry-resolved windows (PRIV-P2-008) and PRIVACY.md's known-gaps section now matches the retention schedule (PRIV-P3-004). Two new P2 findings: PRIV-P2-009 (the new purge does not cover store_proposal_drafts, which retains the submitter's name and free-text notes indefinitely and is omitted from the DSAR runbook) and PRIV-P2-010 (anon still holds INSERT on store_quotes, so a direct PostgREST write can create quote PII with consent_at NULL, bypassing the API consent gate). Executed: read consent providers/routes, retention tasks + policy aliases, DSAR runbook, privacy docs and the store quote/proposal paths; checked migration chain 5302105/5302132/5302434/5302448/5302449.

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
| PRIV-P2-009 | P2 | Quote purge and DSAR erasure leave quote PII in store_proposal_drafts.sections |
| PRIV-P2-010 | P2 | Direct anon INSERT on store_quotes bypasses the consent gate, validation and rate limits |
