# Infrastructure, Deployment, and Environment Drift Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: INFRA · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope: Terraform (DigitalOcean), cloud-init/firewall, droplet compose, deploy scripts, reverse proxy, monitoring stack, rollback, env examples, tfvars handling. Read-only; no live infrastructure access.

## Executive Summary

All 19 previous INFRA rows were re-verified at `7dd0402`: **19 verified-fixed, 0 partial, 0 open, 0 regressed**. The infrastructure layer is now fail-closed and internally consistent: SSH requires an explicit, non-world-open allowlist in both Terraform and CI; Terraform state locking is compatible with the pinned 1.15.9 (`use_lockfile`); the droplet stack runs a digest-pinned, capability-dropped, read-only-rootfs compose topology with Alertmanager delivery + an external dead-man's switch; the deploy gate asserts all seven healthchecked services and rolls back on failure; the rollback script authenticates to GHCR correctly with pinned host keys; and the backup/restore pair shares the same digest-pinned Postgres 16 client/server with real integrity floors (this row was previously partially-fixed and is now closed).

The only caveats are operator-side and already tracked elsewhere: the weekly Terraform drift plan is dormant until `TF_DRIFT_PLAN_ENABLED=true` after the DO token is rotated (CI-P2-008), and prod provisioning remains outstanding (CI-P1-003).

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `infra/terraform/digitalocean/{variables,providers,firewall,cloud-init}.tf/yml` | IaC | SSH fail-closed, locking, UFW | verified |
| `.github/workflows/terraform-do.yml` | Workflow | Allowlist rejection, drift plan, approval-gated apply | verified |
| `infra/digitalocean/docker-compose.yml` + `prometheus.yml` + `alertmanager.tmpl.yml` | Config | Hardening, alerting path | verified |
| `.github/workflows/deploy-do.yml` (health gate, METRICS guard, digest pull) | Workflow | Deploy safety | verified |
| `scripts/{rollback,backup-database,restore-database}.sh` | Scripts | Rollback auth/prefix, backup/restore parity | verified |
| `docs/{ROLLBACK_PROCEDURES,RTO_RPO}.md`, `infra/{digitalocean,terraform}/README.md` | Docs | Operational truth | verified |
| `.gitignore`, `git ls-files` | Repo | tfvars handling | verified |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| INFRA-P1-001 | P1 | SSH world-open | verified-fixed | `admin_ip_ranges` no default + validation (variables.tf:76-92); CI rejects world-open (terraform-do.yml:102-113, :241-248); firewall restricts 22 |
| INFRA-P1-002 | P1 | State-lock/Terraform version mismatch | verified-fixed | `required_version >= 1.15` + `use_lockfile` (providers.tf); workflows pin 1.15.9 |
| INFRA-P2-001 | P2 | No Alertmanager delivery path | verified-fixed | alertmanager service + prometheus alerting; external watchdog fail-closed in prod |
| INFRA-P2-002 | P2 | Dev droplet under-provisioned | verified-fixed | CI + example both `s-1vcpu-2gb` |
| INFRA-P2-003 | P2 | Ops docs contradict pipeline | verified-fixed | README + ROLLBACK_PROCEDURES + RELEASING reconciled |
| INFRA-P2-004 | P2 | Integration env vars not delivered | verified-fixed | printf + envs delivery; env-parity clean |
| INFRA-P2-005 | P2 | Redis hardening weakened / password on argv | verified-fixed | cap_drop ALL, no-new-privileges, user redis, env-only password |
| INFRA-P2-006 | P2 | Rollback GHCR auth / wrong prefix | verified-fixed | rollback.sh:34, :70-95; pinned host key |
| INFRA-P2-007 | P2 | Health gate ignores monitoring/proxy | verified-fixed | GATED_SERVICES 7 services + logs on failure |
| INFRA-P3-001 | P3 | `env/prod.tfvars` tracked | verified-fixed | only `.example` tracked |
| INFRA-P3-002 | P3 | Restore/backup Postgres major mismatch, table-count-only | verified-fixed | both digest-pinned `postgres:16-alpine`; floors asserted (db-restore-test.yml:196-330) |
| INFRA-P3-003 | P3 | RTO_RPO claims AOF | verified-fixed | docs match RDB-only compose |
| INFRA-P3-004 | P3 | README references missing `aws/` | verified-fixed | no reference remains |
| INFRA-P3-005 | P3 | Rollback runbook push-to-apply no-op | verified-fixed | runbook documents manual dispatch |
| INFRA-P3-006 | P3 | .env.example missing alerting/metrics vars | verified-fixed | METRICS_TOKEN + ALERTMANAGER_* present |
| INFRA-P3-007 | P3 | Module-root tfvars not ignored | verified-fixed | `.gitignore:63` |
| INFRA-P3-008 | P3 | Cloud-init UFW stale after narrowing | verified-fixed | documented + refresh procedure (README:19-45) |
| INFRA-P3-009 | P3 | METRICS_TOKEN no fail-closed guard | verified-fixed | prod deploy fails on empty; token file 0400 |
| INFRA-P3-010 | P3 | Alert-rule tests not in CI | verified-fixed | promtool check+test in test + validate gates |

## Recommendations

- **This week**: rotate `DO_API_TOKEN` and set `TF_DRIFT_PLAN_ENABLED=true` so the weekly drift plan actually runs (CI-P2-005/008); set a prod `DROPLET_IP` fallback (RELEASING.md:180-182).
- **This month**: exercise the rollback path (`scripts/rollback.sh` against dev) end-to-end with `DO_SSH_HOST_KEY` and record the run; verify the UFW refresh procedure once on the dev droplet.
- **This quarter**: re-pin the third-party images from the weekly scan output; confirm the dead-man's-switch heartbeat is observed off-box.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the live dev/prod firewall actually restricted to the committed allowlist? | Repo proves the intent; live state unverified read-only | DO console / `terraform plan` output |
| Has the drift plan ever produced a non-empty plan? | Detects unmanaged changes | terraform-do run history once enabled |
| Is the external watchdog heartbeat currently firing? | Dead-man's switch effectiveness | healthchecks.io check history (operator) |
