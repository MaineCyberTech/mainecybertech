# Client Project Tracker

## Purpose

Client-facing project tracking for managed services delivery. Lists projects with status, priority, and unread-comment indicators, and provides per-project detail with tasks, phases, milestones, dependencies, updates, and comments for end clients.

Primary users: client users, client admins, MSP project manager

Business impact: Very High

Category: delivery

## Permissions

| Action                | Roles                         |
| --------------------- | ----------------------------- |
| List projects         | All authenticated org members |
| View project detail   | All authenticated org members |
| Create project        | admin, super_admin            |
| Update project        | admin, super_admin            |
| Delete project        | admin, super_admin            |
| Manage tasks/comments | admin, super_admin            |
| Comment on tasks      | client_user + (org-scoped)    |
| Export projects       | admin, super_admin            |

## Routes

### Portal Routes

| Route                             | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `GET /portal/projects`            | Project list with unread comment counts (compound fetch) |
| `GET /portal/projects/:projectId` | Project detail with tasks, phases, comments, updates     |
| `GET /portal/timeline`            | Org-wide task timeline + calendar view                   |

### Admin Routes

| Route                 | Description                          |
| --------------------- | ------------------------------------ |
| `GET /admin/projects` | Project management list and creation |

### API Routes

| Method                | Endpoint                                                      | Description                                     |
| --------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| GET                   | `/api/v1/projects`                                            | List projects (cached 30s, paginated)           |
| GET                   | `/api/v1/projects/compound`                                   | Projects + tasks + comments + reads in one call |
| GET                   | `/api/v1/projects/export`                                     | CSV/JSON export                                 |
| GET                   | `/api/v1/projects/:id`                                        | Project with embedded tasks                     |
| GET                   | `/api/v1/projects/:id/detail`                                 | Detail with tasks/comments/read states          |
| POST                  | `/api/v1/projects`                                            | Create project                                  |
| PATCH                 | `/api/v1/projects/:id`                                        | Update project (optimistic locking)             |
| DELETE                | `/api/v1/projects/:id`                                        | Delete project                                  |
| GET/POST/PATCH/DELETE | `/api/v1/projects/:id/phases`, `/milestones`, `/dependencies` | Phase/milestone/dependency CRUD                 |
| GET/POST              | `/api/v1/projects/:projectId/tasks`                           | List/create tasks                               |
| PATCH/DELETE          | `/api/v1/projects/:projectId/tasks/:taskId`                   | Update/delete task                              |
| GET/POST              | `/api/v1/projects/:projectId/tasks/:taskId/comments`          | List/create task comments                       |
| POST                  | `/api/v1/projects/:projectId/tasks/:taskId/read`              | Mark task comments read (RPC)                   |
| GET/POST              | `/api/v1/projects/:id/updates`                                | Project update log                              |
| PATCH/DELETE          | `/api/v1/projects/:id/updates/:updateId`                      | Update/delete update                            |
| POST                  | `/api/v1/projects/:id/tasks/reorder`                          | Reorder tasks                                   |

## Data Model

### projects

| Column                    | Type           | Constraints                      | Description                                    |
| ------------------------- | -------------- | -------------------------------- | ---------------------------------------------- |
| id                        | uuid           | PK, default gen_random_uuid()    | Unique identifier                              |
| organization_id           | uuid           | FK → organizations(id), NOT NULL | Tenant scoping                                 |
| created_by                | uuid           | FK → auth.users(id), NOT NULL    | Creator                                        |
| owner_id                  | uuid           | FK → auth.users(id)              | Project owner                                  |
| external_jira_project_key | text           |                                  | Jira/JSM integration key                       |
| name                      | text           | NOT NULL                         | Project name                                   |
| description               | text           |                                  | Project summary                                |
| status                    | project_status | NOT NULL, default 'planned'      | planned/active/client_review/blocked/completed |
| start_date                | date           |                                  | Planned start                                  |
| due_date                  | date           |                                  | Target due date                                |
| progress_percent          | int            | NOT NULL, default 0              | Overall progress                               |
| metadata                  | jsonb          | NOT NULL, default '{}'           | Flexible metadata                              |
| created_at                | timestamptz    | NOT NULL, default now()          | Creation timestamp                             |
| updated_at                | timestamptz    | NOT NULL, default now()          | Last update timestamp                          |

### Related tables

- `project_phases` — phase name/status/dates per project
- `project_milestones` — milestone title/due date/status, optionally bound to a phase
- `project_dependencies` — dependency_type links (finish_to_start), optional task/milestone/project constraints
- `project_tasks` — task title/status/sort_order/estimate/actual hours with per-project ordering
- `project_task_comments` — task comment threads with `is_internal` flag
- `project_task_comment_reads` — per-user read states for unread badges
- `project_updates` — chronological project update log
- `project_members` — project-level membership mapping

## Workflows

### Portal Compound Fetch

- Portal project list issues a single `GET /projects/compound` request (projects + tasks + comments + read states) instead of N+1 per-project calls — prevents per-user rate-limit exhaustion on orgs with many projects
- Unread comment counts are computed client-side by comparing comment timestamps against read states
- On transient API failure the page renders a "temporarily unavailable" state instead of an error boundary

### Task Read State

- Opening a task auto-marks comments read via `mark_task_read(uuid,uuid,uuid)` SECURITY DEFINER RPC (migration 5302122) — bypasses RLS on the direct upsert that previously crashed when no read row existed
- Best-effort calls are wrapped in try/catch so a failure can never take the page down

### Jira/JSM Sync

- Worker `jira-sync` and `jsm-sync` tasks map external statuses onto project/task statuses via `external_jira_project_key` / `external_jira_issue_key`

## AI Review Rules

- AI may draft task descriptions, phase plans, and milestone summaries
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to projects

## Troubleshooting

| Issue                                     | Resolution                                                        |
| ----------------------------------------- | ----------------------------------------------------------------- |
| Portal projects "temporarily unavailable" | Transient API failure/rate limit — retry in a moment              |
| Unread counts stale                       | Verify `mark_task_read` RPC exists (migration 5302122)            |
| Task not found (404)                      | Confirm task belongs to the requested project and org             |
| Optimistic lock error                     | Refresh and retry; another user modified the project concurrently |

## Release Checklist

- [ ] Tables from bootstrap migration 5302026 + tracker migration `5302087_project_tracker.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Compound endpoint `GET /projects/compound` registered before `/:id`
- [ ] `mark_task_read` RPC migration `5302122` applied
- [ ] SDK module exported from `packages/sdk/src/index.ts` (incl. `getCompound`)
- [ ] Portal pages in `apps/web/app/(portal)/portal/projects/`
- [ ] Unit tests pass: `pnpm --filter=api test projects`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/admin/projects.spec.ts`
- [ ] Feature doc added to `docs/features/client-project-tracker.md`
- [ ] Runbook added to `docs/runbooks/client-project-tracker.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
