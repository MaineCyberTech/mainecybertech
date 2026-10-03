# Prompt 28 — File Upload and Download Security Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Upload Components
- **Backend (API):** `documents.ts:158-295` — `POST /upload` with `multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })`
  - Accepts `multipart/form-data` with `file` field
  - 100MB file size limit (app-level)
  - Sanitizes filename: `originalname.replace(/[^a-zA-Z0-9._-]/g, "-")`
  - Storage path: `orgs/{organizationId}/{timestamp}-{sanitizedFilename}`
  - Upsert to Supabase Storage bucket
  - Creates `documents` table record + `document_versions` record
  - Version support: replaces existing file on re-upload (clears old storage path)
- **Avatar upload:** `profiles.ts:141-188` — `POST /:id/avatar` with `multer`
  - 2MB file size limit
  - MIME type whitelist: JPEG, PNG, WebP, GIF
  - Upsert to `avatars` storage bucket (public)
  - Returns public URL
- **Frontend:** `apps/web/components/DocumentPreview.tsx` — inline image/PDF/video/audio/text preview
- **Bulk:** `POST /api/v1/bulk/invite` — CSV upload for user invitations (CSV parsing, not file storage)

### Download Endpoints
- Signed URL generation: `POST /api/v1/documents/:id/signed-url` — `documents.ts:387-411`
  - 1-hour TTL via `supabase.storage.createSignedUrl(doc.storage_path, 3600)`
  - Checks document existence before generating URL
- Public share: `GET /api/v1/documents/shares/:token` — `documents.ts:735-783`
  - No auth required (public endpoint)
  - Checks: revoked_at, expires_at, max_access/access_count
  - Increments access_count on each access
  - Generates fresh signed URL (1h TTL)

### Storage Buckets
- **documents:** Private bucket — RLS-gated via storage.object policies
  - SELECT: `can_read_document(d.id)` check
  - INSERT: org membership + permission check (`documents.upload` or `documents.manage`)
  - UPDATE/DELETE: `documents.manage` permission or super_admin
- **avatars:** Public bucket — no RLS on storage.objects (public reads)
  - Upload via user-context Supabase client (JWT in header)

### Signed URLs
- 1-hour TTL (fixed, not configurable)
- Generated via `supabase.storage.createSignedUrl()`
- Downloaded via browser redirect or direct fetch
- No download count tracking on signed URLs (only on share links)

### Metadata
- `documents` table: name, description, folder_path, storage_bucket, storage_path, mime_type, visibility, current_version, metadata (JSONB)
- `document_versions` table: version_number, storage_path, uploaded_by, checksum, created_at
- `document_shares` table: token, expires_at, max_access, access_count, revoked_at

### MIME/Extension/Size Validation
- **Upload:** No MIME type validation on general document upload (accepts all types)
- **Avatar upload:** Whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Size limit:** 100MB for documents, 2MB for avatars (multer-level, not Supabase bucket-level)
- **Supabase bucket limits:** documents = 50MB (documents bucket), avatars = 2MB (avatars bucket) — mismatch with multer 100MB

### Content Scanning
- No content scanning hooks (no virus scanning, no malware detection)
- No EXIF stripping for images
- No SVG/script injection scanning

### Exports
- Audit export: `GET /api/v1/audit/export` — CSV/JSON with 10,000 row limit
- Ticket export: `GET /api/v1/tickets/export` — CSV/JSON
- Project export: `GET /api/v1/projects/export` — CSV/JSON
- Shared CSV helper at `lib/csv.ts`

### Tenant Scoping
- Document upload requires `organization_id` in body
- Document read requires org membership via `requireOrgAccess` middleware
- Document shares scoped to `document.organization_id`
- Storage bucket policies check org membership via `storage_path_org_id()` helper

### Revocation
- Document shares can be revoked (`revoked_at` field)
- No file-level revocation — once a signed URL is issued, it's valid for 1h regardless
- Storage-level revocation would require bucket policy update

### Versioning
- `documents.current_version` increments on each upload
- `document_versions` stores version history
- Previous storage path is deleted on version replacement
- `GET /:id/versions` and `GET /:id/versions/:versionId` for version history

