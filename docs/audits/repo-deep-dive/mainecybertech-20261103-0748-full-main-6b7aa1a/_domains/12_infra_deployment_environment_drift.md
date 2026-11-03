# Infrastructure, Deployment, and Environment Drift Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `INFRA`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/12_infra_deployment_environment_drift.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

Terraform DigitalOcean module, compose stack, deploy/rollback scripts, reverse proxy, environment examples, runtime validators, monitoring, alert rules, backup hooks, doc/config drift.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `variables.tf` + `terraform-do.yml` | Config | SSH allowlist fail-closed | no default; empty/world-open rejected before plan/apply |
| `providers.tf` + workflow pins | Config | State locking/version | required >=1.15; `use_lockfile=true`; CI 1.15.9 |
| `docker run promtool ... check/test rules` (executed) | Validation | Alert rules | **SUCCESS** 26 rules; rule tests pass on v3.15.1 |
| `infra/digitalocean/README.md` vs `docker-compose.yml` | Cross-check | Operator service/pin table | stale versions + missing node-exporter (INFRA-P2-003 regressed) |
| `.github/actions/prometheus-rules/action.yml` vs compose | Cross-check | Prometheus version used in CI | v3.5.1 vs v3.15.1 (INFRA-P3-011) |

## Executive Summary

The core infrastructure controls remain fixed: SSH is fail-closed (no default, world-open rejected in CI), Terraform 1.15.9 + `use_lockfile`, dev/prod droplet sizes match tfvars, Alertmanager delivery and host-resource alerts are wired, Redis is hardened, rollback works, and the deploy health gate now includes node-exporter. One regression: the Nov 2-3 version/service bumps left the operator docs stale (README lists Prometheus v3.5.1/Alertmanager v0.28.1 while compose runs v3.15.1/v0.29.0, and omits node-exporter; CI/SBOM/monitoring docs still say four third-party images or seven healthchecked services). A new low finding: the promtool CI gate pins Prometheus v3.5.1 while production runs v3.15.1.

**Totals:** 20 findings — P0 0, P1 2, P2 7, P3 11. Status: open 1, regressed 1, verified-fixed 18.

