# Container Runtime Security Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: CTR · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope: app Dockerfiles, root + `infra/digitalocean` compose, deploy health/rollback path, image scanning/SBOM/attestation, `.dockerignore`, third-party pins. Read-only.

## Executive Summary

All 17 previous CTR rows were re-verified: **16 verified-fixed, 1 partially-fixed, 0 open, 0 regressed**. The container estate is hardened: non-root users, digest-pinned base images (automated refresh via Dependabot), dropped npm/corepack from runtime images, `cap_drop: ALL` + `no-new-privileges` + read-only rootfs + tmpfs + `mem_limit`/`pids_limit` on every service, Redis password off argv, healthchecks with `--start-period` on every service and all of them asserted by the deploy gate, and images pulled/run by attestation-verified digests (no TOCTOU). Image vulnerability scanning, digest-bound SBOMs, and build-provenance attestations all run on the deploy path; third-party images get weekly scans + SBOMs; hadolint gates Dockerfile hygiene.

The single residual is CTR-P2-002: the local e2e runner still bind-mounts the whole repository (`.:/app`), which is deliberate (the harness reads the working tree), profile-gated, and now requires an explicit `E2E_ADMIN_PASSWORD` with no shipped default.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `apps/{api,web,worker}/Dockerfile` | Config | Base pins, users, healthchecks, hardening | verified |
| `infra/digitalocean/docker-compose.yml` (415 lines) | Config | Security opts, limits, healthchecks, pins | verified |
| `docker-compose.yml` (root, e2e profile) | Config | Local creds / bind mount | partial (CTR-P2-002) |
| `deploy-do.yml` deploy/health gate | Workflow | Digest pull, gate, rollback | verified |
| `third-party-image-scan.yml`, `build-push.yml`, `deploy-do.yml` build jobs | Workflows | Scan/SBOM/attest | verified |
| `.dockerignore`, `.github/dependabot.yml`, `.github/actions/dockerfile-lint` | Config | Hygiene + refresh + lint gate | verified |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| CTR-P1-001 | P1 | No image vuln scan | verified-fixed | Trivy image scans CRITICAL/HIGH exit 1; npm/corepack dropped; libcrypto3/ssl3 upgraded |
| CTR-P1-002 | P1 | SBOM lockfile-only | verified-fixed | per-image CycloneDX SBOMs bound to digest |
| CTR-P1-003 | P1 | Unsigned images | verified-fixed | provenance + SBOM attestations, verified pre-deploy |
| CTR-P2-001 | P2 | No automated base-pin refresh | verified-fixed | Dependabot docker entries for `/`, app dirs, `infra/digitalocean` |
| CTR-P2-002 | P2 | Local compose default creds + repo-wide bind mount | partially-fixed | e2e profile-gated; `E2E_ADMIN_PASSWORD:?` required; residual: deliberate `.:/app` mount (documented) |
| CTR-P2-003 | P2 | Redis password on argv | verified-fixed | entrypoint + env-only password; `REDISCLI_AUTH` healthcheck |
| CTR-P2-004 | P2 | Health gate ignores worker | verified-fixed | worker healthcheck + SSH probe + gate |
| CTR-P2-005 | P2 | No resource/PID limits | verified-fixed | mem_limit + pids_limit on all 7 services |
| CTR-P2-006 | P2 | Pull by tag TOCTOU | verified-fixed | deploy runs verified digests |
| CTR-P3-001 | P3 | Missing start-period (compose) | verified-fixed | all compose healthchecks have start_period |
| CTR-P3-002 | P3 | Broad .dockerignore patterns | verified-fixed | narrow explicit ignores |
| CTR-P3-003 | P3 | Caddy writable rootfs/mount | verified-fixed | read_only + `:ro` + NET_BIND_SERVICE only |
| CTR-P3-004 | P3 | Prometheus healthcheck missing | verified-fixed | `/-/ready` probe + in gate |
| CTR-P3-005 | P3 | Image HEALTHCHECK start-period | verified-fixed | all three Dockerfiles |
| CTR-P3-006 | P3 | Operator docs/.env.example drift | verified-fixed | .env.example complete; README current |
| CTR-P3-007 | P3 | Third-party images unscanned | verified-fixed | weekly scan + SBOM + alert |
| CTR-P3-008 | P3 | No Dockerfile lint gate | verified-fixed | hadolint in test + validate gates |

## Recommendations

- **This month**: keep the e2e bind mount as an explicit opt-in (CTR-P2-002) — consider mounting only the paths the harness needs if the mount can be narrowed without breaking auth artifacts; document the decision in `docker-compose.yml` (already commented).
- **This quarter**: refresh the pinned third-party digests from the weekly scan results and re-pin; keep `ignore-unfixed: true` semantics consistent across app and third-party scans.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Do the pinned third-party images currently have fixable CRITICAL/HIGH findings? | A red weekly scan is actionable debt | latest `third-party-image-scan` run |
| Is the worker healthcheck actually asserted on prod deploys? | Prod deploy gate is operator-gated | next prod deploy run |
