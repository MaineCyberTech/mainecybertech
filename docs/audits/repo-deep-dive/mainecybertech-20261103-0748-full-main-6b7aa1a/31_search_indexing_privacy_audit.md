# 31_search_indexing_privacy_audit — Prompt 31 - Search, Indexing, and Privacy Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `31_search_indexing_privacy_audit.md` (area SEARCH, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5. 14/15 previous SEARCH findings are verified fixed and 1 is partially fixed (SEARCH-P2-004: admin limit/counts landed, portal remains fixed-5 with no counts/offset); 0 regressed, 0 new. SEARCH-P3-004 closed in this diff: portal searches now write a hashed (SHA-256, 16 hex chars) audit event with query length and per-entity result counts, and the new test asserts the raw term never reaches audit_logs. No new search/privacy issues were identified; the remaining portal pagination gap is the same residual as the prior run and is documented in the SDK. Executed: read both search routes, sanitizer, document-visibility helper, SDK/OpenAPI contracts and migrations 5302432/5302440/5302456; ran the new search-portal test sources.

## Findings

| ID | Severity | Title |
|---|---|---|
| SEARCH-P1-001 | P1 | `sanitizeSearchTerm` does not strip PostgREST `.` operator separators |
| SEARCH-P1-002 | P1 | Admin global search exposes profile PII and never tenant-scopes the organizations query |
| SEARCH-P2-001 | P2 | Raw search terms persisted in plaintext `audit_logs.metadata` |
| SEARCH-P2-002 | P2 | Portal search omits documents despite SDK and documentation contract |
| SEARCH-P2-003 | P2 | Admin search UI silently discards the documents result set |
| SEARCH-P2-004 | P2 | No search pagination or result counts; hard 5-result ceiling |
| SEARCH-P2-005 | P2 | Search query analytics metric is dead and the analytics summary RPC is missing |
| SEARCH-P2-006 | P2 | Prefix/wildcard mismatch: no btree on prefix columns and no full-text (`tsvector`) search |
| SEARCH-P2-007 | P2 | Typeahead calls full search endpoints without rate limiting or a dedicated autocomplete surface |
| SEARCH-P2-008 | P2 | Admin global search returns private/internal documents without applying the `can_read_document` visibility filter |
| SEARCH-P2-009 | P2 | Search router bypasses the org-pinned admin check, so a tenant admin can read another tenant's search results |
| SEARCH-P3-001 | P3 | Soft-delete columns are defined but never used by queries or deletes |
| SEARCH-P3-002 | P3 | Search module documentation is stale relative to the code |
| SEARCH-P3-003 | P3 | Search SDK and OpenAPI contracts do not cover the implemented response (documents, counts, limit) |
| SEARCH-P3-004 | P3 | Portal search queries are not audit-logged, unlike the admin search route |
