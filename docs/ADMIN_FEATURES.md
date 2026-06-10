# Admin Features

> Webhook management, role/permission editor, audit export, bulk user import, global search, health dashboard, Jira/JSM integration UI, ticket comment editing, activity timeline, and CSV export.

---

## Webhook Management

### Database

| Table                | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `webhook_endpoints`  | Managed webhook endpoints with URL, secret, events, active status |
| `webhook_deliveries` | Delivery log: event, status, response, duration, error            |

**Migration:** `5302032_webhook_endpoints.sql`

### API Endpoints

All at `/api/v1/webhook-endpoints/*`, require admin for mutations.

| Method   | Path              | Description                                                       |
| -------- | ----------------- | ----------------------------------------------------------------- |
| `GET`    | `/`               | List endpoints, filterable by `organization_id`                   |
| `GET`    | `/:id`            | Single endpoint                                                   |
| `POST`   | `/`               | Create endpoint (name, url, secret?, events[], organizationId)    |
| `PATCH`  | `/:id`            | Update endpoint (name, url, secret, events, isActive)             |
| `DELETE` | `/:id`            | Delete endpoint                                                   |
| `GET`    | `/:id/deliveries` | Paginated delivery log (20 per page)                              |
| `POST`   | `/:id/test`       | Send test ping, record delivery, update last_success/last_failure |

### Admin UI

- **List** (`/admin/webhooks`): cards with name, URL, event count, status, badges
- **Detail** (`/admin/webhooks/:id`): edit form (name, URL, secret, event checkboxes, active toggle), test button with result, delivery log table, delete button
- **New** (`/admin/webhooks/new`): create form with org selector

### SDK

```typescript
client.webhooks.list()           // WebhookEndpoint[]
client.webhooks.get(id)          // WebhookEndpoint
client.webhooks.create(data)     // WebhookEndpoint
client.webhooks.update(id, data) // WebhookEndpoint
client.webhooks.remove(id)       // void
client.webhooks.listDeliveries(id, params?) // PaginatedResult<WebhookDelivery>
client.webhooks.test(id)         // { ok, status?, error?, duration_ms? }
```

### Permissions

Seeded: `webhooks.view`, `webhooks.manage`

---

## Role/Permission Editor

### API Endpoints

All at `/api/v1/roles/*`, require admin for mutations.

| Method | Path               | Description                                                 |
| ------ | ------------------ | ----------------------------------------------------------- |
| `GET`  | `/`                | List roles (includes `description`, `is_system`)            |
| `GET`  | `/:id`             | Single role                                                 |
| `GET`  | `/:id/permissions` | Role detail + all permissions + current role permission IDs |
| `PUT`  | `/:id/permissions` | Toggle permission: `{ permissionId, hasPermission }`        |

Super Admin role permissions are locked and cannot be modified.

### Admin UI

- **List** (`/admin/roles`): cards with name, key, description, system badge
- **Detail** (`/admin/roles/:id`): interactive permission matrix — click cells to grant/revoke

### SDK

```typescript
client.roles.list(); // Role[]
client.roles.get(id); // Role
client.roles.getPermissions(roleId); // RolePermissions
client.roles.updatePermission(roleId, permId, hasPermission); // { updated }
```

---

## Audit Export

### API Endpoints

| Method | Path                               | Description                          |
| ------ | ---------------------------------- | ------------------------------------ |
| `GET`  | `/api/v1/audit/export?format=csv`  | Download filtered audit logs as CSV  |
| `GET`  | `/api/v1/audit/export?format=json` | Download filtered audit logs as JSON |

Both endpoints accept the same filters as the audit list: `action`, `entity_type`, `organization_id`, `actor_user_id`. CSV limit: 10,000 rows.

### Admin UI

Export buttons ("Download CSV", "Download JSON") appear below the filters on `/admin/audit`. They respect the currently applied filters.

### CSV Format

```
id,action,entity_type,entity_id,organization_id,actor_user_id,actor_type,metadata,created_at
```

---

## Bulk User Import

### API Endpoints

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| `POST` | `/api/v1/bulk/invite` | Bulk invite users via CSV |

**Body:** `{ csv: string, organizationId: string, roleId: string }`

**CSV Format:** One user per line: `email, full_name`

**Processing per row:**

1. Look up user by email in `profiles` table
2. If not found, create via `supabase.auth.admin.createUser()` (confirmed email, random password)
3. Check for existing membership (skip if already exists)
4. Create membership with status `"pending"`

**Response:** `{ results: [{ email, status, message }] }`

- `created` — new user account created
- `exists` — user already had an account
- `invited` — membership created successfully
- `skipped` — already a member
- `error` — something went wrong

### Admin UI

**Route:** `/admin/bulk-invite`

Form with:

- Organization selector (required)
- Role selector (required)
- CSV textarea with placeholder example
- Import button
- Results summary (invited/created/skipped/errors counts)
- Per-row result list with color-coded status

### SDK

