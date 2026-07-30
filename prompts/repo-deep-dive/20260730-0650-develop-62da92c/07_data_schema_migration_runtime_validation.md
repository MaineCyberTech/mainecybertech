# Prompt 07 — Data, Schema, Migration, and Runtime Validation Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Database Schema
- Core schema defined in `supabase/migrations/5302026_...bootstrap.v3.sql` (2377 lines) — single consolidated bootstrap migration
- Tables: organizations, profiles, memberships, roles, role_permissions, tickets, ticket_comments, projects, project_members, project_tasks, comments, documents, document_versions, document_permissions, contracts, contract_signers, appointments, billing_customers, subscriptions, invoices, payments, chat_threads, chat_messages, audit_logs, notifications, notification_preferences, document_shares, webhook_endpoints, webhook_deliveries, webhook_dead_letters, public_interactions, license_tracking, status_items, website_monitors, dmarc_assessments, offboarding_checklists, break_glass_accounts, onboarding_clients, patch_compliance, m365_hardening, incident_responses, identity_verifications, endpoint_security, change_requests, risk_register, retention_policies, tabletop_exercises, isp_assessments, unifi_surveys, port_maps, camera_calculations, hardware_staging, network_diagrams, sop_library, compliance_readiness, insurance_evidence, ai_policies, knowledge_articles, training_modules, phishing_campaigns, cyber_scorecards, automation_workflows, powershell_scripts, kb_article_generations, sharepoint_plans, device_profiles, saas_audits, procurement_quotes, dns_change_requests, satisfaction_pulses, time_entries, budget_roadmaps, client_runbooks, custom_forms, backup_status, client_onboarding_command_center_records, client_onboarding_checklist_items, satisfaction_pulse_templates, satisfaction_pulse_schedules, module_timeline_events, scheduled_check_results, score_history, badges_earned, training_enrollments, training_courses (~80+ tables total)

### Migrations
- Single migration file (`5302026_...bootstrap.v3.sql`) plus ~70+ numbered migration files in `supabase/migrations/`
- Migration CI: `.github/workflows/supabase-migrations.yml` — runs `supabase link` + `supabase db push` per environment
- `supabase/config.toml` in root for local Supabase config
- No rollback scripts — all migrations use `IF NOT EXISTS` / `drop policy if exists` patterns for idempotency

### Constraints
- Primary keys: UUID with `gen_random_uuid()` on all tables
- Foreign keys: All entity tables have `organization_id` FK → `public.organizations(id) on delete cascade`
- NOT NULL constraints: All critical fields (name, organization_id, etc.) are NOT NULL
- Unique constraints: `document_shares(token)`, `document_versions(document_id, version_number)`, `subscriptions(stripe_subscription_id)`, `invoices(stripe_invoice_id)`, `payments(stripe_payment_intent_id)`, `billing_customers(organization_id)`, `webhook_deliveries(idempotency_key)`
- Enums: `ticket_status`, `ticket_priority`, `project_status`, `task_status`, `document_visibility`, `contract_status`, `invoice_status`, `audit_actor_type`, `comment_target_type`, `membership_status`, `notification_module`, `notification_action`

### Indexes
- Performance indexes migration: `5302102_add_performance_indexes.sql`
  - GIN trigram indexes: profiles(full_name, email), organizations(name), tickets(title, description), projects(name, description)
  - Composite indexes: audit_logs(organization_id, created_at desc), audit_logs(entity_type, entity_id), tickets(assigned_to, created_by), projects(created_by), notifications(module, module_id), document_versions(document_id, created_at desc)
- Table-specific indexes: All FK columns have indexes (org_id, user_id, etc.)
- Notification unread index: `notifications(user_id, read) WHERE read = false`

### Foreign Keys / Cascades
- All entity tables cascade delete on organization delete
- `auth.users(id)` references use `on delete cascade` for user-owned data
- `on delete set null` for contracts(document_id) and audit_logs(organization_id)

### RLS
- RLS enabled on all entity tables (see Report 37 for full RLS deep-dive)
- Helper functions: `is_super_admin()`, `is_org_member()`, `is_org_approved_member()`, `user_has_role()`, `user_has_permission()`, `storage_path_org_id()`, `can_read_document()`
- Fix migrations: `5302100_fix_rls_membership_status.sql` (creates `is_org_member()` + rewrites ~100 policies), `5302101_fix_missing_rls_policies.sql` (adds missing UPDATE/DELETE for shared tables)

### Tenant Columns
- All entity tables have `organization_id uuid not null` column
- `notifications` has optional `organization_id`
- `audit_logs` has optional `organization_id`
- `document_shares` has `organization_id`

