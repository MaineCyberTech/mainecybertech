# PHASE 5 — CROSS-DOMAIN RECONCILIATION

## Objective

Connect findings from phases 1-4 into cross-domain issue chains. A single problem may span: schema → API contract → frontend rendering.

## Scope

IN: engine/outputs/inventory.json, engine/outputs/schema_alignment.json,
engine/outputs/api_contract.json, engine/outputs/frontend_alignment.json
OUT: new findings only (do not duplicate prior phase findings)

## Detect

1. **End-to-end data flow breaks** — column exists in migration, API reads it, but frontend doesn't display it (or vice versa)
2. **Cross-domain type drift** — DB type is `text`, API Zod schema says `z.string().uuid()`, SDK type says `string`
3. **Auth/tenancy gaps** — route has requireAuth but SDK doesn't pass token; frontend API call misses org_id
4. **Validation mismatch** — API validates via Zod, but frontend form doesn't match constraints
5. **Dead code flows** — frontend calls SDK method that hits API route that queries table that no longer exists

## Output Format (`engine/outputs/cross_domain.json`)

```json
[
  {
    "severity": "P0|P1|P2|P3",
    "phase": 5,
    "category": "reconciliation",
    "file_primary": "primary file",
    "files_involved": ["file1", "file2", "file3"],
    "issue": "Summary of the cross-domain inconsistency",
    "impact": "End-to-end impact on user or system",
    "fix": "Concrete steps across all involved layers",
    "chain": "schema → api → frontend (describe the data flow breakage)"
  }
]
```

## Severity Definitions for Phase 5

- P0: Data silently lost in transit (column created but never rendered or readable)
- P1: Type mismatch causes runtime error (uuid vs text at boundary)
- P2: Missing field in frontend display; validation mismatch (min vs max)
- P3: Dead code across 2+ layers; cosmetic display issue

---

automation:
checks: - id: CRD-001
desc: "Cross-reference migration columns with API Zod schemas"
grep: "z\.string\(\)|z\.uuid\(\)|z\.enum\(\["
path: "apps/api/src/"
include: "_.ts"
expect: "Zod schemas should reflect DB column types" - id: CRD-002
desc: "Cross-reference API routes with component imports for same entity"
grep: "sdk\.(tickets|documents|projects|organizations)"
path: "apps/web/components/"
include: "_.tsx"
expect: "components using SDK should match available routes"
