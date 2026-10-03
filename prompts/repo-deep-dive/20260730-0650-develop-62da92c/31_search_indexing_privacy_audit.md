# Prompt 31 — Search, Indexing, and Privacy Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Search Routes/UI
- **Admin search:** `GET /api/v1/search` — `search.ts:1-66`
  - Middleware: `requireAuth + requireAdmin`
  - Global search across: profiles (users), organizations, tickets, projects
  - Uses `ILIKE` with `%{q}%` pattern
  - Minimum query length: 2 characters (line 14)
  - Result limits: 5 per entity type
  - Returns: `{ users, organizations, tickets, projects }`
- **Portal search:** `GET /api/v1/search/portal` — `search-portal.ts:1-65`
  - Middleware: `requireAuth`
  - Org-scoped: queries user's approved memberships first, then searches within those org IDs
  - Searches: tickets, projects
  - Minimum query length: 2 characters
  - Result limits: 5 per entity type
  - Returns: `{ tickets, projects }`
- **UI:** `apps/web/components/portal/PortalGlobalSearch.tsx` — search bar in portal header
- **UI:** Global admin search component

### Indexes
- GIN trigram indexes (migration 5302102):
  - `profiles(full_name)` using `gin_trgm_ops`
  - `profiles(email)` using `gin_trgm_ops`
  - `organizations(name)` using `gin_trgm_ops`
  - `tickets(title)` using `gin_trgm_ops`
  - `tickets(description)` using `gin_trgm_ops`
  - `projects(name)` using `gin_trgm_ops`
  - `projects(description)` using `gin_trgm_ops`
- Composite indexes for common query patterns:
  - `audit_logs(organization_id, created_at desc)`
  - `audit_logs(entity_type, entity_id, created_at desc)`
  - `tickets(assigned_to)`
  - `tickets(created_by)`
  - `projects(created_by)`
  - `notifications(module, module_id)`
  - `document_versions(document_id, created_at desc)`
- pg_trgm extension enabled

### Indexing Jobs
- No external search indexing (Elasticsearch, Meilisearch, Algolia)
- No reindexing cron jobs
- Search is real-time against Postgres (no stale index)
- No full-text search vector column (`tsvector`) — uses `ILIKE` instead

### Indexed Fields
- Profiles: full_name, email
- Organizations: name, slug
- Tickets: title, description
- Projects: name, description
- All searches use `ILIKE` with leading wildcard (`%{q}%`) — cannot use standard B-tree indexes

### Tenant Filters
- Admin search: no tenant filter — searches across all orgs (admin privilege)
- Portal search: scoped to user's approved orgs via memberships join:
  `search-portal.ts:22-33` — queries memberships for user, extracts orgIds with status = 'approved'
- Document search: not implemented (documents not in search results)

### Permission Filters
- Admin search: requireAdmin middleware (super_admin or admin role)
- Portal search: requireAuth + org-scoped membership check
- No field-level filtering — all indexed fields are returned in results
- Ticket/project descriptions may contain sensitive content

### Document/Ticket/Project Search
- Tickets: `title.ilike.{searchTerm}` OR `description.ilike.{searchTerm}` — both admin and portal
- Projects: `name.ilike.{searchTerm}` OR `description.ilike.{searchTerm}`
- Documents: NOT searchable via search endpoints
- No full-text search on document content (no file content indexing)

### Admin/Global Search
- Admin search (4 entity types): users, organizations, tickets, projects
- Admin search returns minimal fields: profiles(id, full_name, email, phone, title), organizations(id, name, slug, status), tickets(id, title, status, priority, organization_id), projects(id, name, status, priority, organization_id)
- No pagination on admin search results (hard limit of 5 per type)
- No "show all" / "view more" for search results

### Autocomplete
- No autocomplete/suggestions endpoint
- No typeahead search
- Minimal query length of 2 chars acts as basic filter

### Search Logs
- No search query logging
- No analytics on popular searches
- No way to identify search patterns or failed searches

### Query Analytics
- No query performance tracking
- No slow query monitoring specific to search
- Supabase logs available but no structured search observability

### Deleted Data Removal
- Hard-deleted tickets/projects could still match ILIKE queries briefly (no cleanup mechanism)
- RLS policies filter by organization access but don't filter deleted status (no soft-delete)

### Reindexing
- Not applicable — no external search index
- ILIKE queries are real-time against Postgres tables

### External Provider
- No external search provider integrated
- All search is Postgres-native

### Tests/Docs
- Search API tests: part of API test suite
- Search portal tests: part of API test suite
- No dedicated search documentation

---

## Search Surface Inventory

| Feature | Endpoint | Auth | Scope | Entities | Fields |
|---|---|---|---|---|---|
| Admin search | GET /api/v1/search | requireAuth + requireAdmin | Global | Profiles, orgs, tickets, projects | name, email, title, description |
| Portal search | GET /api/v1/search/portal | requireAuth | User's orgs | Tickets, projects | title, description, name |
| Document search | — | — | — | Not searchable | — |
| User search | GET /api/v1/profiles?email= | requireAuth | Managed separately | Profiles | email |

