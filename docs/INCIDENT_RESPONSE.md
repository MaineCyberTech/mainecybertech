# Incident Response Plan — MCT Platform

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-11 · **Review cadence:** quarterly

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

Role assignments (primary, backup, contact channel, escalation) are recorded in
the on-call rota — fill [`templates/ONCALL_ROTA.md`](templates/ONCALL_ROTA.md)
and commit the completed table into §8 before go-live. Until then the plan is
**not operational** (`IR-P2-008`).

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
  [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) §Emergency Rotation), then
  isolate. Prefer revocation over
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

- Write a blameless postmortem using
  [`templates/POSTMORTEM.md`](templates/POSTMORTEM.md): timeline, root cause,
  contributing factors, what detection missed, and **dated** action items with
  owners.
- File findings into the risk register with the same `AREA-Px-NNN` convention
  used by audits.
- Update this plan, the runbooks, or the alerting rules when the postmortem
  shows a gap. An incident that produces no doc/config change is not closed.

## 5. Communication

| Audience | Channel | When |
|---|---|---|
| Internal | Incident channel | Continuous during response |
| Affected tenants | Status topic `portal-status` + email | Sev-1 within 60 min of confirmation; updates hourly |
| All tenants | Status topic `portal-status` | When impact is platform-wide |
| Regulators / data subjects | Per `docs/DATA_BREACH_RESPONSE.md` | Only with Legal's decision |

The status surface (subscriber instructions, publishing commands, cadence) is
[`STATUS_AND_COMMUNICATION.md`](STATUS_AND_COMMUNICATION.md); message templates
are in [`templates/INCIDENT_COMMS.md`](templates/INCIDENT_COMMS.md).

Never speculate about cause or data exposure externally. State what is known,
what is not, and when the next update comes. For suspected personal-data
breaches, external wording is Legal-gated — do not post until the Security lead
and Legal have made the notification decision
([`DATA_BREACH_RESPONSE.md`](DATA_BREACH_RESPONSE.md) §7).

## 6. Evidence handling

- Preserve logs and database snapshots before remediation where safe. Rotating
  a key does not require deleting the audit trail.
- Keep a single canonical timeline; the scribe owns it.
- Do not paste secret values into the channel, the postmortem, or the log —
  reference the secret's name and location only (see
  [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md)).

## 7. Common playbooks

| Scenario | First action | Document |
|---|---|---|
| Bad deploy | Rollback workflow | `docs/ROLLBACK_PROCEDURES.md` |
| Database corruption/loss | Freeze writes, then restore | `docs/ROLLBACK_PROCEDURES.md` §3, `docs/RTO_RPO.md` |
| Key/token leak | Revoke, then rotate consumers | `docs/SECRETS_ROTATION.md` §Emergency Rotation |
| Suspected tenant data exposure | Contain, then breach decision | `docs/DATA_BREACH_RESPONSE.md` |
| Full monitoring loss | Verify via the alert path / off-box heartbeat (external heartbeat not yet provisioned) | `docs/MONITORING_AND_ALERTING.md` §9, `docs/ALERT_PATH_EXERCISE.md` |
| RLS/tenant isolation regression | Disable affected module writes, patch policy | `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md` |
| Platform outage comms | Post to the status topic | `docs/STATUS_AND_COMMUNICATION.md` |

## 8. On-call rota and current gaps

- **Rota:** fill [`templates/ONCALL_ROTA.md`](templates/ONCALL_ROTA.md) and
  commit the completed table here — primary, backup, and contact channel per
  role, even if one person holds several roles. **The plan is not operational
  until this is filled** (`IR-P2-008`).
- **Known gap (audit `IR-P0-003`, partially fixed):** Alertmanager **is deployed**
  and delivers `critical`/`default` Prometheus alerts to the org ntfy topic
  (`https://ntfy.mainecybertech.us/portal-alerts`). The independent dead-man's
  switch is wired in configuration, but its external heartbeat URL
  (`ALERTMANAGER_WATCHDOG_WEBHOOK_URL`) is **still unset**, so a total loss of
  this droplet is not yet detected off-box (prod deploys fail closed until the
  URL is provisioned). Provision the external heartbeat and record the
  documented stop-Alertmanager drill (`docs/MONITORING_AND_ALERTING.md` §9).
  Sentry notifications still live inside the monitored path. Track the residual
  as a P1 in the risk register.

## 9. Testing

- Exercise one scenario per quarter using
  [`INCIDENT_TABLETOP_SCENARIOS.md`](INCIDENT_TABLETOP_SCENARIOS.md); record
  participants, gaps found, and action items. The first recorded exercise is the
  IR-011 desk dry-run in
  [`INCIDENT_TABLETOP_DRYRUN_2026-10-11.md`](INCIDENT_TABLETOP_DRYRUN_2026-10-11.md);
  the live missed-heartbeat drill is still operator-gated (`IR-P0-003`).
- Exercise the restore path on the cadence in
  [`RTO_RPO.md`](RTO_RPO.md) §Validating RPO/RTO and keep the green
  `db-restore-test` run artifact as evidence. The 5-minute PITR RPO needs a
  dated exercise before it is claimed as achieved.
