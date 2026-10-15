# Environment and Secret Rotation Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: SECRET · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope: `.env.example` files, runtime env schemas, deploy-pipeline secret delivery, rotation/emergency runbooks, break-glass, parity guards. Read-only; no secret values printed.

## Executive Summary

All 17 previous SECRET rows were re-verified: **13 verified-fixed, 4 partially-fixed, 0 open, 0 regressed**. Delivery and mapping are now consistent: the deploy pipeline forwards ~55 secrets as environment variables and writes the droplet `.env` via `printf` (no interpolation), every secret-class key the schema/compose references is written (verified by the env-parity guard, which runs clean), M365 uses a single authoritative `M365_CLIENT_STATE`, rotation/emergency procedures target the consuming environments (`prod-approval` for prod mutations, `dev` for backups), and a full IT-level break-glass runbook plus a dated dry-run record exist.

Residuals are honest and small: the rotation inventory still omits three secret-class keys (`REDIS_PASSWORD`, `VAPID_PRIVATE_KEY`, `MALWARE_SCANNER_API_KEY`); no live rotation/revocation drill has been exercised yet; and the web API-URL validator's production throw is unreachable in the container because the Dockerfile default pre-populates the variable.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/check-env-parity.mjs` (executed) | Guard | schema ↔ .env.example ↔ docs parity | **PASS** |
| `deploy-do.yml` envs + printf block | Workflow | Secret delivery to the droplet | verified (:735, :763-815) |
| `docs/SECRETS_ROTATION.md` (60-row inventory, consuming-env table, procedures, log) | Docs | Rotation mapping + evidence state | partial (3 keys missing) |
| `docs/SECRET_ROTATION_RUNBOOK.md` | Docs | Break-glass/revocation + drill record | verified |
| `docs/JWT_ROTATION.md` | Docs | JWT/signing-secret procedure | verified |
| `apps/{api,worker}/.env.example`, `infra/digitalocean/.env.example` | Config | Key coverage | verified |
| `secret-history-scan.yml`, `.gitleaks.toml` | CI | Leak detection | verified |
| `apps/web/lib/env.ts` + `apps/web/Dockerfile` | Code/config | Localhost fallback claim | partial (SECRET-P3-002) |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| SECRET-P1-001 | P1 | M365 dead config / real value undocumented | verified-fixed | `M365_CLIENT_STATE` single authoritative value; env.ts:102-105; delivered + read |
| SECRET-P1-002 | P1 | Deploy misses secret-class vars | verified-fixed | printf block :763-815 + envs; env-parity clean |
| SECRET-P1-003 | P1 | Rotation procedures target wrong env | verified-fixed | consuming-env table :28-37; procedures :329-357, :374-383 |
| SECRET-P2-001 | P2 | Inventory/matrix lag schema | partially-fixed | matrix covers keys; inventory omits REDIS_PASSWORD, VAPID_PRIVATE_KEY, MALWARE_SCANNER_API_KEY |
| SECRET-P2-002 | P2 | Reminder workflow missing; no real rotation | partially-fixed | reminder exists; log has only initial + 2026-10-12 dry-run |
| SECRET-P2-003 | P2 | Diff-only scanning | verified-fixed | weekly full-history gitleaks + artifact |
| SECRET-P2-004 | P2 | `prod.tfvars` tracked | verified-fixed | only `.example` tracked |
| SECRET-P2-005 | P2 | SCHEDULE_DISPATCH_TOKEN uncovered | verified-fixed | documented retired (matrix:157-159; log #48) |
| SECRET-P2-006 | P2 | Rotation documented, never exercised | partially-fixed | desk dry-run recorded; no live drill yet (doc says so) |
| SECRET-P2-007 | P2 | IR points at missing runbook | verified-fixed | SECRET_ROTATION_RUNBOOK.md exists + referenced |
| SECRET-P2-008 | P2 | tfplan artifacts leak values | verified-fixed | sanitized text only; in-job re-plan |
| SECRET-P2-009 | P2 | JWT runbook wrong target | verified-fixed | JWT_ROTATION.md rotates Supabase signing secret first |
| SECRET-P3-001 | P3 | Worker .env.example omits APP_BASE_URL | verified-fixed | apps/worker/.env.example:56 |
| SECRET-P3-002 | P3 | Web validator localhost fallback | partially-fixed | throw exists (env.ts:87-92) but Dockerfile ENV default pre-populates (Dockerfile:24,47); deploy always passes it |
| SECRET-P3-003 | P3 | No break-glass runbook/drill | verified-fixed | runbook + dry-run record; live drill operator-gated |
| SECRET-P3-004 | P3 | No rotation evidence | verified-fixed | honest evidence state + log + reminder; no production rotation yet |
| SECRET-P3-005 | P3 | No env parity check | verified-fixed | check-env-parity wired + self-test; clean |

## Recommendations

- **This week**: add `REDIS_PASSWORD`, `VAPID_PRIVATE_KEY`, `MALWARE_SCANNER_API_KEY` rows to the rotation inventory (and the public/non-secret VAPID/RLS flags if desired) so every secret-class compose key has an owner and cadence (SECRET-P2-001).
- **This month**: run the first live rotation on a non-critical `dev` secret (rotate → confirm old value rejected → record) to close SECRET-P2-006; remove the Dockerfile `NEXT_PUBLIC_API_URL` default or make the build fail when the arg is absent (SECRET-P3-002).
- **This quarter**: keep the quarterly reminder cadence; re-check exception/escrow custody in the runbook.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which provider tokens are actually in use (DO/Supabase/GitLab/OpenAI)? | Decides scanner-pattern priority (SC-P3-009) | operator token inventory |
| Has any prod secret rotated since 2026-10-12? | Closes SECRET-P2-006 | Rotation Log row + run URL |
