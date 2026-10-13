# 11_supply_chain_dependency_secrets — Prompt 11 - Supply Chain, Dependency, and Secrets Audit

- Run: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Target: `mainecybertech` @ `905ed63` (branch `develop`)
- Domain: `11_supply_chain_dependency_secrets.md` (area SC, prompt)

## Verification Performed

# Supply Chain, Dependency, and Secrets — re-audit verification (develop @ 905ed63)

Read-only verification at `905ed63`; no install/audit run. All 26 previous SC rows were re-checked: 24 verified fixed, 2 partially fixed (platform token formats in the fast diff scanner; Dependabot repo-level security-update separation). No new supply-chain regression was found.

Key evidence: `package.json` overrides (incl. the two-branch `next` range) mirrored at `pnpm-lock.yaml:23`; `scripts/audit-gate.mjs` + `security/dependency-audit-policy.json` (expiry-enforced allowlist) and `scripts/license-gate.mjs` + `security/license-policy.json` (expiry-enforced exceptions) wired through `.github/actions/dependency-audit/action.yml`; `scripts/ci/check-supply-chain-gates.mjs` fixture self-test; Trivy image scans with `exit-code: 1` in `build-push.yml`/`deploy-do.yml`; `actions/attest-sbom` + `actions/attest-build-provenance` produced and verified; `scripts/generate-sbom.mjs` commit binding + `scripts/validate-sbom.mjs` floor/digest checks; `release.yml` attaches the lockfile SBOM; `secret-history-scan.yml` (checksum-pinned gitleaks, artifact, failure notifier); `.gitleaks.toml` + `scripts/ci/verify-gitleaks-config.sh` + negative fixture; `.github/actions/secret-scan/action.yml` before-SHA diff scan + tracked-secret-file guard; `infra/digitalocean/docker-compose.yml` third-party images digest-pinned with the `third-party-image-scan.yml` guard; `dependency-rescan.yml` (weekly advisory re-scan + report-only `pnpm dedupe --check`); `dependabot-triage-reminder.yml` + `docs/DEPENDENCY_POLICY.md` SLA; docs commands and SECURITY.md SBOM statements reconciled.

## Findings

| ID | Severity | Title |
|---|---|---|
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped |
| SC-P2-001 | P2 | No image-level container scanning; Trivy scans filesystem only |
| SC-P2-002 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused |
| SC-P2-003 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present |
| SC-P2-004 | P2 | SBOM is generated but not bound to a commit or attached to releases/images |
| SC-P2-005 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions |
| SC-P2-006 | P2 | `licenses.json` is committed but unenforced and unverified |
| SC-P2-007 | P2 | Swagger UI loads an unpinned third-party script without SRI |
| SC-P2-008 | P2 | Deploy-gate secret scan is a no-op on pushes to main |
| SC-P2-009 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact |
| SC-P2-010 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it |
| SC-P2-011 | P2 | Scheduled full-history secret scan has no failure notification |
| SC-P3-001 | P3 | Root package license remains "ISC" |
| SC-P3-002 | P3 | e2e Docker image is not digest-pinned |
| SC-P3-003 | P3 | Secret-scanner pattern sets diverge between `.sh` and `.ps1` |
| SC-P3-004 | P3 | Unpinned container images (test/local only); production app images tag-based by design |
| SC-P3-005 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK |
| SC-P3-006 | P3 | SBOM is produced as a transient artifact, not bound to a release |
| SC-P3-007 | P3 | A secrets file exists on disk outside git (should never be committed) |
| SC-P3-008 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) |
| SC-P3-009 | P3 | Secret scanner misses the platform's own token formats and scans diffs only |
| SC-P3-010 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks |
| SC-P3-011 | P3 | Dependency and license policy `expires` dates are not enforced by the gates |
| SC-P3-012 | P3 | Docs instruct the broken `pnpm licenses list --json` workflow while CI uses collect-licenses.mjs |
| SC-P3-013 | P3 | SECURITY.md says neither SBOM is signed or attested, contradicting the attested image-SBOM process |
| SC-P3-014 | P3 | No automated unused/duplicate dependency check; lockfile carries 55 multi-version packages |
