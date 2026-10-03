# Client Satisfaction Pulse

## Purpose

CSAT/NPS-style pulse surveys tied to tickets, projects, QBRs, onboarding milestones, and follow-ups. Pulses capture ratings and feedback, templates define reusable survey structures, and schedules automate when pulses are triggered.

Primary users: MSP client success manager, admin, super_admin

Business impact: High

Category: satisfaction-pulse

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List pulses         | All authenticated org members |
| View pulse          | All authenticated org members |
| Create pulse        | admin, super_admin            |
| Update pulse        | admin, super_admin            |
| Delete pulse        | admin, super_admin            |
| Respond to pulse    | All authenticated org members |
| Manage templates    | admin, super_admin            |
| Manage schedules    | admin, super_admin            |
| Export pulses (CSV) | admin, super_admin            |

## Routes

### Admin Routes

| Route                               | Description                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `GET /admin/satisfaction-pulse`     | Pulse list + create form + templates + schedules + CSV export |
| `GET /admin/satisfaction-pulse/:id` | Pulse detail + respond form                                   |

There is no portal page for this module — pulse management is admin-only.

### API Routes

| Method | Endpoint                                   | Description                         |
| ------ | ------------------------------------------ | ----------------------------------- |
| GET    | `/api/v1/satisfaction-pulse`               | List pulses (paginated, filterable) |
| GET    | `/api/v1/satisfaction-pulse/export`        | Export pulses (CSV/JSON)            |
| GET    | `/api/v1/satisfaction-pulse/:id`           | Get a single pulse                  |
| POST   | `/api/v1/satisfaction-pulse`               | Create a pulse                      |
| PATCH  | `/api/v1/satisfaction-pulse/:id`           | Update a pulse                      |
| POST   | `/api/v1/satisfaction-pulse/:id/respond`   | Record rating + feedback            |
| DELETE | `/api/v1/satisfaction-pulse/:id`           | Delete a pulse                      |
| GET    | `/api/v1/satisfaction-pulse/templates`     | List templates                      |
| GET    | `/api/v1/satisfaction-pulse/templates/:id` | Get a single template               |
| POST   | `/api/v1/satisfaction-pulse/templates`     | Create a template                   |
| PATCH  | `/api/v1/satisfaction-pulse/templates/:id` | Update a template                   |
| DELETE | `/api/v1/satisfaction-pulse/templates/:id` | Delete a template                   |
| GET    | `/api/v1/satisfaction-pulse/schedules`     | List schedules                      |
| POST   | `/api/v1/satisfaction-pulse/schedules`     | Create a schedule                   |
| PATCH  | `/api/v1/satisfaction-pulse/schedules/:id` | Update a schedule                   |
| DELETE | `/api/v1/satisfaction-pulse/schedules/:id` | Delete a schedule                   |

## Data Model

### satisfaction_pulses

| Column                     | Type        | Constraints                      | Description                                     |
| -------------------------- | ----------- | -------------------------------- | ----------------------------------------------- |
| id                         | uuid        | PK, default gen_random_uuid()    | Unique identifier                               |
| organization_id            | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                  |
| subject                    | text        | NOT NULL                         | Pulse subject line                              |
| question                   | text        |                                  | Survey question                                 |
| rating                     | integer     | default 5                        | CSAT/NPS rating                                 |
| feedback                   | text        |                                  | Free-form feedback                              |
| source                     | text        | default 'ticket'                 | ticket / project / qbr / onboarding / follow_up |
| source_entity_id           | uuid        |                                  | Source record ID                                |
| source_entity_type         | text        |                                  | Source entity type                              |
| sent_at                    | timestamptz |                                  | When the pulse was sent                         |
| responded_at               | timestamptz |                                  | When the pulse was answered                     |
| status                     | text        | NOT NULL, default 'pending'      | pending / sent / responded                      |
| respondent_user_id         | uuid        | FK → auth.users(id)              | Who responded                                   |
| respondent_organization_id | uuid        | FK → organizations(id)           | Respondent org (for cross-org pulses)           |
| created_at                 | timestamptz | NOT NULL, default now()          | Creation timestamp                              |
| updated_at                 | timestamptz | NOT NULL, default now()          | Last update timestamp                           |

