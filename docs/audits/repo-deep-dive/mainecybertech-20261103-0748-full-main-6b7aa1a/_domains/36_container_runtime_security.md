# Container Runtime Security Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `CTR`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/36_container_runtime_security.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

Dockerfiles, production/local compose, base images/digests, non-root/runtime hardening, healthchecks, resource limits, third-party image scans, SBOM/attestations, .dockerignore, observability container.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `docker run prom/node-exporter:v1.12.1 --version` (executed) | Runtime | Healthcheck behavior | exits 0 without starting the server (CTR-P3-009) |
| Trivy image scan of the pinned node-exporter digest (executed) | Scan | CVE exposure | 15 HIGH / 14 unique CVEs without `.trivyignore`; 0 with it (CTR-P2-007) |
| `infra/digitalocean/docker-compose.yml` | Config | Limits/users/read-only/healthchecks | mem/pids limits; node-exporter read-only, user nobody, cap_drop ALL |
| `deploy-do.yml` GATED_SERVICES | Config | Deploy health gate | includes node-exporter (1070) |
| `docker-compose.yml` e2e profile | Config | Local credentials/bind mount | password required; `.:/app` remains (CTR-P2-002) |

## Executive Summary

First-party image hardening remains intact (non-root, read-only roots, cap_drop ALL, pids/mem limits, digest-pinned images, attestations, image scans). The Nov 2-3 change added `prom/node-exporter` and a `.trivyignore` exception file. The new image is built with Go 1.26.5 and has 15 fixable HIGH findings; all 14 unique CVEs are in the global `.trivyignore`, so the weekly third-party scan reports it clean (CTR-P2-007). Its compose healthcheck only runs `--version`, not a real scrape probe, while the deploy gate trusts `healthy` (CTR-P3-009). The local e2e repo-wide bind mount remains the only partial from the prior set (CTR-P2-002).

**Totals:** 19 findings — P0 0, P1 3, P2 7, P3 9. Status: open 2, partially-fixed 1, regressed 1, verified-fixed 15.

