# PHASE 6 — REMEDIATION MAPPING

## Objective

Aggregate all non-resolved findings from phases 1-5, assign fix priorities, group into patch sets, and estimate effort.

## Scope

IN: engine/outputs/inventory.json, schema_alignment.json, api_contract.json,
frontend_alignment.json, cross_domain.json
OUT: engine/outputs/remediation_plan.json

## Process

1. **Deduplicate** — if same finding appears in multiple phases, keep the one with the most context
2. **Prioritize** — sort by severity (P0 first), then impact breadth (how many users/flows affected)
3. **Group** — cluster by file or by feature area (e.g., "tickets", "auth", "documents")
4. **Effort estimate** — label each as `XS (<1hr)`, `S (1-4hr)`, `M (1-2d)`, `L (3-5d)`, `XL (1-2w)`
5. **Dependency graph** — if fix A must come before fix B, note the dependency

## Output Format (`engine/outputs/remediation_plan.json`)

```json
{
  "generated_at": "<ISO8601>",
  "total_findings": 0,
  "by_severity": { "P0": 0, "P1": 0, "P2": 0, "P3": 0 },
  "patch_sets": [
    {
      "id": "PS-001",
      "name": "Auth hardening",
      "severity": "P0",
      "dependencies": [],
      "effort": "S",
      "findings": ["finding-ref-1", "finding-ref-2"],
      "files": ["apps/api/src/lib/auth.ts", "apps/api/src/middleware/security.ts"],
      "strategy": "Description of the combined fix approach"
    }
  ],
  "unresolved": [
    {
      "severity": "P0|P1|P2|P3",
      "phase": 1-5,
      "finding_ref": "unique-id",
      "file": "path",
      "issue": "",
      "impact": "",
      "fix": "",
      "effort": "XS|S|M|L|XL",
      "patch_set": "PS-001"
    }
  ]
}
```

## Rules

- Every finding must be in exactly one patch set
- Patch set 0 = "Immediate fix" — P0 findings only, no dependencies, effort S or less
- Do not include findings that were resolved_by_phase in earlier phases
- If a fix spans 3+ files, consider making it its own patch set even if effort is small

---

automation:
checks: - id: REM-001
desc: "No missing effort estimates"
read: "engine/outputs/remediation_plan.json"
expect: "every unresolved finding has effort field, no nulls" - id: REM-002
desc: "All P0 findings in patch sets"
read: "engine/outputs/remediation_plan.json"
expect: "every finding with severity P0 has patch_set assigned"
