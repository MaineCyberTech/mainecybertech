# Backup and Restore Drill Plan (companion artifact)

- Companion to: `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/32_backup_restore_drill.md`
- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:/temp/mainecybertech
- Branch: develop
- Commit SHA: 62861370 (6286137017c4b7c77e83ee420ec11382d984f263)
- Generated at: 2026-10-02T03:44Z
- Auditor: principal repository auditor
- Nature: **PLAN ONLY**. No backup, restore, or destructive command was executed while producing this plan.

---

## 1. Purpose and safety framing

This plan describes how to actually *exercise* backup and restore for the Maine CyberTech
portal, so that "configured" becomes "exercised" with a captured artifact. It is written to be
run by an operator on an isolated target, never against production data.

**Hard safety rules for every drill below:**

1. Restore into a throwaway database / throwaway Supabase project — never the linked production project.
2. Never run `scripts/restore-database.sh` with `SUPABASE_DB_URL` pointing at production without explicit change approval.
3. Never delete backup objects during a drill except in a dedicated scratch bucket.
4. Redact secrets at all times; capture only key names, exit codes, counts, and timestamps.
5. Record the drill result as a committed artifact (see §7) so the next audit can cite a real exercise date.

## 2. Current state snapshot (what exists today)

| Asset | Path | State | Exercised? |
|---|---|---|---|
| Daily DB backup workflow | `.github/workflows/db-backup.yml` | Exists on `develop` only; **absent on `main` (default branch)** | `not exercised` (scheduled workflows only run from default branch) |
| Backup script (bash) | `scripts/backup-database.sh` | Present; pg_dump → gzip → S3/Spaces; 30-day retention | `not exercised` |
| Backup script (PowerShell) | `scripts/backup-database.ps1` | Present; duplicate of bash logic | `not exercised` |
| Weekly restore test | `.github/workflows/db-restore-test.yml` | Exists on `develop` only; restores to temp `postgres:16-alpine`; **prints counts, asserts nothing** | `not exercised` |
| Manual restore script | `scripts/restore-database.sh` | Present; `--dry-run` supported; no guardrail against prod URL | `not exercised` |
| Supabase PITR | `docs/ROLLBACK_PROCEDURES.md` §3 Option B | Documented (7-day, Pro plan) | `not exercised` |
| Terraform state | `infra/terraform/digitalocean/providers.tf` + `env/backend.*.hcl` | Remote S3/Spaces backend, `use_lockfile = true`; state gitignored | `not exercised` (state read, not restored) |
| Terraform state bucket versioning | — | No `digitalocean_spaces_bucket` resource; RTO_RPO claims "versioning enabled" | `Unknown` / unverified |
| Storage buckets (`documents`, `avatars`) | `apps/worker/src/tasks/orphan-cleanup.ts` | No backup path of any kind | `not exercised` — no mechanism |
| Redis | `infra/digitalocean/docker-compose.yml` | No backup; rebuilt from DB per `docs/RTO_RPO.md` | `not exercised` |
| Secrets | `docs/SECRETS_ROTATION.md` | Rotation documented; no backup/escrow | N/A (rotate, don't restore) |

## 3. Drill inventory and cadence

| ID | Drill | Target | Cadence | Est. duration | Owner |
|---|---|---|---|---|---|
| D1 | Full DB restore from latest S3 dump | Throwaway Postgres (docker) | Weekly (matches restore-test intent) | 30 min | Platform |
| D2 | Point-in-time recovery | Throwaway Supabase project / PITR fork | Monthly | 60 min | Platform |
| D3 | Restore integrity + tenant isolation assertions | Same as D1 target | Every D1 run | +15 min | Backend |
| D4 | Bad migration drill (roll forward + reverse migration) | Throwaway Supabase project | Quarterly | 90 min | Backend |
| D5 | Storage bucket recovery drill | Throwaway bucket | Quarterly | 60 min | Platform |
| D6 | Terraform state recovery drill | Scratch backend bucket | Semi-annual | 60 min | Infra |
| D7 | Full droplet-loss exercise (paper + partial) | Dev droplet or scratch | Semi-annual | 4 h | Platform/NOC |

## 4. Restore dependency inventory

For D1 (database restore) the following must all be available and known-good:

| Dependency | Source | Failure mode if missing |
|---|---|---|
| `SUPABASE_DB_URL` (target) | GitHub secret / operator env | Restore aborts (script checks presence) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | GitHub secret | No S3 listing / download |
| `S3_BACKUP_BUCKET` (full `s3://bucket/prefix` URI) | GitHub secret | `aws s3 ls` returns nothing → "No backups found" |
| Backup object name/prefix convention | `scripts/backup-database.sh` (`S3_BUCKET`/`S3_PREFIX` = `mainecybertech-backups`/`database-backups`) | Restore test may read the wrong location (naming mismatch — see report finding DR-P1) |
| `pg_dump`/`psql` client version | Runner / docker image | Version-mismatch restore errors (dump uses `postgres:15` image / runner client) |
| Supabase project ref + service context | For PITR fork | PITR unavailable |
| Network egress to S3/Spaces endpoint | Runner | Silent download failure |

## 5. Step-by-step drill plans

### D1 — Full database restore from latest backup (weekly)

1. **Preconditions:** read-only credentials to S3/Spaces; a throwaway Postgres container; the newest dump object identified (name + timestamp only, no secrets logged).
2. Start target: `docker run -d --name drill-pg -e POSTGRES_PASSWORD=<throwaway> -e POSTGRES_DB=drill_restore -p 127.0.0.1:5433:5432 postgres:16-alpine`.
3. Download: `aws s3 cp <S3_BACKUP_BUCKET>/<latest> /tmp/drill.sql.gz`.
4. Restore with pipefail: `set -euo pipefail; gunzip -c /tmp/drill.sql.gz | psql "postgresql://postgres:<throwaway>@localhost:5433/drill_restore"`.
5. Run **D3 assertions** (§6).
6. Record: backup object name, byte size, restore wall-clock, assertion output, exit codes.
7. Tear down: stop/remove `drill-pg`, delete `/tmp/drill.sql.gz`.

**Fail conditions:** download empty; `psql` non-zero; table count below baseline; `_migrations` row count below baseline; any tenant-isolation assertion fails.

### D2 — Point-in-time recovery (monthly)

1. In the Supabase dashboard (hosted), create a restore/fork at a chosen timestamp into a **new** project.
2. Do not repoint any production `SUPABASE_URL`.
3. Run the D3 assertions against the fork's connection string.
4. Record: chosen timestamp, resulting instance, restore duration, assertion output.
5. Delete the fork after recording (cost + data-minimisation).

### D3 — Restore integrity + tenant isolation assertions

See §6 checklist. This is the part that converts "exit code 0" into "the restore is real".

### D4 — Bad migration drill (quarterly)

1. On a throwaway Supabase project, apply all migrations to a known point.
2. Introduce a deliberately bad migration (e.g. `alter table documents drop column storage_bucket;` or a policy that widens tenant access).
3. Attempt forward recovery: write and apply a **reverse migration** under `supabase/migrations/` (not by editing an applied file — see `docs/SUPABASE_MIGRATION_WORKFLOW.md`).
4. Alternatively exercise PITR to just before the bad migration.
5. Assert the schema (and the tenant-scoped RLS behaviour) matches the pre-bad state.
6. Record which of Option A (reverse migration) / Option B (PITR) actually worked, and how long it took against the documented RTO.

### D5 — Storage bucket recovery drill (quarterly)

1. **Blocker to resolve first:** there is currently no storage backup mechanism. Either (a) enable provider-native object versioning/retention on the Supabase storage buckets, or (b) add an export job. The drill cannot run until one exists.
2. Delete a known object in a **scratch** bucket (not `documents`/`avatars` in prod).
3. Recover via versioning or the export, then verify download + checksum.
4. Record recovery path and duration.

### D6 — Terraform state recovery drill (semi-annual)

1. Copy the current state object in a scratch bucket.
2. Simulate loss by pointing a scratch workspace at an empty bucket; confirm `terraform plan` fails as expected.
3. Restore the state object; confirm `terraform plan` shows no changes against the real infra.
4. Record backend bucket, key, restore step, and plan result. Confirm whether bucket versioning is actually enabled (currently unverified).

### D7 — Full droplet-loss exercise (semi-annual, paper + partial)

1. Table-top the sequence in `docs/ROLLBACK_PROCEDURES.md` and the prior DR plan (detect → assess → infra → data → deploy → verify).
2. Partially execute on a scratch/dev droplet: Terraform recreate (with `prevent_destroy` implications noted in `ROLLBACK_PROCEDURES.md` §4) → compose up → DB restore (D1) → health verification.
3. Record actual timings vs the `docs/RTO_RPO.md` targets (API/Web 15 min, DB 1 h / RPO 5 min).

## 6. Verification checklist

Fire these after **every** restore (they are assertions, not prints):

- [ ] `gunzip` succeeded and the decompressed dump is non-zero bytes.
- [ ] `psql` exited `0` **and** the target DB is non-empty.
- [ ] Public table count `>=` committed baseline (baseline derived from `supabase/migrations/`, not hardcoded).
- [ ] `_migrations` (or the CLI's migration ledger) exists and its row count `>=` the migration count at the release tag.
- [ ] At least two critical tables have row counts `>` 0 (choose tables that always have rows in prod).
- [ ] Foreign-key integrity spot check on a tenant-scoped parent/child pair (e.g. documents → organizations).
- [ ] **Tenant isolation:** for a sampled tenant, `select count(*) from <tenant_table>` under a tenant-restricted role returns only that tenant's rows (no cross-tenant leakage after restore). Re-run `scripts/verify-rls.mjs` semantics against the restored schema.
- [ ] RLS is enabled on the restored tables (a restore that strips policies must fail the drill).
- [ ] Recovery-point check: the newest row timestamp in an append-only table (e.g. `audit_logs`) is within the claimed RPO for the source dump.
- [ ] The restore is reproducible: a second operator can repeat D1 from the written steps alone.

Any unchecked box = drill **failed**, not "passed with notes".

## 7. Evidence capture (makes it "exercised")

For each drill, commit a small artifact under
`docs/audits/repo-deep-dive/<run>/drills/` (or a dedicated `docs/drills/` folder) containing:

- drill ID, date, operator, commit/tag of the restored backup
- backup object name + size (never a presigned URL with credentials)
- commands run (no secret values)
- raw assertion output
- pass/fail per checklist item
- **observed restore duration** and comparison to RTO
- follow-ups / defects found

Update `docs/RTO_RPO.md` with a "Last real restore exercise" line pointing at that artifact.
Until that line exists, every restore is `not exercised` per the shared audit rules.

## 8. Exit criteria for the DR domain

The backup/restore domain may be re-scored upward only when **all** of the following are true at the audited commit:

1. `db-backup.yml` and `db-restore-test.yml` run on the default branch (or an equivalent scheduled trigger) and a green run artifact exists.
2. The restore test asserts integrity (counts, `_migrations`, tenant isolation) and fails on a truncated dump.
3. A captured drill artifact proves the last real restore and its duration.
4. A backup-failure **and** restore-test-failure alert path exists and has been fired once synthetically.
5. Storage/uploaded-file recovery has a documented, exercised mechanism.
