# 35_sbom_license_policy — Prompt 35 - SBOM and License Policy Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `35_sbom_license_policy.md` (area SBOM, prompt)

## Verification Performed

Domain subagent produced 27 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| SBOM-P1-001 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation |
| SBOM-P1-002 | P1 | Unsigned Images With No Provenance/Attestation |
| SBOM-P1-003 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts |
| SBOM-P1-004 | P1 | No license allow/deny policy in dependency review or any CI gate |
| SBOM-P1-005 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review |
| SBOM-P2-001 | P2 | SBOM is artifact-only: not release-bound, not commit-bound, not attested |
| SBOM-P2-002 | P2 | No container/image SBOM; base-image OS packages untracked |
| SBOM-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing |
| SBOM-P2-004 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused |
| SBOM-P2-005 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present |
| SBOM-P2-006 | P2 | SBOM is generated but not bound to a commit or attached to releases/images |
| SBOM-P2-007 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions |
| SBOM-P2-008 | P2 | `licenses.json` is committed but unenforced and unverified |
| SBOM-P2-009 | P2 | License exceptions are matched by license string only - documented package scope and UNKNOWN fail open |
| SBOM-P2-010 | P2 | Exception `expires` dates are documentation-only and never enforced by the gates |
| SBOM-P2-011 | P2 | Deploy verifies the tag's attestation but pulls by mutable tag; the SBOM predicate is never verified |
| SBOM-P2-012 | P2 | No scheduled dependency vulnerability re-scan - advisories are only evaluated on PRs and deploys |
| SBOM-P3-001 | P3 | Root license is ISC with no documented rationale |
| SBOM-P3-002 | P3 | SBOM format/count not validated before upload; no regression guard |
| SBOM-P3-003 | P3 | Root package license remains "ISC" |
| SBOM-P3-004 | P3 | SBOM is produced as a transient artifact, not bound to a release |
| SBOM-P3-005 | P3 | Image SBOMs are attested but never validated (no floor or binding check) |
| SBOM-P3-006 | P3 | Runbooks and script headers still document the broken `pnpm licenses list --json` command; docs/CI.md SBOM row is stale |
| SBOM-P3-007 | P3 | Documented sharp license exception does not match the machine policy |
| SBOM-P3-008 | P3 | Shipped third-party images and GitHub Actions dependencies have no SBOM coverage |
| SBOM-P3-009 | P3 | PR license gate depends on the deprecated `deny-licenses` option and cannot fail on unknown licenses |
| SBOM-P3-010 | P3 | NEW: validate-sbom.mjs silently drops its first positional path when --digest is absent |
