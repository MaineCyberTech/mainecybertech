# Postmortem — `<title>` (Sev-`<n>`)

> Blameless postmortem template required by
> [`INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md) §4.4 (platform incidents) and
> [`DATA_BREACH_RESPONSE.md`](../DATA_BREACH_RESPONSE.md) §10 (breach incidents).
> Complete within **5 business days** of closing the incident. An incident that
> produces no doc/config change is not closed.

- **Date / duration:** `<YYYY-MM-DD>` / `<HH:MM>–<HH:MM> UTC`
- **Incident Commander / authors:** `<names>`
- **Status:** draft | reviewed
- **Audit/register links:** `<AREA-Px-NNN / BREACH-YYYY-NNN / issue>`

## Summary

`<2–3 sentences: what broke, for how long, and for whom.>`

## Impact

`<Users, tenants, services, data; duration; RTO/RPO targets met or missed
(docs/RTO_RPO.md); whether any personal data was involved (if yes, this is a
breach-plan postmortem — DATA_BREACH_RESPONSE.md §10).>`

## Timeline (UTC)

| Time | Event |
|---|---|
| `<HH:MM>` | `<first signal / alert / report>` |
| `<HH:MM>` | `<declared, IC appointed>` |
| `<HH:MM>` | `<containment action>` |
| `<HH:MM>` | `<recovery completed>` |

## Detection

`<What alerted, through which channel (MCTServiceDown, Sentry, tenant report,
…); how long the gap was; whether the off-box dead-man's switch or an unalerted
signal (audit-gap, RLS, dead-letter) should have caught it sooner.>`

## Root cause

`<Technical cause + contributing factors; link the offending PR/migration/run.>`

## Resolution / recovery

`<Steps actually taken, including exact rollback/restore commands and the
verification that ended the incident.>`

## What went well / what went badly

- Well: `<...>`
- Badly: `<...>`

## Action items

| Action | Owner | Due | Tracking |
|---|---|---|---|
| `<fix>` | `<owner-name>` | `<date>` | `<issue / AREA-Px-NNN>` |

## Regression guard

`<Test, alert rule, runbook, or doc change added so this cannot recur silently.
If none is possible, say so and record the accepted risk.>`
