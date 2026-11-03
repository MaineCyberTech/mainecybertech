# SBOM and License Policy Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `SBOM`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/35_sbom_license_policy.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

SBOM generation/binding/attestation, release attachment, image and third-party SBOMs, license allow/deny policy, exceptions/expiry, dependency-review license gate, docs.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| Live GitHub API: Release v0.1.0-20261103-6b7aa1a | Live state | Tag/release/SBOM binding | Release green; `release-sbom.cdx.json` attached |
| `node scripts/validate-sbom.mjs custom.cdx.json` (executed) | Validator | Positional-path regression | **PASS** validates the named file |
| `scripts/ci/check-validate-sbom.mjs` (wired) | Self-test | Argument handling | unit-tests action.yml:215-221 |
| `security/license-policy.json` vs `.github/workflows/dependency-review.yml` | Cross-check | License allow-list consistency | PSF-2.0 allowed full-tree only (SBOM-P1-006) |
| Live PR #333 `review` check annotation | CI state | PR license gate | failure: `Dependency review detected incompatible licenses` |

## Executive Summary

The release half of the SBOM story is now delivered: 36 tags exist, Release run 41598762576 is green, and `release-sbom.cdx.json` is attached (closing SBOM-P1-003/P2-001/P2-006/P3-004). The validator argument bug is fixed and has a dedicated self-test (SBOM-P3-010). Two new findings: PSF-2.0 was added to the full-tree license policy but not to the PR dependency-review allow-list or `docs/LICENSE_POLICY.md`, so the required `Dependency Review / review` check fails with an incompatible-license annotation (SBOM-P1-006); and `docs/SBOM_PROCESS.md` still describes four third-party images and omits the new `--allow-missing-versions` behavior (SBOM-P3-011).

**Totals:** 29 findings — P0 0, P1 6, P2 12, P3 11. Status: open 2, verified-fixed 27.

