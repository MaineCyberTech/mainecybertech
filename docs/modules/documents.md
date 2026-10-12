# Documents

**Category:** Core
**API Routes:** `apps/api/src/routes/documents.ts`
**SDK:** `packages/sdk/src/documents.ts`

## Overview

Document management system handling file uploads, version history, signed share links, and bulk operations. Backed by Supabase Storage for file persistence with optimistic locking on concurrent edits.

## Key Features

- Full CRUD with file upload/download via Supabase Storage
- Automatic version tracking on each upload
- Signed/expiring URLs for external sharing
- Share link generation with configurable expiry
- Optimistic locking on updates (version field)
- Bulk operations (delete, move)
- Grid, list, and table view support

## Endpoints

| Method | Path                                  | Description                                        |
| ------ | ------------------------------------- | -------------------------------------------------- |
| GET    | /api/v1/documents                     | List documents (paginated, filterable by org/type) |
| POST   | /api/v1/documents                     | Upload a document                                  |
| GET    | /api/v1/documents/:id                 | Get document by ID                                 |
| PATCH  | /api/v1/documents/:id                 | Update document (optimistic locking)               |
| DELETE | /api/v1/documents/:id                 | Delete document                                    |
| POST   | /api/v1/documents/:id/upload          | Upload new version                                 |
| GET    | /api/v1/documents/:id/download        | Download document file                             |
| GET    | /api/v1/documents/:id/versions        | List version history                               |
| GET    | /api/v1/documents/versions/:versionId | Get specific version                               |
| POST   | /api/v1/documents/:id/share           | Generate signed share link                         |
| DELETE | /api/v1/documents/shares/:shareId     | Revoke share link                                  |
| POST   | /api/v1/documents/bulk                | Bulk delete or move documents                      |

## Data Model

Key tables: `documents` (metadata + version counter), `document_versions` (per-upload records), `document_shares` (signed link tokens + expiry)

## Access Control

- Admin: full CRUD + share link management + bulk operations
- Client: read-only + upload to own org documents (portal)

## Share links and revocation (FILE-P3-005)

`GET /api/v1/documents/shares/:token` (public, token-only) validates the share
row (not revoked, not expired, under `max_access`), then mints a signed Storage
URL. That URL's lifetime is **5 minutes** (`SHARE_SIGNED_URL_TTL_SECONDS` in
`apps/api/src/routes/documents.ts`) and it is always served with a download
disposition. Signed Storage URLs cannot be revoked once issued, so revoking or
deleting a share bounds the residual exposure of an already-issued URL to the
5-minute window (previously 60 minutes); `max_access` is still enforced
atomically at mint time.

## Download disposition (FILE-P3-008)

Authenticated signed-URL endpoints inspect the document's MIME type/extension
(`apps/api/src/lib/preview-policy.ts`): previewable types (images except SVG,
PDF, video, audio, text) are signed inline for the portal preview; every other
type is signed with `Content-Disposition: attachment` so it cannot render from
the storage origin. The web preview additionally sandboxes its PDF/text iframes
and never treats SVG as a previewable image.