### Audit Logs
- Document create/update/delete/bulk-folder/bulk-metadata/share-create/share-update/share-delete all logged to `audit_logs`
- Upload endpoint logs `document.create` or `document.update` with metadata

### CDN/Cache
- No explicit CDN configuration beyond Cloudflare proxy (edge caching)
- Supabase Storage serves files directly (no CDN layer configured)

### Tests
- Document route tests at `apps/api/src/__tests__/`
- Document preview component tests at `apps/web/__tests__/`
- No signed URL / share link security tests

---

## File Surface Inventory

| Feature | Endpoint | Auth | Validation | Storage | Audit |
|---|---|---|---|---|---|
| Document upload (multipart) | POST /api/v1/documents/upload | requireAuth + requireOrgAccess | Size (100MB), path sanitization | documents bucket (private) | ✅ |
| Document create (JSON) | POST /api/v1/documents | requireAuth + requireOrgAccess | Zod schema | documents bucket (ref only) | ✅ |
| Document list | GET /api/v1/documents | requireAuth + requireOrgAccess | Query params | — | — |
| Document get | GET /api/v1/documents/:id | requireAuth + requireOrgAccess | — | — | — |
| Document update | PATCH /api/v1/documents/:id | requireAuth + requireOrgAccess | Zod + optimistic lock | — | ✅ |
| Document delete | DELETE /api/v1/documents/:id | requireAuth + requireOrgAccess + requireAdmin | — | Storage file removal | ✅ |
| Signed URL | POST /api/v1/documents/:id/signed-url | requireAuth + requireOrgAccess | — | — | — |
| Document versions | GET /api/v1/documents/:id/versions | requireAuth + requireOrgAccess | Query params | — | — |
| Bulk folder | POST /api/v1/documents/bulk/folder | requireAuth + requireOrgAccess | Zod schema | — | ✅ |
| Bulk metadata | POST /api/v1/documents/bulk/metadata | requireAuth + requireOrgAccess | Zod schema | — | ✅ |
| Share create | POST /api/v1/documents/:id/shares | requireAuth + requireOrgAccess | Zod schema | — | ✅ |
| Share access (public) | GET /api/v1/documents/shares/:token | None | Token validation | — | — |
| Avatar upload | POST /api/v1/profiles/:id/avatar | requireAuth | MIME whitelist, 2MB | avatars bucket (public) | ✅ |

---

## Findings

### FILE-P0-001 — No MIME/content-type validation on document upload (P0 Critical)

**Evidence:** `documents.ts:158-295` — The upload endpoint accepts any file type. `file.mimetype` is stored as metadata but never validated against a whitelist. A user can upload executable files (.exe, .sh, .bat), SVG with embedded scripts, or HTML with JavaScript.

**Risk:** Uploaded files are accessible via share links (public) or signed URLs. An attacker could upload a malicious SVG with XSS payload, an HTML file with phishing content, or an executable that gets downloaded and run.

**Recommendation:** Add MIME type whitelist for document uploads (PDF, DOCX, XLSX, PNG, JPG, etc.). Block executable extensions (.exe, .bat, .sh, .ps1, .scr, .vbs) and SVG files. For use cases requiring arbitrary file exchange, create a separate "untrusted" bucket with Content-Disposition: attachment.

---

### FILE-P1-001 — Multer size limit (100MB) exceeds Supabase bucket limit (50MB) (P1 High)

**Evidence:** `documents.ts:58` — `limits: { fileSize: 100 * 1024 * 1024 }` (100MB). Bootstrap migration sets `documents` bucket file size limit to 52428800 bytes (50MB) — storage policy at bootstrap.sql line ~2290.

**Risk:** Users can upload files between 50MB-100MB which pass multer validation but fail at Supabase Storage, resulting in a 500 error after the file is already buffered in memory.

**Recommendation:** Align multer limit with Supabase bucket limit: change to `50 * 1024 * 1024`. Alternatively, increase Supabase bucket limit to 100MB.

---

### FILE-P1-002 — No content scanning / virus detection (P1 High)

**Evidence:** No antivirus scanning before or after upload. No integration with ClamAV, VirusTotal, or any content scanner. Files go directly from multer buffer to Supabase Storage.

**Risk:** Infected files uploaded by compromised accounts can be shared with external parties via share links. No quarantine mechanism.

