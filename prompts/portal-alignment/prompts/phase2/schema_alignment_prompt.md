# PHASE 2 — DATABASE + SCHEMA ALIGNMENT

## Objective

Detect schema drift between migration files and actual Supabase database state. Identify missing indices, orphan tables, and foreign key integrity issues.

## Scope

IN: supabase/migrations/, apps/api/src/lib/supabase.ts
OUT: running DB state (infer from migration order)

## Validate

1. **Migration completeness** — every CREATE TABLE in a migration that has no corresponding .from() call in API code
2. **Foreign key integrity** — every REFERENCES clause has ON DELETE CASCADE (or explicitly justified)
3. **Index coverage** — common query patterns (by org_id, user_id, status, created_at) have covering indices
4. **Nullability** — columns that are NOT NULL in migrations but could be null in API insert patterns
5. **Type alignment** — column types match Zod schema expectations (uuid vs text, timestamptz vs timestamp)

## Output Format (`engine/outputs/schema_alignment.json`)

```json
[
  {
    "severity": "P0|P1|P2|P3",
    "phase": 2,
    "category": "schema",
    "table": "table_name",
    "column": "column_name (if applicable)",
    "file": "supabase/migrations/XXX_*.sql",
    "issue": "What the drift or gap is",
    "impact": "Runtime behavior consequences",
    "fix": "Specific SQL or code change",
    "migration_file": "relative/path"
  }
]
```

## Severity Definitions for Phase 2

- P0: Missing CASCADE causes orphan records; NOT NULL column that gets NULL inserts at runtime
- P1: Missing index on frequently filtered column; drift between migration and API query shape
- P2: Redundant index, dead migration no longer applied
- P3: Naming convention violation, missing column comment

---

automation:
checks: - id: SCA-001
desc: "Cross-reference CREATE TABLE with .from() calls"
grep: "CREATE TABLE"
path: "supabase/migrations/"
expect: "each table name found in apps/api/src/ .from('table_name') calls" - id: SCA-002
desc: "Check for CASCADE on foreign keys"
grep: "REFERENCES"
path: "supabase/migrations/"
expect: "majority of REFERENCES include ON DELETE CASCADE" - id: SCA-003
desc: "Index on org_id in every entity table"
grep: "CREATE INDEX.\*org_id|org_id_idx"
path: "supabase/migrations/"
expect: "org_id index exists on memberships, tickets, documents, projects, notifications"
