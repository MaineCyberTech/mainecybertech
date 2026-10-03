# SBOM and License Policy Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: SBOM
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/35_sbom_license_policy.md
- Scope limitations: No SBOM generation tools installed (cannot test); full `pnpm-lock.yaml` license analysis would require installing the tool. Analysis based on package.json license fields, CI workflows, and Dependabot config.

## Scope

Reviewed SBOM readiness, license declarations in package manifests, dependency review workflow, vulnerability alerting, supply chain verification, and release provenance. Checked all package.json files for license fields, Dependabot configuration, dependency review CI gate, and pnpm audit integration.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| Root `package.json` | Manifest | License field "ISC" | Non-standard license choice |
| `apps/api/package.json` | Manifest | License field | Same as root |
| `apps/web/package.json` | Manifest | License field | Same as root |
| `apps/worker/package.json` | Manifest | License field | Same as root |
| `.github/workflows/dependency-review.yml` | Workflow | License/dependency review gate | Fails on high, no license policy |
| `.github/dependabot.yml` | Config | Dependency updates | Weekly, no versioning strategy for GHA |
| `pnpm audit` output | Audit | Known vulns | 2 high findings |
| `package.json` overrides | Override | Vuln mitigation | 7 transitive deps pinned |
| `.github/workflows/build-push.yml` | Workflow | Docker build | No SBOM generation |
| `.github/workflows/e2e.yml` | Workflow | Test pipeline | No dependency checks |

## Executive Summary

The repository has no SBOM generation capability, no container SBOM, no license policy documentation, and no release provenance/attestation. The `dependency-review.yml` workflow provides basic gatekeeping (fail on high severity) but covers only npm dependencies, not Docker base images or GitHub Actions. The root package.json license is `"ISC"` — an unusual choice for a commercial platform. Dependabot vulnerability alerts are enabled via GitHub's native functionality but no `fail-on-severity` exists in the pnpm audit step. Container SBOM and signing are completely absent.

### Strengths
- Dependency review workflow fails on high-severity (dependency-review.yml:17)
- Dependabot configured for both npm and GitHub Actions
- `pnpm audit` run in validate.yml (though continue-on-error)
- 7 known vulnerability overrides in root package.json

### Major Risks
- No SBOM generated for any release artifact
- No license policy or compliance check
- No release signing/provenance (SLSA)
- No container SBOM (image layers undocumented)
- `dependency-review-action@v4` not pinned to SHA
- Root license `ISC` may not match legal requirements

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| Package manifests | 3 | All package.json files have licenses | License is "ISC" (non-standard) | Update to standard license |
| Lockfiles | 5 | Single pnpm-lock.yaml | None | — |
| Docker images | 1 | No container SBOM | No syft/trivy SBOM generation | Add container SBOM step |
| GitHub Actions | 2 | dependency-review + dependabot | Not pinned to SHA | Pin actions |
| Dependency updates | 4 | Dependabot with groups | No auto-merge for patches | Enable auto-merge |
| License fields | 2 | All say "ISC" | No MIT/Apache-2.0 | Change license |
| Third-party/transitive deps | 3 | Overrides for known vulns | No formal transitive risk audit | Add depcheck |
| SBOM workflows | 0 | None | No SBOM generation | Create SBOM workflow |
| Container SBOM | 0 | None | No container SBOM | Add syft to build |
| Dependency review | 3 | PR gate, fail on high | No license policy | Add license policy |
| Vulnerability alerts | 3 | Dependabot + pnpm audit | pnpm audit continues on error | Fail on critical |
| Release provenance | 0 | None | No signing/attestation | Add SLSA provenance |

## Findings

### Finding ID: SBOM-P1-001 - No SBOM generation in CI or releases

- Severity: P1 - High
- Confidence: High
- Area: SBOM / Supply Chain
- Evidence:
  - No SBOM workflow exists in `.github/workflows/`
  - No `cyclonedx-bom`, `@cyclonedx/cyclonedx-npm`, or `spdx-sbom-generator` in dependencies
  - No `syft` or `trivy` SBOM commands in Docker build steps
- What is happening: The repository builds and deploys containers and an application but never generates a Software Bill of Materials.
- Why it matters: Without an SBOM, responding to supply chain vulnerabilities (e.g., Log4j-style events) requires manual dependency tree analysis. SBOMs are increasingly required for compliance (EO 14028, PCI DSS 4.0).
- User / business impact: Inability to quickly assess vulnerability impact in production.
- Recommended fix: Create `.github/workflows/sbom-generation.yml`:
  - Run `pnpm sbom` using `@cyclonedx/cyclonedx-npm` to generate npm SBOM
  - Use `anchore/sbom-action@v0` for container SBOM
  - Attach SBOM to releases
  - Store SBOM as CI artifact
- Suggested validation: Verify SBOM JSON/XML contains all workspace dependencies.
- Owner suggestion: Platform team
- Effort estimate: 4 hours
- Status: Open

### Finding ID: SBOM-P2-001 - No license policy or compliance check

- Severity: P2 - Medium
- Confidence: High
- Area: License Compliance
- Evidence:
  - `dependency-review.yml:17`: `fail-on-severity: high` only — no license policy
  - No `allow-licenses` or `deny-licenses` configuration
  - Root `package.json:4`: `"license": "ISC"`
  - No `LICENSE` file at repository root
- What is happening: The dependency review action runs but without any license allow/deny policy. It only checks vulnerability severity, not license compliance.
- Why it matters: Without a license policy, copyleft or restricted-license dependencies could be introduced without detection. This creates legal risk for a commercial SaaS platform.
- User / business impact: Potential intellectual property or licensing compliance issues.
- Recommended fix: 
  1. Add `allow-licenses` to dependency-review.yml:
  ```yaml
  - uses: actions/dependency-review-action@v4
    with:
      fail-on-severity: high
      allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense, CC0-1.0
   ```
  2. Create `docs/LICENSE_POLICY.md` documenting approved licenses
  3. Add `LICENSE` file to repo root
