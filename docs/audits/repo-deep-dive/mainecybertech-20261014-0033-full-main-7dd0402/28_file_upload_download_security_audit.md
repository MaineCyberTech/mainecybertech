# 28_file_upload_download_security_audit — Prompt 28 - File Upload and Download Security Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `28_file_upload_download_security_audit.md` (area FILE, prompt)

## Verification Performed

Read-only re-verification at `7dd0402`; no live Storage/bucket probing. 17 of 19 previous FILE rows verified fixed, 2 partially fixed, 0 regressed, 0 new. Executed: `bash scripts/exercise-storage-restore.sh` → PASS (6 checks). Key code: `routes/{documents,file-requests}.ts`, `lib/{upload-validation,preview-policy,malware-scan,csv,document-visibility}.ts`, `worker/tasks/orphan-cleanup.ts`; migrations 5302433/5302439. Residuals: malware scanning is an opt-in fail-closed hook (default no-op) and the documents bucket has no MIME allow-list (FILE-P2-003); `docs/ORG_BRANDING.md:65` and `docs/ARCHITECTURAL_ANALYSIS.md:274` still state stale types/sizes (FILE-P3-003).

## Findings

| ID | Severity | Title |
|---|---|---|
| FILE-P1-001 | P1 | Public file-request upload is permission-gated and unreachable for anonymous uploaders |
| FILE-P1-002 | P1 | File-request uploads have no tenant-scoped path and no download path; orphan cleanup will delete them |
| FILE-P1-003 | P1 | Document version history objects are deleted at replace and by orphan cleanup |
| FILE-P2-001 | P2 | `avatars` bucket is used by code but declared nowhere with no storage RLS policy |
| FILE-P2-002 | P2 | Free-form `storageBucket`/`storagePath` on create/update allows signing arbitrary in-bucket objects |
| FILE-P2-003 | P2 | No content/AV scanning and no bucket-level MIME/size limits on the documents bucket |
| FILE-P2-004 | P2 | No backup or restore path for uploaded objects (durability for files) |
| FILE-P2-005 | P2 | Content sniffing does not cover Office, archive, text/JSON, or polyglot payloads |
| FILE-P2-006 | P2 | CSV exports do not neutralize formula injection and default to all rows when `organization_id` is omitted |
| FILE-P2-007 | P2 | Document download authorization bypasses the `can_read_document` visibility model |
| FILE-P2-008 | P2 | Members with `documents:create` can write objects straight to the documents bucket, bypassing upload validation |
| FILE-P3-001 | P3 | Share endpoint has no per-token rate limit |
| FILE-P3-002 | P3 | Client logo accept list still advertises SVG that the server rejects |
| FILE-P3-003 | P3 | Documentation drift on file types and size limits; no documents/upload runbook |
| FILE-P3-004 | P3 | Storage restore path exists but has never been exercised |
| FILE-P3-005 | P3 | Share revocation does not invalidate already-issued signed URLs |
| FILE-P3-006 | P3 | Oversized uploads return 500 instead of a validation error |
| FILE-P3-007 | P3 | File-domain test gaps: no upload-validation unit tests and no file-request download coverage |
| FILE-P3-008 | P3 | Previews render untrusted files inline without sandbox or disposition controls |
