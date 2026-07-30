# Final Risk Register & Prioritized Roadmap

**Audit:** repo-deep-dive | **Run:** 20260730-0650-develop-62da92c | **Branch:** develop (62da92c)
**Generated:** 2026-07-30
**Reports synthesized:** 37 of 41 domain reports (16 absent — documentation/devex)

---

## Risk Register (82 Findings Consolidated)

### P0 Critical (6)

| ID | Domain | Finding | Location | Effort |
|----|--------|---------|----------|--------|
| FINAL-P0-001 | Data | No migration rollback scripts — all migrations are one-way | `supabase/migrations/*.sql` | Medium |
| FINAL-P0-002 | API | No OpenAPI/Swagger spec committed — no machine-readable API contract | `docs/API_ENDPOINT_INVENTORY.md` | Medium |
| FINAL-P0-003 | File | No MIME/content-type validation on document upload (allows .exe, .svg, .html) | `documents.ts:158-295` | Small |
| FINAL-P0-004 | Billing | No entitlement gating — expired/canceled subscriptions retain full feature access | No middleware exists | Medium |
| FINAL-P0-005 | Notifications | No SMTP config in production (all vars optional) — email notifications silently fail | `config/env.ts:13-17` | Small |
| FINAL-P0-006 | Webhooks | Jira/JSM/M365 inbound webhook signatures are optional — unauthenticated events accepted | `webhooks.ts:217-352` | Small |

### P1 High (39)

