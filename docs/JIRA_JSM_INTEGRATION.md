# Jira & JSM Integration

> Bidirectional sync between MCT and Atlassian Jira/JSM.

## Architecture

```
Jira Cloud ──webhook──→ POST /api/v1/webhooks/jira ──→ project_tasks (real-time status sync)
     ↑                                                        │
     │                                                        │
     └────── worker jira-sync (batch, periodic) ←─────────────┘

JSM Cloud ──webhook──→ POST /api/v1/webhooks/jsm ──→ tickets (real-time status sync)
     ↑                                                   │
     │                                                   │
     └────── worker jsm-sync (batch, periodic) ←─────────┘
```

## Database Schema

### `projects` — Jira fields

| Column | Type | Description |
|--------|------|-------------|
| `external_jira_project_key` | `text` | Jira project key (e.g. `"PROJ"`, `"MCT"`) |
| `jira_last_synced_at` | `timestamptz` | Last batch sync timestamp |

### `project_tasks` — Jira fields

| Column | Type | Jira Source | Description |
|--------|------|-------------|-------------|
| `external_jira_issue_key` | `text` | `issue.key` | Jira issue key (e.g. `"PROJ-123"`) |
| `issue_type` | `text` | `issuetype.name` | Bug, Story, Task, Epic, Sub-task |
| `priority` | `text` | `priority.name` | Mapped: Highest→urgent, High→high, Medium→normal, Low→low, Lowest→low |
| `status` | `task_status` enum | `status.name` | Mapped via `STATUS_MAP` |
| `labels` | `text[]` | `labels[]` | Array of string labels |
| `parent_task_id` | `uuid` (FK→self) | `parent.key` | Parent task for sub-tasks |
| `epic_key` | `text` | `customfield_*` | Jira epic link |
| `resolution` | `text` | `resolution.name` | Fixed, Won't Fix, Duplicate, Done |
| `sprint` | `text` | `customfield_10007` | Sprint name/ID |
| `jira_last_synced_at` | `timestamptz` | system | When this task was last synced |
| `estimate_hours` | `numeric` | `timeoriginalestimate` | Original estimate in hours |
| `actual_hours` | `numeric` | `timespent` | Time spent in hours |

### `tickets` — JSM fields

| Column | Type | JSM Source | Description |
|--------|------|------------|-------------|
| `external_jsm_issue_key` | `text` | `issue.key` | JSM issue key (e.g. `"HELPDESK-42"`) |
| `title` | `text` | `summary` | Issue summary |
| `status` | `ticket_status` enum | `status.name` | Mapped: Open→new, In Progress→in_progress, Waiting for Customer→waiting_on_client, Resolved→resolved, Closed→closed |
| `priority` | `ticket_priority` enum | `priority.name` | Mapped same as Jira |
| `category` | `text` | `issuetype.name` | Request type / issue type |
| `source` | `text` | — | Set to `"jsm"` for imported tickets |
| `labels` | `text[]` | `labels[]` | JSM labels |
| `resolution` | `text` | `resolution.name` | Resolution type |
| `jira_last_synced_at` | `timestamptz` | system | Last sync timestamp |

## Status Mapping

### Jira → `project_tasks.status`

| Jira Status | MCT Status |
|-------------|-----------|
| `To Do` | `todo` |
| `In Progress` | `in_progress` |
| `Under Review` | `in_review` |
| `Code Review` | `in_review` |
| `Done` | `done` |
| `Blocked` | `blocked` |

### JSM → `tickets.status`

| JSM Status | MCT Status |
|------------|-----------|
| `Open` | `new` |
| `In Progress` | `in_progress` |
| `Waiting for Customer` | `waiting_on_client` |
| `Waiting for Support` | `in_progress` |
| `Resolved` | `resolved` |
| `Closed` | `closed` |

## Worker Sync Tasks

### `jira-sync` (batch, periodic)

**File:** `apps/worker/src/tasks/jira-sync.ts`

- Queries `project_tasks` where `external_jira_issue_key IS NOT NULL`
- Fetches issue details from Jira REST API (`/rest/api/3/issue/{key}`)
- Syncs these fields when changed: `title`, `description`, `status`, `priority`, `due_at`, `issue_type`, `labels`, `resolution`, `epic_key`, `sprint`
- Updates `jira_last_synced_at` on every sync
- Configurable `batchSize` (default 50) and `projectId` filter

### `jsm-sync` (batch, periodic)

**File:** `apps/worker/src/tasks/jsm-sync.ts`

