# Supply Chain, Dependency, and Secrets Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `SC`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/11_supply_chain_dependency_secrets.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

Package manifests/lockfile, pnpm overrides, dependency/license policy, audit and license gates, SBOM/provenance, Dependabot policy, secret scanning (diff + full history), .env handling, secret-like strings, container image pinning.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `package.json` overrides + `pnpm-lock.yaml` | Config | Dependency remediation current | next 15.5.28; webpack 5.101.2; body-parser 2.3.0->2.4.0; mirrored |
| `.github/actions/dependency-audit/action.yml` | Config | Audit/license gates wired | audit-gate:17; license-gate:29; self-test:36; untracked-artifact guard:38-50 |
| `node scripts/ci/test-secret-patterns.mjs` (executed) | Fixture | Platform token formats | **PASS** 6 detected, 3 negatives |
| Live GitHub API: Release v0.1.0-20261103-6b7aa1a | Live state | Release SBOM attachment | `release-sbom.cdx.json` present |
| `security/dependency-audit-policy.json` vs `docs/DEPENDENCY_POLICY.md` | Cross-check | Allowlist documentation | zod GHSA-mrhx-c7xc-m3w5 is missing from the doc table (SC-P2-012) |

## Executive Summary

Dependency governance remains enforced: overrides are current, the all-scope audit gate runs in both gates, image scans/attestations are present, and the full-history secret scan has failure notification. The release SBOM is now actually attached, and the diff/pre-commit scanners share the canonical pattern list including dop_v1_/sbp_/glpat-/sk-proj-/npm_. One new policy-documentation gap: the production-HIGH zod allowlist is machine-enforced but absent from the human allowlist table (SC-P2-012). License enforcement has a separate new cross-domain defect (SBOM-P1-006: PSF-2.0 is allowed full-tree but not by the PR dependency-review gate).

**Totals:** 27 findings — P0 0, P1 1, P2 12, P3 14. Status: open 1, partially-fixed 1, verified-fixed 25.

