# PowerShell Script Builder / Policy Guard

**Category:** Automation
**API Routes:** `apps/api/src/routes/powershell-policy.ts`
**SDK:** `packages/sdk/src/powershell-policy.ts`

## Overview

PowerShell script authoring and policy enforcement guard for MSP automation scripts. Provides a script builder with syntax validation, dangerous cmdlet detection (Invoke-Expression, Remove-Item -Recurse, Set-ExecutionPolicy Bypass), policy rule engine, approval workflow, and script library management. Ensures all automation scripts comply with organizational security policies before deployment.

## Key Features

- Script builder — draft, edit, version PowerShell scripts with inline syntax highlighting
- Policy guard engine — scan scripts against 15+ policy rules (blocked cmdlets, restricted parameters, required comment headers, approved module allowlist)
- Policy rule management — create custom policy rules (regex or AST-based) per org
- Submission workflow — draft → pending_review → approved/rejected with mandatory reviewer notes on rejection
- Script library — searchable catalog of approved scripts tagged by category (network, AD, M365, backup, reporting)
- Parameterized execution — define input parameters for approved scripts for safe delegated execution
- Version history — full revision tracking with diff view between versions

## Endpoints

| Method | Path                                   | Description                                                 |
| ------ | -------------------------------------- | ----------------------------------------------------------- |
| GET    | /api/v1/powershell/scripts             | List scripts (paginated, filterable by org/category/status) |
| POST   | /api/v1/powershell/scripts             | Create script draft                                         |
| GET    | /api/v1/powershell/scripts/:id         | Get script with versions and scan results                   |
| PATCH  | /api/v1/powershell/scripts/:id         | Update script                                               |
| DELETE | /api/v1/powershell/scripts/:id         | Soft-delete script                                          |
| POST   | /api/v1/powershell/scripts/:id/submit  | Submit for policy review                                    |
| POST   | /api/v1/powershell/scripts/:id/scan    | Run policy guard scan immediately                           |
| POST   | /api/v1/powershell/scripts/:id/approve | Approve script                                              |
| POST   | /api/v1/powershell/scripts/:id/reject  | Reject script with reason                                   |
| GET    | /api/v1/powershell/policies            | List policy rules per org                                   |
| POST   | /api/v1/powershell/policies            | Create custom policy rule                                   |

## Data Model

`powershell_scripts` (organization_id, title, description, script_body, category, status (draft/pending_review/approved/rejected), parameters JSON, reviewer_id, review_notes, scan_results JSONB, submitted_at, reviewed_at, created_by). `script_versions` (script_id, version_number, script_body, change_notes, created_by, created_at). `policy_rules` (organization_id, rule_name, rule_type (block_cmdlet/restrict_param/require_header/allowlist_module), pattern (regex or cmdlet name), severity (warning/critical), is_active, created_by).

## Access Control

- Admin: full CRUD, policy rule management, approval authority, script library management
- Client: create/view own drafts, submit for review
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on script create/submit/approve/reject and policy rule changes
