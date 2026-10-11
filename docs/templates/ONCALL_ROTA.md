# On-Call Rota & Escalation Template

**Owner (to assign):** `<platform-lead-name>` · **Last reviewed:** `<date>` · **Review cadence:** quarterly

This is the fill-in template for the on-call rota required by
[`INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md) §8 and
[`DATA_BREACH_RESPONSE.md`](../DATA_BREACH_RESPONSE.md) §7.1. The incident plan
declares itself **not operational** until every role below has a named primary,
a named backup, and a contact channel (`IR-P2-008`).

> **Owner action (`NEEDS-HUMAN`):** copy the completed table into
> `docs/INCIDENT_RESPONSE.md` §8 (replacing the "to be filled" bullet), commit
> it, and bump the "Last reviewed" date on both plans. Do not leave the
> placeholders in a committed runbook — an unfilled rota is the gap this
> template exists to close.

## 1. Roles

MCT is a small team; one person may hold several roles, but every role needs a
**primary and a backup**, and the contact channel must be one that is monitored
outside business hours.

| Role | Primary | Backup | Contact channel | Escalation |
|---|---|---|---|---|
| Incident Commander (IC) | `<owner-name>` | `<backup-name>` | `<phone/ntfy/email>` | `<platform-lead-name>` |
| Communications lead | `<owner-name>` | `<backup-name>` | `<channel>` | `<platform-lead-name>` |
| Operations lead | `<owner-name>` | `<backup-name>` | `<channel>` | `<platform-lead-name>` |
| Scribe | `<owner-name>` | `<backup-name>` | `<channel>` | IC |
| Security lead | `<owner-name>` | `<backup-name>` | `<channel>` | `<cto-name>` |
| Legal / DPO liaison | `<owner-name>` | `<backup-name>` | `<channel>` | External counsel: `<firm + contact>` |

## 2. Escalation path

1. **Primary on-call** for the affected role — acknowledge within `<N>` minutes
   (`portal-alerts` ntfy topic + `<channel>`).
2. **Backup on-call** — if the primary does not acknowledge within `<N>` minutes.
3. **Platform/Engineering lead** `<owner-name>` — owns staffing, provider
   escalation, and budget decisions (droplet resize, plan changes).
4. **Security lead** `<owner-name>` — the moment compromise is *possible*; invoke
   [`DATA_BREACH_RESPONSE.md`](../DATA_BREACH_RESPONSE.md) immediately, do not
   wait for confirmation.
5. **External**: `<legal counsel>`, `<insurance contact>`, `<Supabase support
   plan>`, `<DigitalOcean support plan>`.

## 3. Rotation mechanics

- **Cadence:** `<weekly|biweekly|monthly>`; handover `<day/time + timezone>`.
- **Alerting:** internal alerts arrive on the ntfy `portal-alerts` topic
  ([`MONITORING_AND_ALERTING.md`](../MONITORING_AND_ALERTING.md) §9); the
  off-box dead-man's-switch receiver is not yet provisioned, so a total loss of
  the droplet currently has no automated page (`IR-P0-003`).
- **Customer comms:** the Communications lead publishes to the platform status
  topic ([`STATUS_AND_COMMUNICATION.md`](../STATUS_AND_COMMUNICATION.md)).
- **Holidays/absences:** swap primary/backup in writing in the incident channel
  and update this table before the swap takes effect.
- **Review:** quarterly, together with `INCIDENT_RESPONSE.md`; also review after
  every Sev-1 and every failed escalation test.

## 4. How to fill (owner: `<platform-lead-name>`)

1. Replace every `<...>` placeholder — no placeholder may survive a commit into
   `INCIDENT_RESPONSE.md`.
2. Keep one row per role even if one person holds several (note the double-hat in
   the contact column).
3. Commit the change; bump "Last reviewed" in both plans.
4. Run one escalation test (page the primary, confirm the backup path works) and
   record it in [`PLATFORM_FAILURE_RUNBOOKS.md`](../PLATFORM_FAILURE_RUNBOOKS.md) §5.