### Soft Deletes
- No explicit soft-delete pattern — organizations use `status` field for logical deletion
- Most tables use hard deletes via RLS-gated DELETE policies

### Audit Fields
- `created_at timestamptz not null default now()` on all tables
- `updated_at timestamptz not null default now()` on most tables (trigger: `set_updated_at()`)
- `version integer not null default 1` on 8 mutable tables (migration `5302051`)
- `audit_logs` table for app-level audit events

### Seeds/Fixtures
- `supabase/seeds/04_test_seed.sql` — comprehensive test seed with Jira/JSM data, branding, webhooks, notifications, permission overrides, document versions

### Generated DB Types
- Not present — no `supabase gen types` output committed

### ORM/Client Usage
- Raw Supabase JS client (`@supabase/supabase-js`) via `getSupabaseAdmin()` / `getSupabaseUser()` — no ORM
- Admin client uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS
- User client uses `SUPABASE_ANON_KEY` + JWT in Authorization header — RLS-enforced

### Runtime Validation
- Zod schemas on all ~27 mutation endpoints, defined in `apps/api/src/validators/*.ts` (25 validator files)
- Env validation: `apps/api/src/config/env.ts` — Zod schema with typed `getEnv()` singleton
- Worker env validation: `apps/worker/src/env.ts` — standalone Zod schema + `parseEnv()` export

### Config Validation
- API: `envSchema` validates 33 env vars (12 required, 21 optional)
- Worker: `envSchema` validates worker-specific vars (SUPABASE_URL, SUPABASE_ANON_KEY, WORKER_CONCURRENCY, WORKER_TIMEOUT, etc.)

### JSON Schema
- Not present — no OpenAPI/Swagger schema files committed

### Migration CI
- `.github/workflows/supabase-migrations.yml` — pushes migrations on push to develop/main
- Uses env-specific linking (dev vs prod)
- Idempotent migration patterns (`IF NOT EXISTS`, `drop policy if exists`)

### Rollback/Drift/Backup
- No migration rollback scripts
- `docs/ROLLBACK_PROCEDURES.md` documents Docker/Supabase/Terraform rollback
- No automated DB backup scheduling (stale S3 backup cron was removed)

---

## Data Model Inventory

### Core Entity Tables (organization-scoped)

| Table | PK | FK Organization | Unique Constraints | Version | RLS |
|---|---|---|---|---|---|
| organizations | uuid | — | — | ✅ v1+ | ✅ |
| profiles | uuid | — | — | ✅ v1+ | ✅ |
| memberships | uuid | ✅ org | user_id+org_id | — | ✅ |
| roles | uuid | — | key | — | ✅ |
| role_permissions | uuid | — | role_id+permission_id | — | ✅ |
| tickets | uuid | ✅ org | — | ✅ v1+ | ✅ |
| ticket_comments | uuid | ✅ org | — | — | ✅ |
| projects | uuid | ✅ org | — | ✅ v1+ | ✅ |
| project_tasks | uuid | ✅ org | — | ✅ v1+ | ✅ |
| documents | uuid | ✅ org | — | ✅ v1+ | ✅ |
| document_shares | uuid | ✅ org | token | — | ✅ |
| webhook_endpoints | uuid | ✅ org | — | ✅ v1+ | ✅ |
| webhook_deliveries | uuid | — | idempotency_key | — | ✅ |
| notifications | uuid | ✅ org (optional) | — | — | ✅ |
| notification_preferences | uuid | ✅ org | user_id+module+channel | ✅ v1+ | ✅ |
| subscriptions | uuid | ✅ org | stripe_subscription_id | — | ✅ |
| invoices | uuid | ✅ org | stripe_invoice_id | — | ✅ |
| payments | uuid | ✅ org | stripe_payment_intent_id | — | ✅ |
| billing_customers | uuid | ✅ org (unique) | stripe_customer_id | ✅ v1+ | ✅ |
| audit_logs | uuid | ✅ (optional) | — | — | ✅ |

### Public Tables (no auth)
- `public_interactions` — RLS disabled (public data)

---

## Migration Inventory

