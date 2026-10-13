# SUPABASE_MIGRATION_CHEATSHEET.md

## One-Page Cheat Sheet

Use this when you need the **exact command** and **when to use it**.

> Reconciled 2026-10-12 with the tree and
> [`SUPABASE_MIGRATION_WORKFLOW.md`](SUPABASE_MIGRATION_WORKFLOW.md) — the
> canonical workflow. There is **no** `supabase/seed.sql` or
> `supabase/verify_seed.sql`; seeds live in `supabase/seeds/*.sql` and run via
> `supabase/config.toml` → `[db.seed] sql_paths`.

---

## Core Commands

### Rebuild local DB from migrations + seeds

```bash
supabase db reset
```

**Use when:**
- you want a clean local rebuild
- you changed foundational schema logic
- you want to test the full migration chain from scratch
- you want to catch ordering / dependency issues
- you changed RLS, storage, permissions, or seed data

`db reset` drops the local database, re-applies every migration, and then runs
the seed files configured in `supabase/config.toml`.

---

### Apply migrations to the linked environment

```bash
supabase db push --include-all
```

**Use when:**
- the migration has been reviewed and merged (CI applies it)
- you are deliberately targeting the **linked remote** project

Never run this against a local database, and never use it as a local dev loop —
it targets the hosted project.

---

## Normal Workflow

```bash
supabase start        # one-time: start the local stack
supabase db reset     # rebuild from migrations + config.toml seeds
```

### Meaning
- `supabase start` → start the local Postgres/Auth/Storage stack
- `db reset` → clean local rebuild from migration history, then seeds
- `db push --include-all` → apply migrations forward on the **linked** project
  (CI does this on `develop`/`main`)

---

## When to Skip a Step

### Skip `db reset` if:
- you do not need a full clean local rebuild
- you are making a small incremental change and already trust local state

### Do **not** skip `db reset` if:
- you changed document logic
- you changed permissions / roles / memberships
- you changed RLS or storage-related behavior
- you changed a migration's fresh-replay behaviour

---

## Migration vs Seed vs Verify

### Migration = structure
Examples:
- tables
- columns
- enums
- policies
- functions
- triggers

### Seed = data
Examples:
- local auth users
- organizations
- document rows
- demo/test data
- permission edge cases

### Verify = proof
Examples:
- run the API/worker test suites (`pnpm --filter=api test`)
- `supabase db diff --linked --schema public` (CI fails on drift)
- spot-check counts/permissions in the local Studio

---

## Safe Rule for This Repo

If you changed anything touching:
- memberships
- roles / permissions
- documents
- document_versions
- document_permissions
- RLS
- storage

run the **full local chain**:

```bash
supabase db reset
pnpm --filter=api test
```

and regenerate the DB types when the schema changed:

```bash
node scripts/generate-db-types.js
```

---

## Quick Review Checklist

Before commit / PR:

- [ ] migration SQL written with the next sequential prefix
- [ ] local rebuild tested (`supabase db reset`)
- [ ] DB types regenerated if the schema changed
- [ ] destructive statements have a `-- Rollback:` note
- [ ] related docs updated

---

## Fastest explanation

```text
start  = run local stack
reset  = rebuild local (migrations + seeds)
push   = apply schema to the linked remote (CI)
test   = prove it worked
```
