# PowerShell Policy Engine

**Category:** Automation (sub-route of edu-automation)
**API Routes:** `apps/api/src/routes/edu-automation/powershell.ts`
**SDK:** `packages/sdk/src/edu-automation.ts` (powershell namespace)

## Overview

PowerShell script policy enforcement and code review pipeline integrated within the Education Automation module. Scripts are drafted, submitted for review, automatically scanned for dangerous patterns, and undergo a structured approval or rejection workflow before deployment.

## Key Features

- Full CRUD management of PowerShell script drafts with title, description, and script body
- Script submission workflow transitioning drafts through statuses: draft → pending_review → approved or rejected
- Automated security scan checking for 6 dangerous cmdlet patterns on submission and on demand
- Approval/rejection workflow with reviewer identity, notes, and timestamps
- 6 dangerous cmdlet patterns detected:
  1. Invoke-Expression / iex — arbitrary code execution
  2. Remove-Item -Recurse / rm -r — destructive file deletion
  3. Set-ExecutionPolicy Bypass — policy circumvention
  4. Credential manipulation — Get-Credential, ConvertTo-SecureString with plaintext
  5. Local user creation — New-LocalUser, Add-LocalGroupMember
  6. Remote execution — New-PSSession, Invoke-Command, Enter-PSSession
- Scan results stored as JSON with pattern name, matching line number, line content, and severity (warning/critical)
- Rejection requires a mandatory reason; approval allows optional notes
- Script version tracking across submissions and re-submissions
- Audit logging on all mutation and workflow endpoints
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                                          | Description                                                    |
| ------ | --------------------------------------------- | -------------------------------------------------------------- |
| GET    | /api/v1/edu-automation/powershell             | List PowerShell scripts (paginated, filterable by status)      |
| GET    | /api/v1/edu-automation/powershell/:id         | Get script with scan results, review status, and history       |
| POST   | /api/v1/edu-automation/powershell             | Create new script draft (default status: draft)                |
| PATCH  | /api/v1/edu-automation/powershell/:id         | Update script content or metadata                              |
| DELETE | /api/v1/edu-automation/powershell/:id         | Remove script and scan results                                 |
| POST   | /api/v1/edu-automation/powershell/:id/submit  | Submit draft for review (draft → pending_review)               |
| POST   | /api/v1/edu-automation/powershell/:id/check   | Run security scan for dangerous cmdlets immediately            |
| POST   | /api/v1/edu-automation/powershell/:id/approve | Approve script (pending_review → approved)                     |
| POST   | /api/v1/edu-automation/powershell/:id/reject  | Reject script with required reason (pending_review → rejected) |

## Data Model

Key fields: `powershell_scripts` (organization_id, title, description, script_body, status, scan_results (jsonb), reviewer_id, review_notes, reviewed_at, submitted_at, created_by) — scan_results is an array of { pattern, line_number, line_content, severity }

## Access Control

- Admin: full CRUD, submission management, run scans, approval/rejection authority
- Client: create and view own drafts; submit for review (portal); cannot approve/reject
