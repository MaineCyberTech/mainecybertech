# 11_supply_chain_dependency_secrets — Prompt 11 - Supply Chain, Dependency, and Secrets Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `11_supply_chain_dependency_secrets.md` (area SC, prompt)

## Verification Performed

Domain subagent produced 26 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

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
