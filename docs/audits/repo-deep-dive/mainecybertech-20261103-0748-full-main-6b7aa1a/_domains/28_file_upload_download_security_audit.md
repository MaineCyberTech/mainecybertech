# File Upload, Download and Storage Security — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: FILE
- Scope limitations: read-only static review; no live Storage/bucket probing. The storage-restore exercise script was executed against local fixtures.

## Scope

Re-verified all 19 previous FILE findings at `6b7aa1a`: upload validation, file-request public flow, document/version storage, signed URLs, bucket policies, preview disposition, CSV exports, malware hook, retention/orphan cleanup, backup/restore and the file-domain tests. New client-visibility changes to file-request reads were reviewed; the side-channel gap is tracked under `SEC-P2-019`.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `bash scripts/exercise-storage-restore.sh` | Executed | PASS — 6 checks (valid/no-manifest/count-mismatch/empty/encrypted-no-key/encrypted-with-key) |
| `apps/api/src/routes/{documents,file-requests}.ts` | Read | Upload, signed URL, share and file-request flows |
| `apps/api/src/lib/{upload-validation,preview-policy,malware-scan,csv,document-visibility}.ts` | Read | Byte-sniffing, disposition, scanning hook, CSV guard, read model |
| `apps/worker/src/tasks/orphan-cleanup.ts` | Read | Reference union (documents/versions/file-request uploads) |
| `supabase/migrations/{5302433,5302439}` | Read | Avatars bucket policies; documents bucket write hardening |
| `docs/ORG_BRANDING.md`, `docs/ARCHITECTURAL_ANALYSIS.md`, `docs/runbooks/secure-file-request.md` | Read | Docs match current limits/types |

## Executive Summary

Eighteen of nineteen prior FILE findings are verified fixed; the only remaining partial is the documented content-scanning gap (`FILE-P2-003`): malware scanning is a fail-closed hook that is a no-op unless `MALWARE_SCANNER_URL` is configured, and the documents bucket has a 25 MiB size cap but deliberately no MIME allow-list. The docs drift, avatars bucket, storage-path pinning, version retention, preview disposition, formula-injection guard, share TTL/rate limit, and the storage-restore exercise all remain fixed.

One new P2 was found: the public file-request upload route buffers up to 25 MiB in memory **before** validating the token, and the only throttle is the global per-IP limiter. This is an unauthenticated memory-amplification/DoS path (no valid token required) and is cheap to trigger.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| FILE-P1-001 | P1 | verified-fixed | Public upload permission-gated | Token-only auth `file-requests.ts:114-130` |
| FILE-P1-002 | P1 | verified-fixed | File-request no tenant path/download | Org path `:161`; row `:219`; list/signed `:351-415`; cleanup union |
| FILE-P1-003 | P1 | verified-fixed | Version objects deleted | `documents.ts:449-463`; version URL `:965-1020` |
| FILE-P2-001 | P2 | verified-fixed | avatars bucket undeclared | `5302433` bucket + owner policies |
| FILE-P2-002 | P2 | verified-fixed | Free-form bucket/path | `validators/document.ts:27-32`; org equality `:284-287,549-556` |
| FILE-P2-003 | P2 | partially-fixed | No AV / no bucket MIME list | `malware-scan.ts:51-54` no-op; `5302439` size only |
| FILE-P2-004 | P2 | verified-fixed | No object backup/restore | Scripts + workflows; exercise PASS |
| FILE-P2-005 | P2 | verified-fixed | Sniffing gaps | `upload-validation.ts:10-18,89-148,165-200` |
| FILE-P2-006 | P2 | verified-fixed | CSV formula/all-rows | `lib/csv.ts:9-25`; shared helper |
| FILE-P2-007 | P2 | verified-fixed | Download bypasses visibility | `canReadDocumentById` `documents.ts:661-663,972-983` |
| FILE-P2-008 | P2 | verified-fixed | Direct bucket writes | `5302439` drops authenticated writes |
| FILE-P3-001 | P3 | verified-fixed | Share endpoint no rate limit | `rateLimitShare` `documents.ts:13,162` |
| FILE-P3-002 | P3 | verified-fixed | Logo accept list advertises SVG | Accept list matches server |
| FILE-P3-003 | P3 | verified-fixed | Docs drift | `ORG_BRANDING.md:24-25,65`; `ARCHITECTURAL_ANALYSIS.md:274` |
| FILE-P3-004 | P3 | verified-fixed | Restore never exercised | Exercise PASS (6 checks) |
| FILE-P3-005 | P3 | verified-fixed | Revoked share URL still valid | 300s TTL + `{download:true}` |
| FILE-P3-006 | P3 | verified-fixed | Oversized upload 500 | `error.ts:36-39` -> 413 |
| FILE-P3-007 | P3 | verified-fixed | File test gaps | `upload-validation.test.ts`, `file-requests.test.ts` |
| FILE-P3-008 | P3 | verified-fixed | Inline untrusted previews | `preview-policy.ts:17-25,55-80`; sandboxed iframes |
| FILE-P2-009 | P2 | open (new) | 25MB buffered before token check | `file-requests.ts:63-78,114-145`; global limiter only |

