# Incident Response Plan — MCT Platform

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-02 · **Review cadence:** quarterly

This is the *platform* incident response plan for the MCT Portal stack
(api, web, worker, Supabase, DigitalOcean infrastructure). It is distinct from
the tenant-facing incident-response *product feature*
(`docs/modules/incident-response.md`) and from the customer-facing guidance in
`SECURITY.md`.

> Audit reference: created in response to `IR-P0-001` (no platform incident
> response plan) from run `20261002-0344-develop-6286137`.

## 1. Scope and definitions

| Term | Meaning here |
|---|---|
| Incident | Any unplanned event degrading availability, confidentiality, or integrity of the platform or tenant data |
| Sev-1 | Full outage, data loss/exposure, or a security compromise affecting tenants |
| Sev-2 | Major feature degraded, single-tenant outage, or a security issue with no confirmed exposure |
| Sev-3 | Minor degradation, no material tenant impact |

Related documents: `docs/MONITORING_AND_ALERTING.md` (detection),
`docs/ROLLBACK_PROCEDURES.md` (recovery), `docs/DATA_BREACH_RESPONSE.md`
(privacy incidents), `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` (operations).

## 2. Roles

MCT is a small team; one person may hold several roles, but each must be
*assigned by name* in the current on-call rota (see §8).

| Role | Responsibility |
|---|---|
| Incident Commander (IC) | Declares severity, owns the timeline, makes the call on rollback/restore |
| Communications lead | Owns tenant and status-page comms; single source of external truth |
| Operations lead | Executes rollback, restore, key rotation, infrastructure changes |
| Scribe | Maintains the incident log (times, actions, evidence, decisions) |
| Security lead | Leads containment/forensics for suspected compromise; owns the breach decision with Legal |

## 3. Declaring an incident

1. Anyone may declare. **When in doubt, declare** — false alarms are cheap.
2. Open an incident channel and appoint an IC.
3. Record start time, observed symptom, and the first evidence (dashboard,
   alert, log excerpt) in the incident log.
4. Assign a severity using §1 and tell the Communications lead.

## 4. Response phases

### 4.1 Detect and triage (first 15 minutes)

- Confirm the signal is real: check `https://api.mainecybertech.com/health`,
  worker health, and the Prometheus/Sentry alerts listed in
  `docs/MONITORING_AND_ALERTING.md`.
- Determine blast radius: single tenant, all tenants, or platform-wide.
- Classify: availability, data integrity, or security/confidentiality.
- If security/confidentiality is *possible*, invoke
  `docs/DATA_BREACH_RESPONSE.md` immediately — do not wait for confirmation.

### 4.2 Contain

- **Availability**: stop the bleeding before diagnosing. Roll back
  (`docs/ROLLBACK_PROCEDURES.md`) if the incident followed a deploy.
- **Data integrity**: stop writes to the affected tables/jobs before restoring,
  or the restore will be overwritten.
- **Security**: revoke the affected credentials first (see
  `secret_rotation_runbook.md`), then isolate. Prefer revocation over
  investigation-in-place — the audit trail survives revocation.

### 4.3 Eradicate and recover

- Recover using the documented path for the class:
  - Deploy regression → rollback workflow (`deploy-do` with `rollback_sha`).
  - Data loss → restore from the most recent verified backup; the restore-test
    baseline (`.github/restore-test-baseline.env`) defines "verified".
  - Credential compromise → rotate all downstream consumers, not just the
    leaked key.
- Re-verify health with the same signals used in §4.1 before declaring recovery.

### 4.4 Post-incident (within 5 business days)

- Write a blameless postmortem: timeline, root cause, contributing factors,
  what detection missed, and **dated** action items with owners.
- File findings into the risk register with the same `AREA-Px-NNN` convention
  used by audits.
- Update this plan, the runbooks, or the alerting rules when the postmortem
  shows a gap. An incident that produces no doc/config change is not closed.

## 5. Communication

| Audience | Channel | When |
|---|---|---|
| Internal | Incident channel | Continuous during response |
| Affected tenants | Status page / email | Sev-1 within 60 min of confirmation; updates hourly |
| All tenants | Status page | When impact is platform-wide |
| Regulators / data subjects | Per `docs/DATA_BREACH_RESPONSE.md` | Only with Legal's decision |

Never speculate about cause or data exposure externally. State what is known,
what is not, and when the next update comes.

## 6. Evidence handling

- Preserve logs and database snapshots before remediation where safe. Rotating
  a key does not require deleting the audit trail.
- Keep a single canonical timeline; the scribe owns it.
- Do not paste secret values into the channel, the postmortem, or the log —
  reference the secret's name and location only (see `secret_rotation_runbook.md`).

## 7. Common playbooks

| Scenario | First action | Document |
|---|---|---|
| Bad deploy | Rollback workflow | `docs/ROLLBACK_PROCEDURES.md` |
| Database corruption/loss | Freeze writes, then restore | `backup_restore_drill_plan.md` |
| Key/token leak | Revoke, then rotate consumers | `secret_rotation_runbook.md` |
| Suspected tenant data exposure | Contain, then breach decision | `docs/DATA_BREACH_RESPONSE.md` |
| Full monitoring loss | Verify from an off-box check | `docs/MONITORING_AND_ALERTING.md` §8 |
| RLS/tenant isolation regression | Disable affected module writes, patch policy | `docs/audits/.../37_*`, ADR-008 notes |

## 8. On-call rota and current gaps

- **Rota:** _to be filled by the Engineering lead — the plan is not operational
  until names and escalation contacts are recorded here._
- **Known gap (audit `IR-P0-003`):** there is no independent dead-man's switch.
  Alertmanager is referenced by `infra/digitalocean/prometheus.rules.yml` but
  not deployed, and Sentry notifications live inside the monitored path. Until
  that is fixed, a total monitoring failure is silent. Track the fix as a P1 in
  the risk register.

## 9. Testing

- Exercise one scenario per quarter using
  `incident_tabletop_scenarios.md`; record participants, gaps found, and
  action items.
- Exercise the restore path per `backup_restore_drill_plan.md` on the cadence
  it defines, and keep the green run artifact as evidence.
