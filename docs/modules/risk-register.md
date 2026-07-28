# Risk Acceptance Register

**Category:** Compliance
**API Routes:** `apps/api/src/routes/risk-register.ts`
**SDK:** `packages/sdk/src/risk-register.ts`

## Overview

Formal risk acceptance and exception tracking system aligned with CMMC, NIST 800-171, and HIPAA risk management requirements. Documents identified risks, assigns ownership, tracks remediation plans, and captures formal acceptance decisions by authorized approvers when risks cannot be fully remediated.

## Key Features

- Risk record CRUD — description, category (technical/operational/regulatory), source (assessment/audit/incident/self-identified)
- Risk scoring — likelihood (1-5) x impact (1-5) with computed inherent and residual risk levels
- Remediation planning — planned control, target residual score, due date, assigned owner, status tracking
- Risk acceptance workflow — formal acceptance request with business justification, compensating controls, approval expiration, and re-review date
- Exception management — periodic exception review (30/60/90-day cycles), automatic escalation on expiry
- Risk register dashboard — total risks by level, overdue items, acceptance expirations, risk trend over time
- Export — risk register as CSV or PDF for audit evidence

## Endpoints

| Method | Path                                       | Description                                                     |
| ------ | ------------------------------------------ | --------------------------------------------------------------- |
| GET    | /api/v1/risk-register                      | List risks (paginated, filterable by org/category/level/status) |
| POST   | /api/v1/risk-register                      | Create risk record                                              |
| GET    | /api/v1/risk-register/:id                  | Get risk with remediation and acceptance history                |
| PATCH  | /api/v1/risk-register/:id                  | Update risk                                                     |
| DELETE | /api/v1/risk-register/:id                  | Soft-delete risk                                                |
| POST   | /api/v1/risk-register/:id/remediation      | Add remediation plan                                            |
| PATCH  | /api/v1/risk-register/:id/remediation/:rid | Update remediation status                                       |
| POST   | /api/v1/risk-register/:id/accept           | Submit risk acceptance with justification                       |
| GET    | /api/v1/risk-register/dashboard            | Risk summary dashboard per org                                  |
| GET    | /api/v1/risk-register/export               | Export risk register as CSV                                     |

## Data Model

`risk_register` (organization_id, risk_id, title, description, category, source, inherent_likelihood, inherent_impact, inherent_level, residual_likelihood, residual_impact, residual_level, status (open/in-remediation/accepted/accepted-expired/closed), created_by). `risk_remediations` (risk_id, planned_control, target_score, due_date, owner_id, status (planned/in-progress/verified/closed), completed_at). `risk_acceptances` (risk_id, justification, compensating_controls text[], approved_by, approved_at, expires_at, re_review_date, is_active boolean).

## Access Control

- Admin: full CRUD, acceptance approval, export
- Client: view risk register for their org, submit remediation updates
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on risk create/update, remediation changes, and acceptance decisions