**Recommendation:** Integrate file scanning (ClamAV via `clamd.js` or VirusTotal API) as a background worker task. Quarantine files that fail scan. Add scanning status field to documents table.

---

### FILE-P1-003 — Signed URLs have fixed 1h TTL with no revocation (P1 High)

**Evidence:** `documents.ts:401` — `createSignedUrl(doc.storage_path, 3600)` — TTL is hardcoded at 3600 seconds (1 hour). Document share links support revocation (`revoked_at` field) but signed URLs generated directly (not via share token) cannot be revoked.

**Risk:** If a user with document access generates a signed URL and shares it externally, there is no way to revoke access for the remaining hour. The signed URL is valid for 60 minutes regardless of permission changes.

**Recommendation:** Reduce default signed URL TTL to 15-30 minutes. Add a `POST /documents/:id/revoke-signed-urls` endpoint that tracks revoked URL sessions (store nonce in DB, check on download). Consider proxying downloads through API instead of direct signed URL redirect.

---

### FILE-P2-001 — Document storage path uses predictable timestamp pattern (P2 Medium)

**Evidence:** `documents.ts:178` — `storagePath = 'orgs/${organizationId}/${Date.now()}-${safeName}'`. The path contains the organization ID and current timestamp, making paths predictable within an org.

**Risk:** If a storage bucket policy is misconfigured, an attacker who knows the org ID and filename can enumerate files by guessing timestamps.

**Recommendation:** Add a UUID or random component to the storage path: `orgs/${organizationId}/${crypto.randomUUID()}-${safeName}`.

---

### FILE-P2-002 — Avatars bucket is public but avatar URLs expose user ID (P2 Medium)

**Evidence:** `profiles.ts:152-153` — Storage path is `${userId}/avatar.${ext}`. `avatars` bucket is public (no RLS for reads per bootstrap line ~2282). Public URL format includes user ID in path.

**Risk:** Anyone who discovers a user's ID can enumerate avatar existence. Public bucket means no access control on avatar images — any authenticated Supabase user can read any avatar.

**Recommendation:** Keep avatars in a private bucket and generate signed URLs for avatar access. Or keep public but use a random hash path instead of userId (e.g., `avatars/${crypto.randomUUID()}/${ext}`).

---

### FILE-P3-001 — No disk cleanup for orphaned storage files (P3 Low)

**Evidence:** When a document record is deleted (`documents.ts:354-385`), the storage file is removed. But if the DB delete succeeds and storage remove fails (line 366 — no error handling on storage remove), the file becomes orphaned.

**Risk:** Gradual accumulation of orphaned storage files over time. No garbage collection mechanism.

**Recommendation:** Add a cron worker task that scans Supabase Storage for files without corresponding DB records. Add error handling to delete endpoint to retry storage removal on failure.

---

## Signed URL Review

| Aspect | Current | Recommendation |
|---|---|---|
| TTL | 1 hour (hardcoded) | Configurable via env var, default 15-30 min |
| Revocation | Not supported | Add nonce-based revocation |
| Rate limiting | None | Add per-IP rate limiting on share endpoint |
| Access tracking | Share token only | Add to signed URL endpoint |
| Path contained | orgId + timestamp | Add random UUID component |

---

## Export Security Review

| Export | Format | Row Limit | Tenant Filter | Auth |
|---|---|---|---|---|
| Audit | CSV/JSON | 10,000 | organization_id | requireAuth + requireOrgAccess |
| Tickets | CSV/JSON | 10,000 | organization_id | requireAuth + requireOrgAccess |
| Projects | CSV/JSON | 10,000 | organization_id | requireAuth + requireOrgAccess |

All exports are properly tenant-scoped and authenticated. Row limits prevent memory exhaustion.

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | No MIME validation on document upload |
| P1 (High) | 3 | Size limit mismatch, no virus scanning, signed URL revocation |
| P2 (Medium) | 2 | Predictable storage paths, public avatar URLs expose user IDs |
| P3 (Low) | 1 | Orphaned storage files |
| **Total** | **7** | |

The file system is well-structured with proper tenant isolation, versioning, audit logging, and signed URL access for share links. The critical gap is the lack of MIME/content-type validation on document uploads, which allows arbitrary file types to be stored and distributed.
