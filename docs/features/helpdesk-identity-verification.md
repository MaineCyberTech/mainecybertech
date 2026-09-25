# Helpdesk Identity Verification

## Purpose

Identity verification workflow for helpdesk actions on sensitive requests. Records who requested the action, the verification method used, whether verification passed, which action was authorized, and by whom.

Primary users: helpdesk technician, client IT contact, security lead

Business impact: High

Category: security

## Permissions

| Action                     | Roles                         |
| -------------------------- | ----------------------------- |
| List verification records  | All authenticated org members |
| View verification record   | All authenticated org members |
| Create verification record | admin, super_admin            |
| Update verification record | admin, super_admin            |
| Delete verification record | admin, super_admin            |
| Verify/authorize action    | admin, super_admin            |

## Routes

### Portal Routes

| Route                               | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `GET /portal/identity-verification` | List verification requests for current org |

### Admin Routes

| Route                      | Description                 |
| -------------------------- | --------------------------- |
| `GET /admin/id-verify`     | Verification request list   |
| `GET /admin/id-verify/:id` | Verification request detail |

### API Routes

| Method | Endpoint                                                  | Description                                |
| ------ | --------------------------------------------------------- | ------------------------------------------ |
| GET    | `/api/v1/security-suite/identity-verification`            | List verifications (paginated, org-scoped) |
| GET    | `/api/v1/security-suite/identity-verification/:id`        | Get single verification                    |
| POST   | `/api/v1/security-suite/identity-verification`            | Create verification record                 |
| PATCH  | `/api/v1/security-suite/identity-verification/:id`        | Update verification record                 |
| DELETE | `/api/v1/security-suite/identity-verification/:id`        | Delete verification record                 |
| POST   | `/api/v1/security-suite/identity-verification/:id/verify` | Mark verification pass/fail and authorize  |

## Data Model

### identity_verifications

| Column              | Type        | Constraints                      | Description                            |
| ------------------- | ----------- | -------------------------------- | -------------------------------------- |
| id                  | uuid        | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id     | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                         |
| requestor_name      | text        | NOT NULL                         | Person requesting the action           |
| requestor_email     | text        |                                  | Requestor email                        |
| verification_method | text        | NOT NULL                         | email / phone / SMS / in-person / MFA  |
| verification_pass   | boolean     | default false                    | Whether verification passed            |
| action_authorized   | text        |                                  | The action authorized                  |
| authorized_by       | uuid        | FK → auth.users(id)              | User who authorized                    |
| authorized_at       | timestamptz |                                  | Authorization timestamp                |
| notes               | text        |                                  | Free-form notes                        |
| status              | text        | NOT NULL, default 'pending'      | pending / passed / failed / authorized |
| created_by          | uuid        | FK → auth.users(id)              | Creator                                |
| created_at          | timestamptz | NOT NULL, default now()          | Creation timestamp                     |
| updated_at          | timestamptz | NOT NULL, default now()          | Last update timestamp                  |

## Workflows

### Verification Flow

1. Technician records an identity verification request with `requestor_name`, `requestor_email`, and `verification_method`
2. `POST /:id/verify` marks the record `verification_pass` (true/false) and `action_authorized`
3. `authorized_by` and `authorized_at` are stamped; status transitions to `authorized` (or stays failed)
4. Audit events `identity-verification.created` / `.updated` / `.deleted` are logged for CRUD

## AI Review Rules

- AI may draft verification notes and follow-up guidance
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying changes

## Troubleshooting

| Issue               | Resolution                                                  |
| ------------------- | ----------------------------------------------------------- |
| List empty          | Verify org has records; check RLS policy                    |
| Verify endpoint 404 | Confirm record exists in the org                            |
| Stuck in "pending"  | Complete the verify step with pass/fail + authorized action |

## Release Checklist

- [ ] Table from migration `5302070_security_suite.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/identity-verification/`
- [ ] Unit tests pass: `pnpm --filter=api test security-suite`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/identity-verification.spec.ts`
- [ ] Feature doc added to `docs/features/helpdesk-identity-verification.md`
- [ ] Runbook added to `docs/runbooks/helpdesk-identity-verification.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
