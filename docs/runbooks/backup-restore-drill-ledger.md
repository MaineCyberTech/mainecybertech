# Backup & Restore Drill Ledger

**Owner:** platform/ops · **Last reviewed:** 2026-11-08

One row per drill execution. `planned` rows record the next intended exercise;
`passed`/`failed` rows must link an evidence artifact (run URL or committed
artifact) — never fabricate a result. Companion to
[`backup-restore-drill-plan.md`](backup-restore-drill-plan.md) (D1–D7). Created
to close audit finding **DR-P3-001** (drill plan only in a dated audit folder,
ledger empty).

**Current state (2026-11-08):** the first automated D1 run passed. `db-backup`
run 42436289022 produced an encrypted 952K dump at
`s3://mct-mainecybertech/database-backups/supabase-dump-2026-11-08-015514.sql.gz.enc`
and recorded the platform heartbeat. `db-restore-test` run 42437188270 restored
140 public tables, 165 migrations and 425 rows with 0 tables missing RLS. The
manual deep-dive and PITR drills remain planned.

| Drill | Planned window | Operator | Target | Result | Evidence | Follow-ups |
| --- | --- | --- | --- | --- | --- | --- |
| D1 (automated) | 2026-11-08 (first run) | Kestrel Ops | throwaway Postgres 17 | **passed** — 140 tables, 165 migrations, 425 rows, 0 tables without RLS | backup run 42436289022; restore run 42437188270 | manual deep-dive within 2 weeks; update `docs/RTO_RPO.md` |
| D1 (manual deep-dive) | within 2 weeks of the first green automated run | platform/ops | throwaway Postgres + §6 checklist | planned | drill artifact | record observed duration vs RTO |
| D2 (PITR) | first month after D1 is green | platform | throwaway Supabase project | planned | drill artifact | measure PITR duration; confirm the 5-min RPO claim |
| D3 | every D1 run | backend | same as D1 | planned | automated run output | promote assertions if gaps found |
| D4 (bad migration) | first quarter after D1 is green | backend | throwaway Supabase project | planned | drill artifact | template the reverse migration |
| D5 (storage recovery) | first quarter after the storage backup is green | platform | scratch bucket | planned | drill artifact | verify MANIFEST checksums |
| D6 (Terraform state) | semi-annual | infra | scratch backend bucket | planned | drill artifact | confirm live bucket versioning |
| D7 (droplet loss) | semi-annual | platform/NOC | dev/scratch droplet | planned | paper + partial artifact | record timings vs RTO |

## Recording rules

- Date (UTC), operator handle, exact commit/tag of the restored backup.
- Never paste secret values or presigned URLs; record the object name + size only.
- Failed drills stay in the ledger with the failure mode and the fix.
- Update `docs/RTO_RPO.md` "Last real restore exercise" only when the row has evidence.
- A green automated `db-restore-test` run is evidence for D1's machine checks;
  the manual deep-dive is still required for tenant-isolation and
  reproducibility per the plan §6.
