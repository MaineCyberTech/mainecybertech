# ULTRA REMEDIATION — Aggressive Fix Mode

## Activation

Use when the release gate decision is `BLOCKED` or `CONDITIONAL with P1+`. Skip if `APPROVED`.

## Strategy

- Create fix branches per patch set (branch name: `fix/PS-NNN-description`)
- For P0 patches: create a `fix/critical-XXX` branch, apply all P0 edits, commit, push
- For each fix branch:
  1. Apply edits from `remediation_patches.json`
  2. Run verification commands
  3. If verification fails, roll back the branch and log the failure
- Group P1/P2 patches into weekly milestones

## Output

`engine/outputs/ultra_remediation_log.json`:

```json
[
  {
    "branch": "fix/critical-auth-gap",
    "patch_sets": ["PS-001"],
    "status": "applied|verified|failed",
    "rolled_back": false,
    "verification_results": { "pnpm --filter=api test": "passed", "pnpm typecheck": "passed" },
    "fixes_applied": 3
  }
]
```

---

automation:
checks: - id: UREM-001
desc: "P0 branches have passing verification"
read: "engine/outputs/ultra_remediation_log.json"
expect: "all P0 branches have status: verified"
