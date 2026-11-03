# 36_container_runtime_security — Prompt 36 - Container Runtime Security Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `36_container_runtime_security.md` (area CTR, prompt)

## Verification Performed

Domain subagent produced 19 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| CTR-P1-001 | P1 | No Container Image Vulnerability Scan in CI |
| CTR-P1-002 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation |
| CTR-P1-003 | P1 | Unsigned Images With No Provenance/Attestation |
| CTR-P2-001 | P2 | Pinned Base-Image Digests Have No Automated Refresh |
| CTR-P2-002 | P2 | Local Compose Ships Default Credentials and Repo-Wide Bind Mount |
| CTR-P2-003 | P2 | Redis Password Exposed on Process Argument Vector |
| CTR-P2-004 | P2 | Deploy Health Gate Ignores Worker Health |
| CTR-P2-005 | P2 | No Container Resource/PID Limits Beyond Memory |
| CTR-P2-006 | P2 | Deploy verifies attestations by digest but pulls and runs images by tag (TOCTOU) |
| CTR-P3-001 | P3 | Missing `--start-period` on API and Worker Healthchecks |
| CTR-P3-002 | P3 | Broad `.dockerignore` `*.md`/`*.txt`/`*.log` Could Mask Needed Build Files |
| CTR-P3-003 | P3 | Caddy runs with a writable rootfs and a writable Caddyfile bind mount |
| CTR-P3-004 | P3 | Prometheus has no healthcheck and observability is outside the deploy health gate |
| CTR-P3-005 | P3 | Image-level HEALTHCHECK for api and worker lacks `--start-period` |
| CTR-P3-006 | P3 | infra/digitalocean operator docs and `.env.example` drift from the deployed stack |
| CTR-P3-007 | P3 | Third-party pinned images are not vulnerability-scanned in CI |
| CTR-P3-008 | P3 | No Dockerfile lint gate in CI |
| CTR-P2-007 | P2 | NEW: global .trivyignore suppresses fixable HIGH CVEs in the new node-exporter image |
| CTR-P3-009 | P3 | NEW: node-exporter healthcheck only runs --version, not a real scrape probe |
