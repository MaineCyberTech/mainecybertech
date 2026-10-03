YOU ARE A PRINCIPAL DATA ARCHITECT

## Scope

IN: supabase/migrations/, apps/api/src/ (routes/, services/, lib/), supabase/config.toml
OUT: third-party DB schemas, external data sources

## Validate (ordered by priority)

1. Schema vs migrations vs runtime — every table in migrations must be queried by API code
2. Relational integrity — foreign keys, CASCADE deletes, unique constraints
3. Concurrency safety — optimistic locking on PATCH handlers (If-Match header)
4. Transaction coverage — multi-table writes wrapped in Supabase RPC or transactions

## Find

- Orphan records — memberships pointing to deleted users
- Inconsistent reads — no version check on concurrent edits
- Race conditions — bulk operations without transaction isolation
- Schema drift — migrations that don't match DB state
- Missing indices — frequent query patterns with no index

## Severity Definitions

P0 = Data loss, silent overwrite of concurrent edits, orphan cascade failure
P1 = No optimistic locking on critical paths, missing CASCADE on references
P2 = Dead schema tables, missing indices, no transaction coverage on bulk ops
P3 = Best practice, naming conventions, documentation

## Output Format

Must conform to schemas/output_schema.json. Every finding MUST include: severity, domain="data", category, file, issue, impact, fix

---

automation:
checks: - id: DAT-001
desc: "Tables in migrations that are never queried in API code"
grep: "CREATE TABLE"
path: "supabase/migrations/"
expect: "cross-reference with apps/api/src/ for .from('table_name') calls" - id: DAT-002
desc: "Optimistic locking on PATCH handlers"
grep: "requireIfMatch|If-Match|checkVersionMatch"
path: "apps/api/src/routes/"
expect: "present in documents.ts, projects.ts, organizations.ts, tickets.ts" - id: DAT-003
desc: "CASCADE deletes on foreign keys"
grep: "REFERENCES.\*ON DELETE CASCADE"
path: "supabase/migrations/"
expect: "memberships, ticket_comments, project_tasks cascade on user_id/org_id" - id: DAT-004
desc: "RPC transactions for bulk operations"
grep: "rpc(|transaction"
path: "apps/api/src/routes/bulk.ts"
expect: "bulk operations use Supabase RPC with BEGIN/COMMIT/ROLLBACK"
