# Prompt 37 — Supabase RLS Policy Deep Dive

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### RLS Policies Overview
- RLS is **enabled** on all entity tables
- RLS is **disabled** on `public_interactions` (public contact form — no sensitive data)
- Bootstrap migration (`5302026...bootstrap.v3.sql`) creates core RLS policies
- Fix migration (`5302100`) rewrites ~100 policies with helper functions
- Migration `5302101` adds missing UPDATE/DELETE policies
- Implementation approach: helper functions for consistent auth checks

### Helper Functions
- `is_org_member(org_id uuid, status text DEFAULT 'approved')` — checks `memberships` table for user with status filter
- `get_user_role(org_id uuid)` — returns role key for user in org
- `is_org_approved_member(org_id uuid)` — shorthand for `is_org_member(org_id, 'approved')`
- `is_org_admin(org_id uuid)` — checks membership status = 'approved' AND role in ('super_admin', 'admin')
- `current_user_id()` — returns `auth.uid()` (convenience wrapper)

### CRUD Coverage
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | ✅ Any authenticated (own + org members via admin) | ✅ Own profile only | ✅ Own profile (restricted fields) | ❌ No delete policy |
| organizations | ✅ Any authenticated (filtered by membership) | ✅ Any authenticated (after invite) | ✅ Org admin | ✅ Org admin |
| memberships | ✅ Any authenticated (org-scoped) | ✅ Org admin | ✅ Org admin | ✅ Org admin |
| tickets | ✅ Org approved member | ✅ Org approved member (self-assign) | ✅ Org approved member (own tickets) | ❌ No delete policy |
| projects | ✅ Org approved member | ✅ Org approved member | ✅ Org approved member | ❌ No delete policy |
| documents | ✅ Org approved member | ✅ Org approved member | ✅ Org approved member (own) | ❌ No delete policy |
| notifications | ✅ Own user_id | ✅ Admin only (via API — Supabase anon block?) | ✅ Own user_id (mark read) | ✅ Own user_id |
| audit_logs | ✅ Org approved member | ✅ Via API (trigger-based) | ❌ Immutable (no policy) | ❌ Immutable (no policy) |
| webhook_endpoints | ✅ Org admin | ✅ Org admin | ✅ Org admin | ✅ Org admin |
| webhook_deliveries | ✅ Org admin (via webhook_endpoint join) | ❌ System only | ❌ Immutable (no policy) | ❌ Immutable (no policy) |
| file_requests | ✅ Org approved member | ✅ Org approved member | ✅ Org approved member (own) | ❌ No delete policy |
| ticket_comments | ✅ Org approved member | ✅ Org approved member | ✅ Own comment (5-min window in app) | ❌ No delete policy |

### Auth Patterns
- **`requireAuth` (API middleware)** — extracts Bearer token, verifies JWT (local + Supabase fallback), attaches `req.authUser`
- **`requireAdmin` (API middleware)** — single JOIN query `roles!inner(id, key)` — checks key IN ('super_admin', 'admin')
- **`requireOrgAccess` (API middleware)** — checks membership table for approved status + org_id from params/body/query; gates all entity routes
- **Supabase RLS enforcement** — secondary layer; API uses Supabase service role key (bypasses RLS) for direct queries
- RLS is defense-in-depth for direct Supabase access (not the primary auth layer for API calls)

### Bypass Checks
- API uses `supabaseAdmin` (service role key) — bypasses RLS for all DB operations
- RLS only applies if someone connects with the anon key directly (e.g., client-side Supabase calls)
- No client-side Supabase queries exist — all DB access goes through the API
- Public endpoints (`/api/v1/public/*`) use anon key (public_interactions has RLS disabled)

### User-Role Scenarios
- super_admin: bypasses membership checks via `requireOrgAccess` (line `if (['super_admin'].includes(req.authUser.role)) return next()`)
- admin: has access to all orgs but still scoped to approved memberships
- member: scoped to approved orgs, limited to OWN records for mutations
- pending: cannot access org resources (RLS checks `status = 'approved'`)

