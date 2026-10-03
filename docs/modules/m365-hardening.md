# M365 Tenant Hardening Scanner

**Category:** Security
**API Routes:** `apps/api/src/routes/security-suite.ts` (mounted at `/api/v1/security-suite`)
**SDK:** `packages/sdk/src/security-suite.ts` (`securitySuite.m365`)
**Table:** `m365_hardening` (migration `5302070_security_suite.sql`)

## Overview

Tracks the Microsoft 365 security baseline for each tenant: MFA enforcement, conditional access, legacy auth blocking, audit logging, DLP, Defender, admin/guest/mailbox counts, and an overall hardening score. The worker `m365-hardening-scan` marks records due for review and advances the next-scan date.

## Key Features

- Per-tenant M365 security posture booleans (MFA, CA, legacy auth, audit, DLP, Defender)
- Overall hardening score (0-100)
- Review scheduling via `next_review_at` / `last_assessment_at`
- Worker `m365-hardening-scan` marks due records scanned and advances the review window

## Endpoints

| Method | Path                                           | Description                             |
| ------ | ---------------------------------------------- | --------------------------------------- |
| GET    | /api/v1/security-suite/m365-hardening          | List hardening records (paginated, org) |
| GET    | /api/v1/security-suite/m365-hardening/:id      | Get single record                       |
| POST   | /api/v1/security-suite/m365-hardening          | Create record                           |
| PATCH  | /api/v1/security-suite/m365-hardening/:id      | Update record                           |
| DELETE | /api/v1/security-suite/m365-hardening/:id      | Delete record                           |
| POST   | /api/v1/security-suite/m365-hardening/:id/scan | Mark scanned + advance next review date |

## Data Model

`m365_hardening` (id, organization_id, tenant_domain, mfa_enforced, conditional_access_configured, legacy_auth_blocked, admin_count, guest_count, shared_mailbox_count, audit_logging_enabled, dlp_configured, defender_configured, last_assessment_at, next_review_at, overall_score, status, notes, created_by, created_at, updated_at). Migration `5302124` adds `last_scanned_at` and `scan_status` for the worker.

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `m365_hardening` org policies
- Admin pages at `apps/web/app/(admin)/admin/m365-hardening/`; portal read-only list at `apps/web/app/(portal)/portal/m365-hardening/`
