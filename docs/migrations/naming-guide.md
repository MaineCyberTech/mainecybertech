# Migration Naming Convention Guide

> Reconciled 2026-10-12 with the tree and the canonical
> [`../SUPABASE_MIGRATION_WORKFLOW.md`](../SUPABASE_MIGRATION_WORKFLOW.md).
> The repository uses **sequential numeric prefixes**, not ISO timestamps —
> earlier revisions of this guide described an ISO format that no migration in
> `supabase/migrations/` uses.

## Overview

This document establishes the standard naming convention for database migrations in the MCT Client Portal. Consistent naming ensures easy tracking, rollback capability, and team collaboration.

## Naming Pattern

**Format:** `NNNNNNN_<descriptive_name>.sql`

### Components:

- **Prefix**: `NNNNNNN` — the next sequential 7-digit number (`5302459`, `5302460`, …)
- **Separator**: Single underscore `_`
- **Description**: Lowercase, snake_case, action-oriented description

### Examples (from the tree):

| Migration                                        | Description                            |
| ------------------------------------------------ | -------------------------------------- |
| `5302456_search_prefix_and_fulltext_indexes.sql` | Adds search prefix/fulltext indexes    |
| `5302457_status_check_constraints.sql`           | Adds status CHECK constraints          |
| `5302458_close_analytics_anon_insert.sql`        | Revokes anon inserts on analytics      |
| `5302459_dead_rls_permission_predicates.sql`     | Resolves dead RLS permission predicates |

## Guidelines

### 1. Prefix

- Use the **next number after the newest file** in `supabase/migrations/`
  (they are sequential and monotonic; the workflow doc's `5302426` example
  demonstrates the pattern, not a fixed value).
- Never renumber or edit an already-applied migration — add a new file.
- Duplicate prefixes are not allowed; check with the validation command below.

### 2. Description Guidelines

- **Action-oriented**: start with verb (create, add, update, remove, rename, alter, fix)
- **Lowercase**: all letters lowercase
- **Snake_case**: words separated by underscores
- **Descriptive**: clearly indicates what the migration does
- **Concise**: keep it readable; there is no hard character cap

### 3. Migration Types & Prefixes

| Action         | Prefix                 | Example                       |
| -------------- | ---------------------- | ----------------------------- |
| Create table   | `create_`              | `create_users_table`          |
| Add column     | `add_`                 | `add_email_to_users`          |
| Add index      | `add_` + `idx_`        | `add_idx_email_to_users`      |
| Add constraint | `add_` + `constraint_` | `add_constraint_email_unique` |
| Remove column  | `remove_`              | `remove_deprecated_field`     |
| Remove index   | `remove_`              | `remove_old_index`            |
| Rename         | `rename_`              | `rename_old_column_to_new`    |
| Alter/Modify   | `alter_`               | `alter_column_type`           |
| Update data    | `update_`              | `update_user_statuses`        |
| Fix            | `fix_`                 | `fix_document_versions_update_predicate` |
| Cleanup        | `cleanup_`             | `cleanup_unused_tables`       |

### 4. Special Cases

- **Data migrations**: Use `update_` or `seed_` prefix
- **Schema-only changes**: Use structural prefixes (`create_`, `add_`, `alter_`, `remove_`)
- **Rollback scripts**: Include rollback instructions in comments (see
  [`README.md`](README.md) — there is no automated down-migration tooling)

## Migration Checklist

Before creating a new migration:

1. [ ] Check existing migrations for similar changes
2. [ ] Take the next sequential prefix (`ls supabase/migrations | sort | tail -1`)
3. [ ] Write descriptive name following conventions
4. [ ] Verify no duplicate prefixes exist
5. [ ] Ensure migration is idempotent where possible
6. [ ] Add rollback comments for destructive changes
7. [ ] Test locally with `supabase db reset`
8. [ ] Regenerate `packages/sdk/src/database.types.ts` if the schema changed
9. [ ] Update any related documentation

## File Structure

```
supabase/
├── migrations/
│   ├── 5302026_...v3.sql
│   ├── 5302118_permission_matrix_full_catalog.sql
│   ├── 5302458_close_analytics_anon_insert.sql
│   └── ...
├── seeds/
│   ├── 00_local_auth_users.corrected.v2.sql
│   ├── 02_schema_aligned_seed.sql
│   └── ...
└── config.toml
```

Seed files are `supabase/seeds/*.sql` wired through
`supabase/config.toml` → `[db.seed] sql_paths`; there is **no**
`supabase/seed.sql` or `supabase/verify_seed.sql`.

## Anti-Patterns to Avoid

| ❌ Avoid               | ✅ Use Instead                                 |
| ---------------------- | ---------------------------------------------- |
| `migration_001.sql`    | `5302460_add_user_email_index.sql`             |
| `fix_bug.sql`          | `5302460_fix_user_email_validation.sql`        |
| `V2__create_table.sql` | `5302460_create_users_table.sql`               |
| `20260626120000_x.sql` | `5302460_x.sql` (ISO timestamps are not used)  |
| `changes.sql`          | `5302460_update_user_status_enum.sql`          |

## Migration Template

```sql
-- Migration: 5302460_create_example_table.sql
-- Description: Creates the example table for demonstration
-- Author: [Your Name]
-- Rollback: DROP TABLE IF EXISTS example;

-- Create table
CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_example_name ON example(name);
```

## Validation Commands

```bash
# Check for duplicate prefixes (7-digit sequential format)
ls supabase/migrations/ | grep -oE '^[0-9]{7}' | sort | uniq -d

# Check migration order
ls supabase/migrations/ | sort

# Local rebuild (drops, re-applies migrations, then runs config.toml seeds)
supabase db reset

# Never use `supabase db push` locally — it targets the linked remote project.
```

## Best Practices

1. **One migration per logical change** - Don't bundle unrelated changes
2. **Write reversible migrations** - Include rollback plan in comments
3. **Test on staging first** - Never run untested migrations on production
4. **Keep migrations small** - Easier to review, debug, and rollback
5. **Document breaking changes** - Note in PR description and changelog
6. **Use transactions** - Wrap multi-statement migrations in `BEGIN; ... COMMIT;`

## Migration Workflow

1. **Create**: Take the next sequential prefix with a descriptive name
2. **Review**: Code review for schema changes
3. **Test**: Run `supabase db reset` locally
4. **Deploy**: Apply via CI/CD (`supabase-migrations.yml` runs `supabase db push --include-all`)
5. **Verify**: Post-deployment validation
6. **Monitor**: Watch for errors post-deployment

---

_Last updated: 2026-10-12_
_MCT Portal Engineering Team_
