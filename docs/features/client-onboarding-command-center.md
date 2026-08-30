# Client Onboarding Command Center

## Purpose

Repeatable workspace for client discovery, M365 setup, access collection, network baseline, documentation, security baseline, and support handoff.

Primary users: MSP onboarding lead, client sponsor, technician

Business impact: Very High

Category: operations

## Permissions

| Action                    | Roles                         |
| ------------------------- | ----------------------------- |
| List onboarding records   | All authenticated org members |
| View onboarding record    | All authenticated org members |
| Create onboarding record  | admin, super_admin            |
| Update onboarding record  | admin, super_admin            |
| Delete onboarding record  | admin, super_admin            |
| Complete phase            | admin, super_admin            |
| Manage checklist items    | admin, super_admin            |
| Export onboarding records | admin, super_admin            |

## Routes

### Portal Routes

| Route                                              | Description                                          |
| -------------------------------------------------- | ---------------------------------------------------- |
| `GET /portal/client-onboarding-command-center`     | List all onboarding records for current organization |
| `GET /portal/client-onboarding-command-center/new` | Create new onboarding record                         |
| `GET /portal/client-onboarding-command-center/:id` | View onboarding record detail with checklist         |

### API Routes

| Method | Endpoint                                          | Description                                     |
| ------ | ------------------------------------------------- | ----------------------------------------------- |
| GET    | `/api/v1/client-onboarding`                       | List onboarding records (paginated, filterable) |
| GET    | `/api/v1/client-onboarding/export.csv`            | Export onboarding records (CSV/JSON)            |
| GET    | `/api/v1/client-onboarding/:id`                   | Get single onboarding record                    |
| POST   | `/api/v1/client-onboarding`                       | Create onboarding record                        |
| PATCH  | `/api/v1/client-onboarding/:id`                   | Update onboarding record                        |
| DELETE | `/api/v1/client-onboarding/:id`                   | Delete onboarding record                        |
| POST   | `/api/v1/client-onboarding/:id/complete-phase`    | Complete current phase and advance              |
| GET    | `/api/v1/client-onboarding/:id/checklist`         | Get checklist items for onboarding record       |
| PATCH  | `/api/v1/client-onboarding/:id/checklist/:itemId` | Update checklist item                           |

## Data Model

### client_onboarding_command_center_records

| Column                   | Type        | Constraints                      | Description                    |
| ------------------------ | ----------- | -------------------------------- | ------------------------------ |
| id                       | uuid        | PK, default gen_random_uuid()    | Unique identifier              |
| organization_id          | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                 |
| client_name              | text        | NOT NULL                         | Client display name            |
| client_domain            | text        |                                  | Client email domain            |
| client_contact_email     | text        |                                  | Primary contact email          |
| client_contact_phone     | text        |                                  | Primary contact phone          |
| onboarding_lead_id       | uuid        | FK → auth.users(id)              | Assigned onboarding lead       |
| status                   | text        | NOT NULL, default 'discovery'    | Overall status                 |
| phase                    | text        | NOT NULL, default 'discovery'    | Current phase                  |
| risk_level               | text        | NOT NULL, default 'medium'       | Risk assessment                |
| discovery_notes          | text        |                                  | Notes from discovery phase     |
| m365_setup_status        | text        | NOT NULL, default 'not_started'  | M365 setup status              |
| m365_tenant_id           | text        |                                  | M365 tenant identifier         |
| m365_licenses            | jsonb       | NOT NULL, default '{}'           | License assignments            |
| access_collection_status | text        | NOT NULL, default 'not_started'  | Access collection status       |
| access_credentials       | jsonb       | NOT NULL, default '{}'           | Collected credentials metadata |
| network_baseline_status  | text        | NOT NULL, default 'not_started'  | Network baseline status        |
| network_diagram_url      | text        |                                  | Link to network diagram        |
| network_scan_results     | jsonb       | NOT NULL, default '{}'           | Vulnerability scan results     |
| documentation_status     | text        | NOT NULL, default 'not_started'  | Documentation status           |
| documentation_url        | text        |                                  | Link to documentation          |
| security_baseline_status | text        | NOT NULL, default 'not_started'  | Security baseline status       |
| security_baseline_score  | integer     | 0-100                            | Security score                 |
| security_findings        | jsonb       | NOT NULL, default '[]'           | Security findings array        |
| support_handoff_status   | text        | NOT NULL, default 'not_started'  | Support handoff status         |
| support_handoff_notes    | text        |                                  | Handoff notes                  |
| handoff_completed_at     | timestamptz |                                  | When handoff was completed     |
| next_review_at           | timestamptz |                                  | Next scheduled review          |
| started_at               | timestamptz | NOT NULL, default now()          | Onboarding start date          |
| completed_at             | timestamptz |                                  | Onboarding completion date     |
| version                  | integer     | NOT NULL, default 1              | Optimistic locking             |
| created_at               | timestamptz | NOT NULL, default now()          | Creation timestamp             |
| updated_at               | timestamptz | NOT NULL, default now()          | Last update timestamp          |

