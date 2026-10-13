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

## Upload Security Controls

### Content sniffing (FILE-P2-005)

Every document and file-request upload passes through
`apps/api/src/lib/upload-validation.ts` before storage. Declared MIME and
filename extension are untrusted:

- Markup/script content (`<!doctype`, `<html`, `<svg`, `<?xml` at the start;
  `<script`, `<svg`, `<html`, `<!doctype` anywhere) is rejected for every
  type, scanned across the whole buffer — leading padding cannot push it past
  the old 512-byte head check.
- The detected container must match the declared MIME: images (JPEG/PNG/GIF/
  WebP magic bytes), PDF (`%PDF-`), Office (`docx`/`xlsx`/`pptx` OOXML zip
  packages, `doc`/`xls`/`ppt` OLE2 compound files), archives (zip/gzip/7z/rar/
  tar), RTF, JSON and plain text.
- A known filename extension that disagrees with the detected container is a
  polyglot mismatch and is rejected (`VALIDATION` 400), e.g. a zip renamed
  `.pdf`.

### Malware scanning (FILE-P2-003, optional)

The API ships a pluggable scan hook (`apps/api/src/lib/malware-scan.ts`) that
is a **no-op unless `MALWARE_SCANNER_URL` is set**. When set, uploads are
POSTed to it as `multipart/form-data` (field `file`) before the object is
written to storage; infected content is rejected (400) and an unreachable or
malformed scanner fails closed (503).

Operator setup:

1. Run a scanner reachable from the API container. For ClamAV, deploy a
   `clamav-rest` sidecar (e.g. `cws/clamav-rest`) on the compose network and
   set `MALWARE_SCANNER_URL=http://clamav-rest:8080/scan`. For VirusTotal,
   run an internal proxy that submits to the VirusTotal API and maps the
   analysis stats to `{"clean": true|false}` — never expose the API key.
2. Set `MALWARE_SCANNER_URL` (and `MALWARE_SCANNER_API_KEY` when the scanner
   needs an `x-apikey` header) as a GitHub secret so `deploy-do.yml` writes it
   to the droplet `.env`; the compose file passes both through to the API.
3. Verify: upload an EICAR test string through a document upload — expect
   `400` and no object in the `documents` bucket; upload a normal file —
   expect success.

### Bucket-level limits (FILE-P2-003)

`storage.buckets.file_size_limit` is set on the `documents` bucket (25 MiB,
matching the file-request multer cap) and authenticated INSERT/UPDATE policies
were removed (FILE-P2-008), so object writes must flow through the API where
sniffing and scanning run.

`allowed_mime_types` is **deliberately not set**: the storage API enforces it
on service-role writes too, and `scripts/restore-storage.sh` re-uploads
archived objects without their original `Content-Type`, so an allow-list would
break disaster-recovery restores until the backup/restore scripts preserve
MIME metadata. The tradeoff is accepted because direct-to-storage writes are
closed and the API enforces the MIME allow-list plus the content checks above.
If an allow-list is added later, update `scripts/backup-storage.sh` /
`scripts/restore-storage.sh` to capture and replay `Content-Type` first, and
backfill old archives.

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
