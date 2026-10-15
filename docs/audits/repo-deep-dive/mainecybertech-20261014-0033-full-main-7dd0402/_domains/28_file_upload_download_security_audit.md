# File Upload / Download Security — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261011-0426-full-main-8d299b8`)
- Area code: FILE
- Scope limitations: static verification; no live Supabase Storage or bucket probing. `scripts/exercise-storage-restore.sh` was executed locally (pass).

## Scope

Re-verified all 19 previous FILE findings at `7dd0402` — documents, file requests, avatars/logos, share links, upload validation, CSV exports, previews, storage backup/restore, and the related tests/docs.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `bash scripts/exercise-storage-restore.sh` | Executed | PASS — 6 checks (valid, no-manifest, count-mismatch, empty, encrypted-no-key, encrypted-with-key) |
| `apps/api/src/routes/{documents,file-requests,profiles,organizations}.ts` | Read | Path construction, authz, version retention |
| `apps/api/src/lib/{upload-validation,preview-policy,malware-scan,csv,document-visibility}.ts` | Read | Content gates, disposition, exports |
| `supabase/migrations/5302433/5302439` | Read | Bucket declarations, write hardening |
| `apps/worker/src/tasks/orphan-cleanup.ts` | Read | Reconciliation with version + upload rows |
| `docs/runbooks/secure-file-request.md`, `docs/ORG_BRANDING.md`, `docs/ARCHITECTURAL_ANALYSIS.md` | Read | Doc drift check |

## Executive Summary

17 of 19 previous findings are verified fixed, including every P1 and six of eight P2s: anonymous file-request uploads are token-authorized with org-prefixed paths and a download path; version objects are retained and reconciled by orphan cleanup; the avatars bucket exists with owner-scoped policies; bucket/path fields are constrained; downloads enforce the visibility model; CSV exports are formula-guarded; and direct authenticated bucket writes are removed. Two partials remain, both documented residuals: no AV scanning or bucket-level MIME allow-list by default (pluggable, fail-closed hook only), and documentation drift (ORG_BRANDING/ARCHITECTURAL_ANALYSIS still advertise SVG/5MB and 50MB bucket limits). No new file-domain findings were justified.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| FILE-P1-001 | P1 | verified-fixed | Public file-request upload permission-gated/unreachable | Token-only auth at `file-requests.ts:114-130` |
| FILE-P1-002 | P1 | verified-fixed | No tenant path/download; cleanup would delete | Org-prefixed path `:160`, uploads row `:218`, org-scoped endpoints `:343-390`, cleanup reconciliation `orphan-cleanup.ts:169-190` |
| FILE-P1-003 | P1 | verified-fixed | Version objects deleted at replace / cleanup | Replace keeps the prior object (retention comment ~`:451`); version signed URL `:961-1020`; cleanup unions `document_versions` |
| FILE-P2-001 | P2 | verified-fixed | `avatars` bucket undeclared | `5302433` bucket + owner-prefix policies |
| FILE-P2-002 | P2 | verified-fixed | Free-form bucket/path signing | `z.literal("documents")` + regex + org-prefix equality (`documents.ts:284-287,549-556`) |
| FILE-P2-003 | P2 | partially-fixed | No AV scanning / bucket MIME-size limits | Fail-closed hook when `MALWARE_SCANNER_URL` set, but default no-op; `allowed_mime_types` deliberately unset (`5302439`); size limit set |
| FILE-P2-004 | P2 | verified-fixed | No backup/restore for uploads | Backup/restore scripts + workflows; exercise wired (`validate.yml:74`); live drill still pending |
| FILE-P2-005 | P2 | verified-fixed | Sniffing misses Office/archive/text/polyglots | `upload-validation.ts:10-18,89-148,165-200` |
| FILE-P2-006 | P2 | verified-fixed | CSV formula injection / all-rows default | `lib/csv.ts:9-25` + org-scoped export surfaces |
| FILE-P2-007 | P2 | verified-fixed | Download bypasses `can_read_document` | `documents.ts:661-663` and `:972-983` |
| FILE-P2-008 | P2 | verified-fixed | Direct bucket writes bypass validation | `5302439` drops authenticated INSERT/UPDATE; service-role API writes |
| FILE-P3-001 | P3 | verified-fixed | Share endpoint no per-token rate limit | `rateLimitShare` on `GET /shares/:token` |
| FILE-P3-002 | P3 | verified-fixed | Logo accept list advertises SVG | Client accept list matches server; test asserts |
| FILE-P3-003 | P3 | partially-fixed | Doc drift on file types/sizes | Runbook accurate, but `ORG_BRANDING.md:65` (SVG/5MB) and `ARCHITECTURAL_ANALYSIS.md:274` (documents 50MB/avatars 2MB) are stale |
| FILE-P3-004 | P3 | verified-fixed | Storage restore never exercised | Exercise script executed PASS; CI-wired |
| FILE-P3-005 | P3 | verified-fixed | Share revocation vs signed URLs | TTL 300s + `download: true` (`documents.ts:157-191`) |
| FILE-P3-006 | P3 | verified-fixed | Oversized uploads 500 | `error.ts:36-39` → 413 |
| FILE-P3-007 | P3 | verified-fixed | File-domain test gaps | `upload-validation.test.ts`, `file-requests.test.ts` present |
| FILE-P3-008 | P3 | verified-fixed | Previews render untrusted files inline | `preview-policy.ts` denies SVG/XML/HTML inline; sandboxed iframes |

## Recommendations

1. **Decide on malware scanning (FILE-P2-003)** — provision `MALWARE_SCANNER_URL` (ClamAV sidecar) in dev/prod or record the no-op as an owner-accepted risk; revisit the bucket `allowed_mime_types` once `restore-storage.sh` preserves MIME metadata.
2. **Fix the stale docs (FILE-P3-003)** — update `ORG_BRANDING.md:65` (PNG/JPEG/WebP/GIF, real limit) and `ARCHITECTURAL_ANALYSIS.md:274` (documents 25MiB bucket / API caps).
3. **Exercise a live storage restore (FILE-P2-004 residual)** — once backup secrets are provisioned, run `storage-restore-test` and record the run in the drill ledger.

## Suggested tests

- Storage policy test: authenticated INSERT into the `documents` bucket is denied (regression for FILE-P2-008).
- Download/visibility: a private document's bytes are not reachable via another document's id (already covered) and a share token never returns inline markup (SVG/HTML) — extend `documents.test.ts`.
- Docs guard: a test that the sizes/types stated in `ORG_BRANDING.md` match the server allow-list.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will a malware scanner be provisioned? | AV coverage for public uploads | Operator decision |
| Is the 25MiB bucket limit compatible with the API’s per-purpose caps? | Avoid confusing 413s | API config review |