| Migration # | Purpose | Reversible |
|---|---|---|
| 5302026 | Core bootstrap (schema, enums, RLS, storage, functions, triggers) | Partial (`IF NOT EXISTS`) |
| 5302027 | Seed roles (admin, super_admin, member, viewer, billing) | No |
| 5302028 | Seed permissions (26 permissions across 5 roles) | No |
| 5302029 | notifications table + RLS | Yes (DROP) |
| 5302030 | Jira/JSM columns on projects, tasks, tickets | Partial |
| 5302032 | webhook_endpoints + webhook_deliveries tables + RLS | Yes (DROP) |
| 5302033 | public_interactions table + RLS (anon INSERT) | Yes (DROP) |
| 5302034 | ticket_comment editing (edited_at + UPDATE RLS) | Yes |
| 5302036 | service_role INSERT policy on public_interactions | Yes (DROP) |
| 5302037 | Idempotent INSERT policies for public_interactions | Yes (DROP) |
| 5302038 | Disable RLS on public_interactions | Yes |
| 5302043 | document_shares table + RLS | Yes |
| 5302050 | webhook retry/DLQ (retry_count, next_retry_at, dead_letter, webhook_dead_letters) | Partial |
| 5302051 | Optimistic locking version columns (8 tables) | Partial |
| 5302053 | webhook idempotency key (column + unique constraint) | Partial |
| 5302100 | Fix RLS membership status (~100 policies rewrites) | Yes (policy drop) |
| 5302101 | Fix missing RLS policies (UPDATE/DELETE for shared tables) | Yes (policy drop) |
| 5302102 | Performance indexes (GIN trigram + composite indexes) | Yes (DROP INDEX) |
| 53020xx-53021xx | 60+ module-specific migrations (after 5302102) | Partial |

---

## Runtime Validation Inventory

| Layer | Mechanism | Coverage |
|---|---|---|
| API env | Zod schema (`config/env.ts`) | 33 vars (12 required) |
| Worker env | Zod schema (`worker/src/env.ts`) | ~10 vars |
| Request body | Zod schemas in `validators/*.ts` | All 27+ mutation endpoints |
| Request params | Manual (z.string().min(1) from AGENTS.md note) | Relaxed UUID validation |
| Response format | `success()` / `failure()` wrappers | All endpoints |
| Auth | `requireAuth` middleware | All routes except public/inbound webhook |
| Org access | `requireOrgAccess` middleware | All entity routes |
| Admin check | `requireAdmin` middleware | Admin-only endpoints |
| Cache | `responseCacheNoRenew` | 4 GET endpoints (orgs/docs/projects/roles) |
| Rate limit | Global + per-user express-rate-limit | All except health/inbound webhooks |
| Optimistic locking | `requireIfMatch` + `checkVersionMatch` | PATCH on docs/projects/orgs/tickets/webhook_endpoints |
| Idempotency | Redis + in-memory fallback | Webhook handlers + idempotency middleware |
| Input sanitization | `inputSanitizer` middleware | All requests |

---

## Findings

### DATA-P0-001 — No migration rollback scripts (P0 Critical)

**Evidence:** `supabase/migrations/*.sql` — all files are one-way. No `down/` directory or rollback SQL exists. `docs/ROLLBACK_PROCEDURES.md` covers Docker/Terraform rollback but does not cover DB rollback. `docs/SUPABASE_GUIDE.md` exists but references stale file.

**Risk:** If a migration corrupts data or breaks prod, the only rollback path is manual `supabase db reset` which destroys all data. No point-in-time recovery documented.

**Recommendation:** For each migration, create a `down.sql` counterpart. Add `supabase db diff --linked` to CI for pre-deploy schema diff review. Document manual rollback using `supabase migration repair --status reverted`.

---

### DATA-P1-001 — No typed DB client generated (P1 High)

**Evidence:** No `supabase gen types` output committed. All queries use `.from("table_name").select("*")` with loose `as any` casts throughout route handlers (e.g., `webhooks.ts:78`, `billing.ts:206`).

**Risk:** Schema changes at the DB level are invisible to TypeScript. Queries that reference dropped columns or changed types will fail at runtime. Loose `as any` casts bypass type checking.

**Recommendation:** Generate TypeScript types via `supabase gen types typescript --local > packages/sdk/src/types/database.ts`. Configure pre-commit hook to regenerate on schema change. Remove `as any` casts in route handlers in favor of typed Supabase client.

---

### DATA-P1-002 — Soft-delete pattern missing on mutable entities (P1 High)

**Evidence:** Organizations use `status` field for logical deletion (status = 'deleted'), but tickets, projects, documents use hard DELETE. Migration `5302100` only adds RLS policies — no soft-delete columns (deleted_at, deleted_by) on any table.

**Risk:** Accidental hard DELETE is irreversible. Audit logs reference deleted entities by UUID but lose all context (name, title, etc.) when hard-deleted.

