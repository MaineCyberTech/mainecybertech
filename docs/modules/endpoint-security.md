# Endpoint Security Coverage Map

**Category:** Security
**API Routes:** `apps/api/src/routes/security-suite.ts` (mounted at `/api/v1/security-suite`)
**SDK:** `packages/sdk/src/security-suite.ts` (`securitySuite.endpoints`)
**Table:** `endpoint_security` (migration `5302070_security_suite.sql`)

## Overview

Tracks endpoint protection coverage by device group: antivirus installs, disk encryption, MDM enrollment, local-admin removal, firewall, and EDR deployment. Computes a per-group coverage percentage and flags groups below threshold. The worker task `endpoint-security-check` periodically recomputes coverage and marks low-coverage groups.

## Key Features

- Per-device-group coverage counts for AV, encryption, MDM, local admin, firewall, and EDR
- `coverage_pct` computed per group
- Aggregate `GET /endpoint-security/coverage` endpoint (AV/encryption/MDM percentages across groups)
- Worker `endpoint-security-check` flags groups below 80% coverage
- Admin CRUD for groups; portal read-only list

## Endpoints

| Method | Path                                              | Description                                  |
| ------ | ------------------------------------------------- | -------------------------------------------- |
| GET    | /api/v1/security-suite/endpoint-security          | List endpoint groups (paginated, org-scoped) |
| GET    | /api/v1/security-suite/endpoint-security/:id      | Get single endpoint group                    |
| POST   | /api/v1/security-suite/endpoint-security          | Create endpoint group                        |
| PATCH  | /api/v1/security-suite/endpoint-security/:id      | Update endpoint group                        |
| DELETE | /api/v1/security-suite/endpoint-security/:id      | Delete endpoint group                        |
| GET    | /api/v1/security-suite/endpoint-security/coverage | Aggregate AV/encryption/MDM coverage         |

## Data Model

`endpoint_security` (id, organization_id, device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled, local_admin_removed, firewall_enabled, edr_deployed, coverage_pct, status, notes, created_by, created_at, updated_at).

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `endpoint_security` org policies
- Audit logging on create/update/delete
- Admin pages at `apps/web/app/(admin)/admin/endpoint-security/`; portal read-only list at `apps/web/app/(portal)/portal/endpoint-security/`
