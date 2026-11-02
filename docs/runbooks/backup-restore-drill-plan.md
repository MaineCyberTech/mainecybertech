# Backup & Restore Drill Plan (D1–D7)

**Owner:** platform/ops · **Last reviewed:** 2026-10-12 · **Review cadence:** semi-annual (with `docs/RTO_RPO.md`)

Stable-path drill plan for exercising backup and restore for the Maine CyberTech
portal. Relocated here from the dated audit folder
(`docs/audits/repo-deep-dive/20261002-0344-develop-6286137/backup_restore_drill_plan.md`)
and reconciled against `develop` in the 2026-10-12 remediation wave (**DR-P3-001**).

- Companion to: the 2026-10-02 DR audit report (same folder as the original).
- Nature: **PLAN + procedure.** Executed drills are recorded in
  [`backup-restore-drill-ledger.md`](backup-restore-drill-ledger.md); a drill is
  only "passed" when its evidence artifact is committed (or linked) there.

## 1. Purpose and safety framing

This plan describes how to actually *exercise* backup and restore so that
"configured" becomes "exercised" with a captured artifact. It is written to be
run by an operator on an isolated target, never against production data.

**Hard safety rules for every drill below:**

1. Restore into a throwaway database / throwaway Supabase project — never the linked production project.
2. Never run `scripts/restore-database.sh` with `SUPABASE_DB_URL` pointing at production without explicit change approval.
3. Never delete backup objects during a drill except in a dedicated scratch bucket.
4. Redact secrets at all times; capture only key names, exit codes, counts, and timestamps.
5. Record the drill result in the ledger (see §7) so the next audit can cite a real exercise date.

## 2. Current state snapshot (reconciled 2026-10-12)

