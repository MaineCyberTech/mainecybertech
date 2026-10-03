# Secure File Request

## Purpose

Tokenized, time-limited secure upload links that let external parties (clients, vendors, candidates) upload files to an organization's document storage without needing an account. Requests enforce size, count, and MIME-type limits, can be revoked, and can notify the request creator on upload.

Primary users: MSP operations, client admin, external uploaders (unauthenticated)

Business impact: High

Category: operations

## Permissions

| Action                   | Roles                            |
| ------------------------ | -------------------------------- |
| List file requests       | All authenticated org members    |
| View file request        | All authenticated org members    |
| Create file request      | All authenticated org members    |
| Update / revoke request  | All authenticated org members    |
| Delete file request      | admin, super_admin               |
| View public request      | Anyone with valid token (unauth) |
| Upload to public request | Anyone with valid token (unauth) |

## Routes

### Portal Routes

| Route                       | Description                               |
| --------------------------- | ----------------------------------------- |
| `GET /portal/file-requests` | List secure file requests for current org |

### Public Routes

| Route                 | Description                |
| --------------------- | -------------------------- |
| `GET /upload/[token]` | Public upload landing page |

### Admin Routes

| Route                           | Description                                |
| ------------------------------- | ------------------------------------------ |
| `GET /admin/file-requests`      | Secure File Request Portal list page       |
| `GET /admin/file-requests/[id]` | Request detail (copy link, revoke, status) |

### API Routes

| Method | Endpoint                                     | Description                                |
| ------ | -------------------------------------------- | ------------------------------------------ |
| GET    | `/api/v1/file-requests`                      | List requests (filter by status)           |
| GET    | `/api/v1/file-requests/:id`                  | Get a single request                       |
| POST   | `/api/v1/file-requests`                      | Create request with token + expiry         |
| PATCH  | `/api/v1/file-requests/:id`                  | Update title/description/status/visibility |
| DELETE | `/api/v1/file-requests/:id`                  | Delete request                             |
| GET    | `/api/v1/file-requests/public/:token`        | Public request metadata (unauth)           |
| POST   | `/api/v1/file-requests/public/:token/upload` | Public file upload (unauth, multer)        |

## Data Model

### file_requests

| Column             | Type        | Constraints                      | Description                 |
| ------------------ | ----------- | -------------------------------- | --------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier           |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping              |
| title              | text        | NOT NULL                         | Display title               |
| description        | text        |                                  | Purpose of the request      |
| token              | text        | NOT NULL, UNIQUE                 | Opaque share token          |
| storage_path       | text        | NOT NULL                         | Storage bucket prefix       |
| max_file_size_mb   | integer     | default 50                       | Per-file size cap           |
| allowed_mime_types | text[]      |                                  | Restrictive MIME allow-list |
| max_files          | integer     | default 1                        | Upload count cap            |
| expires_at         | timestamptz | NOT NULL                         | Link expiry                 |
| upload_count       | integer     | NOT NULL, default 0              | Files uploaded so far       |
| completed_at       | timestamptz |                                  | When the request completed  |
| status             | text        | NOT NULL, default 'active'       | active / revoked            |
| visibility         | text        | NOT NULL, default 'internal'     | internal / public           |
| notify_on_upload   | boolean     | default true                     | Send notification on upload |
| created_by         | uuid        | FK → auth.users(id)              | Request creator             |
| metadata           | jsonb       | NOT NULL, default '{}'           | Extra context               |
| created_at         | timestamptz | NOT NULL, default now()          | Creation timestamp          |
| updated_at         | timestamptz | NOT NULL, default now()          | Last update timestamp       |

## Workflows

### Create a Request

1. User creates a request with title, expiry (days), size cap, file count, MIME allow-list, and notify preference
2. API generates a random 64-char hex token and stores `uploads/requests/{token}` as the storage path
3. The share link is `/upload/{token}` (web) backed by `GET /api/v1/file-requests/public/:token`
4. Audits with `file_request.created`

### Public Upload

1. Uploader opens the share link — metadata is fetched unauthenticated
2. `POST /api/v1/file-requests/public/:token/upload` validates: status active, not expired, under `max_files`, file size ≤ `max_file_size_mb`, MIME in allow-list, extension not blocked
3. File is stored in the `documents` bucket; `upload_count` increments
4. If `notify_on_upload`, the creator receives an in-app notification
5. Audits with `file_request.uploaded`

### Revoke / Delete

- `PATCH` with `status: "revoked"` invalidates the public link (410 on subsequent access)
- `DELETE` removes the request entirely (admin/super_admin only)

## Troubleshooting

| Issue                               | Resolution                                            |
| ----------------------------------- | ----------------------------------------------------- |
| Upload link returns 410             | Request revoked, expired, or over `max_files`         |
| File rejected                       | Check blocked extension list and `allowed_mime_types` |
| Public page shows "unavailable"     | Token invalid or API unreachable from public host     |
| Upload succeeds but no notification | Verify `notify_on_upload` and notification delivery   |

## Release Checklist

- [ ] Migration `5302064_file_requests.sql` applied
- [ ] API routes registered at `/api/v1/file-requests` in `apps/api/src/app.ts`
- [ ] SDK module `fileRequests` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/file-requests/`
- [ ] Public page at `apps/web/app/(public)/upload/[token]/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/file-requests.spec.ts`
- [ ] Feature doc added to `docs/features/secure-file-request.md`
- [ ] Runbook added to `docs/runbooks/secure-file-request.md`
