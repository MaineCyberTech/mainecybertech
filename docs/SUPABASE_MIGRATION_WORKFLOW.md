# SUPABASE_MIGRATION_WORKFLOW.md

## Purpose

This guide explains the **recommended Supabase migration workflow** for the Maine CyberTech Portal repository.

It is designed to help contributors safely:
- create or update schema changes
- apply migrations locally or to a linked environment
- seed data when needed
- verify results
- keep migration history clean and understandable

---

## Core Principle

Keep these concerns separate:

- **Migrations** = schema / database structure changes
- **Seeds** = data insertion or alignment after schema exists
- **Verification** = checks that confirm the environment is correct

For this project, that usually means:
- schema changes belong in `supabase/migrations/`
- data setup belongs in `supabase/seed.sql`
- verification belongs in `supabase/verify_seed.sql`

---

## Repository Context

Relevant paths in this repo:

```text
supabase/
  config.toml
  migrations/
  patches/
  seeds/
  seed.sql
  verify_seed.sql
sql/
  README.md
  supporting SQL / bootstrap / verification docs
```

Important operational note:
- older migration, patch, and seed history should be cleaned up over time so contributors can clearly identify the active path
- do not create throwaway duplicate SQL variants unless they are intentionally documented

---

## Recommended Workflow

## Seed Files

Seed files are configured in `supabase/config.toml` under `[db.seed]`:

```toml
[db.seed]
enabled = true
sql_paths = [
  "./seeds/00_local_auth_users.corrected.v2.sql",
  "./seeds/01_attach_real_users.corrected.v2.sql",
  "./seeds/02_schema_aligned_seed.sql",
  "./seeds/03_local_portal_extra_demo_seed.sql",
  "./seeds/04_test_seed.sql"
]
```

Files are executed in order during `supabase db reset`. New seed files must be added to `sql_paths` to execute.

## Step 1 — Decide what kind of change you are making

### Use a migration when you are changing structure
Examples:
- creating a table
- altering a table
- adding a column
- adding an enum value
- creating or updating functions
- creating or updating RLS policies
- adding indexes, constraints, triggers, or foreign keys

### Use a seed when you are changing data
Examples:
- inserting reference rows
- inserting demo / baseline portal data
- aligning documents / versions / permissions
- setting up safe test data after the schema exists

### Use verification when you want proof the result is correct
Examples:
- row counts
- presence of seeded documents
- visibility distribution
- version checks
- permission checks

---

## Step 2 — Author or update the migration

Create or update the SQL in the active migration path.

### Best practices
- keep the migration focused on one logical schema change set
- avoid mixing seed data into migration files
- prefer explicit SQL over hidden side effects
- if changing security-sensitive areas, include helper functions / RLS / storage alignment as part of the migration plan

### Examples of good migration content
- `create table`
- `alter table`
- `create type`
- `create or replace function`
- `create policy`
- `create trigger`
- `create index`

---

## Step 3 — Test locally with a clean rebuild when needed

If you want to confirm the migration chain rebuilds correctly from scratch, run:

```bash
supabase db reset
```

### When to use this
Use `supabase db reset` when:
- you are testing the full local migration chain from zero
- you changed foundational schema logic
- you want to catch ordering / dependency issues early
- you want a clean local state before reseeding

### What it does
This rebuilds the local database from the migration history and clears out drift in a dev environment.

---

## Step 4 — Apply migrations to the linked environment

To push the current migration state to the linked Supabase project, run:

```bash
supabase db push
```

### When to use this
Use `supabase db push` when:
- your migration SQL is ready
- you want to apply the current local schema state to the linked target environment
- you have already tested locally or are intentionally promoting a migration forward

### Important
Before pushing:
- confirm you are linked to the intended Supabase environment
- confirm your local migration files are the ones you actually want applied
- confirm you are not accidentally carrying old / obsolete SQL in the active path

---

## Step 5 — Seed data if the workflow requires it

If the schema is in place and you need baseline or aligned data, run:

```bash
supabase db query < supabase/seed.sql
```

### When to use this
Use `seed.sql` when:
- the schema already exists
- you need initial or aligned test data
- you want seeded organization / document / permission examples
- you are setting up a new environment after migrations

