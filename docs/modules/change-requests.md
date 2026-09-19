# Change Advisory / Mini-CAB Tool

**Category:** Operations
**API Routes:** `apps/api/src/routes/change-requests.ts`
**SDK:** `packages/sdk/src/change-requests.ts`

## Overview

Lightweight Change Advisory Board (CAB) tool for small MSP teams. Manages change request lifecycle from submission through risk assessment, approval voting, implementation, and post-change review. Supports standard, normal, and emergency change classifications with automated approval routing.

## Key Features

- Change request CRUD with type (standard/normal/emergency) and category (network/software/hardware/policy)
- Risk assessment matrix — impact x likelihood scoring (1-5 each) with computed risk level (low/medium/high/critical)
- CAB voting — approve/reject/abstain per CAB member with mandatory comment on reject
- Implementation plan with rollback steps, scheduled window, and testing checklist
- Post-implementation review (PIR) — outcome (success/failed/rolled-back), lessons learned
- Emergency change bypass — post-hoc ratification workflow within 24 hours
- Calendar integration — change window blocks exported as iCal feed

## Endpoints

| Method | Path                                  | Description                                                          |
| ------ | ------------------------------------- | -------------------------------------------------------------------- |
| GET    | /api/v1/change-requests               | List change requests (paginated, filterable by org/type/risk/status) |
| POST   | /api/v1/change-requests               | Submit change request                                                |
| GET    | /api/v1/change-requests/:id           | Get change with votes, implementation, PIR                           |
| PATCH  | /api/v1/change-requests/:id           | Update change metadata                                               |
| DELETE | /api/v1/change-requests/:id           | Cancel/delete change request                                         |
| POST   | /api/v1/change-requests/:id/vote      | Cast CAB vote                                                        |
| POST   | /api/v1/change-requests/:id/implement | Mark implementation started                                          |
| POST   | /api/v1/change-requests/:id/pir       | Submit post-implementation review                                    |
| GET    | /api/v1/change-requests/export        | Export change history as CSV                                         |

## Data Model

`change_requests` (organization_id, title, description, change_type, category, risk_impact, risk_likelihood, risk_level, status (draft/submitted/approved/rejected/implementing/completed/rolled-back), scheduled_start, scheduled_end, rollback_plan, created_by, assigned_to). `cab_votes` (change_id, cab_member_id, decision (approve/reject/abstain), comments, voted_at). `change_pir` (change_id, outcome, lessons_learned, completed_at).

## Access Control

- Admin: full CRUD, vote, implement, submit PIR
- Client: submit change requests for their org, view own changes
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on all mutation endpoints and status transitions
