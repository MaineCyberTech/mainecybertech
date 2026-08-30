# File Upload and Download Security Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** FILE
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Overall Risk Score: 25/100 (Low-Medium).** Minor improvements since last run: document GET /:id now requires organization_id parameter preventing cross-org access; DELETE /:id now requires admin. Three findings remain open: no client-side file type validation, no malware scanning, no file size enforcement at upload action. One new finding identified.

## Previous Findings Status

### FILE-P1-001: No Client-Side File Type Validation

**Status:** STILL OPEN
**Previous Evidence:** pps/web/app/(portal)/portal/documents/actions.ts — upload action validates file presence but not file type.
**Current Evidence:** File unchanged. No file type allowlist has been added.
**Risk:** Users can upload any file type, including executables, scripts, or malicious content.
**Recommendation:** Add file type allowlist (PDF, DOCX, XLSX, images) on both client and server.

### FILE-P1-002: No Malware/Virus Scanning

**Status:** STILL OPEN
**Previous Evidence:** No antivirus scanning on uploaded files.
**Current Evidence:** No scanning integration added. Supabase Storage has no scanning integration.
**Risk:** Malicious files can be uploaded and served to other users.
**Recommendation:** Add ClamAV scanning or use a third-party scanning service on upload.

### FILE-P1-003: File Size Limit Not Enforced at Upload Action

**Status:** STILL OPEN
**Previous Evidence:** API has express.json({ limit: "10mb" }) and multer, but server action doesn't validate file size before sending.
**Current Evidence:** No client-side file size validation has been added.
**Risk:** Large files can cause memory exhaustion or timeout.
**Recommendation:** Add 50MB client-side and server-side size validation.

### FILE-P2-001: Share Link Token Not Rate-Limited

**Status:** STILL OPEN
**Previous Evidence:** GET /documents/shares/:token is a public endpoint with no rate limiting.
**Current Evidence:** No rate limiting added to share access endpoint.
**Risk:** An attacker with a valid token could enumerate or rapidly consume it.
**Recommendation:** Add rate limiting to the public share access endpoint.

### FILE-P2-002: No Signed URL Expiry on Document Download

**Status:** STILL OPEN
**Previous Evidence:** Document download URLs may not have enforced expiry times.
**Current Evidence:** No expiry enforcement has been added.
**Recommendation:** Ensure all direct download URLs have short expiry (e.g., 1 hour).

## New Findings

### FILE-NEW-001: Document GET /:id Now Requires Organization ID (Mitigated)

**Severity:** RESOLVED
**Evidence:** pps/api/src/routes/documents.ts:99-114 — GET /:id now requires organization_id query parameter and filters by it. This prevents cross-org document enumeration.
**Status:** Fix verified in commit dfb5ef8.

### FILE-NEW-002: Document DELETE Now Requires Admin

**Severity:** RESOLVED
**Evidence:** pps/api/src/routes/documents.ts:354 — DELETE /:id now requires
equireAdmin middleware.
**Status:** Fix verified in commit dfb5ef8.

## Quick Wins (Still Applicable)

1. Add file type allowlist to upload action — 1 hour
2. Add file size validation to upload action — 30 min
3. Add rate limiting to share token endpoint — 1 hour
4. Add signed URL expiry enforcement — 30 min

## Summary

| Finding                                          | Previous Status | Current Status |
| ------------------------------------------------ | --------------- | -------------- |
| FILE-P1-001: No client-side file type validation | OPEN            | STILL OPEN     |
| FILE-P1-002: No malware scanning                 | OPEN            | STILL OPEN     |
| FILE-P1-003: File size limit not enforced        | OPEN            | STILL OPEN     |
| FILE-P2-001: Share link token not rate-limited   | OPEN            | STILL OPEN     |
| FILE-P2-002: No signed URL expiry                | OPEN            | STILL OPEN     |
| FILE-NEW-001: GET /:id org verification          | —               | RESOLVED       |
| FILE-NEW-002: DELETE requires admin              | —               | RESOLVED       |
