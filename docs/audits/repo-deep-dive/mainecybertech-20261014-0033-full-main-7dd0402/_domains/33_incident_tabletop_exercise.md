# Incident Tabletop Exercise (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: IR
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (23 IR findings)
- Scope limitations: no live tabletop was facilitated and no operator was interviewed; readiness is assessed from the committed plans, templates, catalogs, drill ledgers and read-only public probes.

## Scope

Re-verified all 23 previous IR findings at `main@7dd0402` against the current plans (incident response, breach response, status/comms, rollback, failure runbooks, tabletop catalog and dry-run, rota template, rotation log, drill ledger) and the alerting/observability surface they depend on.

## Executive Summary

The incident-response *documentation* program is essentially complete: both P0 plans (platform IR and data breach) are committed and current, the stale "Alertmanager not deployed" text is corrected, all referenced templates now exist under `docs/templates/`, a 12-scenario catalog including the total-monitoring-loss scenario is committed, the first recorded exercise is a desk dry-run of IR-011, and the rollback/migration/state-restore procedures are all reconciled. **15 of 23 previous findings are `verified-fixed`**.

The eight `partially-fixed` rows share one theme — **the plan is written, the human/operational half is not done**: the watchdog URL is still unset (IR-P0-003), the rota is unfilled (IR-P2-008), no live tabletop has been facilitated (IR-P2-009), the status topic's ACL is unverified (IR-P2-005), secrets rotation has only a desk dry-run (IR-P2-004), the bad-migration drill is unrun (IR-P1-002), audit-gap alerting is missing (IR-P2-002), and the breach plan still claims three now-alerted signals have no alert (IR-P2-007). No regressions.

One new P3: the incident plan's first triage instruction tells responders to check `https://api.mainecybertech.com/health`, which currently 404s (the same condition behind OBS-P2-017).

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| IR-P0-001 | P0 | No platform-level incident response plan, roles, or postmortem process | verified-fixed | `INCIDENT_RESPONSE.md` (roles :26-43, phases :55-100, comms :110-141) |
| IR-P0-002 | P0 | No data breach response / notification process | verified-fixed | `DATA_BREACH_RESPONSE.md` (full plan; detection sources :137-143) |
| IR-P0-003 | P0 | Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver | partially-fixed | URL unset (`INCIDENT_RESPONSE.md:148-158`); dry-run gap G1 |
| IR-P1-001 | P1 | Rollback documentation contradicts itself on SHA-targeted rollback | verified-fixed | `ROLLBACK_PROCEDURES.md` §1 + handbook + workflow agree |
| IR-P1-002 | P1 | Bad-migration recovery is manual-only with no automated reverse or staging proof | partially-fixed | drift gate fixed; reverse manual; D4 planned |
| IR-P1-003 | P1 | Worker health failure during deploy is non-fatal | verified-fixed | `deploy-do.yml:1056-1085,1155-1172` |
| IR-P1-004 | P1 | Backups are not verified deeply enough to prove the documented RPO/RTO | verified-fixed | `db-restore-test.yml:196-293`; `restore-storage.sh:114-137` |
| IR-P1-005 | P1 | Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test | verified-fixed | shared `S3_BUCKET`/`S3_PREFIX` contract in all four paths |
| IR-P1-006 | P1 | No runtime detection or alerting for tenant-isolation (RLS) regressions | verified-fixed | rules `:162-215`; promtool CI |
| IR-P2-001 | P2 | Several Prometheus metrics are declared but not wired, limiting incident diagnosis | verified-fixed | all call sites wired; docs reconciled |
| IR-P2-002 | P2 | No alerting on audit-trail gaps or privileged (impersonation/admin) abuse | partially-fixed | impersonation alerted; audit-gap log-only |
| IR-P2-003 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts | verified-fixed | rules `:217-260,360-368`; drift metric emitted |
| IR-P2-004 | P2 | Secrets rotation is documented but has no exercised evidence | partially-fixed | desk dry-run row `SECRETS_ROTATION.md:503`; no live rotation |
| IR-P2-005 | P2 | No platform status/communication surface for MCT's own outages | partially-fixed | `STATUS_AND_COMMUNICATION.md`; ACL check NEEDS-HUMAN |
| IR-P2-006 | P2 | Migration dry-run result is discarded in CI | verified-fixed | `supabase-migrations.yml:67-88` artifact + drift gate |
| IR-P2-007 | P2 | Platform IR and breach plans are stale on the deployed alerting path and reference template files that do not exist in docs/ | partially-fixed | alerting text fixed; `DATA_BREACH_RESPONSE.md:158-160` still claims three signals are unalerted |
| IR-P2-008 | P2 | On-call rota and escalation contacts are unassigned, so the incident plan is not operational | partially-fixed | `docs/templates/ONCALL_ROTA.md` exists, unfilled |
| IR-P2-009 | P2 | No tabletop exercise has been run and the scenario catalog is stale | partially-fixed | 12-scenario catalog + IR-011 desk dry-run; no live exercise |
| IR-P2-010 | P2 | Prometheus alert-rule unit tests are not wired into CI | verified-fixed | `.github/actions/prometheus-rules` in test/validate |
| IR-P3-001 | P3 | Terraform state restore guidance lacks a tested procedure | verified-fixed | `terraform-state-restore.sh` + CI test; live drill pending |
| IR-P3-002 | P3 | Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts | verified-fixed | `MONITORING_AND_ALERTING.md:82-146` |
| IR-P3-003 | P3 | Monitoring doc still reports wired metrics as 'defined, not wired' and omits the alert rules added for impersonation and RLS | verified-fixed | docs reconciled |
| IR-P3-004 | P3 | Alerting secrets are not documented in the secrets matrix or environment-variable reference | verified-fixed | matrix `:117-126`; env reference `:168-187` |
| IR-P3-005 | P3 | Incident plan's first triage step points responders at a URL that currently 404s | **open (new)** | `INCIDENT_RESPONSE.md:57`; live 404 on 2026-10-14 |

