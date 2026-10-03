# SBOM and License Policy Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** SBOM

## Executive Summary

**Risk Score: 6.0/10 (Moderate-High).** Strong foundations: lockfile integrity, dependency overrides for 7 vulnerable packages, build script restriction, Dependabot configured. **Critical gaps:** no SBOM generation, no container scanning, no dependency review gate, no release provenance, no license fields in any package.json.

**12 findings** (5 P1, 4 P2, 3 P3)

## Key Findings

### SBOM-P1-001: No SBOM Generation in Any CI Workflow

**Evidence:** No SPDX/CycloneDX artifacts. No tooling installed.
**Recommendation:** Add CycloneDX SBOM generation to `build-push.yml`.

### SBOM-P1-002: No Container Vulnerability Scanning

**Evidence:** No Trivy/Grype/Snyk in any workflow. Base image and dep vulnerabilities undetected until runtime.
**Recommendation:** Add `aquasecurity/trivy-action` to `build-push.yml`.

### SBOM-P1-003: No Dependency Review Gate on PRs

**Evidence:** No `actions/dependency-review-action` or `pnpm audit` in any workflow.
**Recommendation:** Add to PR workflows and `validate.yml`.

### SBOM-P2-001: No Release Provenance

**Evidence:** No cosign, SLSA, or attestation.
**Recommendation:** Add cosign keyless signing.

### SBOM-P2-002: No License Compliance Tooling

**Evidence:** All 7 `package.json` files missing `license` field. No license checker in CI.
**Recommendation:** Add `"license": "ISC"` to all manifests. Add `pnpm licenses list --json` to CI.

### SBOM-P2-003: 11 Unaddressed Dependabot Alerts

**Evidence:** Acknowledged in AGENTS.md but no formal triage process.
**Recommendation:** Create `docs/VULNERABILITY_MANAGEMENT.md` with SLAs.

## Quick Wins

1. Add `"license": "ISC"` to all 7 `package.json` — 10 min
2. Add `pnpm audit --audit-level=high` to `validate.yml` — 15 min
3. Add `actions/dependency-review-action` to PRs — 15 min
4. Triage 11 Dependabot alerts — 1 hour
5. Verify `supabase-cli@0.0.21` (potential typo-squatting) — 15 min
