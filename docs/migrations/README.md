# Migrations — conventions and policy

Schema changes live in `supabase/migrations/NNNNNNN_name.sql` (7-digit prefix).
The authoritative workflow (local commands, hosted apply, drift gate) is
[`../SUPABASE_MIGRATION_WORKFLOW.md`](../SUPABASE_MIGRATION_WORKFLOW.md); the
naming rules are in [`naming-guide.md`](naming-guide.md). This page records the
policies that the audit (DATA-P3-001/005) asked to keep in one place.

## Baseline and pre-baseline files

- `5302427` is the going-forward baseline. Every migration with a prefix
  `>= 5302427` must pair each `create policy` with a same-file
  `drop policy if exists <name> on <table>` earlier in the file;
  `scripts/verify-rls.mjs` rule 3 fails CI otherwise.
- Files `< 5302427` are pre-baseline history. Their missing drop-pairing was
  backfilled on 2026-10-12 (DATA-P3-001) so a fresh `db reset` / partial
  replay is idempotent, and the baseline rule applies to every new file.
- Do not renumber historical files or move the baseline.

## No down-migrations

The repository has **no** down/revert migration tooling and does not plan one.
A bad migration is recovered through one of the paths in
[`../ROLLBACK_PROCEDURES.md`](../ROLLBACK_PROCEDURES.md) §3:

1. a new forward migration that inverts the DDL (preferred), or
2. a reviewed manual SQL fix for a small change, or
3. PITR / backup restore when data (not just schema) was damaged.

Never delete or renumber an applied migration; a revert is a **new** file with
the next prefix.

## Rollback notes (required for destructive migrations)

A migration that drops tables/columns or rewrites privileges must carry a
`-- Rollback:` header comment stating:

- the inverse DDL (what to re-create or re-grant), and
- what requires a backup/PITR restore (dropped rows are gone).

Rollback notes document the manual path — they are not executable down
migrations. Current destructive migrations and their notes:

| Migration | What the note covers |
| --- | --- |
| `5302055_cleanup_dead_tables.sql` | re-create the nine dropped tables + policies |
| `5302110_restore_document_permissions.sql` | re-drop the restored objects (revert as a pair with 5302055) |
| `5302116_grant_table_privileges.sql` | revoke the re-granted privileges |
| `5302406_device_profiles.sql` | re-create the 5302074 shape + restore rows from backup |
| `5302407_network_diagrams.sql` | re-create the 5302072 shape + restore rows from backup |
| `5302432_drop_unused_soft_delete_columns.sql` | re-add the dropped columns/indexes (values were NULL) |

## Fresh-replay hardening in old files

Idempotency guards (`drop policy if exists`, `create table if not exists`),
transaction wrapping (`begin;`/`commit;`) and rollback notes may be backfilled
into already-applied files when they only change fresh-replay / partial-apply
behaviour: the statements already ran on migrated databases, so their effect
on those databases is unchanged. Never change the applied DDL effect itself in
an old file — add a new migration instead.
