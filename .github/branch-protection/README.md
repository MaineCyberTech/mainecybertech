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

| Branch    | Required checks                                                              |
| --------- | ---------------------------------------------------------------------------- |
| `develop` | `test (20.x)`, `lint (20.x)`, `typecheck`                                    |
| `main`    | `test (20.x)`, `lint (20.x)`, `typecheck`, `e2e (20.x)`, `Dependency Review` |

Notes:

- The check names are the **job/check-run names** produced by
  `.github/workflows/{test,lint,typecheck,e2e,dependency-review}.yml`.
- `e2e (20.x)` is intentionally **not** required on `develop`: the suite has
  known data-dependent flakiness under CI API/Supabase contention (see
  `AGENTS.md` → Known Debt). It is required on `main`, where the deploy pipeline
  also gates on it.
- `strict: true` requires the branch to be up to date before merging.
- `allow_force_pushes` / `allow_deletions` are disabled on both branches.