**New this run:** SC-P2-012.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped | verified-fixed | re-verified at 6b7aa1a: package.json:56-86 carries the overrides (next 15.5.28 at :75, webpack 5.101.2 at :84, body-parser 2.3.0 -> 2.4.0 at :85), mirrored in pnpm-lock.yaml; audit-gate is wired in .github/actions/dependency-audit/action.yml:17. |
| SC-P2-001 | P2 | No image-level container scanning; Trivy scans filesystem only | verified-fixed | re-verified at 6b7aa1a: per-image Trivy scans (scan-type image, CRITICAL/HIGH, exit-code 1) in deploy-do.yml build jobs (:228-240 etc.) and build-push.yml. |
| SC-P2-002 | P2 | No artifact provenance, attestation, or signing; `id-token: write` requested but unused | verified-fixed | re-verified at 6b7aa1a: per-image actions/attest-sbom + actions/attest-build-provenance (deploy-do.yml:264-274 etc.), verified fail-closed before deploy (:430-520); id-token is consumed. |
| SC-P2-003 | P2 | License policy not enforced in CI; non-OSI and LGPL licenses present | verified-fixed | re-verified at 6b7aa1a: scripts/license-gate.mjs over the full resolved tree via dependency-audit action.yml:19-29 (test + validate), plus dependency-review allow-licenses on PRs; exception scope/expiry self-test wired (:31-36). |
| SC-P2-004 | P2 | SBOM is generated but not bound to a commit or attached to releases/images | verified-fixed | re-verified at 6b7aa1a: generate-sbom.mjs binds <VERSION>+<commit> (metadata.component.version + mct:commit, :328-330, :459-462); validate-sbom floor + digest binding; release.yml attaches the lockfile SBOM; image SBOMs are digest-attested. |
| SC-P2-005 | P2 | Dependabot PR backlog is large and not triaged; one stale update conflicts with resolved versions | verified-fixed | repo-side at 6b7aa1a: dependabot-triage-reminder.yml keeps a deduplicated weekly issue listing open PRs; SLA is in docs/DEPENDENCY_POLICY.md. The live queue is not inspectable read-only. |
| SC-P2-006 | P2 | `licenses.json` is committed but unenforced and unverified | verified-fixed | re-verified at 6b7aa1a: licenses.json/sbom.cdx.json are untracked and guarded (dependency-audit action.yml:38-50 fails if committed); .gitignore lists them. |
| SC-P2-007 | P2 | Swagger UI loads an unpinned third-party script without SRI | verified-fixed | re-verified at 6b7aa1a: apps/api/src/routes/docs.ts:18,54,58 pins swagger-ui-dist version + integrity SRI + crossorigin; production route stays 404. |
| SC-P2-008 | P2 | Deploy-gate secret scan is a no-op on pushes to main | verified-fixed | re-verified at 6b7aa1a: same before-SHA logic as CI-P2-002 (.github/actions/secret-scan/action.yml:15-28). |
| SC-P2-009 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact | verified-fixed | re-verified at 6b7aa1a: secret-history-scan.yml runs full-history gitleaks 8.30.1 (checksum-verified, :27-39) and uploads the JSON report as a 30-day artifact (:55-59). |
| SC-P2-010 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it | verified-fixed | re-verified at 6b7aa1a: git ls-files shows only env/*.tfvars.example tracked; .gitignore:58,63 covers env/*.tfvars and infra/terraform/**/*.tfvars. |
| SC-P2-011 | P2 | Scheduled full-history secret scan has no failure notification | verified-fixed | re-verified at 6b7aa1a: secret-history-scan.yml:61-88 notifies via ntfy/Slack and fails loudly when no channel is configured (no silent scan failure). |
| SC-P3-001 | P3 | Root package license remains "ISC" | verified-fixed | re-verified at 6b7aa1a: docs/LICENSE_POLICY.md:82-88 documents ISC as intentional for the root + workspaces; allowlist includes ISC. |
| SC-P3-002 | P3 | e2e Docker image is not digest-pinned | verified-fixed | re-verified at 6b7aa1a: e2e.yml installs Playwright via pnpm exec (no container image); the root compose e2e profile image is digest-pinned (docker-compose.yml:73) and profile-gated. |
| SC-P3-003 | P3 | Secret-scanner pattern sets diverge between `.sh` and `.ps1` | verified-fixed | re-verified at 6b7aa1a: scripts/scan-secrets.sh:13 and scripts/scan-secrets.ps1:7-15 carry the same 10 pattern classes; the CI composite mirrors them (.github/actions/secret-scan/action.yml:14). |
| SC-P3-004 | P3 | Unpinned container images (test/local only); production app images tag-based by design | verified-fixed | re-verified at 6b7aa1a: third-party compose images (redis/caddy/prometheus/alertmanager) are digest-pinned; third-party-image-scan.yml:49-57 fails on any unpinned literal ref; mct-* refs are the repo's own digest-resolved images (documented exception). |
| SC-P3-005 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | verified-fixed | re-verified at 6b7aa1a: hadolint gate wired (test.yml:60, validate.yml:62; digest-pinned image) and the WORKDIR/exec-form fixes are in the Dockerfiles. |
| SC-P3-006 | P3 | SBOM is produced as a transient artifact, not bound to a release | verified-fixed | re-verified at 6b7aa1a: release.yml generates release-sbom.cdx.json and `gh release upload` attaches it (:126-145); live Release v0.1.0-20261103-6b7aa1a has the asset. |
| SC-P3-007 | P3 | A secrets file exists on disk outside git (should never be committed) | verified-fixed | re-verified at 6b7aa1a: the secret-scan composite rejects tracked .env/supabase temp files (.github/actions/secret-scan/action.yml:43-61); git ls-files shows none; .gitignore covers .env/supabase/.temp. |
| SC-P3-008 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | verified-fixed | re-verified at 6b7aa1a: .gitleaks.toml uses rule-scoped allowlists for each reviewed class + scripts/ci/verify-gitleaks-config.sh proves a synthetic key is still detected (negative fixture). |
| SC-P3-009 | P3 | Secret scanner misses the platform's own token formats and scans diffs only | verified-fixed | re-verified at 6b7aa1a: the diff scanner, pre-commit .sh and .ps1 all consume scripts/ci/secret-patterns.txt, which includes dop_v1_, sbp_, glpat-, sk-proj- and npm_ (:1-15); scripts/ci/test-secret-patterns.mjs passes 6 detection + 3 negative fixtures. |
| SC-P3-010 | P3 | Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | partially-fixed | at 6b7aa1a the SLA and triage reminder exist; Dependabot security-update separation remains a GitHub repo setting not inspectable read-only. |
| SC-P3-011 | P3 | Dependency and license policy `expires` dates are not enforced by the gates | verified-fixed | re-verified at 6b7aa1a: audit-gate.mjs and license-gate.mjs treat missing/past expires as violations; both policy files carry dates; fixture self-test asserts it (dependency-audit action.yml:31-36). |
| SC-P3-012 | P3 | Docs instruct the broken `pnpm licenses list --json` workflow while CI uses collect-licenses.mjs | verified-fixed | re-verified at 6b7aa1a: docs/DEPENDENCY_POLICY.md:133, docs/SBOM_PROCESS.md:27,145 and docs/LICENSE_POLICY.md:101 use scripts/collect-licenses.mjs. |
| SC-P3-013 | P3 | SECURITY.md says neither SBOM is signed or attested, contradicting the attested image-SBOM process | verified-fixed | re-verified at 6b7aa1a: SECURITY.md:41-56 distinguishes the attested per-image SBOMs from the artifact-only lockfile SBOM. |
| SC-P3-014 | P3 | No automated unused/duplicate dependency check; lockfile carries 55 multi-version packages | verified-fixed | re-verified at 6b7aa1a: dependency-rescan.yml runs pnpm dedupe --check report-only and uploads dedupe-check.txt + reports (:43-72). |
| SC-P2-012 | P2 | NEW: production-HIGH zod allowlist is absent from the dependency policy doc | open | NEW at 6b7aa1a: security/dependency-audit-policy.json:18-26 adds a production-scope HIGH allowlist for zod GHSA-mrhx-c7xc-m3w5 (resolved zod 3.25.76, fixed only in 4.6.6; expires 2026-12-15). The gate enforces the date, but docs/DEPENDENCY_POLICY.md:35-39 still lists only the elliptic dev exception and says last updated 2026-10-12, so the accepted production risk is absent from the reviewer-facing policy table. |

