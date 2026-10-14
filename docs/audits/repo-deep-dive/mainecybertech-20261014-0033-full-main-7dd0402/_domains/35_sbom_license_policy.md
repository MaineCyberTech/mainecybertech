# SBOM and License Policy Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: SBOM · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope: lockfile/image/third-party SBOMs, provenance/attestation, license allow/deny policy + exceptions, dependency review, dependency re-scan, release binding. Read-only.

## Executive Summary

All 26 previous SBOM rows were re-verified at `7dd0402`: **22 verified-fixed, 4 partially-fixed, plus 1 new P3**. The SBOM program is complete end to end on the build/deploy path: the lockfile CycloneDX SBOM carries licenses + a dependency graph and binds `<VERSION>+<commit>`, is validated before upload; each app image gets a digest-bound image SBOM that is validated (floor + digest) and attested with both CycloneDX and SLSA predicates, and the deploy verifies both predicates and pulls by the verified digest; the four third-party runtime images get weekly scans + SBOMs; Actions dependencies are enumerated and SHA-pin-checked.

The four partially-fixed rows all share one cause: **the release attachment is wired but never delivered** — `release.yml` fails on every promotion with exit 141 (SIGPIPE at the release-notes step; live run 38490822732) and origin has 0 tags / 0 releases (see CI-P2-011). So commit binding and attestations are exercised, but no SBOM has ever been attached to a release.

