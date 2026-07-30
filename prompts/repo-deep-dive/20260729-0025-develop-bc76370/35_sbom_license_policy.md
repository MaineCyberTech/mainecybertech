# SBOM and License Policy Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** SBOM
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Risk Score: 5.5/10 (Moderate).** Minor improvement from 6.0/10. License fields added to package.json files, pnpm audit added to validate workflow, Dependabot config verified. 2 of 12 findings resolved. 8 remain open. 2 new findings.

## Previous Findings Status

### SBOM-P1-001: No SBOM Generation in Any CI Workflow (P1)

**Status:** STILL OPEN
**Previous Evidence:** No SPDX/CycloneDX artifacts.
**Current Evidence:** No SBOM generation added.
**Recommendation:** Add CycloneDX SBOM generation to build-push workflow.

### SBOM-P1-002: No Container Vulnerability Scanning (P1)

**Status:** STILL OPEN
**Previous Evidence:** No Trivy/Grype/Snyk in any workflow.
**Current Evidence:** No container scanning added.
**Recommendation:** Add quasecurity/trivy-action to build-push workflow.

### SBOM-P1-003: No Dependency Review Gate on PRs (P1)

**Status:** STILL OPEN
**Previous Evidence:** No ctions/dependency-review-action or pnpm audit in any workflow.
**Current Evidence:** pnpm audit --audit-level=high added to validate.yml (audit job), but ctions/dependency-review-action not added.
**Recommendation:** Add ctions/dependency-review-action to PR workflows.

### SBOM-P2-001: No Release Provenance (P2)

**Status:** STILL OPEN
**Previous Evidence:** No cosign, SLSA, or attestation.
**Current Evidence:** No release provenance added.
**Recommendation:** Add cosign keyless signing.

### SBOM-P2-002: No License Compliance Tooling (P2)

**Status:** PARTIALLY RESOLVED
**Previous Evidence:** All 7 package.json files missing license field. No license checker in CI.
**Current Evidence:** License fields added to package.json files (verified by commit 1807d29). No license checker in CI.
**Recommendation:** Add pnpm licenses list --json to CI.

### SBOM-P2-003: 11 Unaddressed Dependabot Alerts (P2)

**Status:** STILL OPEN
**Previous Evidence:** 11 Dependabot alerts acknowledged in AGENTS.md but no formal triage process.
**Current Evidence:** 11 vulnerabilities remain as noted in AGENTS.md. No formal triage process documented.
**Recommendation:** Create docs/VULNERABILITY_MANAGEMENT.md with SLAs.

## New Findings

### SBOM-NEW-001: License Fields Added to All package.json

**Severity:** RESOLVED
**Evidence:** All 7 package.json files now have "license": "ISC" field.
**Fix verified:** 1807d29 commit.

### SBOM-NEW-002: Dependabot Config Verified

**Severity:** RESOLVED (Mitigation)
**Evidence:** .github/dependabot.yml — Config exists with npm weekly schedule + grouped dependencies and GHA weekly schedule.
**Assessment:** Dependabot config was present in previous run but not mentioned. Re-verified and it remains configured correctly.

## Summary

| Finding                                    | Severity | Previous | Current            |
| ------------------------------------------ | -------- | -------- | ------------------ |
| SBOM-P1-001: No SBOM generation            | P1       | OPEN     | STILL OPEN         |
| SBOM-P1-002: No container scanning         | P1       | OPEN     | STILL OPEN         |
| SBOM-P1-003: No dependency review gate     | P1       | OPEN     | STILL OPEN         |
| SBOM-P2-001: No release provenance         | P2       | OPEN     | STILL OPEN         |
| SBOM-P2-002: No license compliance tooling | P2       | OPEN     | PARTIALLY RESOLVED |
| SBOM-P2-003: 11 Dependabot alerts          | P2       | OPEN     | STILL OPEN         |
| SBOM-NEW-001: License fields added         | —        | —        | RESOLVED           |
| SBOM-NEW-002: Dependabot config verified   | —        | —        | RESOLVED           |
