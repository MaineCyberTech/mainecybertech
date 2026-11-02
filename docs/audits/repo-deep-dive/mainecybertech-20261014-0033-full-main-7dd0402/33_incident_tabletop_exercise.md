# 33_incident_tabletop_exercise — Prompt 33 - Incident Tabletop Exercise

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `33_incident_tabletop_exercise.md` (area IR, prompt)

## Verification Performed

Domain subagent produced 24 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process |
| IR-P0-002 | P0 | No data breach response / notification process |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions |
| IR-P2-001 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis |
| IR-P2-002 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse |
| IR-P2-003 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts |
| IR-P2-004 | P2 | Secrets rotation is documented but has no exercised evidence |
| IR-P2-005 | P2 | No platform status/communication surface for MCT's own outages |
| IR-P2-006 | P2 | Migration dry-run result is discarded in CI |
| IR-P2-007 | P2 | Platform IR and breach plans are stale on the deployed alerting path and reference template files that do not exist in docs/ |
| IR-P2-008 | P2 | On-call rota and escalation contacts are unassigned, so the incident plan is not operational |
| IR-P2-009 | P2 | No tabletop exercise has been run and the scenario catalog is stale |
| IR-P2-010 | P2 | Prometheus alert-rule unit tests are not wired into CI |
| IR-P3-001 | P3 | Terraform state restore guidance lacks a tested procedure |
| IR-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts |
| IR-P3-003 | P3 | Monitoring doc still reports wired metrics as 'defined, not wired' and omits the alert rules added for impersonation and RLS |
| IR-P3-004 | P3 | Alerting secrets are not documented in the secrets matrix or environment-variable reference |
| IR-P3-005 | P3 | Incident plan's first triage step points responders at a URL that currently 404s |