**New this run:** SBOM-P1-006, SBOM-P3-011.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| SBOM-P1-001 | P1 | SBOM Is Lockfile-Only, Not an Image SBOM or Attestation | verified-fixed | re-verified at 6b7aa1a: per-image Trivy CycloneDX SBOM + validate + actions/attest-sbom on the deploy path (deploy-do.yml:240-274, :313-342, :389-418) and build-push.yml; third-party images get SBOMs too (third-party-image-scan.yml:95-121). |
| SBOM-P1-002 | P1 | Unsigned Images With No Provenance/Attestation | verified-fixed | re-verified at 6b7aa1a: per-image actions/attest-build-provenance, and verify-attestations runs gh attestation verify (SLSA + CycloneDX predicates, signer-workflow + source-digest pinned) before deploy (:430-520). |
| SBOM-P1-003 | P1 | No version identity: no tags, no product version, no commit binding in generated artifacts | verified-fixed | re-verified at 6b7aa1a: artifacts bind <VERSION>+<commit> (generate-sbom.mjs:328-330,459-462) and the tag half is now delivered: origin has 36 tags including v0.1.0-20261103-6b7aa1a, Release run 41598762576 is green, and the Release has release-sbom.cdx.json attached. |
| SBOM-P1-004 | P1 | No license allow/deny policy in dependency review or any CI gate | verified-fixed | re-verified at 6b7aa1a: dependency-review uses allow-licenses + allow-dependencies-licenses (PR diff) and license-gate.mjs enforces the full-tree allow/deny policy + exceptions (dependency-audit action.yml:19-29). |
| SBOM-P1-005 | P1 | SBOM carries no license data and no dependency graph, limiting triage and license review | verified-fixed | re-verified at 6b7aa1a: sbom.yml feeds collect-licenses output into generate-sbom; reproduced locally - 1446 components, 823 dependency nodes, metadata component + mct:* properties; validate-sbom floor passes. |
| SBOM-P2-001 | P2 | SBOM is artifact-only: not release-bound, not commit-bound, not attested | verified-fixed | re-verified at 6b7aa1a: commit binding + image attestations are exercised on dev deploys, and release binding is now delivered (Release v0.1.0-20261103-6b7aa1a with release-sbom.cdx.json). |
| SBOM-P2-002 | P2 | No container/image SBOM; base-image OS packages untracked | verified-fixed | re-verified at 6b7aa1a: Trivy cyclonedx image SBOMs (Alpine OS + npm contents) per app image on deploy + build-push; third-party images covered weekly. |
| SBOM-P2-003 | P2 | `docs/CI.md` documents the SBOM workflow as "Blocking" but it gates nothing | verified-fixed | re-verified at 6b7aa1a: docs/CI.md SBOM row (:31) says 'Artifact-only (not a gate)'; the deploy path gates on the validated+attested image SBOMs. |
| SBOM-P2-004 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused | verified-fixed | re-verified at 6b7aa1a: same as SC-P2-002 - attestations produced and consumed. |
| SBOM-P2-005 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present | verified-fixed | re-verified at 6b7aa1a: same as SC-P2-003 - full-tree license gate + PR allow-list. |
| SBOM-P2-006 | P2 | SBOM is generated but not bound to a commit or attached to releases/images | verified-fixed | re-verified at 6b7aa1a: lockfile SBOMs are commit-bound, image SBOMs are digest-attested, and release.yml now succeeds and attaches release-sbom.cdx.json (live Release v0.1.0-20261103-6b7aa1a). |
| SBOM-P2-007 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions | verified-fixed | re-verified at 6b7aa1a: same as SC-P2-005 - reminder workflow + SLA; live queue not inspectable read-only. |
| SBOM-P2-008 | P2 | `licenses.json` is committed but unenforced and unverified | verified-fixed | re-verified at 6b7aa1a: same as SC-P2-006 - untracked + guarded. |
| SBOM-P2-009 | P2 | License exceptions are matched by license string only - documented package scope and UNKNOWN fail open | verified-fixed | re-verified at 6b7aa1a: license-gate matches on (license, package); UNKNOWN fails unless the package is named; fixture self-test covers scope-mismatch + unlisted-UNKNOWN (dependency-audit action.yml:31-36). |
| SBOM-P2-010 | P2 | Exception `expires` dates are documentation-only and never enforced by the gates | verified-fixed | re-verified at 6b7aa1a: missing/malformed/past expires fail closed in both gates; security/license-policy.json + security/dependency-audit-policy.json carry dates; self-test asserts it. |
| SBOM-P2-011 | P2 | Deploy verifies the tag's attestation but pulls by mutable tag; the SBOM predicate is never verified | verified-fixed | re-verified at 6b7aa1a: verify-attestations resolves each tag to a digest, verifies BOTH predicates (SLSA + CycloneDX) and publishes digests; deploy exports MCT_*_IMAGE=repo@sha256:... and refuses to run without digests (:430-520, :894-905); compose uses the digest refs. |
| SBOM-P2-012 | P2 | No scheduled dependency vulnerability re-scan - advisories are only evaluated on PRs and deploys | verified-fixed | re-verified at 6b7aa1a: dependency-rescan.yml weekly (report-only audit-gate --report, Trivy fs, dedupe check) + artifacts. |
| SBOM-P3-001 | P3 | Root license is ISC with no documented rationale | verified-fixed | re-verified at 6b7aa1a: docs/LICENSE_POLICY.md:82-88 documents ISC as an intentional MIT-equivalent choice. |
| SBOM-P3-002 | P3 | SBOM format/count not validated before upload; no regression guard | verified-fixed | re-verified at 6b7aa1a: sbom.yml:54-55 runs validate-sbom.mjs (format, unique bom-refs, dependency refs, component floor, version/commit binding) before upload; image mode floors digest-bound image SBOMs. |
| SBOM-P3-003 | P3 | Root package license remains "ISC" | verified-fixed | re-verified at 6b7aa1a: same as SBOM-P3-001 - intentional and documented. |
| SBOM-P3-004 | P3 | SBOM is produced as a transient artifact, not bound to a release | verified-fixed | re-verified at 6b7aa1a: release.yml generates and attaches release-sbom.cdx.json (:126-145); live Release v0.1.0-20261103-6b7aa1a has the asset, so the SBOM is no longer transient. |
| SBOM-P3-005 | P3 | Image SBOMs are attested but never validated (no floor or binding check) | verified-fixed | re-verified at 6b7aa1a: validate-sbom.mjs --image --digest runs before each attestation (deploy-do.yml:253-258, :323-328, :399-404) and in build-push.yml:79-82 etc. |
| SBOM-P3-006 | P3 | Runbooks and script headers still document the broken `pnpm licenses list --json` command; docs/CI.md SBOM row is stale | verified-fixed | re-verified at 6b7aa1a: docs use collect-licenses.mjs; docs/CI.md SBOM row updated (see SBOM-P2-003). |
| SBOM-P3-007 | P3 | Documented sharp license exception does not match the machine policy | verified-fixed | re-verified at 6b7aa1a: security/license-policy.json:80-84 exception matches docs/LICENSE_POLICY.md:60 (LGPL-3.0-or-later, @img/sharp-libvips-linux-x64, dev/build-only, expires 2027-10-03). |
| SBOM-P3-008 | P3 | Shipped third-party images and GitHub Actions dependencies have no SBOM coverage | verified-fixed | re-verified at 6b7aa1a: third-party-image-scan.yml resolves the five digest-pinned refs (redis, caddy, prometheus, alertmanager, node-exporter) and emits digest-bound CycloneDX SBOMs; scripts/actions-inventory.mjs --check reports 126 refs, all SHA-pinned. |
| SBOM-P3-009 | P3 | PR license gate depends on the deprecated `deny-licenses` option and cannot fail on unknown licenses | verified-fixed | re-verified at 6b7aa1a: dependency-review.yml uses the allow-list form (license-check + allow-licenses + allow-dependencies-licenses); the full-tree license-gate is the fail-closed UNKNOWN backstop. |
| SBOM-P3-010 | P3 | NEW: validate-sbom.mjs silently drops its first positional path when --digest is absent | verified-fixed | re-verified at 6b7aa1a: scripts/validate-sbom.mjs:33-41 only drops the --digest value slot when --digest is present, and a new self-test scripts/ci/check-validate-sbom.mjs (wired unit-tests action.yml:215-221) covers positional path with/without --digest, default path, mismatch and missing digest value. Reproduced directly: `node scripts/validate-sbom.mjs custom.cdx.json` validates the named file. |
| SBOM-P1-006 | P1 | NEW: PSF-2.0 is allowed by the full-tree gate but not the PR dependency-review gate or docs | open | NEW at 6b7aa1a: security/license-policy.json:20 adds PSF-2.0 (argparse 3.0.4, pulled by js-yaml 5.5.0; pnpm-lock.yaml:3412), but .github/workflows/dependency-review.yml:28's allow-licenses list and docs/LICENSE_POLICY.md:24-27 still omit PSF-2.0. Live PR #333's required 'Dependency Review / review' check failed with annotation 'Dependency review detected incompatible licenses'; the full-tree gate passes, so the two license gates now disagree. |
| SBOM-P3-011 | P3 | NEW: SBOM process doc still says four third-party images and omits the new validator flag | open | NEW at 6b7aa1a: docs/SBOM_PROCESS.md:97-100 still says the compose stack runs four digest-pinned third-party images (redis, prometheus, alertmanager, caddy) and documents image validation as `--image --digest`; infra/digitalocean/docker-compose.yml:271-272 adds node-exporter and third-party-image-scan.yml:116 now validates it with --allow-missing-versions, which the doc's Validation section does not mention. |

