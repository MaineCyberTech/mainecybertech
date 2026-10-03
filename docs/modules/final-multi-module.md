# Final Multi-Module

**Category:** Operations
**API Routes:** `apps/api/src/routes/final.ts`
**SDK:** `packages/sdk/src/final.ts`

## Overview
Aggregate module covering 11 sub-modules for operational needs: backups, budgets, device profiles, DNS changes, forms, procurement, runbooks, SaaS audits, satisfaction pulses, SharePoint plans, and time entries.

## Key Features
- Backup status tracking with DR testing, offsite replication, and encryption verification
- Budget roadmap planning with financial projections
- Device profile management (hardware configurations, standards)
- DNS change request workflow
- Custom form builder and submissions
- Procurement quote management
- Client runbook documentation
- SaaS audit scanning (shadow IT detection)
- Client satisfaction pulse surveys (NPS, CSAT)
- SharePoint plan and architecture documentation
- Time entry tracking for billable/non-billable work

## Endpoints (all sub-modules follow CRUD pattern)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/final/backups | List backup status records |
| POST | /api/v1/final/backups | Create backup record |
| PATCH | /api/v1/final/backups/:id | Update record |
| DELETE | /api/v1/final/backups/:id | Delete record |
| GET | /api/v1/final/backups/stats | Get backup statistics (failed, untested, offsite, encrypted) |
| GET | /api/v1/final/budgets | List budget roadmaps |
| POST | /api/v1/final/budgets | Create budget |
| PATCH | /api/v1/final/budgets/:id | Update |
| DELETE | /api/v1/final/budgets/:id | Delete |
| GET | /api/v1/final/device-profiles | List device profiles |
| POST | /api/v1/final/device-profiles | Create profile |
| PATCH | /api/v1/final/device-profiles/:id | Update |
| DELETE | /api/v1/final/device-profiles/:id | Delete |
| GET | /api/v1/final/dns-changes | List DNS change requests |
| POST | /api/v1/final/dns-changes | Create request |
| PATCH | /api/v1/final/dns-changes/:id | Update |
| DELETE | /api/v1/final/dns-changes/:id | Delete |
| GET | /api/v1/final/forms | List custom forms |
| POST | /api/v1/final/forms | Create form |
| PATCH | /api/v1/final/forms/:id | Update |
| DELETE | /api/v1/final/forms/:id | Delete |
| GET | /api/v1/final/procurement | List procurement quotes |
| POST | /api/v1/final/procurement | Create quote |
| PATCH | /api/v1/final/procurement/:id | Update |
| DELETE | /api/v1/final/procurement/:id | Delete |
| GET | /api/v1/final/runbooks | List client runbooks |
| POST | /api/v1/final/runbooks | Create runbook |
| PATCH | /api/v1/final/runbooks/:id | Update |
| DELETE | /api/v1/final/runbooks/:id | Delete |
| GET | /api/v1/final/saas-audit | List SaaS audits |
| POST | /api/v1/final/saas-audit | Create audit |
| PATCH | /api/v1/final/saas-audit/:id | Update |
| DELETE | /api/v1/final/saas-audit/:id | Delete |
| GET | /api/v1/final/satisfaction | List satisfaction pulses |
| POST | /api/v1/final/satisfaction | Create pulse |
| PATCH | /api/v1/final/satisfaction/:id | Update |
| DELETE | /api/v1/final/satisfaction/:id | Delete |
| GET | /api/v1/final/sharepoint | List SharePoint plans |
| POST | /api/v1/final/sharepoint | Create plan |
| PATCH | /api/v1/final/sharepoint/:id | Update |
| DELETE | /api/v1/final/sharepoint/:id | Delete |
| GET | /api/v1/final/time-entries | List time entries |
| POST | /api/v1/final/time-entries | Create entry |
| PATCH | /api/v1/final/time-entries/:id | Update |
| DELETE | /api/v1/final/time-entries/:id | Delete |

## Data Model
Key fields (per table): `backup_status` (last_backup_status, restore_test_result, offsite_replicated, encryption_enabled), `budget_roadmaps` (fiscal_year, categories, projected, actual), `device_profiles` (name, specifications, is_standard), `dns_change_requests` (domain, record_type, old_value, new_value, status), `custom_forms` (title, fields, submissions), `procurement_quotes` (vendor, items, total, status), `client_runbooks` (title, procedures, contacts), `saas_audits` (application, vendor, users, authorized), `satisfaction_pulses` (score_type, score, comments), `sharepoint_plans` (site_type, architecture, permissions), `time_entries` (description, hours, billable, rate) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full CRUD across all sub-modules
- Client: read-only (portal, own org data)

## Worker Tasks
- `backup-dr-check`: Backup status and RPO/RTO verification
- `saas-audit-scan`: SaaS audit scanning
- `status-maintenance-check`: Status maintenance verification
