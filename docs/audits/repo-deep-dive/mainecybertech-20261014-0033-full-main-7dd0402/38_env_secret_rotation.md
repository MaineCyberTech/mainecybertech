# 38_env_secret_rotation — Prompt 38 - Environment and Secret Rotation Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `38_env_secret_rotation.md` (area SECRET, prompt)

## Verification Performed

Domain subagent produced 17 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference |
| SECRET-P1-003 | P1 | Rotation and emergency procedures target the wrong GitHub environment for the prod deploy and backup workflows |
| SECRET-P2-001 | P2 | Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered |
| SECRET-P2-002 | P2 | Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation |
| SECRET-P2-003 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact |
| SECRET-P2-004 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it |
| SECRET-P2-005 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy |
| SECRET-P2-006 | P2 | Secrets rotation is documented but has no exercised evidence |
| SECRET-P2-007 | P2 | Incident response points at a secret-rotation runbook that is not in docs/ |
| SECRET-P2-008 | P2 | Terraform plan artifacts carry sensitive variable values off the runner |
| SECRET-P2-009 | P2 | JWT rotation runbook rotates the API verification copy, not the Supabase signing secret, and references a nonexistent JWT_EXPIRY |
| SECRET-P3-001 | P3 | Worker `.env.example` omits `APP_BASE_URL` |
| SECRET-P3-002 | P3 | Web runtime validator can silently fall back to a localhost API URL |
| SECRET-P3-003 | P3 | No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence |
| SECRET-P3-004 | P3 | Secret rotation policy has no evidence any secret was ever rotated |
| SECRET-P3-005 | P3 | No automated `.env.example` <-> runtime schema <-> docs parity check |