### satisfaction_pulse_templates

| Column          | Type        | Constraints                      | Description           |
| --------------- | ----------- | -------------------------------- | --------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier     |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping        |
| name            | text        | NOT NULL                         | Template name         |
| description     | text        |                                  | Template description  |
| type            | text        | NOT NULL, default 'csat'         | csat / nps            |
| questions       | jsonb       | NOT NULL, default '[]'           | Question definitions  |
| is_active       | boolean     | NOT NULL, default true           | Template enabled flag |
| created_by      | uuid        | FK → auth.users(id)              | Author                |
| created_at      | timestamptz | NOT NULL, default now()          | Creation timestamp    |
| updated_at      | timestamptz | NOT NULL, default now()          | Last update timestamp |

### satisfaction_pulse_schedules

| Column          | Type        | Constraints                           | Description                                                  |
| --------------- | ----------- | ------------------------------------- | ------------------------------------------------------------ |
| id              | uuid        | PK, default gen_random_uuid()         | Unique identifier                                            |
| organization_id | uuid        | FK → organizations(id), NOT NULL      | Tenant scoping                                               |
| template_id     | uuid        | FK → satisfaction_pulse_templates(id) | Template used                                                |
| name            | text        | NOT NULL                              | Schedule name                                                |
| trigger_type    | text        | NOT NULL, default 'ticket_closed'     | ticket_closed / project_complete / qbr / onboarding / manual |
| trigger_config  | jsonb       | NOT NULL, default '{}'                | Trigger-specific config                                      |
| frequency       | text        |                                       | Frequency label                                              |
| cron_expression | text        |                                       | Cron for recurring sends                                     |
| is_active       | boolean     | NOT NULL, default true                | Schedule enabled flag                                        |
| last_run_at     | timestamptz |                                       | Last execution                                               |
| next_run_at     | timestamptz |                                       | Next scheduled execution                                     |
| created_by      | uuid        | FK → auth.users(id)                   | Author                                                       |
| created_at      | timestamptz | NOT NULL, default now()               | Creation timestamp                                           |
| updated_at      | timestamptz | NOT NULL, default now()               | Last update timestamp                                        |

## Workflows

### Pulse Lifecycle

1. **Create** — Pulse created with subject, question, rating scale, and source
2. **Send** — Pulse moves to `sent_at` when dispatched; `status` becomes `sent`
3. **Respond** — `POST /:id/respond` records `rating` + `feedback`, stamps `responded_at`, sets status `responded`
4. **Export** — CSV export (`/export?format=csv`) streams pulse rows for reporting

### Scheduling

- Schedules reference a template and a trigger type (e.g., `ticket_closed`)
- Recurring sends use `cron_expression`/`frequency` with `next_run_at` for the worker
- Inactive schedules (`is_active = false`) are skipped

### Admin Display

- Pulses section lists subject, source, status, rating, and sent/responded chips
- Templates and schedules panels show counts and active states
- CSV export link available directly on the page

## Troubleshooting

| Issue                    | Resolution                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| Pulse not sending        | Check `status` and `sent_at`; schedules use `next_run_at` for worker |
| Respond endpoint fails   | Pulse may already be `responded`; rating must be an integer          |
| Templates empty          | No templates created; create one before scheduling                   |
| CSV export empty         | No pulses in the org, or `format` not `csv`                          |
| RLS policy denies access | Confirm user has an approved membership in the organization          |

## Release Checklist

- [ ] Migrations `5302074_final_batch.sql` + `5302079_satisfaction_pulse_widget.sql` applied
- [ ] API routes registered in `apps/api/src/routes/satisfaction-pulse-widget.ts`
- [ ] Services in `apps/api/src/services/satisfaction-pulse-widget.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`satisfactionPulse`)
- [ ] Admin pages created in `apps/web/app/(admin)/admin/satisfaction-pulse/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/admin/satisfaction-pulse.spec.ts`
- [ ] Feature doc added to `docs/features/client-satisfaction-pulse.md`
- [ ] Runbook added to `docs/runbooks/client-satisfaction-pulse.md`
