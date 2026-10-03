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

## Bad-migration recovery (audit IR-P1-002)

There is **no** automated `down`/revert command and no migration-reversal tool —
the repository does not have one, and this procedure does not invent one. A bad
migration is undone by one of the paths in
[`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) §3:

1. **Reverse migration (preferred, least data loss).** Author a new forward
   migration `supabase/migrations/<next-number>_revert_<name>.sql` containing
   the inverse DDL (`drop table if exists`, `drop column if exists`, policy
   restore, etc.), commit it, and let `supabase-migrations.yml` apply it.
   Never edit or delete the already-applied migration file.
2. **Manual SQL** for a small, well-understood change (`ROLLBACK_PROCEDURES.md`
   §3 Option C).
3. **PITR / full restore** when data (not just schema) was damaged — see §3
   Option B and §3a. This loses writes after the restore point, so it is the
   last resort, not the first.

### Pre-apply automated check

`supabase-migrations.yml` now captures the `supabase db diff --linked --schema
public` dry-run and **fails** when it is non-empty, so unreconciled drift is
seen before `db push` instead of being swallowed by `|| true`. A reviewed
`workflow_dispatch` run may set `allow_drift=1` to bypass the check.

### Bad-migration drill (rehearsable)

Run against a throwaway Supabase project/branch — never production:

1. Note the pre-migration schema fingerprint:
   `supabase db dump --linked --schema public -f before.sql`.
2. Apply a deliberately bad migration (e.g. drop a column).
3. Recover using path 1 above; time the recovery.
4. Assert equivalence: diff `supabase db dump --linked --schema public -f
   after.sql` against `before.sql` and confirm the only differences are the
   intended revert (no lost columns/policies).
5. Record the measured recovery time and the diff evidence, and compare it to
   the Postgres RTO in [`RTO_RPO.md`](RTO_RPO.md).

Until a dated drill artifact exists, bad-migration recovery is *documented but
not exercised*.
