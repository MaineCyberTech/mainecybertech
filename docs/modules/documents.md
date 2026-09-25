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