Counts: 15 verified-fixed / 8 partially-fixed / 0 regressed / 1 open (new P3).

## Recommendations

### Immediate / Release blocking

1. Provision the external watchdog URL and record the missed-heartbeat drill — the only P0-class gap left in this domain (IR-P0-003 / OBS-P0-001).

### This week

2. Fix the triage URL in `INCIDENT_RESPONSE.md:57` (IR-P3-005) or reconcile the prod API hostname first (OBS-P2-017).
3. Fill the on-call rota (`docs/templates/ONCALL_ROTA.md` → `INCIDENT_RESPONSE.md` §8) — the plan is explicitly "not operational" until then (IR-P2-008).
4. Correct the stale "no alert" sentence in `DATA_BREACH_RESPONSE.md:158-160` (IR-P2-007).

### This month

5. Verify the `portal-status` topic ACLs (anonymous read) and record the check (IR-P2-005).
6. Facilitate the first live tabletop (IR-011) with named participants and record it in the catalog's exercise table (IR-P2-009).
7. Perform one live rotation on a non-critical dev secret and log it (IR-P2-004).
8. Add the audit-write failure metric + rule (IR-P2-002).

### Later / Platform evolution

9. Author a reverse-migration template and run the D4 bad-migration drill (IR-P1-002).
10. Keep the plans re-reviewed whenever the alerting path changes (the cause of IR-P2-007).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Fix the triage URL | The first incident step must work | `docs/INCIDENT_RESPONSE.md:57` | curl the URL during a drill |
| Stale-sentence fix in the breach plan | Prevents responders ignoring live alerts | `docs/DATA_BREACH_RESPONSE.md:158-160` | read-through |
| Fill the rota | Makes the plan operational | `docs/templates/ONCALL_ROTA.md`, `INCIDENT_RESPONSE.md` §8 | named primary/backup/contacts |

## Suggested Tests

- **Tabletop**: run IR-011 (monitoring-path loss) live once the watchdog URL exists; record detection time and gaps.
- **Drill**: stop alertmanager → confirm the external page; log in `ALERT_PATH_EXERCISE.md` and the drill ledger.
- **Doc guard**: a CI check that every relative link in `INCIDENT_RESPONSE.md`/`DATA_BREACH_RESPONSE.md` resolves (the old missing-template bug would have been caught).
- **Alert coverage**: a test asserting each "known signal" named in the breach plan maps to an existing rule name.

## Suggested Documentation Updates

- `docs/INCIDENT_RESPONSE.md:57` (triage URL) and §8 (rota table once filled).
- `docs/DATA_BREACH_RESPONSE.md:158-160` (alert coverage sentence).
- `docs/INCIDENT_TABLETOP_SCENARIOS.md` §7 (record the first live exercise).
- `docs/PLATFORM_FAILURE_RUNBOOKS.md` §6 (first real drill rows).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Who is the on-call primary/backup and escalation contact? | Without names the plan is not operational | Completed `ONCALL_ROTA.md` |
| Has the `portal-status` topic been ACL-checked? | Determines whether tenants can actually subscribe | A test post + anonymous poll |
| Is a live revocation drill acceptable on a dev secret this quarter? | Decides when IR-P2-004 closes | Operator scheduling decision |

## Appendix

- Previous-run deltas: 15 of 23 rows verified-fixed; the 8 partials are unchanged in kind (exercise/provisioning), not code.
- Cross-domain: IR-P0-003 = OBS-P0-001 = RES-P2-005 (same receiver); IR-P2-003 is now consistent with the reconciled register (verified-fixed).