- Suggested validation: PR adding a GPL dependency is blocked.
- Owner suggestion: Founder / Legal
- Effort estimate: 1 hour
- Status: Open

### Finding ID: SBOM-P2-002 - dependency-review-action not pinned to SHA

- Severity: P2 - Medium
- Confidence: High
- Area: Supply Chain / GitHub Actions
- Evidence:
  - `dependency-review.yml:15`: `uses: actions/dependency-review-action@v4`
- What is happening: The dependency review action is pinned to a mutable major version tag (`v4`), not a commit SHA.
- Why it matters: Same supply chain risk as other unpinned actions — the tag could be force-pushed to point to a different (potentially malicious) version.
- User / business impact: Same as CI-P1-001 — supply chain attack risk.
- Recommended fix: Pin to exact SHA: `uses: actions/dependency-review-action@<sha>`.
- Suggested validation: CI workflow still passes with SHA pin.
- Owner suggestion: Infrastructure team
- Effort estimate: 15 minutes
- Status: Open

### Finding ID: SBOM-P3-001 - Root package.json license ISC not standard for commercial platform

- Severity: P3 - Low
- Confidence: High
- Area: Licensing
- Evidence:
  - `package.json:4`: `"license": "ISC"`
- What is happening: The monorepo uses the ISC license, which is functionally equivalent to MIT but less standard for commercial SaaS platforms.
- Why it matters: ISC is fine legally but unusual. MIT or Apache-2.0 is more widely recognized and expected by most downstream consumers.
- User / business impact: Negligible.
- Recommended fix: Change to `"MIT"` and add a `LICENSE` file.
- Suggested validation: Update package.json and add LICENSE file.
- Owner suggestion: Founder
- Effort estimate: 15 minutes
- Status: Open

### Finding ID: SBOM-P3-002 - No release provenance or signing

- Severity: P3 - Low
- Confidence: High
- Area: Release Security
- Evidence:
  - No signing step in deploy-do.yml or build-push.yml
  - No cosign or slsa-verifier usage
  - No attestation generation
- What is happening: Docker images and releases are not signed or attested. There is no cryptographic verification that a release artifact came from this repository's CI pipeline.
- Why it matters: Without provenance, consumers cannot verify the integrity or origin of release artifacts.
- User / business impact: Low — no external consumers currently pull images.
- Recommended fix: Add GitHub Attestation or cosign signing to build-push.yml.
- Suggested validation: Verify attestation with `gh attestation verify`.
- Owner suggestion: Platform team
- Effort estimate: 4 hours
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| No SBOM for vuln response | P1 | Medium | High | No SBOM workflow | Add SBOM generation |
| No license compliance | P2 | Low | Medium | No allow-licenses in dep review | Add license policy |
| Dependency review action mutable | P2 | Low | Medium | @v4 tag | Pin to SHA |

## Recommendations

### Immediate / Release Blocking

1. Add SBOM generation workflow (SBOM-P1-001)

### This Week

2. Pin dependency-review-action to SHA (SBOM-P2-002)
3. Add license allow/deny policy to dependency-review.yml (SBOM-P2-001)

### This Month

4. Add `LICENSE` file and update license to MIT (SBOM-P3-001)
5. Add release provenance/signing to build pipeline (SBOM-P3-002)

### Later / Platform Evolution

6. Add container SBOM generation to build-push.yml using syft
7. Implement SLSA Level 1 provenance attestation

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Pin dependency-review-action | Supply chain hardening | dependency-review.yml | CI passes |
| Add license policy | Legal compliance | dependency-review.yml | PR with GPL dep blocked |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| SBOM workflow | P1 | Platform | 4 hours | cyclonedx-bom |
| License policy | P2 | Founder/Legal | 1 hour | Legal review |
| Dependency review pin | P2 | Infrastructure | 15 min | None |
| LICENSE file | P3 | Founder | 15 min | Legal review |
| Release provenance | P3 | Platform | 4 hours | cosign + GH attestation |

## Suggested Tests

- CI workflow that verifies SBOM JSON is valid CycloneDX format
- Test that dependency-review blocks a PR adding a GPL-licensed dependency
- Verify attestation with `gh attestation verify`

## Suggested Documentation Updates

- Create `docs/LICENSE_POLICY.md` — approved licenses, exception process
- Create `docs/SBOM_PROCESS.md` — how SBOMs are generated and stored
- Remove `docs/SECRETS_ROTATION.md` rotation log sample for YAML (it references a non-existent workflow)

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are there any copyleft or GPL dependencies in the dependency tree? | Immediate legal risk | Full dependency license audit |
| Who owns license compliance decisions? | Approval for license policy | Business/legal input |
| Do any downstream customers require SBOMs? | Prioritizes SBOM work | Stakeholder input |

## Appendix

### License Field Inventory

| Package | License |
|---------|---------|
| Root | ISC |
| `apps/api` | ISC (inherited) |
| `apps/web` | ISC (inherited) |
| `apps/worker` | ISC (inherited) |
| `packages/sdk` | ISC (inherited) |
| `packages/ui` | ISC (inherited) |
| `packages/config` | ISC (inherited) |

### Dependency Review Configuration (Recommended)

```yaml
- uses: actions/dependency-review-action@<sha> # v4.x.x
  with:
    fail-on-severity: high
    allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense, CC0-1.0
    deny-licenses: GPL-1.0-or-later, GPL-2.0-or-later, GPL-3.0-or-later, AGPL-1.0, AGPL-3.0
```