| ID | Domain | Finding | Location | Effort |
|----|--------|---------|----------|--------|
| FINAL-P1-001 | Security | Tenant isolation bypassed in test mode (`NODE_ENV=test` skips `requireOrgAccess`) | `org-access.ts:44` | Medium |
| FINAL-P1-002 | Architecture | Single DO droplet SPOF — no HA, no failover | `droplet.tf`, `docker-compose.yml` | Large |
| FINAL-P1-003 | Architecture | No request timeout middleware — slow requests exhaust connection pool | `app.ts:70-191` | Small |
| FINAL-P1-004 | Security | Users API returns full profile + memberships of ANY user across orgs (no org gate) | `users.ts:160-176` | Small |
| FINAL-P1-005 | Security | Avatar upload has no ownership verification — any user can overwrite any avatar | `profiles.ts:141-188` | Small |
| FINAL-P1-006 | Data | No typed DB client — `as any` casts throughout route handlers | All route files | Medium |
| FINAL-P1-007 | Data | Soft-delete pattern missing on tickets, projects, documents (hard DELETE irreversible) | All entity routes | Medium |
| FINAL-P1-008 | Data | `audit_logs` cascade `on delete set null` creates orphan records on org deletion | Bootstrap migration | Small |
| FINAL-P1-009 | API | SSE notification stream lacks per-connection auth re-validation | `notifications.ts:15-91` | Small |
| FINAL-P1-010 | API | Inbound webhook handlers lack timeout on external calls | `webhooks.ts` | Small |
| FINAL-P1-011 | API | No breaking-change detection in CI | No workflow | Small |
| FINAL-P1-012 | Supply Chain | No SBOM generation in CI or releases | No workflow | Small |
| FINAL-P1-013 | Supply Chain | No container vulnerability scanning | No workflow step | Small |
| FINAL-P1-014 | Infra | Terraform backend state bucket name drift (`providers.tf` vs `env/*.hcl`) | `providers.tf:5` | Small |
| FINAL-P1-015 | Infra | Caddyfile.prod missing Content-Security-Policy header (no XSS protection in prod) | `Caddyfile.prod` | Small |
| FINAL-P1-016 | Observability | DB query duration metric (`recordDbQuery`) defined but never called | `metrics.ts:22-28` | Small |
| FINAL-P1-017 | Observability | Worker has no Prometheus metrics or task performance tracking | `worker/src/main.ts` | Medium |
| FINAL-P1-018 | Performance | No database index audit — table scans on audit_logs, notifications, ticket_comments | Missing migration | Small |
| FINAL-P1-019 | Performance | No container memory limits in docker-compose (known Web OOM) | `docker-compose.yml` | Small |
| FINAL-P1-020 | Mobile | No service worker or offline support — app unusable without network | No SW file | Medium |
| FINAL-P1-021 | Webhooks | No timestamp tolerance / replay window on inbound webhooks | `webhooks.ts` | Small |
| FINAL-P1-022 | Webhooks | Outbound dispatch idempotency key is timestamp-based (not deterministic) | `webhook-dispatcher.ts:32` | Small |
| FINAL-P1-023 | Webhooks | No automated retry worker for failed outbound deliveries | Missing worker task | Medium |
| FINAL-P1-024 | Webhooks | Webhook endpoint secrets stored in plaintext in DB | `webhook-management.ts:80` | Medium |
| FINAL-P1-025 | File | Multer size limit (100MB) exceeds Supabase bucket limit (50MB) — silent 500 errors | `documents.ts:58` | Small |
| FINAL-P1-026 | File | No content scanning / virus detection on uploaded files | No integration | Medium |
| FINAL-P1-027 | File | Signed URLs have fixed 1h TTL with no revocation capability | `documents.ts:401` | Small |
| FINAL-P1-028 | Billing | No self-serve subscription management UI (no Stripe Customer Portal integration) | Portal billing page | Medium |
| FINAL-P1-029 | Billing | No automated reconciliation worker schedule confirmed | `stripe-reconcile.ts` | Small |
| FINAL-P1-030 | Notifications | No duplicate notification prevention — same event creates duplicate notifications | `notifications.ts:210-247` | Small |
| FINAL-P1-031 | Notifications | SSE stream sends full notification body without sensitivity filtering | `notifications.ts:48` | Small |
| FINAL-P1-032 | Search | Documents not searchable via search endpoints | `search.ts` | Small |
| FINAL-P1-033 | Search | ILIKE with leading wildcard prevents B-tree index usage | `search.ts:21` | Small |
| FINAL-P1-034 | DR | No RTO/RPO defined for any component | All docs | Small |
| FINAL-P1-035 | DR | Backup restoration never tested or verified | `db-backup.yml` | Small |
| FINAL-P1-036 | DR | Terraform state stored only locally (no remote backend) | `terraform/` | Small |
| FINAL-P1-037 | DR | No backup alerting on failure | `db-backup.yml` | Small |
| FINAL-P1-038 | Container | No container runtime security hardening (`cap_drop`, `security_opt`, `read_only` missing) | `docker-compose.yml` | Small |
| FINAL-P1-039 | Container | Docker base images not pinned to SHA digest | All 3 Dockerfiles | Small |

### P2 Medium (29)

