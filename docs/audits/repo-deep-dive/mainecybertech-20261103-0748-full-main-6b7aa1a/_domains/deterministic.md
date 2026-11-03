# Deterministic lens re-audit (DET) — 6b7aa1a

- Domain: deterministic (machine checks, no LLM)
- Area: DET
- Repo: MaineCyberTech/mainecybertech @ `6b7aa1a` (origin/main, 2026-11-03)
- Previous run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Tool: `python3 tools/deterministic_checks.py /tmp/opencode/mct-nov-g7 -o /tmp/opencode/det-out-nov`
- Result: the tool emits the same two P3 rows as the previous run; both re-verify as
  fixed against the repo. One new documentation-level P3 on the image-scan header.

## Executive summary

The deterministic sweep is text-identical to 7dd0402: the sandbox has no
gitleaks binary and the compose file still carries tag-based fallbacks for the
three mct-* images. Re-verifying against the repo (not the sandbox) confirms:

1. **DET-P3-001** — gitleaks 8.30.1 is pinned by release tarball and its
   SHA-256 is checked before install; the checksum matches the published
   v8.30.1 checksums file. The lens row is an audit-host artifact.
2. **DET-P3-002** — every literal container image is digest-pinned, including
   the new `node-exporter` (`prom/node-exporter:v1.12.1@sha256:1b4e4438...`).
   All five Docker Hub digests were resolved against the live tag metadata and
   match. App images are resolved to digests and attestation-verified at deploy
   time; the three compose fallbacks are the documented manual-operator path.
3. **DET-P3-003 (new)** — the third-party-image-scan header still describes
   four images and omits `node-exporter`; the dynamic resolver does scan it, so
   this is documentation drift, not a coverage hole.

## Findings

| ID | Severity | Title | Status | Evidence |
|---|---|---|---|---|
| DET-P3-001 | P3 | [SEC] gitleaks not installed (secret scan skipped) | verified-fixed | secret-history-scan.yml:27-40,44-48; verify-gitleaks-config.sh:1-54 |
| DET-P3-002 | P3 | [SUPPLY] 3 container image(s) without a digest pin | verified-fixed | deploy-do.yml:897-904; third-party-image-scan.yml:51-61; docker-compose.yml:35,272,306,354,413 |
| DET-P3-003 | P3 | Image-scan header still says four images, omits node-exporter | open (new) | third-party-image-scan.yml:3-4; docker-compose.yml:271-272 |

## Verification detail

- `gitleaks` pin: version `8.30.1`, SHA-256
  `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`,
  matching `gitleaks_8.30.1_checksums.txt`.
- Image digests (all resolved via the Docker Hub tag API):
  - `redis:7-alpine` → `8da19c73...` (compose :35)
  - `prom/node-exporter:v1.12.1` → `1b4e4438...` (compose :272, new)
  - `prom/prometheus:v3.15.1` → `fa330227...` (compose :306)
  - `prom/alertmanager:v0.29.0` → `88743b63...` (compose :354)
  - `caddy:2-alpine` → `e70b164d...` (compose :413)
- The deploy path refuses to run without all three app digests
  (`deploy-do.yml:897-904`) and exports `@sha256` refs at :902-904.

## Recommendations

- Update the third-party-image-scan header to five images and name
  `node-exporter` (DET-P3-003).
- Keep the gitleaks version + SHA-256 pair in one place and refresh both
  together when bumping; the comment at `secret-history-scan.yml:30-31` already
  says so.
- Leave the compose tag fallback only while the manual path is documented; the
  third-party-image-scan guard already prevents new unpinned literal refs.
