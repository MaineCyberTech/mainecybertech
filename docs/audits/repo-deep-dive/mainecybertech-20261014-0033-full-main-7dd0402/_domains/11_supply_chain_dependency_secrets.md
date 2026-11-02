# Supply Chain, Dependency, and Secrets Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Area code: SC · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`; fast re-check: `…20261013-0126-fast-develop-905ed63`
- Scope: package manifests/lockfile/overrides, Dependabot, action pins, Docker base images, secret scanning (diff + history), SBOM/provenance/attestation, license policy, env examples, tracked secret files. Read-only.

## Executive Summary

All 26 previous SC rows were re-verified at `7dd0402`: **23 verified-fixed, 3 partially-fixed, 0 open, 0 regressed**. The supply-chain control set is broad and enforced in CI: the dependency audit policy blocks CRITICAL any scope / HIGH+ prod, the license gate enforces a full-tree allow/deny policy with package-scoped, expiry-bound exceptions (self-tested), every external action ref is SHA-pinned (125 refs, guard PASS), container images are digest-pinned and scanned, images carry both provenance and SBOM attestations verified fail-closed before deploy, secret scanning runs on diffs (PRs + pushes) and weekly over full history, and generated license/SBOM artifacts are untracked and guarded.

Residuals: the diff secret scanner still does not know the platform's own token formats (dop_v1_/sbp_/glpat_/sk-proj-/npm_); Dependabot security-update separation is a GitHub repo setting that cannot be inspected read-only; and the SBOM release attachment is wired but never delivered because `release.yml` fails on every promotion (exit 141, live run 38490822732 — see CI-P2-011), so SC-P3-006 is partially fixed.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `node scripts/actions-inventory.mjs --check` (executed) | Guard | External action pins | **PASS** 125 refs SHA-pinned |
| `node scripts/check-env-parity.mjs` (executed) | Guard | Env example ↔ schema ↔ docs parity | **PASS** |
| `node scripts/check-supply-chain-gates.mjs` | Fixture suite | License/audit exception scope + expiry | ran (Node-18 env crash on `import.meta.dirname`; CI uses Node 20) — logic read + fixtures present |
| `package.json` / `pnpm-lock.yaml` | Config | Overrides incl. `next`, `webpack` pin | verified |
| `.github/actions/dependency-audit/action.yml`, `secret-scan/action.yml` | Composite | Gates wired into test + validate | verified |
| `security/license-policy.json`, `security/dependency-audit-policy.json` | Policy | Exceptions + expires | verified |
| `secret-history-scan.yml`, `.gitleaks.toml`, `verify-gitleaks-config.sh` | Workflow/config | Full-history scan + allowlist proof | verified |
| `git ls-files` | Repo | Tracked tfvars/env/licenses artifacts | none tracked |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| SC-P1-001 | P1 | Dev-tree advisories; mis-scoped `next` override | verified-fixed | package.json overrides (`next >=15.5.24 <16 \|\| >=16.3.6`, webpack 5.101.2); audit-gate wired |
| SC-P2-001 | P2 | No image-level scan | verified-fixed | Trivy image scans CRITICAL/HIGH exit 1 in deploy-do + build-push |
| SC-P2-002 | P2 | No provenance/attestation | verified-fixed | attest-sbom + attest-build-provenance; verified pre-deploy |
| SC-P2-003 | P2 | License policy not enforced | verified-fixed | license-gate full tree + dependency-review allow-list + self-test |
| SC-P2-004 | P2 | SBOM not commit/release bound | verified-fixed | `VERSION`+commit binding; release attachment; digest attestations |
| SC-P2-005 | P2 | Dependabot backlog untriaged | verified-fixed | weekly triage reminder + SLA; merged dependabot PRs; live queue uninspectable |
| SC-P2-006 | P2 | `licenses.json` committed | verified-fixed | untracked + guard (dependency-audit action:38-50) |
| SC-P2-007 | P2 | Swagger UI unpinned script | verified-fixed | docs.ts:18,54,58 version + SRI |
| SC-P2-008 | P2 | Deploy secret scan no-op on main | verified-fixed | before-SHA logic (secret-scan action:15-28) |
| SC-P2-009 | P2 | Diff-only scanning | verified-fixed | weekly full-history gitleaks + artifact |
| SC-P2-010 | P2 | `prod.tfvars` tracked | verified-fixed | only `.example` tracked; gitignore covers |
| SC-P2-011 | P2 | No failure notification on history scan | verified-fixed | loud ntfy/Slack notifier (:61-88) |
| SC-P3-001 | P3 | Root ISC license | verified-fixed | LICENSE_POLICY.md:82-88 |
| SC-P3-002 | P3 | e2e image unpinned | verified-fixed | no container image; compose e2e digest-pinned + profile-gated |
| SC-P3-003 | P3 | Scanner pattern divergence .sh/.ps1 | verified-fixed | same 10 pattern classes |
| SC-P3-004 | P3 | Unpinned images | verified-fixed | third-party digests pinned; scan fails unpinned literal refs |
| SC-P3-005 | P3 | Dockerfile lint gaps | verified-fixed | hadolint gate wired; fixes in place |
| SC-P3-006 | P3 | SBOM transient | partially-fixed | release.yml wired to attach the SBOM (:126-145) but fails every promotion (exit 141, run 38490822732); 0 releases — see CI-P2-011 |
| SC-P3-007 | P3 | Secrets file on disk | verified-fixed | tracked-secret-file guard; none tracked |
| SC-P3-008 | P3 | gitleaks false positives | verified-fixed | scoped allowlists + negative fixture |
| SC-P3-009 | P3 | Scanner misses platform tokens | partially-fixed | patterns lack dop_v1_/sbp_/glpat_/sk-proj-/npm_ (action:14; scan-secrets.sh:13) |
| SC-P3-010 | P3 | Dependabot security-update separation | partially-fixed | SLA + reminder exist; repo setting out of band |
| SC-P3-011 | P3 | `expires` not enforced | verified-fixed | both gates fail closed on missing/past dates |
| SC-P3-012 | P3 | Docs use broken `pnpm licenses` | verified-fixed | docs use collect-licenses.mjs |
| SC-P3-013 | P3 | SECURITY.md SBOM contradiction | verified-fixed | SECURITY.md:41-56 distinguishes artifact vs attested |
| SC-P3-014 | P3 | No unused/duplicate dep check | verified-fixed | dependency-rescan runs `pnpm dedupe --check` (report-only) |

## Recommendations

- **This week**: add the platform token formats (`dop_v1_`, `sbp_`, `glpat_`, `sk-proj-`, `npm_`) to the diff scanner and full-history gitleaks config; add a negative fixture so the formats cannot regress (SC-P3-009).
- **This month**: enable Dependabot security updates in repo settings and record it in `docs/DEPENDENCY_POLICY.md` (SC-P3-010).
- **This quarter**: triage the open Dependabot queue against the documented SLA using the weekly reminder issue.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does the live Dependabot queue still exceed the SLA? | Repo-side controls exist; backlog is the risk | open Dependabot PR list |
| Are `dop_v1_`-style tokens used anywhere? | Decides urgency of SC-P3-009 | provider token inventory (operator) |
