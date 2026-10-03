# Risk Acceptance Register

## Purpose

Maintain a risk register for the organization: identified risks with category, likelihood, impact, computed risk score, mitigating and compensating controls, and formal risk acceptance with expiry. Supports the accept-the-risk workflow for MSP and client governance.

Primary users: MSP vCISO, client sponsor, technician

Business impact: High

Category: governance

## Permissions

| Action      | Roles                         |
| ----------- | ----------------------------- |
| List risks  | All authenticated org members |
| View risk   | All authenticated org members |
| Create risk | admin, super_admin            |
| Update risk | admin, super_admin            |
| Delete risk | admin, super_admin            |
| Assess risk | admin, super_admin            |
| Accept risk | admin, super_admin            |

## Routes

### Portal Routes

| Route                       | Description                               |
| --------------------------- | ----------------------------------------- |
| `GET /portal/risk-register` | List identified risks with status + score |

### API Routes

| Method | Endpoint                              | Description                         |
| ------ | ------------------------------------- | ----------------------------------- |
| GET    | `/api/v1/governance/risks`            | List risks (paginated, filterable)  |
| GET    | `/api/v1/governance/risks/:id`        | Get single risk                     |
| POST   | `/api/v1/governance/risks`            | Create risk                         |
| PATCH  | `/api/v1/governance/risks/:id`        | Update risk                         |
| DELETE | `/api/v1/governance/risks/:id`        | Delete risk                         |
| POST   | `/api/v1/governance/risks/:id/assess` | Score risk from likelihood × impact |

## Data Model

### risk_register

| Column                | Type        | Constraints                      | Description                              |
| --------------------- | ----------- | -------------------------------- | ---------------------------------------- |
| id                    | uuid        | PK, default gen_random_uuid()    | Unique identifier                        |
| organization_id       | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                           |
| risk_description      | text        | NOT NULL                         | Description of the risk                  |
| risk_category         | text        | NOT NULL, default 'security'     | Risk category                            |
| likelihood            | text        | default 'medium'                 | Qualitative likelihood                   |
| impact                | text        | default 'medium'                 | Qualitative impact                       |
| risk_score            | integer     |                                  | Computed score (likelihood × impact)     |
| mitigating_controls   | text        |                                  | Controls that reduce the risk            |
| accepted_by           | uuid        | FK → auth.users(id)              | User who accepted the risk               |
| accepted_at           | timestamptz |                                  | Acceptance timestamp                     |
| acceptance_expires    | timestamptz |                                  | When acceptance must be renewed          |
| compensating_controls | text        |                                  | Controls compensating for the risk       |
| status                | text        | NOT NULL, default 'identified'   | Risk status                              |
| owner_user_id         | uuid        | FK → auth.users(id)              | Risk owner                               |
| risk_level            | text        |                                  | Derived level (low/medium/high/critical) |
| accepting_controls    | text        |                                  | Controls referenced at acceptance        |
| assessed_at           | timestamptz |                                  | Last assessment timestamp                |
| created_by            | uuid        | FK → auth.users(id)              | Creator                                  |
| created_at            | timestamptz | NOT NULL, default now()          | Creation timestamp                       |
| updated_at            | timestamptz | NOT NULL, default now()          | Last update timestamp                    |

> `risk_level`, `accepting_controls`, and `assessed_at` are added by migration `5302125_risk_assess_columns.sql` and written by the assess endpoint.

## Workflows

### Risk Assessment

1. Analyst creates a risk with description, category, likelihood, and impact
2. `POST /risks/:id/assess` accepts numeric likelihood and impact (1-5)
3. Server computes `risk_score = likelihood × impact`
4. Server derives `risk_level`: critical (≥15), high (≥10), medium (≥5), low (<5)
5. Mitigating and accepting controls are persisted and `assessed_at` is set

### Risk Acceptance

- Risks with `acceptance_expires` set are considered formally accepted
- The portal surfaces the acceptance expiry date on the risk card
- Acceptance must be renewed before `acceptance_expires` to remain valid
- Expired acceptances are flagged for re-assessment

## AI Review Rules

- AI may draft risk descriptions, control recommendations, and assessment summaries
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual risk records
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| Risk score not computed  | Use the assess endpoint; manual PATCH does not derive `risk_level` |
| `risk_level` missing     | Verify migration 5302125 applied and assess endpoint was used      |
| Acceptance not shown     | Confirm `acceptance_expires` is set on the risk                    |
| RLS policy denies access | Confirm user has an approved membership in the organization        |
| 404 on risk by id        | Confirm `organization_id` query param matches the risk's org       |

## Release Checklist

- [ ] Migration `5302071_governance.sql` applied
- [ ] Migration `5302125_risk_assess_columns.sql` applied
- [ ] API routes registered in `apps/api/src/routes/governance.ts`
- [ ] Validator `createRiskSchema` in `apps/api/src/validators/governance.ts`
- [ ] SDK module `governance.risks` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/risk-register/`
- [ ] Unit tests pass: `pnpm --filter=api test governance`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/risk-register.spec.ts`
- [ ] Feature doc added to `docs/features/risk-acceptance-register.md`
- [ ] Runbook added to `docs/runbooks/risk-acceptance-register.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
