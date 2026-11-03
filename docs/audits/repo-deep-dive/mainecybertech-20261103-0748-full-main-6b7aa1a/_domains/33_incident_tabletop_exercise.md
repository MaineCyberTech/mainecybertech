# Incident, Tabletop, and Breach-Readiness Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: IR
- Scope limitations: read-only repository review; no live incident, page, breach notification or tabletop was run. Public GitHub Actions history was read; logs require admin access.

## Scope

Re-verified all 24 previous IR findings at `6b7aa1a`: the incident-response plan and roles, breach response, severity/communication/postmortem, rollback and bad-migration recovery, worker/deploy health, restore verification, RLS/audit/privileged-abuse detection, alert-rule testing, secrets rotation, status surface, on-call rota, tabletop catalog/exercise, and the first-triage URL. The `7dd0402..6b7aa1a` diff was reviewed for the incident-plan URL fix and the alert-path exercise.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `docs/INCIDENT_RESPONSE.md` | Read | Roles, declaration, phases, gaps, triage URL | URL fixed; watchdog still unset |
| `docs/DATA_BREACH_RESPONSE.md` | Read | Breach detection/notification, known gaps | Stale “no alert” sentence remains |
| `docs/INCIDENT_TABLETOP_SCENARIOS.md`, `docs/INCIDENT_TABLETOP_DRYRUN_2026-10-11.md` | Read | Scenario catalog and desk dry-run | No live exercise |
| `docs/ALERT_PATH_EXERCISE.md`, `.github/workflows/alert-path-exercise.yml` | Read + API | Exercise design and run history | One failed run |
| `docs/STATUS_AND_COMMUNICATION.md`, `docs/templates/ONCALL_ROTA.md` | Read | Status surface/on-call | ACL and rota still pending |
| `docs/SECRETS_ROTATION.md`, `docs/SECRET_ROTATION_RUNBOOK.md` | Read | Rotation evidence | Desk dry-run only |
| `infra/digitalocean/prometheus.rules.yml` | Read | Detection signals referenced by the plans | Rules present |

## Executive Summary

Sixteen of the 24 previous findings are `verified-fixed`; eight are `partially-fixed`; one new P2 is open. IR-P3-005 is fixed: the incident plan’s first triage step now points at the working app-host URLs and explicitly warns about the dead `api.mainecybertech.com/health` host. The plans, roles, breach process, postmortem template, alert-rule tests and rollback contracts remain in place.

