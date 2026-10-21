# 12_infra_deployment_environment_drift — Prompt 12 - Infrastructure, Deployment, and Environment Drift Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `12_infra_deployment_environment_drift.md` (area INFRA, prompt)

## Verification Performed

Domain subagent produced 19 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| INFRA-P1-001 | P1 | SSH is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it) |
| INFRA-P1-002 | P1 | Terraform state-locking fix is incompatible with the pinned Terraform version (use_lockfile requires >= 1.10, workflows pin 1.9) |
| INFRA-P2-001 | P2 | Prometheus alert rules have no delivery path (no Alertmanager) |
| INFRA-P2-002 | P2 | Dev droplet capacity is under-provisioned and the CI value drifts from dev.tfvars.example |
| INFRA-P2-003 | P2 | Operations documentation contradicts the current pipeline and configuration |
| INFRA-P2-004 | P2 | Integration/security env vars referenced by the app schema are not delivered by the deploy pipeline |
| INFRA-P2-005 | P2 | Redis container hardening was weakened and its password remains in process arguments |
| INFRA-P2-006 | P2 | Manual rollback script cannot authenticate to GHCR and defaults to the wrong image prefix |
| INFRA-P2-007 | P2 | Deploy health gate ignores the monitoring and reverse-proxy containers |
| INFRA-P3-001 | P3 | `env/prod.tfvars` is tracked despite an ignore rule that names it |
| INFRA-P3-002 | P3 | Restore test uses a different Postgres major than the backup script and verifies only table counts |
| INFRA-P3-003 | P3 | `docs/RTO_RPO.md` claims Redis AOF persistence that compose does not enable |
| INFRA-P3-004 | P3 | `infra/terraform/README.md` references an `aws/` directory that does not exist |
| INFRA-P3-005 | P3 | Terraform is manual-dispatch only, so the "push to trigger apply" rollback runbook step is a no-op |
| INFRA-P3-006 | P3 | infra/digitalocean/.env.example omits the alerting and internal-metrics variables the compose stack reads |
| INFRA-P3-007 | P3 | Terraform tfvars generated/referenced at the module root are not covered by the .gitignore rule |
| INFRA-P3-008 | P3 | Cloud-init UFW SSH allowlist is applied only at droplet creation, so narrowed allowlists leave stale host rule |
| INFRA-P3-009 | P3 | METRICS_TOKEN has no fail-closed deploy guard; an empty token leaves the API scrape permanently down |
| INFRA-P3-010 | P3 | Prometheus alert-rule unit tests exist but are not run in CI |
