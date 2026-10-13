# Backup/DR Review Dashboard

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/final/backups.ts` (stats/risk) + `apps/api/src/routes/final/crud.ts` (`backups` → `backup_status`)
**SDK:** `packages/sdk/src/final.ts`

> **Not the platform's own backup signal (DR-P2-008).** This module tracks
> *client* backup/DR records per organization; its `backup_status` rows are
> product data. The platform's backup freshness is recorded in
> `public.platform_backup_heartbeats` by `.github/workflows/db-backup.yml`
> (`scripts/record-backup-heartbeat.sh`) and alerted on by the worker
> `backup-dr-check` plus `backup-staleness-check.yml` — see `docs/RTO_RPO.md`.

## Overview

Centralized backup and disaster recovery review platform. Tracks backup status (system name, backup type, last result, RPO/RTO hours, retention, restore-test history, offsite/encryption flags) across all client environments, with an org-scoped stats + risk view.

## Key Features

- Backup status inventory — system name, backup type, last backup result, size
- RPO/RTO tracking per system (`recovery_point_objective_hours` / `recovery_time_objective_hours`)
- Last backup monitoring — success/warning/failure status and next scheduled run
- Restore-test history — `restore_tested_at`, `restore_test_result`
- Offsite replication and encryption flags per record
- Stats + risk-analysis aggregates per organization (counts by status/type, overdue or untested systems)

## Endpoints

All routes are mounted under `/api/v1/final` and require authentication plus
`organization_id` org access (`requireAuth` + `requireOrgAccess`).

| Method | Path                                | Description                                                          |
| ------ | ----------------------------------- | -------------------------------------------------------------------- |
| GET    | /api/v1/final/backups               | List backup records (paginated: `page`, `limit`, filter by `organization_id`) |
| POST   | /api/v1/final/backups               | Create backup record (`backup-dr:create`)                            |
| GET    | /api/v1/final/backups/:id           | Fetch one record                                                     |
| PATCH  | /api/v1/final/backups/:id           | Update record (`backup-dr:edit`)                                     |
| DELETE | /api/v1/final/backups/:id           | Delete record (`backup-dr:delete`, confirmation body required)       |
| GET    | /api/v1/final/backups/stats         | Aggregate counts per org (status/type/overdue)                       |
| GET    | /api/v1/final/backups/risk-analysis | Risk view per org (overdue tests, failing/untested systems)          |

> **Export is not implemented (DR-P3-004).** Earlier docs listed
> `/api/v1/backup-dr/*` routes (jobs, dr-tests, dashboard, export). Those routes
> never existed; the real surface is the `/final/backups*` table above and
> there is no CSV/export endpoint. A doc/route consistency check for module
> docs is tracked separately.

## Data Model

`backup_status` (one row per client system): `organization_id`, `system_name`,
`backup_type` (default `full`), `last_backup_at`, `last_backup_status`
(default `unknown`), `last_backup_size_gb`, `next_scheduled_at`,
`recovery_point_objective_hours`, `recovery_time_objective_hours`,
`retention_days` (default 30), `restore_tested_at`, `restore_test_result`,
`offsite_replicated`, `encryption_enabled`, `notes`, `status` (default
`monitored`), `created_by`, `created_at`, `updated_at`
(`supabase/migrations/5302075_backup_dr.sql`).

## Access Control

- Router-level `requireAuth` + `requireOrgAccess`; every query is scoped by
  `organization_id`.
- Writes/deletes additionally require the `backup-dr` module permission
  (`create` / `edit` / `delete`); deletes require an explicit confirmation body.
- RLS on `backup_status`: select/insert/update scoped to the caller's
  memberships (`backup_select_org`, `backup_insert_auth`, `backup_update_org`).
- Audit logging on create/update/delete (`backups.created` / `.updated` /
  `.deleted`).