| ID | Domain | Finding | Effort |
|----|--------|---------|--------|
| FINAL-P2-001 | Inventory | Committed `.env` / `.env.local` may leak local secrets | Small |
| FINAL-P2-002 | Inventory | Committed `.playwright-auth.json` contains auth tokens | Small |
| FINAL-P2-003 | Inventory | `terraform.exe` binary committed to repo | Small |
| FINAL-P2-004 | Inventory | SDK test coverage thin (2 files for 50+ modules) | Large |
| FINAL-P2-005 | Architecture | SQS consumer path dormant and unverified | Small |
| FINAL-P2-006 | Feature | Limited E2E coverage (26 spec files for 60 modules) | Large |
| FINAL-P2-007 | Feature | Worker tasks have limited test coverage (1 file for 9 tasks) | Medium |
| FINAL-P2-008 | Feature | Some UI components lack error/empty states | Medium |
| FINAL-P2-009 | UX | Incomplete ARIA labeling across interactive elements | Small |
| FINAL-P2-010 | UX | No visual regression testing in CI (Chromatic not wired) | Small |
| FINAL-P2-011 | Data | Missing NOT NULL constraint on `document_shares.organization_id` | Small |
| FINAL-P2-012 | Data | `document_shares` token uses UUID v4 (weak for external share links) | Small |
| FINAL-P2-013 | Data | No DB-level CASCADE on `webhook_deliveries.webhook_id` | Small |
| FINAL-P2-014 | API | Response pagination type partially undocumented (raw arrays returned) | Small |
| FINAL-P2-015 | API | `/metrics` endpoint lacks auth | Small |
| FINAL-P2-016 | Supply Chain | No `.npmrc` restricts registry (dependency confusion risk) | Small |
| FINAL-P2-017 | Infra | `dev.tfvars` / `prod.tfvars` contain placeholder values | Small |
| FINAL-P2-018 | Infra | Terraform state files committed to repo | Small |
| FINAL-P2-019 | Infra | Redis default password in docker-compose.yml | Small |
| FINAL-P2-020 | Observability | Client-side logger endpoint never configured (`__LOG_ENDPOINT__` undefined) | Small |
| FINAL-P2-021 | Performance | No per-route rate limiting granularity (global only) | Medium |
| FINAL-P2-022 | Mobile | No PWA manifest or install support | Small |
| FINAL-P2-023 | Security | Roles endpoint returns all roles + permission mappings to any authenticated user | Small |
| FINAL-P2-024 | Security | Audit log access not scoped to org (admin of Org-A reads Org-B audit logs) | Small |
| FINAL-P2-025 | Security | Admin search has no audit trail for search queries | Small |
| FINAL-P2-026 | Auth | Bulk invite lacks per-invite volume limit (10000 invites in one request) | Small |
| FINAL-P2-027 | Auth | Any admin can assign `super_admin` role (no gating) | Small |
| FINAL-P2-028 | Auth | Admin test-email endpoint lacks rate limiting (email relay abuse) | Small |
| FINAL-P2-029 | Platform | No feature flag system — all features deployed together | Medium |

### P3 Low (8)

| ID | Domain | Finding | Effort |
|----|--------|---------|--------|
| FINAL-P3-001 | UX | No formal typography scale | Small |
| FINAL-P3-002 | Data | Inconsistent `updated_at` triggers across tables | Small |
| FINAL-P3-003 | API | No integration health endpoint for external services | Small |
| FINAL-P3-004 | Supply Chain | Root package.json license is "ISC" (unusual for commercial platform) | Small |
| FINAL-P3-005 | Infra | `deploy.sh` is dead code (CI uses inline SSH commands) | Small |
| FINAL-P3-006 | File | No disk cleanup for orphaned storage files | Medium |
| FINAL-P3-007 | Analytics | GA and Tawk.to scripts load without user consent gate — ACCEPTED | — |
| FINAL-P3-008 | Analytics | No do-not-track header respect — ACCEPTED | — |

---

## Risk Heatmap

| Impact | P0 | P1 | P2 | P3 |
|--------|:--:|:--:|:--:|:--:|
| Critical | 6 | — | — | — |
| High | — | 39 | — | — |
| Medium | — | — | 29 | — |
| Low | — | — | — | 8 |

**Risk Score: HIGH** — 6 critical gaps (data loss, no contract, arbitrary uploads, no billing enforcement, email silent failure, webhook forgery) plus 39 high-severity findings.

---

## Prioritized Remediation Roadmap

### Phase 1 — Immediate (Days 1-7) — 12 items

