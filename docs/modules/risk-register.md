# Risk Acceptance Register

**Category:** Governance
**API Routes:** `apps/api/src/routes/governance.ts` (mounted at `/api/v1/governance`)
**SDK:** `packages/sdk/src/governance.ts` (`governance.risks`)
**Table:** `risk_register` (migration `5302071_governance.sql`)

## Overview

Tracks known risks and their acceptance by clients or internal stakeholders, with likelihood/impact scoring, mitigating and compensating controls, acceptance expiry, and review cadence.

## Key Features

- Risk records with category, description, likelihood, impact, risk score, and status
- `POST /risks/:id/assess` computes `risk_score = likelihood × impact` and maps to a risk level (low/medium/high/critical)
- Acceptance tracking with owner, expiry, and review dates
- Worker candidates for expiring-acceptance reminders

## Endpoints

| Method | Path                                | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | /api/v1/governance/risks            | List risks (paginated, org-scoped) |
| GET    | /api/v1/governance/risks/:id        | Get single risk                    |
| POST   | /api/v1/governance/risks            | Create risk record                 |
| PATCH  | /api/v1/governance/risks/:id        | Update risk                        |
| DELETE | /api/v1/governance/risks/:id        | Delete risk                        |
| POST   | /api/v1/governance/risks/:id/assess | Score risk (likelihood × impact)   |

## Data Model

`risk_register` (id, organization_id, risk_description, risk_category, likelihood, impact, risk_score, mitigating_controls, accepted_by, accepted_at, acceptance_expires, compensating_controls, risk_level, accepting_controls, assessed_at, status, owner_user_id, created_by, created_at, updated_at).

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `risk_register` org policies
- Admin pages at `apps/web/app/(admin)/admin/governance/risks/` (incl. `RiskAssessButton` on detail); portal read-only list at `apps/web/app/(portal)/portal/risk-register/`
