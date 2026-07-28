# M365 Offboarding Safety Checklist

**Category:** Operations
**API Routes:** `apps/api/src/routes/offboarding.ts`
**SDK:** `packages/sdk/src/offboarding.ts`

## Overview

Structured employee offboarding workflow for Microsoft 365 environments. Ensures all critical exit steps are completed before account deactivation — mailbox forwarding, OneDrive/SharePoint data transfer, license revocation, alias removal, and delegated access cleanup. Includes approval gate and rollback capability.

## Key Features

- Offboarding request CRUD with employee name, role, last working day, and manager approval
- Step-by-step checklist — 15+ predefined steps (forward email, transfer OneDrive, remove groups, revoke MFA devices, disable account, remove licenses, remove aliases, remove Teams membership, revoke app access, remove delegate access, archive Teams chat)
- Automatic step progression — API marks steps as completed with verified_at timestamp
- Manager approval gate — offboarding cannot proceed without signed-off approver
- Rollback support — reactive employee record within 72 hours (undo account disable, restore forwarding)
- Exit interview capture — optional survey link and notes field per request

## Endpoints

| Method | Path                                  | Description                                                                |
| ------ | ------------------------------------- | -------------------------------------------------------------------------- |
| GET    | /api/v1/offboarding                   | List offboarding requests (paginated, filterable by org/status/department) |
| POST   | /api/v1/offboarding                   | Initiate offboarding                                                       |
| GET    | /api/v1/offboarding/:id               | Get request with full checklist and status                                 |
| PATCH  | /api/v1/offboarding/:id               | Update request metadata                                                    |
| POST   | /api/v1/offboarding/:id/complete-step | Mark checklist step complete                                               |
| POST   | /api/v1/offboarding/:id/approve       | Manager approval                                                           |
| POST   | /api/v1/offboarding/:id/rollback      | Rollback offboarding (reactive account)                                    |
| DELETE | /api/v1/offboarding/:id               | Cancel offboarding request                                                 |
| GET    | /api/v1/offboarding/export            | Export offboarding history as CSV                                          |

## Data Model

`offboarding_requests` (organization_id, employee_name, employee_email, department, last_working_day, manager_id, manager_approved_at, status (open/in-progress/completed/rolled-back/cancelled), exit_interview_notes, created_by). `offboarding_checklist_items` (request_id, step_key, step_label, step_category, completed boolean, completed_by, completed_at, notes).

## Access Control

- Admin: full CRUD, complete steps, approve, rollback
- Manager: approve offboarding for direct reports, view own team requests
- Client: view own org offboarding requests
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on create, approve, complete-step, rollback, and cancel
