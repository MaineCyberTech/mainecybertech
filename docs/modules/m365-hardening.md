# M365 Tenant Hardening Scanner

**Category:** Security
**API Routes:** `apps/api/src/routes/m365-hardening.ts`
**SDK:** `packages/sdk/src/m365-hardening.ts`

## Overview

Automated M365 tenant security posture assessment that scans Exchange Online, SharePoint, Conditional Access, Identity, and Defender configurations against CIS benchmarks and Microsoft Secure Score best practices.

## Key Features

- On-demand and scheduled tenant scans with configurable check categories
- Per-check pass/fail/warning results with remediation guidance and documentation links
- Risk scoring (critical/high/medium/low) with trend tracking over time
- Historical scan results with regression detection (new failures since last scan)
- Export findings as CSV/PDF for compliance reporting

## Endpoints

| Method | Path                             | Description                                               |
| ------ | -------------------------------- | --------------------------------------------------------- |
| GET    | /api/v1/m365-hardening/scans     | List scans (paginated, filterable by org/status/category) |
| POST   | /api/v1/m365-hardening/scans     | Trigger a new scan                                        |
| GET    | /api/v1/m365-hardening/scans/:id | Get scan detail with all check results                    |
| GET    | /api/v1/m365-hardening/checks    | List all available checks by category                     |
| GET    | /api/v1/m365-hardening/stats     | Aggregate risk scores + trend data                        |

## Data Model

`m365_scan_results` (organization_id, scan_date, status, overall_score, category_scores JSON, total_checks, passed, failed, warnings, risk_level, triggered_by). `m365_scan_checks` (scan_id, check_id, check_name, category (exchange/sharepoint/ca/identity/defender), status, severity, remediation, doc_link, actual_value, expected_value).

## Access Control

- Admin: full CRUD, trigger scans, view all org results
- requireAuth + requireOrgAccess on all endpoints
- RLS via organization_id filter
- Audit logging on scan create and result export