The new finding is a latent correctness bug in `scripts/validate-sbom.mjs`: with no `--digest`, its argument filter drops the first positional path, so a caller passing a custom SBOM path silently validates `./sbom.cdx.json` instead. Current CI callers are unaffected (the default name coincides, or `--digest` is passed), but the documented `[sbomPath]` usage is broken.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/generate-sbom.mjs` (executed locally) | Script | Reproduce lockfile SBOM content | 1446 components, 823 dependency nodes, `metadata.component.version` + `mct:*` props |
| `node scripts/validate-sbom.mjs` (executed) | Script | Validator behaviour | reproduced positional-path bug (SBOM-P3-010) |
| `node scripts/actions-inventory.mjs --check` (executed) | Guard | Actions dependency inventory | PASS 125 refs |
| `.github/workflows/{sbom,release,build-push,deploy-do,third-party-image-scan,dependency-review,dependency-rescan}.yml` | Workflows | Produce/validate/attest/bind | verified |
| `security/license-policy.json`, `scripts/license-gate.mjs`, `scripts/audit-gate.mjs` | Policy/gates | Exceptions scope + expiry | verified (self-test wired) |
| `docs/LICENSE_POLICY.md`, `docs/SBOM_PROCESS.md`, `docs/DEPENDENCY_POLICY.md`, `SECURITY.md` | Docs | Policy + process truth | verified |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| SBOM-P1-001 | P1 | SBOM lockfile-only, no image SBOM/attestation | verified-fixed | per-image Trivy CycloneDX + attest-sbom (deploy-do:240-274 etc.) |
| SBOM-P1-002 | P1 | Unsigned images, no provenance | verified-fixed | attest-build-provenance + fail-closed verify |
| SBOM-P1-003 | P1 | No version identity/tags/commit binding | partially-fixed | `<VERSION>`+commit binding done (generate-sbom:328-330, reproduced); tags absent - release.yml fails every run (run 38490822732), 0 tags (CI-P2-011) |
| SBOM-P1-004 | P1 | No license allow/deny policy | verified-fixed | dependency-review allow-list + full-tree license gate |
| SBOM-P1-005 | P1 | SBOM lacks licenses/graph | verified-fixed | collect-licenses + dependency graph; validator floor |
| SBOM-P2-001 | P2 | Artifact-only, not bound/attested | partially-fixed | commit-bound + attested (exercised); release binding never delivered (release.yml fails, 0 releases) |
| SBOM-P2-002 | P2 | No image SBOM / OS packages untracked | verified-fixed | Trivy image SBOMs per app + third-party images |
| SBOM-P2-003 | P2 | docs/CI.md "Blocking" misstatement | verified-fixed | CI.md SBOM row now "Artifact-only (not a gate)" |
| SBOM-P2-004 | P2 | No provenance/attestation | verified-fixed | same as SC-P2-002 |
| SBOM-P2-005 | P2 | License policy not enforced | verified-fixed | same as SC-P2-003 |
| SBOM-P2-006 | P2 | Not commit/release bound | partially-fixed | commit + image binding done; release attachment never delivered (release.yml fails, 0 releases) |
| SBOM-P2-007 | P2 | Dependabot backlog untriaged | verified-fixed | reminder + SLA; live queue uninspectable |
| SBOM-P2-008 | P2 | `licenses.json` committed | verified-fixed | untracked + guard |
| SBOM-P2-009 | P2 | Exceptions string-only; UNKNOWN fails open | verified-fixed | (license, package) matching + UNKNOWN fail-closed + fixtures |
| SBOM-P2-010 | P2 | Exception expiry never enforced | verified-fixed | missing/past = violation; self-test |
| SBOM-P2-011 | P2 | Pull by mutable tag; SBOM predicate unverified | verified-fixed | both predicates verified; digests passed to deploy; pull by digest |
| SBOM-P2-012 | P2 | No scheduled advisory re-scan | verified-fixed | dependency-rescan.yml weekly |
| SBOM-P3-001 | P3 | Root ISC no rationale | verified-fixed | LICENSE_POLICY.md:82-88 |
| SBOM-P3-002 | P3 | SBOM not validated before upload | verified-fixed | validate-sbom in sbom.yml:54-55 |
| SBOM-P3-003 | P3 | Root ISC (dup) | verified-fixed | documented intentional |
| SBOM-P3-004 | P3 | SBOM transient | partially-fixed | release.yml wired (:126-145) but fails every promotion; SBOM remains transient (CI-P2-011) |
| SBOM-P3-005 | P3 | Image SBOMs never validated | verified-fixed | `--image --digest` before each attestation |
| SBOM-P3-006 | P3 | Docs use broken licenses command | verified-fixed | collect-licenses.mjs everywhere |
| SBOM-P3-007 | P3 | sharp exception mismatch | verified-fixed | policy + LICENSE_POLICY.md aligned (expires 2027-10-03) |
| SBOM-P3-008 | P3 | Third-party images/actions no SBOM | verified-fixed | third-party SBOMs + actions inventory |
| SBOM-P3-009 | P3 | Deprecated `deny-licenses` | verified-fixed | allow-list form + full-tree backstop |
| **SBOM-P3-010** | **P3** | **NEW: validator drops first positional path without `--digest`** | **open** | scripts/validate-sbom.mjs:33-36 (`index !== digestIndex + 1` drops index 0 when `digestIndex=-1`); reproduced |

## New Findings Detail

### SBOM-P3-010 — `validate-sbom.mjs` positional-path bug (P3, open)

- **Evidence**: `scripts/validate-sbom.mjs:33-36` — `args.filter((arg, index) => arg !== "--image" && arg !== "--digest" && index !== digestIndex + 1)`; when `--digest` is absent, `digestIndex = -1` so `index !== 0` excludes the first positional argument. `node scripts/validate-sbom.mjs /tmp/.../sbom.cdx.json` opened `<repo>/sbom.cdx.json` instead (ENOENT reproduced). The header documents `node scripts/validate-sbom.mjs [sbomPath]`.
- **Why it matters**: a future caller validating a named SBOM (e.g. `release-sbom.cdx.json`) would either fail on the wrong file or — if the default file exists — validate the wrong document and still print PASS, weakening the attestation gate's assurance.
- **Fix**: only skip the argument after `--digest` when `digestIndex !== -1` (e.g. `digestIndex === -1 || index !== digestIndex + 1`), and add a fixture test that a custom path is honoured without `--digest`.
- **Validation**: `node scripts/validate-sbom.mjs <custom>.cdx.json` validates that file; add the case to CI.

## Recommendations

- **This week**: fix SBOM-P3-010 (one-line filter guard + a regression test).
- **This month**: re-verify the release SBOM attachment on the next promotion (`release.yml` run) and keep the `expires` dates current as exceptions approach 2027.
- **This quarter**: decide whether the lockfile SBOM should also be attested (currently artifact-only by design, documented).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are image attestations actually retrievable for the latest deployed digest? | Proves the durable record exists outside CI | `gh attestation verify oci://…@<digest>` (needs registry auth) |
| Does any current caller pass a custom SBOM path without `--digest`? | Bounds SBOM-P3-010 impact | grep of all workflow call sites (none today) |