**New this run:** INFRA-P3-011.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) | verified-fixed | re-verified at 6b7aa1a: admin_ip_ranges has no default + non-empty validation (variables.tf:76-92); CI fails empty/world-open allowlists before plan/apply (terraform-do.yml:102-113, :241-248); DO firewall restricts 22 to the list (firewall.tf:18-22). |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) | verified-fixed | re-verified at 6b7aa1a: providers.tf requires >= 1.15 and sets use_lockfile=true; terraform-do.yml pins 1.15.9. |
| INFRA-P2-001 | P2 | Prometheus alert rules have no delivery path (no Alertmanager) | verified-fixed | re-verified at 6b7aa1a: alertmanager service (docker-compose.yml:350-409) + prometheus alerting block (prometheus.yml:14-17) + watchdog rule; prod deploys fail closed without the external watchdog URL (deploy-do.yml:846-863). |
| INFRA-P2-002 | P2 | Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example | verified-fixed | re-verified at 6b7aa1a: CI dev size s-1vcpu-2gb (terraform-do.yml:84) matches env/dev.tfvars.example; prod s-2vcpu-2gb. |
| INFRA-P2-003 | P2 | Operations documentation contradicts the current pipeline and configuration | regressed | regressed at 6b7aa1a by the Nov 2-3 infra bumps: infra/digitalocean/README.md:16-17 still lists prom/prometheus v3.5.1 and prom/alertmanager v0.28.1 while compose runs v3.15.1 / v0.29.0 (docker-compose.yml:306,354), and the service table omits the new node-exporter (:271). docs/CI.md:33 still says the scan resolves four refs and :56 lists seven healthchecked services without node-exporter; docs/SBOM_PROCESS.md:97 says four images; docs/MONITORING_AND_ALERTING.md:224-231 health table omits node-exporter. |
| INFRA-P2-004 | P2 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline | verified-fixed | re-verified at 6b7aa1a: deploy printf + envs deliver the integration/security vars (deploy-do.yml:735, :763-815); scripts/check-env-parity.mjs runs clean; compose reads them. |
| INFRA-P2-005 | P2 | Redis container hardening was weakened and its password remains in process arguments | verified-fixed | re-verified at 6b7aa1a: cap_drop ALL + no-new-privileges + user redis + entrypoint file/env password (no argv), RDB-only persistence (docker-compose.yml:35-80). |
| INFRA-P2-006 | P2 | Manual rollback script cannot authenticate to GHCR and defaults to the wrong image prefix | verified-fixed | re-verified at 6b7aa1a: scripts/rollback.sh logs in to GHCR from the caller (token via stdin), prefix ghcr.io/mainecybertech/mainecybertech (:34), pinned host key with explicit last-resort opt-in (:47-64); shellcheck-gated. |
| INFRA-P2-007 | P2 | Deploy health gate ignores the monitoring and reverse-proxy containers | verified-fixed | re-verified at 6b7aa1a: GATED_SERVICES now includes redis api worker web alertmanager prometheus node-exporter caddy (deploy-do.yml:1070), with per-service logs on failure (:1074-1085). |
| INFRA-P3-001 | P3 | `env/prod.tfvars` is tracked despite an ignore rule that names it | verified-fixed | re-verified at 6b7aa1a: only env/prod.tfvars.example tracked; gitignore covers it. |
| INFRA-P3-002 | P3 | Restore test uses a different Postgres major than the backup script and verifies only table counts | verified-fixed | re-verified at 6b7aa1a: both the backup script (scripts/backup-database.sh:52) and the restore test (db-restore-test.yml:177) use the same digest-pinned postgres:16-alpine; the restore test asserts table/migration/row/freshness/RLS floors (:196-330). (Previously partially-fixed.) |
| INFRA-P3-003 | P3 | `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable | verified-fixed | re-verified at 6b7aa1a: docs/RTO_RPO.md:12 documents Redis RDB-snapshot-only (RPO 24h) matching compose (redis-data volume, no AOF). |
| INFRA-P3-004 | P3 | `infra/terraform/README.md` references an `aws/` directory that does not exist | verified-fixed | re-verified at 6b7aa1a: no aws/ reference remains in infra/terraform/README.md. |
| INFRA-P3-005 | P3 | Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op | verified-fixed | re-verified at 6b7aa1a: docs/ROLLBACK_PROCEDURES.md:236-256 documents the manual-dispatch-only reality and the Actions dispatch procedure. |
| INFRA-P3-006 | P3 | infra/digitalocean/.env.example omits the alerting and internal-metrics variables the compose stack reads | verified-fixed | re-verified at 6b7aa1a: .env.example includes METRICS_TOKEN (:111) and the ALERTMANAGER_* block (:117-129). |
| INFRA-P3-007 | P3 | Terraform tfvars generated/referenced at the module root are not covered by the .gitignore rule | verified-fixed | re-verified at 6b7aa1a: .gitignore:63 adds infra/terraform/**/*.tfvars (examples stay tracked). |
| INFRA-P3-008 | P3 | Cloud-init UFW SSH allowlist is applied only at droplet creation, so narrowed allowlists leave stale host rule | verified-fixed | re-verified at 6b7aa1a: documented as create-time + DO firewall authoritative (cloud-init.yml:17-27, firewall.tf:12-20) with a refresh procedure (infra/terraform/README.md:19-45). |
| INFRA-P3-009 | P3 | METRICS_TOKEN has no fail-closed deploy guard; an empty token leaves the API scrape permanently down | verified-fixed | re-verified at 6b7aa1a: prod deploy fails on an empty METRICS_TOKEN (deploy-do.yml:824-835); the token file is written 0400 to the prometheus user (:836-841). |
| INFRA-P3-010 | P3 | Prometheus alert-rule unit tests exist but are not run in CI | verified-fixed | re-verified at 6b7aa1a: the prometheus-rules composite runs promtool check + test against a digest-pinned prom/prometheus image in test.yml:52 and validate.yml:50; see INFRA-P3-011 for the version mismatch with production. |
| INFRA-P3-011 | P3 | NEW: promtool CI gate pins Prometheus v3.5.1 while production runs v3.15.1 | open | NEW at 6b7aa1a: .github/actions/prometheus-rules/action.yml:19 pins prom/prometheus v3.5.1 (digest 4b05...) while production runs v3.15.1 (docker-compose.yml:306), despite the action header (:5) claiming it is the same image. promtool check/test currently pass on both, but CI does not validate the rule semantics on the deployed Prometheus version. |

## New Findings Detail

### INFRA-P3-011 — NEW: promtool CI gate pins Prometheus v3.5.1 while production runs v3.15.1 (P3, open)

- **Evidence:** NEW at 6b7aa1a: .github/actions/prometheus-rules/action.yml:19 pins prom/prometheus v3.5.1 (digest 4b05...) while production runs v3.15.1 (docker-compose.yml:306), despite the action header (:5) claiming it is the same image. promtool check/test currently pass on both, but CI does not validate the rule semantics on the deployed Prometheus version.
- **Owner:** platform/infrastructure · **Target:** this quarter

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| Operations documentation contradicts the current pipeline and configuration | P2 | INFRA-P2-003 | Fix/verify per the finding |
| NEW: promtool CI gate pins Prometheus v3.5.1 while production runs v3.15.1 | P3 | INFRA-P3-011 | Fix/verify per the finding |

## Recommendations

- **Immediate:** refresh `infra/digitalocean/README.md`, `docs/CI.md`, `docs/SBOM_PROCESS.md` and the monitoring health table for v3.15.1/v0.29.0 + node-exporter (INFRA-P2-003 / CTR-P3-006).
- **This month:** pin the promtool composite to the production v3.15.1 digest (INFRA-P3-011).
- **This quarter:** keep the host-resource rules/health gate and the manual-dispatch rollback docs in sync.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the README version table used by operators during rollback? | Stale pins can mislead a manual restore | Operator feedback |
| Does any rule rely on v3.5.1-only behavior? | CI would not catch a v3.15.1 regression | Run promtool tests against both versions (done here: both pass) |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
