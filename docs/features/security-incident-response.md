# Security Incident Response

## Purpose

Track security incidents for each client organization through the full response lifecycle: detection, containment, eradication, recovery, and closure. Each `incident_responses` record captures the incident type, severity, timestamps for each lifecycle stage, affected systems, root cause, and lessons learned.

Primary users: MSP SOC analyst, incident commander, client admin

Business impact: Critical

Category: security

## Permissions

Permission module key: `incidents` (view / create / edit / delete)

| Action              | Roles                          |
| ------------------- | ------------------------------ |
| List/view incidents | All authenticated org members  |
| Create incident     | admin, super_admin, technician |
| Update incident     | admin, super_admin, technician |
| Delete incident     | admin, super_admin             |

## Routes

### Portal Routes

| Route                           | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `GET /portal/incident-response` | List security incidents for the organization |

### Admin Routes

| Route                  | Description               |
| ---------------------- | ------------------------- |
| `GET /admin/incidents` | Admin incident management |

### API Routes

| Method | Endpoint                               | Description                            |
| ------ | -------------------------------------- | -------------------------------------- |
| GET    | `/api/v1/security-suite/incidents`     | List incidents (paginated, org-scoped) |
| POST   | `/api/v1/security-suite/incidents`     | Create incident record                 |
| GET    | `/api/v1/security-suite/incidents/:id` | Get single incident                    |
| PATCH  | `/api/v1/security-suite/incidents/:id` | Update incident (status/timestamps)    |
| DELETE | `/api/v1/security-suite/incidents/:id` | Delete incident                        |

## Data Model

### incident_responses

| Column           | Type        | Constraints                      | Description                                    |
| ---------------- | ----------- | -------------------------------- | ---------------------------------------------- |
| id               | uuid        | PK, default gen_random_uuid()    | Unique identifier                              |
| organization_id  | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                 |
| incident_type    | text        | NOT NULL                         | phishing/malware/data breach/lost device…      |
| title            | text        | NOT NULL                         | Incident title                                 |
| description      | text        |                                  | Full description                               |
| severity         | text        | NOT NULL, default 'medium'       | low / medium / high / critical                 |
| detected_at      | timestamptz |                                  | Detection timestamp                            |
| contained_at     | timestamptz |                                  | Containment timestamp                          |
| eradicated_at    | timestamptz |                                  | Eradication timestamp                          |
| recovered_at     | timestamptz |                                  | Recovery timestamp                             |
| closed_at        | timestamptz |                                  | Closure timestamp                              |
| affected_systems | text        |                                  | Affected endpoints/systems                     |
| root_cause       | text        |                                  | Root cause analysis                            |
| lessons_learned  | text        |                                  | Post-incident lessons                          |
| status           | text        | NOT NULL, default 'detected'     | detected/contained/eradicated/recovered/closed |
| lead_user_id     | uuid        | FK → auth.users(id)              | Incident lead                                  |
| created_by       | uuid        | FK → auth.users(id)              | Creator                                        |
| created_at       | timestamptz | NOT NULL, default now()          | Creation timestamp                             |
| updated_at       | timestamptz | NOT NULL, default now()          | Last update timestamp                          |

## Workflows

### Incident Lifecycle

1. **Detected** → record `incident_type`, `title`, `severity`, `detected_at`, `affected_systems`
2. **Contained** → set `contained_at`; assign `lead_user_id`
3. **Eradicated** → set `eradicated_at`; record `root_cause`
4. **Recovered** → set `recovered_at`
5. **Closed** → set `closed_at`; capture `lessons_learned`

Stages are advanced by PATCHing `status` and the matching timestamp column. Status index (`idx_incident_responses_status`) supports filter queries by state.

### Post-Incident Review

- `lessons_learned` captured on closure feeds the SOP library and tabletop exercises
- High/critical incidents should have a follow-up review scheduled

## AI Review Rules

- AI may draft containment steps, root-cause hypotheses, and lessons-learned summaries
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before closure

## Troubleshooting

| Issue                        | Resolution                                                       |
| ---------------------------- | ---------------------------------------------------------------- |
| List empty for valid org     | Verify `organization_id` matches active org; check RLS           |
| Status filter mismatch       | Status values are free text following detected→closed convention |
| Severity not shown on portal | Confirm `severity` set on create (defaults to medium)            |
| Delete blocked               | Only admin/super_admin role members may delete                   |

## Release Checklist

- [ ] Migration `5302070_security_suite.sql` applied (incident_responses + RLS + indexes)
- [ ] Permission keys `incidents:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/security-suite.ts` (crudRoute)
- [ ] Validators in `apps/api/src/validators/security-suite.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/incident-response/` renders
- [ ] Admin page `apps/web/app/(admin)/admin/incidents/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/incident-response.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/security-incident-response.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
