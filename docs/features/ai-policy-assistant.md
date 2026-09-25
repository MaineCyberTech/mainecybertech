# AI Policy Assistant

## Purpose

AI usage policy management for client organizations. Policies define approved AI tools, data handling rules, and employee guidance, with an approval workflow and versioned status lifecycle. Helps clients govern generative AI usage consistently.

Primary users: MSP compliance engineer, client security administrator, admin, super_admin

Business impact: Medium

Category: edu-automation

## Permissions

| Action         | Roles                         |
| -------------- | ----------------------------- |
| List policies  | All authenticated org members |
| View policy    | All authenticated org members |
| Create policy  | admin, super_admin            |
| Update policy  | admin, super_admin            |
| Delete policy  | admin, super_admin            |
| Approve policy | admin, super_admin            |

## Routes

### Admin Routes

| Route                                     | Description                                 |
| ----------------------------------------- | ------------------------------------------- |
| `GET /admin/edu-automation/ai-policy`     | List AI policies + create form (admin-only) |
| `GET /admin/edu-automation/ai-policy/:id` | View/edit a single AI policy (admin-only)   |

There is no portal page for this module — policy authoring and review are admin-only operations.

### API Routes

| Method | Endpoint                               | Description               |
| ------ | -------------------------------------- | ------------------------- |
| GET    | `/api/v1/edu-automation/ai-policy`     | List policies (paginated) |
| GET    | `/api/v1/edu-automation/ai-policy/:id` | Get a single policy       |
| POST   | `/api/v1/edu-automation/ai-policy`     | Create a policy           |
| PATCH  | `/api/v1/edu-automation/ai-policy/:id` | Update a policy           |
| DELETE | `/api/v1/edu-automation/ai-policy/:id` | Delete a policy           |

## Data Model

### ai_policies

| Column              | Type        | Constraints                      | Description                                 |
| ------------------- | ----------- | -------------------------------- | ------------------------------------------- |
| id                  | uuid        | PK, default gen_random_uuid()    | Unique identifier                           |
| organization_id     | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                              |
| title               | text        | NOT NULL                         | Policy title                                |
| content             | text        |                                  | Policy body                                 |
| approved_tools      | text[]      |                                  | Allowed AI tools list                       |
| data_handling_rules | text        |                                  | Rules for handling data in AI tools         |
| employee_guidance   | text        |                                  | Guidance for employees                      |
| status              | text        | NOT NULL, default 'draft'        | draft / pending_review / approved / retired |
| approved_by         | uuid        | FK → auth.users(id)              | Reviewer                                    |
| approved_at         | timestamptz |                                  | Approval timestamp                          |
| created_by          | uuid        | FK → auth.users(id)              | Author                                      |
| created_at          | timestamptz | NOT NULL, default now()          | Creation timestamp                          |
| updated_at          | timestamptz | NOT NULL, default now()          | Last update timestamp                       |

## Workflows

### Policy Lifecycle

1. **Draft** — Author creates a policy with title, content, approved tools, data handling rules, and employee guidance
2. **Review** — Policy is submitted for review and approval (status transitions toward `approved`)
3. **Approve** — Reviewer approves, stamping `approved_by`/`approved_at`
4. **Maintain** — Policies are updated as the AI tool landscape changes; retired policies move to `retired`

### Admin Display

- List shows policy titles with links to detail pages
- Create form collects `organizationId`, `title`, `content`, `dataHandlingRules`, and `employeeGuidance`
- Empty state renders "No AI policies"

## Troubleshooting

| Issue                     | Resolution                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| Policy list empty         | Verify org has policies and `organization_id` is passed           |
| Approved tools not saving | `approved_tools` is a text array — pass as an array, not a string |
| Approval date missing     | `approved_by`/`approved_at` stamped on approval action            |
| RLS policy denies access  | Confirm user has an approved membership in the organization       |

## Release Checklist

- [ ] Migration `5302073_edu_automation.sql` applied (`ai_policies` table)
- [ ] API routes registered in `apps/api/src/routes/edu-automation.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`eduAutomation.aiPolicy`)
- [ ] Admin pages created in `apps/web/app/(admin)/admin/edu-automation/ai-policy/`
- [ ] Server actions in `apps/web/lib/module-actions.ts` (`createAiPolicy`)
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/admin/ai-policy.spec.ts`
- [ ] Feature doc added to `docs/features/ai-policy-assistant.md`
- [ ] Runbook added to `docs/runbooks/ai-policy-assistant.md`
