# Deterministic lens re-audit (DET) — 7dd0402

- Domain: deterministic (machine checks, no LLM)
- Area: DET
- Repo: MaineCyberTech/mainecybertech @ `7dd0402` (origin/main, 2026-10-13)
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Tool: `python3 tools/deterministic_checks.py /tmp/opencode/mct-reaudit-g7 -o /tmp/opencode/det-out`
  (accepts flags; run read-only against the worktree)
- Result: 2 findings, both P3 — same IDs and same static text as the previous run.

## Executive summary

The deterministic sweep is unchanged at the text level: the sandbox has no
gitleaks binary, and the compose file still carries tag-based fallbacks for the
three mct-* images. Re-verifying the two rows against the repo (not the sandbox)
shows both were remediated operationally:

1. **DET-P3-001** — gitleaks is pinned (8.30.1) and checksum-verified in
   `.github/workflows/secret-history-scan.yml:27-40`; the workflow runs the
   full-history scan plus an allowlist negative probe. The lens row is an
   artifact of the audit host, not a repo gap.
2. **DET-P3-002** — the deploy path resolves every tag to its manifest digest,
   verifies provenance + SBOM attestations, and fails closed without digests
   (`deploy-do.yml:897-904`); `third-party-image-scan.yml:39-61` enforces
   digest pinning for every literal image ref. The three mct-* compose
   fallbacks are the documented manual-operator exception.

## Findings

| ID | Severity | Title | Status | Evidence |
|---|---|---|---|---|
| DET-P3-001 | P3 | [SEC] gitleaks not installed (secret scan skipped) | verified-fixed | secret-history-scan.yml:27-40,42-47; scripts/ci/verify-gitleaks-config.sh |
| DET-P3-002 | P3 | [SUPPLY] 3 container image(s) without a digest pin | verified-fixed | deploy-do.yml:897-904; third-party-image-scan.yml:51-61; docker-compose.yml:74-80,82,160,233 |

No new DET findings: the tool's other check families (PORT, CI, DEP, GIT, DOC)
produced no output at 7dd0402.

## Recommendations

- Keep the gitleaks version + SHA-256 pair in one place (the workflow env) and
  refresh both together when bumping; the comment at
  `secret-history-scan.yml:30-31` already says so.
- Leave the compose tag fallback only as long as the manual path is documented;
  the third-party-image-scan guard already prevents new unpinned literal refs.
