# Branch protection (as code)

These JSON files are the GitHub branch-protection payloads for `develop` and
`main`. They are committed so the rules are reviewable and reproducible instead
of living only in repository settings.

Apply (requires admin on the repository and `gh` authenticated with a token
that has `administration: write`):

```bash
gh api -X PUT repos/MaineCyberTech/mainecybertech/branches/develop/protection \
  --input .github/branch-protection/develop.json
gh api -X PUT repos/MaineCyberTech/mainecybertech/branches/main/protection \
  --input .github/branch-protection/main.json
```

Inspect the current rules:

```bash
gh api repos/MaineCyberTech/mainecybertech/branches/develop/protection
```

## Required status checks

| Branch    | Required checks                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `develop` | `Test / test (20.x)`, `Test / security-scan`, `Test / secrets-scan`, `Lint / lint (20.x)`, `TypeCheck / typecheck`, `CodeQL / Analyze (javascript-typescript)`                                                   |
| `main`    | `Test / test (20.x)`, `Test / security-scan`, `Test / secrets-scan`, `Lint / lint (20.x)`, `TypeCheck / typecheck`, `E2E / e2e (20.x)`, `Dependency Review / review`, `CodeQL / Analyze (javascript-typescript)` |

Notes:

- The check names are the exact `<workflow name> / <job/check-run name>`
  contexts produced by `.github/workflows/*.yml`. `scripts/check-required-checks.mjs`
  (run by the `unit-tests` composite in both the PR gate and the deploy gate)
  fails when a context stops resolving or its workflow becomes path-filtered
  (BP-P2-004 / BP-P2-005 / CI-P2-009).
- `Test / security-scan` (dependency audit + license policy + Trivy fs) and
  `Test / secrets-scan` (diff secret scan) block merges on both branches, so a
  failing security scan cannot merge (BP-P2-007).
- `CodeQL / Analyze (javascript-typescript)` is required on both branches so the
  SAST job must run green. Blocking merges on code-scanning *findings* still
  needs the repository ruleset / code-scanning setting `Require code scanning
  results` — a repo-admin action (BP-P2-007).
- `E2E / e2e (20.x)` is intentionally **not** required on `develop`: the suite
  has known data-dependent flakiness under CI API/Supabase contention (see
  `AGENTS.md` → Known Debt). It is required on `main`, where the deploy pipeline
  also gates on it, and its `pull_request` trigger is deliberately unfiltered
  (BP-P2-004 / CI-P2-009) so the check always reports.
- `strict: true` requires the branch to be up to date before merging.
- `allow_force_pushes` / `allow_deletions` are disabled on both branches.