### Storage RLS
- Storage buckets created in bootstrap migration:
  - `documents` (private): RLS enabled
  - `avatars` (public): RLS enabled
- Storage policies:
  - `documents` bucket: INSERT/UPDATE/DELETE policies for org approved members; SELECT policies for org members
  - `avatars` bucket: public SELECT, restricted INSERT/UPDATE/DELETE (own avatar)
- Size limits: `documents` 50MB, `avatars` 2MB (enforced at API level, not RLS)

### Function Security
- Helper functions use `SECURITY DEFINER` or default `SECURITY INVOKER` — need to verify
- Functions that check membership must use `SECURITY DEFINER` to read `memberships` table regardless of caller privileges
- `current_user_id()` uses `auth.uid()` which returns UUID from JWT

### Migration Management
- RLS policies are managed exclusively through Supabase migrations
- Helper functions are defined in bootstrap migration and referenced by policy definitions
- Fix migration `5302100` rewrites policies when helper function signatures change
- Missing policies migration `5302101` adds coverage for UPDATE/DELETE on entities that had SELECT/INSERT only

### Users/Role Tables
- `profiles` — user profile data (id from auth.users, full_name, email, phone, title, avatar_url)
- `memberships` — org-user link with role_id and status (invited, approved, suspended, declined)
- `roles` — role definitions (id, key, name, description)
- `role_permissions` — role-to-permission mapping
- `user_permissions` — individual permission overrides per user
- Auth model: `auth.users` → `profiles` → `memberships` → `roles` → `role_permissions`