## New Findings Detail

### SBOM-P1-006 — NEW: PSF-2.0 is allowed by the full-tree gate but not the PR dependency-review gate or docs (P1, open)

- **Evidence:** NEW at 6b7aa1a: security/license-policy.json:20 adds PSF-2.0 (argparse 3.0.4, pulled by js-yaml 5.5.0; pnpm-lock.yaml:3412), but .github/workflows/dependency-review.yml:28's allow-licenses list and docs/LICENSE_POLICY.md:24-27 still omit PSF-2.0. Live PR #333's required 'Dependency Review / review' check failed with annotation 'Dependency review detected incompatible licenses'; the full-tree gate passes, so the two license gates now disagree.
- **Owner:** supply-chain owner · **Target:** this week

### SBOM-P3-011 — NEW: SBOM process doc still says four third-party images and omits the new validator flag (P3, open)

- **Evidence:** NEW at 6b7aa1a: docs/SBOM_PROCESS.md:97-100 still says the compose stack runs four digest-pinned third-party images (redis, prometheus, alertmanager, caddy) and documents image validation as `--image --digest`; infra/digitalocean/docker-compose.yml:271-272 adds node-exporter and third-party-image-scan.yml:116 now validates it with --allow-missing-versions, which the doc's Validation section does not mention.
- **Owner:** supply-chain owner · **Target:** this quarter

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| NEW: PSF-2.0 is allowed by the full-tree gate but not the PR dependency-review gate or docs | P1 | SBOM-P1-006 | Fix/verify per the finding |
| NEW: SBOM process doc still says four third-party images and omits the new validator flag | P3 | SBOM-P3-011 | Fix/verify per the finding |

## Recommendations

- **Immediate:** add PSF-2.0 to `dependency-review.yml` `allow-licenses` and `docs/LICENSE_POLICY.md` (SBOM-P1-006); rerun the required review check.
- **This month:** update `docs/SBOM_PROCESS.md` for the fifth third-party image and the `--allow-missing-versions` flag (SBOM-P3-011); keep the release tag/SBOM attachment green.
- **This quarter:** review whether the third-party `--allow-missing-versions` relaxation needs a companion floor/exception record (CTR-P2-007).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which package introduced PSF-2.0? | Fix must match the exact dependency diff | `pnpm why argparse` / PR #333 diff |
| Should `--allow-missing-versions` be documented as a policy exception? | It weakens the image SBOM version check | Trivy output review |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