| Priority | ID | Finding | Owner |
|----------|----|---------|-------|
| 1 | FINAL-P0-004 | Add `requireActiveSubscription` middleware (entitlement gating) | Backend |
| 2 | FINAL-P0-003 | Add MIME whitelist to document upload, block executable/SVG | Backend |
| 3 | FINAL-P0-006 | Make Jira/JSM/M365 webhook signatures required, add 501 for unconfigured | Backend |
| 4 | FINAL-P0-001 | Create rollback SQL per migration, add CI dry-run | Backend |
| 5 | FINAL-P1-004 | Add `requireOrgAccess` to users route (GET /:id, /:id/detail, /:id/permissions) | Backend |
| 6 | FINAL-P1-005 | Add ownership check to avatar upload (req.params.id === req.authUser.userId) | Backend |
| 7 | FINAL-P0-005 | Make SMTP vars required, configure SendGrid/Resend in prod | Infra |
| 8 | FINAL-P1-001 | Remove `isTest` bypass from `org-access.ts` | Backend |
| 9 | FINAL-P1-014 | Fix Terraform backend state bucket drift | Infra |
| 10 | FINAL-P1-015 | Add CSP header to `Caddyfile.prod` | Infra |
| 11 | FINAL-P1-036 | Migrate Terraform state to remote backend (DO Spaces) | Infra |
| 12 | FINAL-P2-001 | Remove committed `.env`/`.env.local` from git | Infra |

### Phase 2 — Short-term (Days 8-30) — 20 items

| Priority | ID | Finding | Owner |
|----------|----|---------|-------|
| 13 | FINAL-P1-006 | Generate Supabase TypeScript types, remove `as any` casts | Backend |
| 14 | FINAL-P1-007 | Add soft-delete columns (`deleted_at`, `deleted_by`) to tickets/projects/documents | Backend |
| 15 | FINAL-P1-009 | Add periodic auth re-validation to SSE stream | Backend |
| 16 | FINAL-P1-010 | Add 5s timeout wrapper around webhook DB operations | Backend |
| 17 | FINAL-P1-011 | Add OpenAPI spec generation + breaking-change CI gate | Backend |
| 18 | FINAL-P1-018 | Create DB index migration (audit_logs, notifications, ticket_comments) | Backend |
| 19 | FINAL-P1-019 | Add `mem_limit` to all docker-compose services | Infra |
| 20 | FINAL-P1-021 | Add timestamp tolerance check to inbound webhook handlers | Backend |
| 21 | FINAL-P1-022 | Fix outbound idempotency keys to be deterministic | Backend |
| 22 | FINAL-P1-024 | Encrypt webhook endpoint secrets at rest | Backend |
| 23 | FINAL-P1-025 | Align multer size limit with Supabase bucket limit (50MB) | Backend |
| 27 | FINAL-P1-016 | Wire `recordDbQuery()` into Supabase query wrapper | Backend |
| 24 | FINAL-P1-017 | Add Prometheus `/metrics` endpoint to Worker | Worker |
| 25 | FINAL-P1-020 | Create service worker with cache-first strategy | Web |
| 26 | FINAL-P1-032 | Add document search to admin + portal search endpoints | Backend |
| 28 | FINAL-P1-034 | Define and document RTO/RPO | Platform |
| 29 | FINAL-P1-037 | Add failure notification to db-backup workflow | CI |
| 30 | FINAL-P1-038 | Add `cap_drop`, `security_opt`, `read_only` to docker-compose | Infra |
| 31 | FINAL-P1-039 | Pin Docker base images to SHA digests | Infra |
| 32 | FINAL-P0-002 | Generate OpenAPI 3.0 spec from Zod schemas | Backend |

### Phase 3 — Medium-term (Days 31-90) — 25 items