No dedicated SDK method — uses direct `fetch()` or the form-based approach.

---

## Migrations

| Migration                       | Description                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `5302032_webhook_endpoints.sql` | `webhook_endpoints` + `webhook_deliveries` tables + RLS        |
| `5302028_seed_permissions.sql`  | Added `webhooks.view`, `webhooks.manage` permissions (updated) |

---

## Environment Variables

No new environment variables are required for these features. All use existing auth and database infrastructure.

---

## Global Search

**Route:** Admin header (every page via `layout.tsx`)

**API:** `GET /api/v1/search?q=<term>` (requires admin auth)

Searches 4 tables in parallel using `ilike`:

| Table           | Fields Searched        | Max Results |
| --------------- | ---------------------- | ----------- |
| `profiles`      | `full_name`, `email`   | 5           |
| `organizations` | `name`, `slug`         | 5           |
| `tickets`       | `title`, `description` | 5           |
| `projects`      | `name`, `description`  | 5           |

**UI:** `AdminGlobalSearch.tsx` — 300ms debounce, grouped dropdown results with avatar initials, status/priority pills, click-outside-to-close, "no results" empty state. Keyboard shortcut ready (Ctrl+K can be added).

---

## Health Dashboard

**Route:** `/admin/health`

**UI:** `HealthDashboardClient.tsx` — real-time service status page showing:

- **API Server**: green/red status badge + response latency
- **Database**: healthy/unhealthy status from API `/health` endpoint
- **Worker**: status from health checks
- Auto-refreshes every 30 seconds
- Manual "Refresh" button
- Last checked timestamp

**API:** `GET /health` — returns JSON with `{ service, status, checks: { database: { status, latencyMs } }, uptime }`

---

## Jira / JSM UI Integration

Jira and JSM fields are displayed across admin and portal pages where applicable.

### Admin Ticket Pages

| Page                                     | JSM Fields Displayed                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| **Ticket list** (`/admin/tickets`)       | `external_jsm_issue_key` — blue monospace badge next to title            |
| **Ticket detail** (`/admin/tickets/:id`) | `external_jsm_issue_key` (badge), `labels` (chips), `resolution` (field) |

### Admin Project Pages

| Page                                       | Jira Fields Displayed                                            |
| ------------------------------------------ | ---------------------------------------------------------------- |
| **Project list** (`/admin/projects`)       | `external_jira_project_key` — blue monospace badge in pill area  |
| **Project detail** (`/admin/projects/:id`) | `external_jira_project_key` — blue monospace badge in action bar |

### Portal Pages

| Page                                        | Fields Displayed                                                     |
| ------------------------------------------- | -------------------------------------------------------------------- |
| **Project detail** (`/portal/projects/:id`) | `external_jira_issue_key` — blue monospace badge next to task title  |
| **Support list** (`/portal/support`)        | `external_jsm_issue_key` — blue monospace badge next to ticket title |

All badges use consistent styling: `rounded border border-blue-500/20 bg-blue-500/10 text-[10px] font-mono text-blue-300`. Hidden when the field is null/undefined.

### API Notes

The ticket detail endpoint (`GET /api/v1/tickets/:id`) previously included a join to a non-existent `ticket_assignees` table which caused the query to fail and return "not found" for all tickets. Fixed by removing the invalid join — the `assigned_to` field is a single-column UUID on the `tickets` table, not a separate relationship.

## CORS Configuration

The API CORS middleware requires `credentials: true` for client-side fetch calls with `credentials: "include"`:

```typescript
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
```

Without this, the browser blocks cross-origin credentialed requests (web port 3000 → API port 4000) for methods other than GET, preventing role permission toggles and other mutations from client components.

## Dynamic Rendering

Pages using `getApiClient()` (which calls `cookies()` from `next/headers`) must include `export const dynamic = "force-dynamic"` to prevent Next.js from attempting static generation. During static generation, there is no HTTP request context, so `cookies()` throws and the page renders a "not found" fallback. All admin pages and portal pages that access the API have this flag set.

---

## Organization Switcher

Users with approved memberships in multiple organizations can switch between them directly from the portal header.

**Route:** Portal header (every page via `layout.tsx`)

**UI:** `OrgSwitcher.tsx` — dropdown select in the header showing all orgs the user belongs to. Hidden when the user has only 1 org.

**Cookie:** `mct_active_org` — HttpOnly cookie set by `setActiveOrg()` server action, read by `getActiveOrg()`. Persists for 30 days. When no cookie is set or the org is no longer available, falls back to the first approved membership.

**File:** `lib/org-actions.ts` — exports `setActiveOrg(orgId)` and `getActiveOrg()`.

**Integration:** `lib/auth/membership.ts`'s `getApprovedMembership()` checks the cookie before returning a membership. The portal layout fetches all memberships + orgs and passes them to the switcher.

---

## Admin Projects Page

**Route:** `/admin/projects`