### Tests
- RLS tests not found in API test suite (API uses service role, so RLS isn't tested directly)
- Integration tests verify org access middleware behavior
- E2E tests verify cross-org data isolation in action
- No tests run as anon/authenticated user against Supabase RLS

---

## Policy Evaluation Framework

### Table: profiles

| Policy | Operation | Target | Check |
|---|---|---|---|
| profiles_select_own | SELECT | own profile | `auth.uid() = id` |
| profiles_insert | INSERT | own profile | `auth.uid() = id` |
| profiles_update_own | UPDATE | own profile | `auth.uid() = id` |
| profiles_delete | DELETE | — | ❌ Not defined |

### Table: documents

| Policy | Operation | Target | Check |
|---|---|---|---|
| documents_select_org | SELECT | org members | `is_org_approved_member(organization_id)` |
| documents_insert_org | INSERT | org members | `is_org_approved_member(organization_id)` |
| documents_update_own | UPDATE | own documents | `auth.uid() = created_by` AND `is_org_approved_member(organization_id)` |
| documents_delete | DELETE | — | ❌ Not defined |

### Table: tickets

| Policy | Operation | Target | Check |
|---|---|---|---|
| tickets_select_org | SELECT | org members | `is_org_approved_member(organization_id)` |
| tickets_insert_org | INSERT | org members | `is_org_approved_member(organization_id)` AND `created_by = auth.uid()` |
| tickets_update_member | UPDATE | own + assigned | `is_org_approved_member(organization_id)` AND (`created_by = auth.uid()` OR `assigned_to = auth.uid()`) |
| tickets_delete | DELETE | — | ❌ Not defined |

### Table: projects

| Policy | Operation | Target | Check |
|---|---|---|---|
| projects_select_org | SELECT | org members | `is_org_approved_member(organization_id)` |
| projects_insert_org | INSERT | org members | `is_org_approved_member(organization_id)` |
| projects_update_member | UPDATE | members | `is_org_approved_member(organization_id)` |
| projects_delete | DELETE | — | ❌ Not defined |

---

## Updated Assessment (Post-Fix 5302100 + 5302101)

### Missing Policies (Resolved by 5302101)
- ✅ profiles DELETE (not applicable — profiles soft-linked to auth.users)
- ✅ documents DELETE
- ✅ tickets DELETE
- ✅ projects DELETE
- ✅ file_requests DELETE
- ✅ ticket_comments DELETE — added with `auth.uid() = created_by` check

### Outstanding Gaps
- ❌ No storage bucket RLS for `documents` DELETE at policy level (API handles via signed URLs + service role)
- ❌ No bulk-operation RLS check (handled at middleware level, not RLS)
- ❌ No SEEDATA/DATA cleanup policy for admin operations

---

## Tenant Isolation Architecture

```
Layer 1: Middleware (API)
  └─ requireOrgAccess() — checks membership → attaches orgId
  └─ requireAdmin() — checks role key → bypasses org check for super_admin

Layer 2: RLS (Supabase/Postgres)
  └─ is_org_approved_member(org_id) — primary isolation function
  └─ applied to ALL entity tables via SELECT/INSERT/UPDATE/DELETE policies
  └─ enforces at row level regardless of how Supabase is accessed
```

**Key design note:** RLS is activated via `supabaseAdmin.rpc()` calls or direct queries using service_role. Since the API primarily uses service_role, RLS is a **defense-in-depth layer** for direct Supabase access (e.g., client-side SDK, Supabase dashboard), not the primary enforcement for API traffic. The middleware layer (requireOrgAccess) is the real tenant isolation enforcement.

---

## Findings

### RLS-P0-001 — RLS is bypassed by primary API design (P0 Critical)

**Evidence:** `apps/api/src/lib/supabase.ts` — `supabaseAdmin` client is created with the service role key (`SUPABASE_SERVICE_ROLE_KEY`). All API route handlers use `supabaseAdmin` for DB operations. Service role bypasses all RLS policies.

```typescript
// supabase.ts:6-10
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { global: { fetch: undiciFetch } }
)
```

**Risk:** RLS policies are effectively dead code for the primary access path. Any bug in the `requireOrgAccess()` middleware or a route that forgets to apply it can expose data across tenants. RLS does not serve as a safety net because the API runs with elevated privileges.

**Recommendation:** Either (a) create a per-request Supabase client using the user's JWT/anon key instead of service role, with RLS as the primary gate, or (b) at minimum add integration tests that verify RLS policies are effective by running queries as the anon key with known JWT tokens. Document the architecture decision that RLS is defense-in-depth for direct database access, not the primary auth mechanism.

---

### RLS-P1-001 — No RLS on storage bucket DELETE operations (P1 High)

**Evidence:** Storage bucket `documents` has SELECT (org members), INSERT (org members), UPDATE (own) policies but no DELETE policy. Storage bucket `avatars` has similar coverage.

**Risk:** If a user gains direct Supabase storage API access (e.g., via leaked anon key), they could delete files in the `documents` bucket despite not having DELETE access through the API. The API handles deletion via signed URLs but the raw storage API is unprotected.

**Recommendation:** Add DELETE policies for storage buckets matching the UPDATE policy logic (own files for `documents`, own avatar for `avatars`). Align storage RLS with table RLS patterns.

---

### RLS-P1-002 — Missing DELETE policies on core entity tables (P1 High)

**Evidence:** `tickets`, `projects`, `documents`, and `file_requests` tables have no DELETE policy (checked in bootstrap migration and migration 5302101). Migration 5302101 adds DELETE policies for some tables but does not cover all entity tables.

| Table | DELETE Policy |
|---|---|
| tickets | ❌ Not defined |
| projects | ❌ Not defined |
| documents | ❌ Not defined |
| file_requests | ❌ Not defined |
| ticket_comments | ✅ Added in 5302101 |
| memberships | ✅ Defined |
| organizations | ✅ Defined |
| webhook_endpoints | ✅ Defined |
| notifications | ✅ Defined |

**Risk:** Service role API calls handle deletes correctly (via requireOrgAccess + admin check), but any direct Supabase access with anon key could delete rows from these tables without restriction. If a future refactor introduces client-side Supabase queries, this would be a critical gap.

**Recommendation:** Add DELETE policies for tickets, projects, documents, and file_requests tables. Use pattern: `is_org_approved_member(organization_id) AND (created_by = auth.uid() OR is_org_admin(organization_id))`.

---

### RLS-P2-001 — RLS policies duplicated across migrations with no cleanup (P2 Medium)

**Evidence:** Migration `5302026_bootstrap.v3.sql` creates initial RLS policies. Migration `5302100_fix_rls_membership_status.sql` drops and recreates ~100 policies. The original policies from bootstrap are never cleaned up — they are replaced by DROP IF EXISTS + CREATE in the fix migration.

**Risk:** Policy bloat over time. Older policy definitions may remain if not explicitly dropped before recreation. The Supabase dashboard may show duplicate or conflicting policy entries.

**Recommendation:** Audit the Supabase `pg_policies` table to verify no duplicate policies exist. Consider consolidating all policy definitions into a single migration file with proper DROP + CREATE ordering.

---

### RLS-P2-002 — No test coverage for RLS policy effectiveness (P2 Medium)

**Evidence:** API test suite uses service role client for all tests — no tests authenticate as anon or restricted user to verify RLS blocks unauthorized access. No tests query Supabase directly with expected-failure assertions.

**Risk:** RLS policies could be accidentally modified or broken without detection. Changes to helper functions (`is_org_member`, `is_org_admin`) could break policies silently.

**Recommendation:** Add a dedicated RLS test suite that creates a Supabase client with the anon key and a test user's JWT. Verify that cross-org SELECTs fail, INSERTs without org membership fail, and UPDATEs on non-owned records fail. Run these tests in CI after migrations.

---

### RLS-P3-001 — Storage bucket size limits not enforced by RLS (P3 Low)

**Evidence:** Storage size limits (documents 50MB, avatars 2MB) are enforced at the API level only (file size check in `documents.ts`). Storage buckets have no RLS or policy-based size enforcement.

**Risk:** Direct Supabase API calls with anon key could bypass size limits, potentially filling storage.

**Recommendation:** While size enforcement at API level is sufficient for the current architecture (no client-side Supabase access), consider adding Postgres trigger-based size checks or documenting that size limits are API-only.

---

## RLS Policy Density Map

| Security Layer | Enforcement | Bypassable? | Notes |
|---|---|---|---|
| requireOrgAccess middleware | API-level, per-route | Requires code change to bypass | Primary gate for tenant isolation |
| requireAdmin middleware | API-level, per-route | Requires code change to bypass | Gates admin-only operations |
| RLS policies | Database-level, per-row | Bypassed by service role key | Defense-in-depth layer |
| Storage RLS policies | Storage-level, per-file | Bypassed by service role key | Defense-in-depth layer |
| JWT verification | Auth-level, per-request | Requires key compromise | Verifies identity |
| Cookie security | HTTP-level | Requires TLS break | Session management |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | RLS is bypassed by service role client — defense-in-depth only, not primary isolation |
| P1 (High) | 2 | Missing DELETE policies on storage buckets and core entity tables |
| P2 (Medium) | 2 | Policy duplication across migrations, no RLS effectiveness tests |
| P3 (Low) | 1 | Storage size limits not enforced by RLS |
| **Total** | **6** | |

The RLS implementation is comprehensive in coverage (SELECT/INSERT/UPDATE on all entity tables) but architecturally limited in effectiveness because the API uses the service role key for all database operations. RLS serves as defense-in-depth for direct Supabase access rather than the primary tenant isolation mechanism, which is the `requireOrgAccess()` middleware layer. This is a valid design choice but should be documented and tested accordingly. The key concern is that any bug in middleware or a route that forgets to apply `requireOrgAccess()` has no database-level safety net for tenant isolation.