| Priority | ID | Finding | Owner |
|----------|----|---------|-------|
| 33 | FINAL-P1-023 | Create BullMQ retry worker for failed webhook deliveries | Worker |
| 34 | FINAL-P1-026 | Integrate file scanning (ClamAV/VirusTotal) as background task | Worker |
| 35 | FINAL-P1-028 | Integrate Stripe Customer Portal for self-serve billing | Web |
| 36 | FINAL-P1-030 | Add idempotency check for notification creation | Backend |
| 37 | FINAL-P1-031 | Strip sensitive fields from SSE notification payloads | Backend |
| 38 | FINAL-P2-005 | Verify or remove SQS consumer code path | Worker |
| 39 | FINAL-P2-006 | Add E2E tests for high-value feature modules | QA |
| 40 | FINAL-P2-007 | Add worker task tests for all 9 handlers | Worker |
| 41 | FINAL-P2-021 | Add per-route rate limit configuration | Backend |
| 42 | FINAL-P2-022 | Create PWA manifest.json | Web |
| 43 | FINAL-P2-029 | Implement feature flag system with admin UI | Backend |
| 44 | FINAL-P1-035 | Execute first quarterly restore drill | Platform |
| 45 | FINAL-P2-026 | Add volume limit to bulk invite (max 100/request) | Backend |
| 46 | FINAL-P2-027 | Gate super_admin role assignment to existing super admins | Backend |
| 47 | FINAL-P2-028 | Add rate limit to test-email endpoint | Backend |
| 48 | FINAL-P2-004 | Add SDK tests for top 10 most-used modules | Backend |
| 49 | FINAL-P2-023 | Add requireAdmin to roles permission endpoint | Backend |
| 50 | FINAL-P2-024 | Add org scope enforcement to audit route | Backend |
| 51 | FINAL-P2-012 | Strengthen document share tokens to 256-bit random | Backend |
| 52 | FINAL-P2-011 | Add NOT NULL constraint to document_shares.organization_id | Backend |
| 53 | FINAL-P2-010 | Wire Chromatic into CI for visual regression testing | CI |
| 54 | FINAL-P2-009 | Add aria-labels to all icon-only buttons | Web |
| 55 | FINAL-P1-012 | Add SBOM generation workflow | CI |
| 56 | FINAL-P1-013 | Add container vulnerability scanning (Trivy) to build pipeline | CI |
| 57 | FINAL-P1-003 | Add `connect-timeout` middleware to Express | Backend |

### Phase 4 — Long-term (90+ days) — 14 items

| Priority | ID | Finding | Owner |
|----------|----|---------|-------|
| 58 | FINAL-P1-002 | Design multi-node HA for production | Infra |
| 59 | FINAL-P1-008 | Fix audit_logs cascade policy | Backend |
| 60 | FINAL-P1-033 | Add prefix search mode for B-tree index usage | Backend |
| 61 | FINAL-P2-008 | Audit all 60 feature pages for empty/error state handling | Web |
| 62 | FINAL-P2-017 | Add Terraform helper script for local operations | Infra |
| 63 | FINAL-P2-018 | Clean terraform state from git history | Infra |
| 64 | FINAL-P2-019 | Remove default Redis password, make required | Infra |
| 65 | FINAL-P2-020 | Configure or remove `__LOG_ENDPOINT__` dead code | Web |
| 66 | FINAL-P2-013 | Add CASCADE delete to webhook_deliveries FK | Backend |
| 67 | FINAL-P2-014 | Standardize all list endpoints to PaginatedResult<T> envelope | Backend |
| 68 | FINAL-P2-015 | Add auth to /metrics endpoint | Backend |
| 69 | FINAL-P2-016 | Create `.npmrc` with registry configuration | Infra |
| 70 | FINAL-P3-001 | Define typography scale in Tailwind config | Web |
| 71 | FINAL-P3-006 | Add cron task for orphaned storage file cleanup | Worker |

---

## Validation Plan

| Phase | Validation Method | Success Criteria |
|-------|------------------|------------------|
| Phase 1 | Manual security review + CI passes | No new P0/P1 findings from re-audit |
| Phase 2 | Automated tests + CI gates | All new code has >80% coverage |
| Phase 3 | E2E tests + quarterly restore drill | 50+ E2E spec files, verified restore |
| Phase 4 | Full re-audit | <10 P1 findings remaining |