**UI:** Stat cards (Total / Active / Completed) at the top, then the Project Queue list with a "Create Project" button. Clicking the button opens a modal dialog (same pattern as the tickets page) with fields for organization, status, name, description, priority, Jira project key, start/due dates.

**Component:** `AdminProjectsClient.tsx` — client component with modal state, renders project cards and the create modal.

## Sentry Error Tracking

Both the API and Web app have Sentry integration for error tracking.

### API (`@sentry/node`)

- Initialized in `createApp()` via `lib/sentry.ts`
- Captures exceptions in the global `error.ts` middleware
- Requires `SENTRY_DSN` env var (skips init when unset)

### Web (`@sentry/browser`)

- Initialized via page-level `initBrowserSentry()` in `lib/sentry.ts`
- `SentryErrorBoundary.tsx` — class-based error boundary that captures errors and shows a "Something went wrong" UI with reload button
- `captureError(error, context?)` utility for manual error reporting
- Requires `NEXT_PUBLIC_SENTRY_DSN` env var (skips init when unset)
- Uses `@sentry/browser` + `@sentry/react` (NOT `@sentry/nextjs` — avoids build conflicts)

## Shared ESLint Config

All 3 apps extend `packages/config/eslint.js` as a base:

- `apps/api/eslint.config.js`
- `apps/worker/eslint.config.js`
- `apps/web/eslint.config.js`

The shared config adds `no-console: warn` and `@typescript-eslint/no-unused-vars` rules. Each app layers its own rules on top (TS parser, React plugins, etc.).

---

## CSV Export (Tickets / Projects)

Follows the same pattern as the [audit export](#audit-export).

### API Endpoints

| Method | Path                                  | Description                   |
| ------ | ------------------------------------- | ----------------------------- |
| `GET`  | `/api/v1/tickets/export?format=csv`   | Download all tickets as CSV   |
| `GET`  | `/api/v1/tickets/export?format=json`  | Download all tickets as JSON  |
| `GET`  | `/api/v1/projects/export?format=csv`  | Download all projects as CSV  |
| `GET`  | `/api/v1/projects/export?format=json` | Download all projects as JSON |

All accept optional query params: `organization_id`, `status`. CSV limit: 10,000 rows.

### SDK

```typescript
client.tickets.exportData({ format: "csv", organizationId?: string, status?: string }) // Blob
client.projects.exportData({ format: "csv", organizationId?: string, status?: string }) // Blob
```

### Admin UI

"Download CSV" / "Download JSON" buttons appear below the filter/search bars on:

- `/admin/tickets` — in `AdminTicketCenterClient.tsx`
- `/admin/projects` — in `AdminProjectsClient.tsx`

---

## Ticket Comment Editing

### Database

Migration `5302034_ticket_comment_editing.sql` adds:

- `edited_at timestamptz` column on `ticket_comments`
- `ticket_comments_update_own` RLS policy — allows update by comment author if they have `tickets.comment` permission

### API Endpoint

| Method  | Path                                            | Description                      |
| ------- | ----------------------------------------------- | -------------------------------- |
| `PATCH` | `/api/v1/tickets/:ticketId/comments/:commentId` | Edit comment body (5-min window) |

- **5-minute edit window** — throws `403 FORBIDDEN` if comment is older than 5 minutes
- Sets `edited_at` to current timestamp
- Logs `ticket.comment.update` audit event with `previousBody` in metadata

### SDK

```typescript
client.tickets.updateComment(ticketId, commentId, { body }); // TicketComment
```

### Admin UI

On `/admin/tickets/:ticketId`:

- **Edit button** — appears on each comment posted within the last 5 minutes (checked at render time)
- **Inline form** — clicking Edit shows a textarea + Save/Cancel via `?editComment=COMMENT_ID` search param
- **"(edited)" indicator** — shown next to timestamp on edited comments

---

## Activity Timeline

### API

`GET /api/v1/audit` and `GET /api/v1/audit/export` now accept an optional `entity_id` query param, allowing filtering audit events by the specific entity they reference.

### Admin UI

On `/admin/tickets/:ticketId`:

- **"Activity Timeline" panel** — below the Comments section
- Shows audit log events for that ticket with: colored dot, action label, metadata preview, relative timestamp
- Empty state: "No activity recorded."

### Admin Dashboard

On `/admin`:

- **"Recent Audit Activity" panel** — 4th panel in the activity grid (alongside tickets, docs, projects)
- Shows the last 8 audit log entries with action name and relative timestamp
- Links to the full audit log viewer at `/admin/audit`

---

## Migrations

| Migration                            | Description                                                    |
| ------------------------------------ | -------------------------------------------------------------- |
| `5302032_webhook_endpoints.sql`      | `webhook_endpoints` + `webhook_deliveries` tables + RLS        |
| `5302028_seed_permissions.sql`       | Added `webhooks.view`, `webhooks.manage` permissions (updated) |
| `5302034_ticket_comment_editing.sql` | `edited_at` column + UPDATE RLS on `ticket_comments`           |