- Searches JSM via JQL: `project = {projectKey} AND created >= -{daysBack}d`
- For new issues: creates MCT tickets with `source: "jsm"`
- For existing issues (matched by `external_jsm_issue_key`): syncs `status`, `priority`, `labels`, `resolution`
- Configurable `projectKey`, `organizationId`, `fullSync` (7 or 30 day lookback)

## Webhook Endpoints

All webhooks are mounted at `/api/v1/webhooks/*` in `apps/api/src/routes/webhooks.ts`.

| Endpoint | Source | Action |
|----------|--------|--------|
| `POST /jira` | Jira webhook | Looks up `project_tasks` by `external_jira_issue_key`, syncs status via `JIRA_STATUS_MAP` |
| `POST /jsm` | JSM webhook | Looks up `tickets` by `external_jsm_issue_key`, syncs status via `JSM_STATUS_MAP` |
| `POST /stripe` | Stripe webhook | Logs audit events for checkout, invoice, subscription events |
| `POST /m365` | M365 webhook | Logs audit events for calendar resource changes |

## Connecting a Project to Jira

### Via API

```bash
# Create a project linked to Jira
curl -X POST /api/v1/projects \
  -H "Authorization: Bearer <token>" \
  -d '{
    "organizationId": "<org-id>",
    "name": "My Project",
    "externalJiraProjectKey": "PROJ"
  }'

# Link a task to a Jira issue
curl -X POST /api/v1/projects/<project-id>/tasks \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement login",
    "externalJiraIssueKey": "PROJ-123",
    "issueType": "Story",
    "priority": "high",
    "labels": ["frontend", "auth"]
  }'

# Update a task's Jira fields
curl -X PATCH /api/v1/projects/<project-id>/tasks/<task-id> \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sprint": "Sprint 12",
    "epicKey": "PROJ-50",
    "resolution": "Done"
  }'
```

## Environment Variables

See `docs/ENVIRONMENT_VARIABLES.md` for the complete reference.

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `JIRA_BASE_URL` | Worker | For Jira sync | Jira instance URL (e.g. `https://your-domain.atlassian.net`) |
| `JIRA_EMAIL` | Worker | For Jira sync | Jira account email |
| `JIRA_API_TOKEN` | Worker | For Jira sync | Jira API token (Atlassian account → API tokens) |
| `JSM_BASE_URL` | Worker | For JSM sync | JSM instance URL |
| `JSM_EMAIL` | Worker | For JSM sync | JSM account email |
| `JSM_API_TOKEN` | Worker | For JSM sync | JSM API token |

## Setting Up Jira Webhooks

1. In Jira: **Settings → System → Webhooks → Create Webhook**
2. URL: `https://api.mainecybertech.com/api/v1/webhooks/jira`
3. Events: `Issue created`, `Issue updated`, `Issue deleted`
4. Optionally add a secret token and validate it in the webhook handler

## Setting Up JSM Webhooks

1. In JSM: **Project settings → Automation → Webhook**
2. URL: `https://api.mainecybertech.com/api/v1/webhooks/jsm`
3. Events: `issue_created`, `issue_updated`

## SDK Types

All Jira/JSM fields are typed in `packages/sdk/src/types.ts`:

```typescript
interface Project {
  external_jira_project_key?: string | null;
  jira_last_synced_at?: string | null;
}

interface ProjectTask {
  external_jira_issue_key?: string | null;
  issue_type?: string | null;
  priority?: string | null;
  labels?: string[] | null;
  parent_task_id?: string | null;
  epic_key?: string | null;
  resolution?: string | null;
  sprint?: string | null;
  jira_last_synced_at?: string | null;
}

interface Ticket {
  external_jsm_issue_key?: string | null;
  labels?: string[] | null;
  resolution?: string | null;
  jira_last_synced_at?: string | null;
}
```

## Migration Reference

| Migration | Description |
|-----------|-------------|
| `5302026_...bootstrap.sql` | Base schema: `projects.external_jira_project_key`, `project_tasks.external_jira_issue_key`, `tickets.external_jsm_issue_key` |
| `5302030_add_jira_fields.sql` | Added: `projects.jira_last_synced_at`; `project_tasks.issue_type, priority, labels, parent_task_id, epic_key, resolution, sprint, jira_last_synced_at`; `tickets.labels, resolution, jira_last_synced_at`; added `'open'` to `ticket_status` enum |

## Troubleshooting

- **Sync not running**: Verify `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` are set in worker env
- **Webhook not updating**: Check the issue key matches exactly (case-sensitive) between Jira and MCT
- **Status not mapping**: Add missing status to `STATUS_MAP` in `worker/src/tasks/jira-sync.ts` (or `jsm-sync.ts`) and `webhooks.ts`
- **Jira API rate limiting**: The sync has built-in retry with backoff on 429 responses