---

## Indexed Data Inventory

| Entity | Fields Indexed | Index Type | Searchable From |
|---|---|---|---|
| profiles | full_name, email | GIN trigram | Admin search |
| organizations | name, slug | GIN trigram + standard | Admin search |
| tickets | title, description | GIN trigram | Admin + portal search |
| projects | name, description | GIN trigram | Admin + portal search |
| documents | — | — | Not searchable |
| audit_logs | — | — | Not searchable (filtered list only) |

---

## Findings

### SEARCH-P1-001 — Document search not implemented (P1 High)

**Evidence:** `search.ts` and `search-portal.ts` search only profiles, organizations, tickets, projects. Documents have no search endpoint or ILIKE query.

**Risk:** Users cannot search for documents by name or content from the search bar. They must navigate to the documents list and manually filter.

**Recommendation:** Add document search to both admin and portal search endpoints. Search by `name` and `description` fields with ILIKE. Consider adding document content search via full-text extraction in a worker task.

---

### SEARCH-P1-002 — ILIKE with leading wildcard prevents B-tree index usage (P1 High)

**Evidence:** `search.ts:21` — `const searchTerm = '%${q}%'` — leading wildcard `%` forces full table scan for the trigram index fallback. While GIN trigram indexes exist and handle `%{q}%` patterns, they are less efficient than B-tree indexes for prefix searches.

**Risk:** On large datasets, search performance degrades. GIN trigram indexes have larger storage footprint and slower write performance than B-tree indexes.

**Recommendation:** Add a prefix search mode (no leading `%`) that can use B-tree indexes for `searchTerm.startsWith(q)` patterns when no wildcards are needed. Consider adding `pg_trgm` word similarity search as an alternative.

---

### SEARCH-P2-001 — No search results pagination (P2 Medium)

**Evidence:** Both search endpoints hard-limit results to 5 per entity type. No pagination parameters (`page`, `limit`). No "show more" mechanism.

**Risk:** Users can't see more than 5 results per category. Common names or search terms may return many matches but only show a fraction.

**Recommendation:** Add optional `page` and `limit` query parameters with higher max limits (e.g., 25). Add "show all" link to the full search results page.

---

### SEARCH-P2-002 — No search analytics or observability (P2 Medium)

**Evidence:** No search query logging. No way to identify what users search for most, what returns zero results, or what search patterns exist.

**Risk:** Unable to optimize search based on user behavior. No visibility into failed searches (zero results) that indicate content gaps.

**Recommendation:** Log search queries (anonymized) to a `search_queries` table with: query text, result count, entity types searched, timestamp. Add admin dashboard widget showing popular searches and zero-result queries.

---

### SEARCH-P2-003 — No full-text search on document/file content (P2 Medium)

**Evidence:** Documents table has no `tsvector` column. No worker task extracts text from uploaded files. No full-text search on document body.

**Risk:** Users cannot search within document contents. For a document-heavy portal, this is a significant UX gap.

**Recommendation:** Create a worker task that extracts text from uploaded documents (PDF, DOCX, TXT) using `pdf-parse` and `mammoth` libraries. Store extracted text in a `document_content` table or use Postgres `tsvector` for full-text search. Add the extracted content to document search queries.

---

### SEARCH-P3-001 — No search field-level permission filtering (P3 Low)

**Evidence:** Search returns entity titles, descriptions, and names without field-level filtering. Ticket descriptions may contain sensitive information visible in search results.

**Risk:** Users searching in portal mode see ticket descriptions that may reference sensitive details. No way to restrict which fields are searchable or visible per role.

**Recommendation:** Add field-level access control to search results based on user role. For example, descriptions could be hidden from member role while visible to admin role. Add a `searchable_fields` configuration per entity type.

---

## Authorization Review

| Search Type | Tenant Isolation | Authorization | Risk |
|---|---|---|---|
| Admin (global) | None — all orgs | requireAdmin role | ✅ Properly gated |
| Portal (org-scoped) | By approved memberships | requireAuth + org membership | ✅ Properly gated |
| Profile search | None (by email query) | requireAuth | ⚠️ Email enumeration risk |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 0 | — |
| P1 (High) | 2 | Documents not searchable, ILIKE leading wildcard prevents optimal indexing |
| P2 (Medium) | 3 | No pagination, no search analytics, no full-text content search |
| P3 (Low) | 1 | No field-level permission filtering on search results |
| **Total** | **6** | |

Search is currently implemented as lightweight Postgres ILIKE queries with GIN trigram indexes for performance. The approach works well for the current scale but has significant gaps: documents are not searchable, results are limited to 5 per category without pagination, and there's no full-text search on document content. The tenant isolation (org-scoped portal search) and authorization (admin gate on global search) are correctly implemented.