**Recommendation:** Add `deleted_at timestamptz` and `deleted_by uuid` columns to tickets, projects, documents, and webhook_endpoints. Update RLS policies to filter `WHERE deleted_at IS NULL`. Change app-level DELETE to SET deleted_at = NOW().

---

### DATA-P1-003 — audit_logs cascade policy creates orphan risk (P1 High)

**Evidence:** `audit_logs` table has `organization_id uuid references public.organizations(id) on delete set null` (bootstrap migration lines 606-607). Organization deletion sets org_id to null but keeps the audit record.

**Risk:** After org deletion, audit events lose org association. No entity_type-specific cascade — all audit_logs rows for a deleted org become orphaned (null org_id).

**Recommendation:** Keep `on delete set null` but add a materialized retention: explicitly update org_id to a "deleted_org" sentinel UUID or keep the UUID but mark the org as deleted (using soft-delete pattern for organizations). Add cascade config per entity type in a metadata column.

---

### DATA-P2-001 — Missing NOT NULL constraint on document_shares organization_id at DB level (P2 Medium)

**Evidence:** `document_shares` table (migration 5302043) has organization_id column but no `NOT NULL` constraint. App code always sets it (documents.ts:569) but DB doesn't enforce.

**Risk:** Direct insert via SQL or future app bug could create share links without org association, bypassing tenant isolation.

**Recommendation:** `ALTER TABLE public.document_shares ALTER COLUMN organization_id SET NOT NULL;`

---

### DATA-P2-002 — document_shares token uses UUID v4 (collision risk at scale) (P2 Medium)

**Evidence:** `documents.ts:564` — `const token = crypto.randomUUID();` — UUID v4 has 122 bits of randomness. While collision-resistant, share links are designed for external access and are not brute-force protected.

**Risk:** Token-guessable share links could expose documents. No rate limiting on `GET /api/v1/documents/shares/:token` endpoint.

**Recommendation:** Use `crypto.randomBytes(32).toString('hex')` for 256-bit tokens. Add rate limiting to the public share access endpoint. Add access_count tracking (already present) and auto-revocation on threshold.

---

### DATA-P2-003 — No DB-level CASCADE on webhook_deliveries.webhook_id (P2 Medium)

**Evidence:** `webhook_deliveries` table has `webhook_id uuid references public.webhook_endpoints(id)` without explicit `on delete cascade`. Migration 5302050 uses `on delete cascade` for `webhook_dead_letters` but not for original deliveries.

**Risk:** Deleting a webhook endpoint leaves orphaned delivery records with broken FK references.

**Recommendation:` `ALTER TABLE public.webhook_deliveries DROP CONSTRAINT webhook_deliveries_webhook_id_fkey, ADD CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE;`

---

### DATA-P3-001 — `updated_at` trigger relies on update_updated_at_column() pattern (P3 Low)

**Evidence:** Bootstrap migration (line ~628) creates `set_updated_at()` trigger function. Not all tables have the trigger applied. Some tables (e.g., webhook_deliveries) lack updated_at entirely.

**Risk:** Inconsistent updated_at behavior across tables. Some tables get automatic updates, others require manual app-level handling.

**Recommendation:** Audit all tables for updated_at column + trigger. Add to webhook_deliveries, document_shares, and other high-churn tables. Standardize trigger name.

---

## Schema Evolution Roadmap

| Phase | Item | Effort | Priority |
|---|---|---|---|
| 1 | Add migration rollback scripts (down.sql per migration) | Medium | P0 |
| 2 | Add deleted_at/deleted_by soft-delete columns to mutable tables | Medium | P1 |
| 3 | Generate Supabase TypeScript types + remove as any casts | Medium | P1 |
| 4 | Add NOT NULL constraint to document_shares.organization_id | Small | P2 |
| 5 | Strengthen document share tokens to 256-bit random | Small | P2 |
| 6 | Add CASCADE delete to webhook_deliveries FK | Small | P2 |
| 7 | Standardize updated_at triggers across all tables | Small | P3 |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | No migration rollback capability |
| P1 (High) | 3 | No typed DB client, soft-delete missing, audit cascade policy |
| P2 (Medium) | 3 | Missing constraints, weak share tokens, orphan FK |
| P3 (Low) | 1 | Inconsistent updated_at triggers |
| **Total** | **8** | |

The schema and migration practices are mature overall — idempotent migrations, comprehensive FK/PK constraints, proper indexes (including GIN trigram), and Zod runtime validation are all strong areas. The critical gaps are: (1) no rollback path for migrations, (2) no typed DB client causing `as any` proliferation, and (3) no soft-delete pattern exposing data to irreversible loss.