## New Findings Detail

### SC-P2-012 — NEW: production-HIGH zod allowlist is absent from the dependency policy doc (P2, open)

- **Evidence:** NEW at 6b7aa1a: security/dependency-audit-policy.json:18-26 adds a production-scope HIGH allowlist for zod GHSA-mrhx-c7xc-m3w5 (resolved zod 3.25.76, fixed only in 4.6.6; expires 2026-12-15). The gate enforces the date, but docs/DEPENDENCY_POLICY.md:35-39 still lists only the elliptic dev exception and says last updated 2026-10-12, so the accepted production risk is absent from the reviewer-facing policy table.
- **Owner:** supply-chain owner · **Target:** this month

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| Dependabot has no security-update separation or triage SLA, and PR template has no enforced link to required checks | P3 | SC-P3-010 | Fix/verify per the finding |
| NEW: production-HIGH zod allowlist is absent from the dependency policy doc | P2 | SC-P2-012 | Fix/verify per the finding |

## Recommendations

- **Immediate:** add PSF-2.0 to the PR dependency-review allow-list (SBOM-P1-006) and add the zod exception row to `docs/DEPENDENCY_POLICY.md` (SC-P2-012).
- **This month:** keep the zod 3->4 migration on a dated plan before the 2026-12-15 expiry; review the `.trivyignore` scope impact on node-exporter (CTR-P2-007).
- **This quarter:** decide Dependabot security-update separation in repo settings (SC-P3-010).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will the zod 3->4 migration land before 2026-12-15? | The high production exception expires then | Migration issue/PR |
| Is argparse 3.0.4 the only new PSF-2.0 package? | The PR gate must allow the exact diff | `pnpm why argparse` / dependency-review run |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
