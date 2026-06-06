# SUPABASE_MIGRATION_CHEATSHEET.md

## One-Page Cheat Sheet

Use this when you need the **exact command** and **when to use it**.

---

## Core Commands

### Rebuild local DB from migrations

```bash
supabase db reset
```

**Use when:**
- you want a clean local rebuild
- you changed foundational schema logic
- you want to test the full migration chain from scratch
- you want to catch ordering / dependency issues

---

### Apply migrations to the linked environment

```bash
supabase db push
```

**Use when:**
- your migration SQL is ready
- you want to apply schema changes to the linked Supabase project
- you have confirmed you are targeting the correct environment

---

### Seed aligned data

```bash
supabase db query < supabase/seed.sql
```

**Use when:**
- the schema already exists
- you need baseline or aligned data
- you are setting up or refreshing a development/test environment

---

### Verify the result

```bash
supabase db query < supabase/verify_seed.sql
```

**Use when:**
- you need to confirm the migration + seed result is actually correct
- you want to validate counts, seeded paths, versions, and permissions

---

## Normal Workflow

```bash
supabase db reset
supabase db push
supabase db query < supabase/seed.sql
supabase db query < supabase/verify_seed.sql
```

### Meaning
- `db reset` → clean local rebuild from migration history
- `db push` → apply schema changes forward
- `seed.sql` → load aligned data
- `verify_seed.sql` → confirm expected output

---

## When to Skip a Step

### Skip `db reset` if:
- you do not need a full clean local rebuild
- you are making a small incremental change and already trust local state

### Skip `seed.sql` if:
- you are only testing schema changes
- you do not need baseline data for the current task

### Do **not** skip `verify_seed.sql` if:
- you changed document logic
- you changed permissions / roles / memberships
- you changed RLS or storage-related behavior

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
- organizations
- document rows
- document versions
- permission rows

### Verify = proof
Examples:
- row counts
- visibility distribution
- seeded storage paths
- version checks
- permission checks

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

run the **full chain**:

```bash
supabase db reset
supabase db push
supabase db query < supabase/seed.sql
supabase db query < supabase/verify_seed.sql
```

---

## Quick Review Checklist

Before commit / PR:

- [ ] migration SQL written
- [ ] local rebuild tested if needed
- [ ] migrations pushed
- [ ] seed run if needed
- [ ] verification reviewed
- [ ] related docs updated

---

## Fastest explanation

```text
reset = rebuild local
push = apply schema
seed = load data
verify = prove it worked
```
