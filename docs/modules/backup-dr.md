# Backup/DR Review Dashboard

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/backup-dr.ts`
**SDK:** `packages/sdk/src/backup-dr.ts`

## Overview

Centralized backup and disaster recovery review platform. Tracks backup solutions (Veeam, Datto, Acronis, Azure Backup, etc.), recovery point objectives (RPO), recovery time objectives (RTO), last successful backup status, and DR test results across all client environments.

## Key Features

- Backup job inventory — solution type, frequency, retention policy, target (local/cloud/hybrid)
- RPO/RTO tracking per workload with compliance status (green/yellow/red)
- Last backup result monitoring — success, warning, failure with error details
- DR test scheduling and result recording with pass/fail criteria
- Recovery validation — test restore reports with verification status
- Dashboard with aggregate health scores, overdue tests, and failing jobs per org

## Endpoints

| Method | Path                              | Description                                                     |
| ------ | --------------------------------- | --------------------------------------------------------------- |
| GET    | /api/v1/backup-dr/jobs            | List backup jobs (paginated, filterable by org/solution/status) |
| POST   | /api/v1/backup-dr/jobs            | Create backup job record                                        |
| PATCH  | /api/v1/backup-dr/jobs/:id        | Update backup job                                               |
| DELETE | /api/v1/backup-dr/jobs/:id        | Soft-delete job                                                 |
| POST   | /api/v1/backup-dr/jobs/:id/result | Log backup result                                               |
| GET    | /api/v1/backup-dr/dr-tests        | List DR tests (filterable by org/result)                        |
| POST   | /api/v1/backup-dr/dr-tests        | Record DR test                                                  |
| GET    | /api/v1/backup-dr/dashboard       | Health dashboard per org                                        |
| GET    | /api/v1/backup-dr/export          | Export backup/DR status as CSV                                  |

## Data Model

`backup_jobs` (organization_id, workload_name, solution, frequency_minutes, retention_days, target_type, status, rpo_minutes, rto_minutes, last_backup_at, last_result, created_by). `backup_results` (job_id, status (success/warning/failed), size_gb, duration_seconds, error_message, checked_at). `dr_tests` (organization_id, workload_name, test_type (file/VM/database/full), result (pass/fail/incomplete), restored_at, verified_by, notes).

## Access Control

- Admin: full CRUD, result logging, DR test management, export
- Client: read-only dashboard and job list for their org
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on job create/update/delete, result posts, DR test records