| Asset | Path | State | Exercised? |
|---|---|---|---|
| Daily DB backup workflow | `.github/workflows/db-backup.yml` | Present and scheduled on the default branch (DR-P0-002 fixed); records a platform heartbeat (DR-P2-008) | **No green run yet** — operator backup secrets unprovisioned (DR-P0-001 residual) |
| Backup script (bash) | `scripts/backup-database.sh` | pg_dump → gzip → S3/Spaces; encryption when `BACKUP_ENCRYPTION_KEY` is set; 30-day retention | `not exercised` |
| Backup script (PowerShell) | — | Retired (DR-P3-002); use `scripts/backup-database.sh` via WSL/Git Bash | N/A |
| Weekly restore test | `.github/workflows/db-restore-test.yml` | Present and scheduled; restores to a temp `postgres:16-alpine` and **asserts** structure/freshness/RLS floors (DR-P0-003, DR-P1-001 fixed) | `not exercised` (same operator residual) |
| Storage backup | `.github/workflows/storage-backup.yml`, `scripts/backup-storage.sh` | Paginated listing, zero-object refusal, MANIFEST with `object_count`, encryption, offsite option (DR-P2-001 fixed) | `not exercised` |
| Storage restore test | `.github/workflows/storage-restore-test.yml`, `scripts/restore-storage.sh --verify-only` | Weekly assertions: manifest present, `object_count` == extracted count, archive non-empty (DR-P1-002, DR-P2-002 fixed) | `not exercised` |
| Manual restore script | `scripts/restore-database.sh` | `--dry-run` supported; stream-decrypt; environment guardrail | `not exercised` |
| Supabase PITR | `docs/ROLLBACK_PROCEDURES.md` §3 Option B | Documented (7-day, Pro plan) | `not exercised` |
| Terraform state | `infra/terraform/digitalocean/state-bucket.tf` + `env/backend.*.hcl` | Remote S3/Spaces backend; `versioning { enabled = true }` now declared as a resource (DR-P2-005 fixed); state gitignored | `not exercised` (state read, not restored) |
| Storage buckets (`documents`, `avatars`) | backup/restore scripts above | Backup + restore-test path exists (was absent in the 2026-10-02 audit) | `not exercised` |
| Redis | `infra/digitalocean/docker-compose.yml` | No backup; rebuilt from DB per `docs/RTO_RPO.md` | `not exercised` |
| Secrets | `docs/SECRETS_ROTATION.md`, `docs/SECRET_ROTATION_RUNBOOK.md` | Rotation documented; key escrow **still unrecorded** (gap) | N/A (rotate, don't restore) |

## 3. Drill inventory and cadence

| ID | Drill | Target | Cadence | Est. duration | Owner |
|---|---|---|---|---|---|
| D1 | Full DB restore from latest S3 dump | Throwaway Postgres (docker) | Weekly (automated `db-restore-test`; manual deep-dive per quarter) | 30 min | Platform |
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
| `S3_BUCKET` (bucket **name**, no `s3://`) + `S3_PREFIX` (key prefix) | GitHub variable (legacy `S3_BACKUP_BUCKET` secret accepted as a fallback and normalised) | `aws s3 ls` returns nothing → "No backups found" |
| Backup object name/prefix convention | `scripts/backup-database.sh` (`S3_BUCKET`/`S3_PREFIX`, DR-P1-003) | Restore test may read the wrong location (contract documented) |
| `pg_dump`/`psql` client version | Runner / docker image | Version-mismatch restore errors |
| Supabase project ref + service context | For PITR fork | PITR unavailable |
| Network egress to S3/Spaces endpoint | Runner | Silent download failure |

## 5. Step-by-step drill plans

### D1 — Full database restore from latest backup (weekly)

1. **Preconditions:** read-only credentials to S3/Spaces; a throwaway Postgres container; the newest dump object identified (name + timestamp only, no secrets logged).
2. Start target: `docker run -d --name drill-pg -e POSTGRES_PASSWORD=<throwaway> -e POSTGRES_DB=drill_restore -p 127.0.0.1:5433:5432 postgres:16-alpine`.
3. Download: `aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/<latest>" /tmp/drill.sql.gz`
   (`S3_BUCKET` is a bucket name and `S3_PREFIX` a key prefix — the same
   contract the backup workflows write with, DR-P1-003 / DR-P3-007).
4. Restore with pipefail: `set -euo pipefail; gunzip -c /tmp/drill.sql.gz | psql "postgresql://postgres:<throwaway>@localhost:5433/drill_restore"`.
5. Run **D3 assertions** (§6).
6. Record: backup object name, byte size, restore wall-clock, assertion output, exit codes.
7. Tear down: stop/remove `drill-pg`, delete `/tmp/drill.sql.gz`.

**Fail conditions:** download empty; `psql` non-zero; table count below baseline; migration row count below baseline; any tenant-isolation assertion fails.

### D2 — Point-in-time recovery (monthly)

1. In the Supabase dashboard (hosted), create a restore/fork at a chosen timestamp into a **new** project.
2. Do not repoint any production `SUPABASE_URL`.
3. Run the D3 assertions against the fork's connection string.
4. Record: chosen timestamp, resulting instance, restore duration, assertion output.
5. Delete the fork after recording (cost + data-minimisation).

### D3 — Restore integrity + tenant isolation assertions

See §6 checklist. This is the part that converts "exit code 0" into "the restore is real". The automated `db-restore-test.yml` runs the machine-checkable subset on every weekly run; the manual deep-dive adds the tenant-isolation and reproducibility checks.

### D4 — Bad migration drill (quarterly)

1. On a throwaway Supabase project, apply all migrations to a known point.
2. Introduce a deliberately bad migration (e.g. `alter table documents drop column storage_bucket;` or a policy that widens tenant access).
3. Attempt forward recovery: write and apply a **reverse migration** under `supabase/migrations/` (not by editing an applied file — see `docs/SUPABASE_MIGRATION_WORKFLOW.md`).
4. Alternatively exercise PITR to just before the bad migration.
5. Assert the schema (and the tenant-scoped RLS behaviour) matches the pre-bad state.
6. Record which of Option A (reverse migration) / Option B (PITR) actually worked, and how long it took against the documented RTO.

### D5 — Storage bucket recovery drill (quarterly)

1. Delete a known object in a **scratch** bucket (not `documents`/`avatars` in prod).
2. Recover from the newest storage archive (`scripts/restore-storage.sh`) or provider-native versioning when enabled.
3. Verify download + checksum against the MANIFEST.
4. Record recovery path and duration.

### D6 — Terraform state recovery drill (semi-annual)

1. Copy the current state object in a scratch bucket.
2. Simulate loss by pointing a scratch workspace at an empty bucket; confirm `terraform plan` fails as expected.
3. Restore the state object; confirm `terraform plan` shows no changes against the real infra.
4. Record backend bucket, key, restore step, and plan result. Confirm bucket versioning is enabled (declared in `state-bucket.tf`; verify the live setting).

### D7 — Full droplet-loss exercise (semi-annual, paper + partial)

1. Table-top the sequence in `docs/ROLLBACK_PROCEDURES.md` and this plan (detect → assess → infra → data → deploy → verify).
2. Partially execute on a scratch/dev droplet: Terraform recreate (with `prevent_destroy` implications noted in `docs/ROLLBACK_PROCEDURES.md` §4) → compose up → DB restore (D1) → health verification.
3. Record actual timings vs the `docs/RTO_RPO.md` targets (API/Web 15 min, DB 1 h / RPO 5 min).

## 6. Verification checklist

Fire these after **every** restore (they are assertions, not prints):

- [ ] `gunzip` succeeded and the decompressed dump is non-zero bytes.
- [ ] `psql` exited `0` **and** the target DB is non-empty.
- [ ] Public table count `>=` committed baseline (baseline derived from `supabase/migrations/`, not hardcoded).
- [ ] Migration ledger exists and its row count `>=` the migration count at the release tag.
- [ ] At least two critical tables have row counts `>` 0 (choose tables that always have rows in prod).
- [ ] Foreign-key integrity spot check on a tenant-scoped parent/child pair (e.g. documents → organizations).
- [ ] **Tenant isolation:** for a sampled tenant, a tenant-restricted role sees only that tenant's rows. Re-run `scripts/verify-rls.mjs` semantics against the restored schema.
- [ ] RLS is enabled on the restored tables (a restore that strips policies must fail the drill).
- [ ] Recovery-point check: the newest row timestamp in an append-only table (e.g. `audit_logs`) is within the claimed RPO for the source dump.
- [ ] The restore is reproducible: a second operator can repeat D1 from the written steps alone.

Any unchecked box = drill **failed**, not "passed with notes".

## 7. Evidence capture (makes it "exercised")

For each drill, add a row to
[`backup-restore-drill-ledger.md`](backup-restore-drill-ledger.md) and commit a
small artifact (under `docs/runbooks/drills/` or linked from the row) containing:

- drill ID, date, operator, commit/tag of the restored backup
- backup object name + size (never a presigned URL with credentials)
- commands run (no secret values)
- raw assertion output
- pass/fail per checklist item
- **observed restore duration** and comparison to RTO
- follow-ups / defects found

Update `docs/RTO_RPO.md` with a "Last real restore exercise" line pointing at
that artifact. Until that line exists, every restore is `not exercised` per the
shared audit rules.

## 8. Exit criteria for the DR domain

The backup/restore domain may be re-scored upward only when **all** of the
following are true at the audited commit:

1. `db-backup.yml` and `db-restore-test.yml` run on the default branch (or an equivalent scheduled trigger) and a green run artifact exists.
2. The restore test asserts integrity (counts, migrations, tenant isolation) and fails on a truncated dump.
3. A captured drill artifact proves the last real restore and its duration.
4. A backup-failure **and** restore-test-failure alert path exists and has been fired once synthetically.
5. Storage/uploaded-file recovery has a documented, exercised mechanism.
