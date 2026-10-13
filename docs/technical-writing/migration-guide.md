# MCT Portal Migration Guide

> Deployment and migration guide for the MCT client portal. Reconciled against
> the current workflow on 2026-10-11. The canonical references are
> [`SUPABASE_MIGRATION_WORKFLOW.md`](../SUPABASE_MIGRATION_WORKFLOW.md) (schema
> changes), [`RELEASING.md`](../RELEASING.md) (promotion and release process),
> [`ROLLBACK_PROCEDURES.md`](../ROLLBACK_PROCEDURES.md) (rollback), and
> [`UPGRADE.md`](../UPGRADE.md) (breaking changes / upgrade manifest). When this
> guide and those documents disagree, they win.

## 1. Database migrations (Supabase)

### Naming

Migrations use a 7-digit sequential prefix, not a timestamp:

```
supabase/migrations/5302NNN_short_description.sql
```

Use the next free number (e.g. `5302446` → `5302447`). See
[`migrations/naming-guide.md`](../migrations/naming-guide.md) for the name
conventions.

### Local development

```bash
# Start the local stack
supabase start

# Drop, re-apply all migrations, then run the seeds in config.toml
supabase db reset
```

`supabase db reset` is the normal local loop. Never run `supabase db push`
locally — it targets the linked hosted project.

### Adding a migration

1. Create `supabase/migrations/<next-number>_short_description.sql`.
2. Prefer idempotent DDL (`create table if not exists`, `drop policy if
   exists` before `create policy`, `add column if not exists`, `insert … on
   conflict do nothing`).
3. Regenerate types: `node scripts/generate-db-types.js`.
4. Test locally: `supabase db reset && pnpm --filter=api test`.
5. Commit the migration and the regenerated
   `packages/sdk/src/database.types.ts` together.

Schema belongs in migrations; demo/test rows belong in `supabase/seeds/`.

### Applying to the hosted project

[`.github/workflows/supabase-migrations.yml`](../../.github/workflows/supabase-migrations.yml)
runs on pushes to `develop`/`main` that touch `supabase/**` (and on
`workflow_call`), applying `supabase db push --include-all` against the hosted
project, serialized per branch. Prod runs attach the approval-gated
`prod-approval` environment (BP-P3-003), so a production migration pauses for
the same reviewers as the prod deploy. The prod deploy (`deploy-do.yml`) has a
prod-only `migrate-gate` that depends on it. Applied migrations are tracked by
Supabase; editing an already-applied file is never the fix — add a new one.

### Bad-migration recovery

There is **no** automated `down`/revert command. Undo a bad migration with, in
order of preference:

1. A reverse migration — a new forward file
   (`supabase/migrations/<next-number>_revert_<name>.sql`) with the inverse DDL,
   applied by the normal workflow.
2. Manual SQL for a small, well-understood change
   ([`ROLLBACK_PROCEDURES.md`](../ROLLBACK_PROCEDURES.md) §3 Option C).
3. PITR or a full restore when data (not just schema) was damaged — see §3
   Option B and §3a.

The rehearsable drill lives in
[`SUPABASE_MIGRATION_WORKFLOW.md`](../SUPABASE_MIGRATION_WORKFLOW.md).

## 2. Application deployments

[`.github/workflows/deploy-do.yml`](../../.github/workflows/deploy-do.yml)
deploys on pushes to `main` or `develop` that touch `apps/api/**`,
`apps/web/**`, `apps/worker/**`, `packages/**`, `infra/digitalocean/**` or the
workflow itself; deploys are queued per ref and an in-flight prod deploy is
never cancelled.

- `main` → prod (`app.mainecybertech.com`), `develop` → dev
  (`app.mainecybertech.us`). Promoting means merging `develop` into `main`.
- Prod-only gates: `e2e-gate` and `migrate-gate`; the prod `deploy` job
  attaches the `prod-approval` environment. A manual prod dispatch is only
  accepted from the `main` ref.
- Images are built and pushed to GHCR tagged with the commit SHA (or the
  `rollback_sha`).

Local builds and tests:

```bash
pnpm --filter=api build      # tsup
pnpm --filter=web build      # next build
pnpm lint && pnpm typecheck && pnpm test && pnpm e2e
```

## 3. Versioning and release notes

- [`VERSION`](../../VERSION) at the repo root is the product version source of
  truth; generated artifacts bind `<VERSION>+<commit SHA>`. The commit SHA
  stays authoritative for images and rollbacks.
- Each promotion push to `main` makes
  [`release.yml`](../../.github/workflows/release.yml) cut the
  `v<VERSION>-<YYYYMMDD>-<short-sha>` tag and a GitHub Release with a generated
  body (commits since the previous tag, migrations added, `UPGRADE.md` window)
  plus the lockfile SBOM attached; fill the human sections from
  [`templates/RELEASE_NOTES_TEMPLATE.md`](../../templates/RELEASE_NOTES_TEMPLATE.md)
  (Breaking Changes, Migrations, Operator Actions). See
  [`RELEASING.md`](../RELEASING.md) for the scheme.
- [`UPGRADE.md`](../UPGRADE.md) is the running manifest of behavior-affecting
  changes; add an entry there when a migration wave lands.

## 4. Rollback

- **Application:** dispatch `deploy-do` with `rollback_sha` set to the previous
  working commit (7–40 lowercase hex). Builds are skipped and the droplet
  redeploys the existing GHCR images; see
  [`ROLLBACK_PROCEDURES.md`](../ROLLBACK_PROCEDURES.md) §1–§2.
- **Database:** reverse migration, PITR, or backup restore — §3, §3a and §3b.
  There is no down-migration automation.
- **Terraform:** revert the commit, then dispatch `terraform-do` with `apply`
  on — push does not trigger it. §4.

## 5. Troubleshooting

| Issue | Symptom | Resolution |
| --- | --- | --- |
| Health check fails | `/health` returns 503 | Check API logs, verify Supabase connectivity |
| Build fails | TypeScript errors | Run `pnpm typecheck` locally first |
| Test failures | CI pipeline red | Run `pnpm test` locally, fix failures |
| Migration timeout | Deployment hangs | Check Supabase dashboard for locks |
| CORS errors | Frontend can't call API | Verify `CORS_ORIGIN` includes the frontend domain |

```bash
# Check a workflow run
gh run view <run-id> --log

# Check service health
curl -sf https://api.mainecybertech.com/health
curl -sf -o /dev/null -w "%{http_code}" https://app.mainecybertech.com/login
curl -sf http://localhost:3001/health    # worker, on the droplet

# Check the database / logs
supabase status
ssh root@<droplet-ip> "docker logs mct-portal-api-1 --tail 100"
```

## Key files

| File | Purpose |
| --- | --- |
| `supabase/migrations/*.sql` | Database schema changes |
| `supabase/seeds/*.sql` | Seed data (wired through `config.toml`) |
| `packages/sdk/src/database.types.ts` | Generated DB types |
| `apps/api/.env.example` | API environment template |
| `apps/web/.env.example` | Web environment template |
| `infra/terraform/digitalocean/` | Infrastructure as Code |
| `.github/workflows/` | CI/CD pipelines |

---

*Reconciled: 2026-10-11*
