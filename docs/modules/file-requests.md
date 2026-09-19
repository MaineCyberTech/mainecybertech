# File Requests

**Category:** Client
**API Routes:** `apps/api/src/routes/file-requests.ts`
**SDK:** `packages/sdk/src/file-requests.ts`

## Overview
Secure file request portal for creating token-based upload links that allow external parties to securely upload files without authentication.

## Key Features
- Token-based public upload links (no authentication required)
- Configurable file size limits and allowed MIME types
- Maximum file count enforcement per request
- Expiration date with automatic deactivation
- Upload count tracking and limit enforcement
- Status management (active, full, expired, closed)
- Activity/upload log per request

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/file-requests | List file requests (paginated, filterable by status) |
| GET | /api/v1/file-requests/public/:token | Get public request info (no auth) |
| GET | /api/v1/file-requests/:id | Get request by ID (with uploads) |
| POST | /api/v1/file-requests | Create a new file request |
| PATCH | /api/v1/file-requests/:id | Update file request |
| DELETE | /api/v1/file-requests/:id | Delete a file request |

## Data Model
Key fields: `title`, `description`, `token`, `storage_path`, `max_file_size_mb`, `allowed_mime_types`, `max_files`, `expires_at`, `upload_count`, `status`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD
- Client: full CRUD (portal, own org requests)
- Public: read-only via token (view request details, upload files)
