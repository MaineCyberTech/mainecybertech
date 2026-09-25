# Supabase Migration Workflow

> Canonical workflow for schema changes and seed data. Reconciled 2026-09-24.

## Where things live

| Concern            | Location                                                |
| ------------------ | ------------------------------------------------------- |
| Schema changes     | `supabase/migrations/NNNNNNN_name.sql` (7-digit prefix) |
| Seed / test data   | `supabase/seeds/NN_name.sql`                            |
| Which seeds run    | `supabase/config.toml` → `[db.seed] sql_paths`          |
| Generated DB types | `packages/sdk/src/database.types.ts`                    |

There is **no** `supabase/seed.sql` or `supabase/verify_seed.sql` — that older
model was replaced by `supabase/seeds/*.sql` wired through `config.toml`.
`supabase/patches/` and `supabase/sql/` do not exist.

## Local development

```bash
supabase start
supabase db reset   # drops, re-applies all migrations, then runs the seeds in config.toml
```

`db reset` is the normal local loop. Never use `supabase db push` locally — it
targets the **linked remote** project.

## Adding a migration

1. Create `supabase/migrations/5302426_short_description.sql` (next number).
2. Prefer idempotent DDL: `create table if not exists`,
   `drop policy if exists X; create policy X …`, `add column if not exists`,
   `insert … on conflict do nothing`.
3. Regenerate types: `node scripts/generate-db-types.js`.
4. Test locally with `supabase db reset` and `pnpm --filter=api test`.
5. Commit the migration and the regenerated `database.types.ts` together.

`schema vs seed` rule: schema belongs in migrations; demo/test rows belong in
`supabase/seeds/`.

## Applying to hosted Supabase

`.github/workflows/supabase-migrations.yml` runs on push to `develop`/`main`
when `supabase/**` changes (and on `workflow_call`), executing
`supabase db push --include-all` against the hosted project. The prod deploy
(`deploy-do.yml`) has a prod-only `migrate-gate` that depends on it. Applied
migrations are tracked by Supabase, so re-running a file is not expected —
idempotency is a robustness safeguard, not the mechanism.

## Common mistakes

- Editing an already-applied migration instead of adding a new one.
- Referencing `supabase/seed.sql` (does not exist — use `supabase/seeds/`).
- Forgetting to regenerate `database.types.ts` after a DDL change.
- Running `supabase db push` against the hosted project by accident.