The readiness gaps are unchanged and operational: the external watchdog URL is unset, the on-call rota is unassigned, the status-surface ACL is unverified, the bad-migration/PITR drills are unexercised, and the only tabletop is a desk dry-run. A new P2 records that the first scheduled alert-path exercise **failed** and is not yet in the evidence table, so the monitoring-loss scenario remains unproven.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| IR-P0-001 | P0 | verified-fixed | No platform IR plan, roles or postmortem process | `INCIDENT_RESPONSE.md`; postmortem template |
| IR-P0-002 | P0 | verified-fixed | No breach response/notification process | `DATA_BREACH_RESPONSE.md` |
| IR-P0-003 | P0 | partially-fixed | No independent dead-man's switch | Watchdog URL unset; alert-path run failed |
| IR-P1-001 | P1 | verified-fixed | Rollback docs contradict SHA-targeted rollback | `ROLLBACK_PROCEDURES.md`; `deploy-do.yml` contract |
| IR-P1-002 | P1 | partially-fixed | Bad-migration recovery manual only | Dry-run artifact; D4 `planned` |
| IR-P1-003 | P1 | verified-fixed | Worker health failure non-fatal during deploy | `deploy-do.yml:1067-1086,1155-1172` |
| IR-P1-004 | P1 | verified-fixed | Backups not verified deeply enough | `db-restore-test.yml:196-293`; storage assertions |
| IR-P1-005 | P1 | verified-fixed | Backup bucket config inconsistent | Shared `S3_BUCKET`/`S3_PREFIX` |
| IR-P1-006 | P1 | verified-fixed | No runtime RLS-regression detection | RLS metrics + `MCTTenantScopeRegression` |
| IR-P2-001 | P2 | verified-fixed | Prometheus metrics declared but unwired | Live call sites; docs reconciled |
| IR-P2-002 | P2 | partially-fixed | No audit-gap/privileged-abuse alerting | Impersonation covered; audit gap still log-only |
| IR-P2-003 | P2 | verified-fixed | No webhook DLQ/payment drift alerts | Rules + counters |
| IR-P2-004 | P2 | partially-fixed | Secrets rotation undocumented/unexercised | Desk dry-run only |
| IR-P2-005 | P2 | partially-fixed | No verified status/communication surface | ACL `NEEDS-HUMAN`; row pending |
| IR-P2-006 | P2 | verified-fixed | Migration dry-run discarded | Artifact + drift gate |
| IR-P2-007 | P2 | partially-fixed | IR/breach plans stale on alerting path | `DATA_BREACH_RESPONSE.md:158-160` still says “no alert” |
| IR-P2-008 | P2 | partially-fixed | On-call rota/escalation unassigned | `ONCALL_ROTA.md` unfilled |
| IR-P2-009 | P2 | partially-fixed | No tabletop exercise run; catalog stale | Desk dry-run only; no human facilitation |
| IR-P2-010 | P2 | verified-fixed | Prometheus alert-rule tests not in CI | `prometheus-rules` composite in test/validate |
| IR-P3-001 | P3 | verified-fixed | Terraform state restore untested | Script + CI test; live drill pending |
| IR-P3-002 | P3 | verified-fixed | Monitoring doc/health semantics disagree | `MONITORING_AND_ALERTING.md:82-146` |
| IR-P3-003 | P3 | verified-fixed | Monitoring doc reports wired metrics as unwired | Reconciled |
| IR-P3-004 | P3 | verified-fixed | Alerting secrets undocumented | Matrix + env reference |
| IR-P3-005 | P3 | verified-fixed | First triage step points at a 404 URL | `INCIDENT_RESPONSE.md:57-65` now app-host URLs |
| IR-P2-011 | P2 | open (new) | First scheduled alert-path exercise failed; no evidence row | Run 41323651243 failed at “Exercise alert delivery on the droplet”; evidence table still empty |

Counts: **16 verified-fixed / 8 partially-fixed / 0 regressed / 1 open** (IR-P2-011 new). IR-P3-005 moved to fixed.

## Residual detail

### IR-P0-003 / IR-P2-011 — the monitoring-loss path is still unproven

The `Watchdog` rule routes to a dedicated receiver, but `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is still unset (`INCIDENT_RESPONSE.md:158`; `DATA_BREACH_RESPONSE.md:149`). The first scheduled alert-path exercise (41323651243, 2026-11-01) failed at the “Exercise alert delivery on the droplet” step (exit 1), and `ALERT_PATH_EXERCISE.md:104-110` still has `_none recorded yet_`. `INCIDENT_TABLETOP_DRYRUN_2026-10-11.md:61-64,82` also says the exercise has never run and that a failed scheduled run does not page. So the IR-011 monitoring-loss scenario stays at “detection still not independent”.

Fix: link the failed run, identify the missing prerequisite (DROPLET_IP/DO_API_TOKEN, SSH key or ntfy secret), rerun on dev, and require the evidence row before the next prod deploy.

### IR-P1-002 — bad-migration recovery is still hand-written

`supabase-migrations.yml:67-127` captures the dry-run artifact and fails on post-push drift, but there is no reverse-migration automation and the D4 bad-migration drill remains `planned` in `docs/runbooks/backup-restore-drill-ledger.md:23`. A bad migration still relies on a hand-written down migration or PITR.

### IR-P2-002 — audit-trail gaps remain log-only

Impersonation abuse is covered by `MCTImpersonationBurst`/`MCTImpersonationActivity` (`prometheus.rules.yml:102-130`), but `apps/api/src/services/audit.ts` still only logs an insert failure after retries; there is no metric/rule for audit-write failures, missing rows or export gaps. A breach could lose its own evidence trail without a page.

### IR-P2-007 — breach plan still contradicts the deployed alert set

`docs/DATA_BREACH_RESPONSE.md:158-160` says webhook dead-letter growth, worker health and RLS regressions “currently have **no alert**”. All three now have rules (`MCTWebhookDeadLettersAccumulating`, `MCTWorkerTaskFailures`, `MCTTenantScopeRegression`). The stale sentence sends responders to manual checks that are actually automated, and undermines trust in the plan.

### IR-P2-008 / IR-P2-009 — the plan is not operational

`docs/templates/ONCALL_ROTA.md` is still a template; every drill row remains `_unassigned_`. The 2026-10-11 tabletop is a **desk dry-run** with a pending human reviewer, not a facilitated exercise. The catalog is refreshed (12 scenarios), but no live/human tabletop has been run.

## Recommendations

### Immediate / release blocking

1. Provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` and run the missed-heartbeat drill; record the evidence in `ALERT_PATH_EXERCISE.md`.
2. Assign the on-call rota primary/backup/escalation in `docs/templates/ONCALL_ROTA.md` and link the filled copy from the plan.