### Important distinction
`seed.sql` is **not** the migration layer.
It should not be treated as the source of schema truth.

---

## Step 6 — Verify the result

After applying schema and seed changes, validate the environment:

```bash
supabase db query < supabase/verify_seed.sql
```

### What verification should check
Typical checks include:
- table counts
- document visibility counts
- seeded storage paths
- document version rows
- document permission rows

### Why this matters
In this project, document access depends on multiple aligned layers:
- document rows
- versions
- explicit permissions
- RLS behavior
- storage path alignment

That means verification is not optional if you want confidence the environment is actually correct.

---

## Step 7 — Review the output before committing

Before committing migration work, review:
- migration SQL output
- seed output
- verification output
- any notices or warnings from the CLI

### Specifically verify
- the schema applied without unexpected errors
- seeded rows are present where expected
- old rows were not unintentionally overwritten
- verification output matches your expected environment state

---

## Step 8 — Commit related changes together

When the migration is validated, commit the following together where appropriate:
- migration SQL
- seed updates
- verification updates
- related documentation updates
- README / workflow updates if the process changed

### Why
This keeps schema evolution and operational instructions aligned.

---

## Migration vs Seed vs Verify

## Migration
Use for **structure**.

```sql
create table ...
alter table ...
create policy ...
```

## Seed
Use for **data**.

```sql
insert into ...
update ...
```

## Verify
Use for **proof / validation**.

```sql
select count(*) ...
select ... where storage_path in (...)
```

---

## When to use each command

## `supabase db reset`
Use when:
- testing the local migration chain from scratch
- you need a clean local rebuild
- you want to confirm ordering and dependency correctness

## `supabase db push`
Use when:
- you are ready to apply migrations to the linked environment
- you want to move current migration state forward

## `supabase db query < supabase/seed.sql`
Use when:
- the schema already exists
- you need baseline or aligned data inserted

## `supabase db query < supabase/verify_seed.sql`
Use when:
- you need confidence that the environment is actually correct after migration / seed work

---

## Recommended Daily Developer Flow

For a normal change:

```text
1. Write / update migration SQL
2. Test locally (reset if needed)
3. Push migration
4. Seed if needed
5. Verify
6. Review output
7. Commit migration + seed + verify + docs together
```

---

## Safe Workflow for This Repository

Use this order whenever possible:

### Schema-first workflow
```bash
supabase db reset
supabase db push
supabase db query < supabase/seed.sql
supabase db query < supabase/verify_seed.sql
```

### Why this is safe here
This project has:
- tenant-aware security
- RLS policies
- document permissions
- document versions
- storage alignment

Those features make verification especially important after any nontrivial schema change.

---

## Common Mistakes to Avoid

### 1) Mixing schema and seed logic together
Keep migrations structural and seeds data-focused.

### 2) Forgetting verification
A migration that “ran” is not the same as an environment that is “correct.”

### 3) Leaving obsolete SQL clutter in active paths
Old migration / patch / seed copies make future changes riskier.

### 4) Changing document schema without considering storage / permissions
Document features in this repo are tightly connected to:
- documents
- document_versions
- document_permissions
- storage policies

### 5) Pushing to the wrong environment
Always confirm which Supabase project is linked before `db push`.

---

## Recommended Review Checklist

Before merging a migration-related PR, confirm:

- [ ] migration SQL is focused and intentional
- [ ] seed SQL is separate from schema SQL
- [ ] `supabase db reset` was used where appropriate
- [ ] `supabase db push` completed successfully
- [ ] `seed.sql` was run if needed
- [ ] `verify_seed.sql` output was reviewed
- [ ] docs / README updates were included if the workflow changed

---

## Short Version

### Use these commands in this order

```bash
supabase db reset
supabase db push
supabase db query < supabase/seed.sql
supabase db query < supabase/verify_seed.sql
```

### Meaning
- `db reset` → rebuild local from migrations
- `db push` → apply migrations to linked environment
- `seed.sql` → load aligned data
- `verify_seed.sql` → confirm the result is correct

---

## Final Recommendation

For this portal, treat migrations as part of the **security model**, not just the schema model.

Because the platform depends on:
- roles and permissions
- membership approval
- RLS policies
- document permissions
- storage alignment

A migration is only finished when the schema, seed, and verification layers all agree.
