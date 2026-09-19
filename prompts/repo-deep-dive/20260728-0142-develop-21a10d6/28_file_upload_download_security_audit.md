# File Upload and Download Security Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** FILE

## Executive Summary

Document upload/download system with Supabase Storage, signed URLs, version history, and share links. Strong access control via `requireOrgAccess` and RLS. Key gaps: no client-side file type validation, no malware scanning, no file size enforcement at upload action level, share link tokens not rate-limited.

## Key Findings

### FILE-P1-001: No Client-Side File Type Validation

**Evidence:** `apps/web/app/(portal)/portal/documents/actions.ts` — upload action validates file presence but not file type. API accepts any MIME type.
**Recommendation:** Add file type allowlist (PDF, DOCX, XLSX, images, etc.) on both client and server.

### FILE-P1-002: No Malware/Virus Scanning

**Evidence:** No antivirus scanning on uploaded files. Supabase Storage has no scanning integration.
**Recommendation:** Add ClamAV scanning or use a third-party scanning service on upload.

### FILE-P1-003: File Size Limit Not Enforced at Upload Action

**Evidence:** API has `express.json({ limit: "10mb" })` and multer config, but the server action in `actions.ts` doesn't validate file size before sending.
**Recommendation:** Add 50MB client-side and server-side size validation.

### FILE-P2-001: Share Link Token Not Rate-Limited

**Evidence:** `GET /documents/shares/:token` is a public endpoint with no rate limiting. An attacker with a valid token could enumerate or rapidly consume it.
**Recommendation:** Add rate limiting to the public share access endpoint.

### FILE-P2-002: No Signed URL Expiry on Document Download

**Evidence:** Document download URLs may not have enforced expiry times.
**Recommendation:** Ensure all direct download URLs have short expiry (e.g., 1 hour).

## Quick Wins

1. Add file type allowlist to upload action — 1 hour
2. Add file size validation to upload action — 30 min
3. Add rate limiting to share token endpoint — 1 hour