### client_onboarding_checklist_items

| Column               | Type        | Constraints                                                 | Description                |
| -------------------- | ----------- | ----------------------------------------------------------- | -------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()                               | Unique identifier          |
| organization_id      | uuid        | FK → organizations(id), NOT NULL                            | Tenant scoping             |
| onboarding_record_id | uuid        | FK → client_onboarding_command_center_records(id), NOT NULL | Parent record              |
| phase                | text        | NOT NULL                                                    | Phase this item belongs to |
| item_key             | text        | NOT NULL                                                    | Unique key within phase    |
| label                | text        | NOT NULL                                                    | Display label              |
| description          | text        |                                                             | Item description           |
| is_required          | boolean     | NOT NULL, default true                                      | Whether item is mandatory  |
| is_completed         | boolean     | NOT NULL, default false                                     | Completion status          |
| completed_by         | uuid        | FK → auth.users(id)                                         | User who completed         |
| completed_at         | timestamptz |                                                             | Completion timestamp       |
| notes                | text        |                                                             | Completion notes           |
| sort_order           | integer     | NOT NULL, default 0                                         | Display order              |
| created_at           | timestamptz | NOT NULL, default now()                                     | Creation timestamp         |
| updated_at           | timestamptz | NOT NULL, default now()                                     | Last update timestamp      |

## Workflows

### Standard Onboarding Flow

1. **Discovery** → Initial meeting, stakeholder mapping, environment survey, pain points, scope agreement
2. **M365 Setup** → Tenant provisioning, license assignment, security defaults, MFA, Exchange/Teams/SharePoint config
3. **Access Collection** → Credential inventory, VPN/remote access, admin accounts, vendor portals, documentation access
4. **Network Baseline** → Network diagram, IP scheme, firewall rules, wireless audit, vulnerability scan
5. **Documentation** → Runbooks, asset inventory, emergency contacts, SLA docs, backup verification
6. **Security Baseline** → Endpoint protection, patch management, email security, awareness training, incident response
7. **Support Handoff** → Ticketing integration, monitoring setup, knowledge transfer, go-live sign-off, first-week review

Each phase has a predefined checklist. Completion of all required items in a phase allows advancing to the next phase.

### Phase Completion

- User clicks "Complete Phase" on record detail
- System validates all required checklist items for current phase are completed
- If valid, advances `phase` and `status` to next phase
- On final phase ("support_handoff"), sets status to "completed" and `completed_at` timestamp
- Creates audit log entry

### Checklist Management

- Default checklist items created automatically on record creation (41 items across 7 phases)
- Users can add custom checklist items
- Required items must be completed before phase completion
- Completion tracked with user, timestamp, and optional notes

## AI Review Rules

- AI may draft onboarding plans, checklist templates, discovery summaries, and handoff documentation
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual onboarding records
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                       | Resolution                                                                |
| --------------------------- | ------------------------------------------------------------------------- |
| Phase won't advance         | Verify all required checklist items for current phase are marked complete |
| Checklist items not created | Check database for trigger/function; re-run migration if needed           |
| Export returns empty        | Verify organization has onboarding records; check RLS policies            |
| RLS policy denies access    | Confirm user has membership in the organization                           |
| Optimistic lock error       | Refresh record and retry; another user modified concurrently              |

## Release Checklist

- [ ] Migration `5302078_client_onboarding_command_center.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/client-onboarding-command-center.ts`
- [ ] Service functions in `apps/api/src/services/client-onboarding-command-center.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal pages created in `apps/web/app/(portal)/portal/client-onboarding-command-center/`
- [ ] Unit tests pass: `pnpm --filter=api test client-onboarding-command-center`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/client-onboarding-command-center.spec.ts`
- [ ] Feature doc added to `docs/features/client-onboarding-command-center.md`
- [ ] Runbook added to `docs/runbooks/client-onboarding-command-center.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