Counts: 18 verified-fixed, 1 partially-fixed, 0 regressed, 1 new/open.

## New finding detail

### FILE-P2-009 — Unauthenticated 25 MB buffering before token validation

- Evidence: `apps/api/src/routes/file-requests.ts:63-78` (`multer.memoryStorage()`, `limits.fileSize = 25 * 1024 * 1024`), `:114-122` (multer mounted before the handler), `:122-158` (token/status/expiry/size/MIME checks happen after the file is fully buffered), `apps/api/src/app.ts:118-131` (only global per-IP throttle: 300 requests / 15 min; no upload/token limiter).
- Attack: send `POST /api/v1/file-requests/public/<anything>/upload` with an allowed MIME/extension and a 25 MiB body. The token is never consulted until multer has buffered the bytes. 300 requests per IP per window is 7.5 GiB; a modest number of concurrent requests exhausts the API heap. No valid token is required.
- User/business impact: API/worker outage for all tenants from an unauthenticated caller; restart loop or OOM kill.
- Fix: add a lightweight middleware before multer that loads the request row and rejects missing/expired/closed/full tokens; add a per-token and per-IP upload limiter (e.g. 5/min/token, 20/min/IP); stream to Storage or lower the buffer cap; keep the 25 MiB business limit only after the token is known.
- Validation: concurrency test with 20 parallel 25 MiB bodies and an invalid token -> expect 4xx before buffering/at a low memory ceiling; valid token -> upload succeeds within the per-token budget.
- Cross-reference: `SEC-P2-019` covers the sibling visibility gap on `GET /:id/uploads` and the signed-URL route; this finding is the unauthenticated availability path.

## Residual detail

### FILE-P2-003 — Content scanning / bucket MIME allow-list

`apps/api/src/lib/malware-scan.ts:51-54` returns immediately when `MALWARE_SCANNER_URL` is unset, so in the default deployment only byte-sniffing runs. `5302439_documents_bucket_write_hardening.sql:31-33` sets `file_size_limit = 25 MiB` but leaves `allowed_mime_types` unset because the restore path re-uploads archived objects without their original Content-Type. The API validates MIME/extensions, but a service-role/restore writer can bypass it. Recommendation: make the scanner a deploy prerequisite (or fail startup in production when unset), and have restore preserve Content-Type metadata so the bucket allow-list can be enabled.

## Recommendations

1. **FILE-P2-009** — validate the token before multer, add per-token/IP upload limits, and stream rather than buffer.
2. **FILE-P2-003** — require `MALWARE_SCANNER_URL` in production (startup check) and preserve MIME on restore so `allowed_mime_types` can be set.
3. **SEC-P2-019** — apply the parent file-request visibility check to the nested upload list and signed-URL routes.
4. Keep the storage-restore exercise in the required workflow and add a real bucket drill to the ledger.

## Suggested tests

- Invalid token + 25 MiB body -> 4xx before the body is buffered; memory stays bounded.
- 6 uploads/minute with one valid token -> 429; 21/minute from one IP -> 429.
- MIME allow-list: a service-role upload of `text/html` into `documents` is rejected once `allowed_mime_types` is set.
- Cross-tenant: client A requests `GET /file-requests/:id/uploads` for an internal org-B request -> 404.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will a malware scanner be deployed in production? | The default is a no-op | `MALWARE_SCANNER_URL` environment value / deploy manifest |
| Can the restore path preserve Content-Type? | Blocks enabling the bucket MIME allow-list | Storage backup manifest schema |
| What is the per-token upload budget? | Sets the limiter thresholds | Product/ops decision |