### This week

3. Triage and rerun alert-path exercise 41323651243; record the failure, owner, fix and green rerun.
4. Fix the stale “no alert” sentence in `DATA_BREACH_RESPONSE.md:158-160`.

### This month

5. Run a facilitated tabletop (at least IR-011) and record attendees, timeline and follow-ups.
6. Verify the `portal-status` ACL and record the first status-surface exercise.
7. Exercise a live secret rotation on a non-critical dev secret and update the rotation log.

### This quarter

8. Add an audit-write-failure metric/rule; template a reverse migration; run D4 and D2.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Link failed alert-path run | Turns a silent failure into a tracked action | `docs/ALERT_PATH_EXERCISE.md` | row with run URL + owner |
| Correct the breach-plan alert sentence | Restores trust in the plan | `docs/DATA_BREACH_RESPONSE.md:158-160` | docs read-through |
| Fill the rota template | Makes escalation actionable | `docs/templates/ONCALL_ROTA.md` | named primary/backup |
| Record a desk-to-live tabletop delta | Shows what a real exercise adds | `docs/INCIDENT_TABLETOP_DRYRUN_2026-10-11.md` | facilitated notes |

## Suggested Tests

- **Exercise**: rerun `alert-path-exercise.yml` on dev and assert the ntfy notification and Watchdog page are observed.
- **Tabletop**: facilitated IR-011 with a scribe and timeline; record actual detection time.
- **Audit gap**: inject an audit insert failure and assert a metric/alert (to be added).
- **Rollback**: a staging bad-migration apply followed by the documented down path.

## Suggested Documentation Updates

- `docs/ALERT_PATH_EXERCISE.md`: replace the empty evidence row.
- `docs/DATA_BREACH_RESPONSE.md`: reconcile the detection table with the deployed rules.
- `docs/templates/ONCALL_ROTA.md`: fill and link the assignment.
- `docs/INCIDENT_RESPONSE.md`: remove “rota unassigned” once complete.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Why did the alert-path exercise fail? | Distinguishes provisioning from a broken receiver | Failed run log/step |
| Who owns the on-call rota? | The plan cannot be operational without a name | Filled rota |
| Is the status topic anonymously readable? | The fallback channel may leak or fail | ACL check output |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-11-03): alert-path-exercise 41323651243 failed 2026-11-01T15:55Z at “Exercise alert delivery on the droplet” (exit 1); no successful rerun. No live tabletop artifact exists.
- IR-P3-005 is fixed by the `INCIDENT_RESPONSE.md:57-65` rewrite; the old `api.mainecybertech.com/health` first-triage step is gone.
- No prior finding regressed; IR-P2-011 is the only new row.
