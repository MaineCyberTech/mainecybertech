# REMEDIATION ENGINE — Auto-Generated Patch Plan

## Objective

Convert the remediation plan (phase 6 output) into concrete file-by-file change sets with diff-level patches.

## Input

`engine/outputs/remediation_plan.json` — structured patch sets with findings grouped by file

## Process

For each patch set `PS-NNN`:

1. Read the affected files
2. For each finding, generate an exact oldString→newString edit that resolves the issue
3. Group edits by file

## Output Format (`engine/outputs/remediation_patches.json`)

```json
[
  {
    "patch_set": "PS-001",
    "name": "Auth hardening",
    "edits": [
      {
        "file": "apps/api/src/lib/auth.ts",
        "oldString": "existing code snippet (10+ chars for uniqueness)",
        "newString": "replacement code snippet",
        "finding_ref": "finding-id",
        "verified_by": ["test command to run"]
      }
    ],
    "verification": ["pnpm --filter=api test", "pnpm --filter=api typecheck"]
  }
]
```

## Rules

- Every edit must have an `oldString` that is unique in the file (include surrounding context if needed)
- Every edit must have a `verified_by` test or check command
- If a fix requires a migration, include the SQL as a separate edit targeting supabase/migrations/
- If a fix requires env var changes, note it in `config_changes`

---

automation:
checks: - id: REMP-001
desc: "All edits have unique oldString"
read: "engine/outputs/remediation_patches.json"
expect: "no two edits in the same file have identical oldString" - id: REMP-002
desc: "All edits have verification commands"
read: "engine/outputs/remediation_patches.json"
expect: "every edit has non-empty verified_by array"