**New this run:** CTR-P2-007, CTR-P3-009.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI | verified-fixed | re-verified at 6b7aa1a: Trivy image scans still run in deploy-do.yml build jobs and build-push.yml; note the new third-party exception blind spot in CTR-P2-007. |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation | verified-fixed | re-verified at 6b7aa1a: per-image Trivy CycloneDX SBOMs bound to the pushed digest and attested (deploy-do.yml:240-274 etc.). |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation | verified-fixed | re-verified at 6b7aa1a: build-provenance attestations per image + fail-closed verification before deploy (deploy-do.yml:430-520); docs/CI.md:60-123 documents the policy. |
| CTR-P2-001 | P2 | Pinned Base-Image Digests Have No Automated Refresh | verified-fixed | re-verified at 6b7aa1a: .github/dependabot.yml has weekly docker entries for /, /apps/api, /apps/web, /apps/worker, /infra/digitalocean, so Dockerfile + compose digest pins get PRs. |
| CTR-P2-002 | P2 | Local Compose Ships Default Credentials and Repo-Wide Bind Mount | partially-fixed | at 6b7aa1a the e2e service is profile-gated and requires E2E_ADMIN_PASSWORD with no default (docker-compose.yml:73,91); residual: the e2e runner still bind-mounts the whole repo (.:/app, :83) - deliberate, documented, explicit opt-in only. |
| CTR-P2-003 | P2 | Redis Password Exposed on Process Argument Vector | verified-fixed | re-verified at 6b7aa1a: infra/digitalocean/docker-compose.yml:35-80 runs redis as the redis user via redis-entrypoint.sh, passes REDIS_PASSWORD by environment only, and the healthcheck uses REDISCLI_AUTH (not -a). |
| CTR-P2-004 | P2 | Deploy Health Gate Ignores Worker Health | verified-fixed | re-verified at 6b7aa1a: worker has a compose healthcheck (docker-compose.yml:220-230) and the deploy gate asserts the full GATED_SERVICES list including worker (deploy-do.yml:1070-1085) plus an SSH worker /health probe (:1170-1195). |
| CTR-P2-005 | P2 | No Container Resource/PID Limits Beyond Memory | verified-fixed | re-verified at 6b7aa1a: every service sets mem_limit + pids_limit (redis 48m/128; api/worker/web/prometheus 256m/256; caddy 64m/128; alertmanager 128m/128); CPU caps deliberately unset on the 1-vCPU box (documented). |
| CTR-P2-006 | P2 | Deploy verifies attestations by digest but pulls and runs images by tag (TOCTOU) | verified-fixed | re-verified at 6b7aa1a: verify-attestations outputs digests; deploy exports MCT_*_IMAGE=<repo>@sha256:... and refuses to run without them (:894-905); compose prefers the digest refs. |
| CTR-P3-001 | P3 | Missing `--start-period` on API and Worker Healthchecks | verified-fixed | re-verified at 6b7aa1a: start_period is set on api/worker/node-exporter/prometheus/alertmanager/caddy compose healthchecks (docker-compose.yml:157, :230, :303, :343, :409, :439). |
| CTR-P3-002 | P3 | Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files | verified-fixed | re-verified at 6b7aa1a: .dockerignore uses explicit narrow paths (no blanket *.md/*.txt/*.log), with a comment on why. |
| CTR-P3-003 | P3 | Caddy runs with a writable rootfs and a writable Caddyfile bind mount | verified-fixed | re-verified at 6b7aa1a: caddy read_only:true + tmpfs /tmp, Caddyfile/certs mounted :ro, cap_add limited to NET_BIND_SERVICE (docker-compose.yml:412-451). |
| CTR-P3-004 | P3 | Prometheus has no healthcheck and observability is outside the deploy health gate | verified-fixed | re-verified at 6b7aa1a: prometheus /-/ready healthcheck (:337-343) and alertmanager healthcheck (:404-409); both are in GATED_SERVICES (deploy-do.yml:1070). |
| CTR-P3-005 | P3 | Image-level HEALTHCHECK for api and worker lacks `--start-period` | verified-fixed | re-verified at 6b7aa1a: apps/api/Dockerfile, apps/worker/Dockerfile and apps/web/Dockerfile HEALTHCHECKs all carry --start-period. |
| CTR-P3-006 | P3 | infra/digitalocean operator docs and `.env.example` drift from the deployed stack | regressed | regressed at 6b7aa1a by the Nov 2-3 infra bumps: infra/digitalocean/README.md:16-17 still lists prom/prometheus v3.5.1 / prom/alertmanager v0.28.1 while compose runs v3.15.1 / v0.29.0 (docker-compose.yml:306,354), and the service table omits node-exporter (:271). The .env.example side remains correct (METRICS_TOKEN :111, ALERTMANAGER_* block), but the operator README no longer documents the deployed stack; same drift as INFRA-P2-003. |
| CTR-P3-007 | P3 | Third-party pinned images are not vulnerability-scanned in CI | verified-fixed | re-verified at 6b7aa1a: third-party-image-scan.yml resolves every literal digest-pinned ref from infra/digitalocean/docker-compose.yml (now five, including node-exporter), fails on any unpinned literal ref (:50-63), Trivy-scans each weekly and emits SBOMs + ntfy/Slack alert. See CTR-P2-007 for the .trivyignore over-breadth on node-exporter. |
| CTR-P3-008 | P3 | No Dockerfile lint gate in CI | verified-fixed | re-verified at 6b7aa1a: hadolint gate wired in test.yml:60 and validate.yml:62 (.github/actions/dockerfile-lint, digest-pinned image, --failure-threshold warning). |
| CTR-P2-007 | P2 | NEW: global .trivyignore suppresses fixable HIGH CVEs in the new node-exporter image | open | NEW at 6b7aa1a: infra/digitalocean/docker-compose.yml:271-272 adds prom/node-exporter v1.12.1 (built with Go 1.26.5). .trivyignore:20-67 is passed to every matrix image (third-party-image-scan.yml:90-94) and its Go block says 'shared across the three images' (caddy/prometheus/alertmanager). Reproduced with the pinned image: Trivy without .trivyignore reports 15 HIGH (0 critical) fixable findings across 14 unique CVEs, all 14 present in .trivyignore; with .trivyignore Trivy reports 0. The new fifth image's weekly... |
| CTR-P3-009 | P3 | NEW: node-exporter healthcheck only runs --version, not a real scrape probe | open | NEW at 6b7aa1a: node-exporter's compose healthcheck is ['CMD','/bin/node_exporter','--version'] (docker-compose.yml:296-301), which only proves the binary executes; it does not bind :9100, read /host/proc\|/sys\|/rootfs, or scrape. The deploy gate treats 'healthy' as the gate (deploy-do.yml:1070-1080), so a running exporter with broken mounts/metrics passes. Reproduced: --version exits 0 without starting the server. |

## New Findings Detail

### CTR-P2-007 — NEW: global .trivyignore suppresses fixable HIGH CVEs in the new node-exporter image (P2, open)

- **Evidence:** NEW at 6b7aa1a: infra/digitalocean/docker-compose.yml:271-272 adds prom/node-exporter v1.12.1 (built with Go 1.26.5). .trivyignore:20-67 is passed to every matrix image (third-party-image-scan.yml:90-94) and its Go block says 'shared across the three images' (caddy/prometheus/alertmanager). Reproduced with the pinned image: Trivy without .trivyignore reports 15 HIGH (0 critical) fixable findings across 14 unique CVEs, all 14 present in .trivyignore; with .trivyignore Trivy reports 0. The new fifth image's weekly scan is therefore green while its HIGH findings are suppressed.
- **Owner:** platform/infrastructure · **Target:** this month

### CTR-P3-009 — NEW: node-exporter healthcheck only runs --version, not a real scrape probe (P3, open)

- **Evidence:** NEW at 6b7aa1a: node-exporter's compose healthcheck is ['CMD','/bin/node_exporter','--version'] (docker-compose.yml:296-301), which only proves the binary executes; it does not bind :9100, read /host/proc|/sys|/rootfs, or scrape. The deploy gate treats 'healthy' as the gate (deploy-do.yml:1070-1080), so a running exporter with broken mounts/metrics passes. Reproduced: --version exits 0 without starting the server.
- **Owner:** platform/infrastructure · **Target:** this quarter

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| Local Compose Ships Default Credentials and Repo-Wide Bind Mount | P2 | CTR-P2-002 | Fix/verify per the finding |
| infra/digitalocean operator docs and `.env.example` drift from the deployed stack | P3 | CTR-P3-006 | Fix/verify per the finding |
| NEW: global .trivyignore suppresses fixable HIGH CVEs in the new node-exporter image | P2 | CTR-P2-007 | Fix/verify per the finding |
| NEW: node-exporter healthcheck only runs --version, not a real scrape probe | P3 | CTR-P3-009 | Fix/verify per the finding |

## Recommendations

- **Immediate:** scope `.trivyignore` per image or add a node-exporter-specific exception file; do not let the caddy/prometheus/alertmanager Go CVEs suppress the new image (CTR-P2-007).
- **This month:** replace the `--version` healthcheck with a real exporter probe or add an `up{job="node-exporter"} == 0` alert (CTR-P3-009); update the operator README/docs (CTR-P3-006 / INFRA-P2-003).
- **This quarter:** decide whether the e2e repo bind mount can be narrowed (CTR-P2-002).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is node-exporter's Go 1.26.5 binary actually affected by every ignored CVE? | Some may be module-only; Trivy reports them as fixed findings | Per-CVE Trivy review |
| Can a real node-exporter probe run in the scratch image? | Healthcheck currently proves only process execution | Option: sidecar probe or Prometheus `up` alert |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
