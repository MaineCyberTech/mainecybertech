# Release Notes & Changelog

**Audit:** repo-deep-dive | **Run:** 20260730-0650-develop-62da92c | **Branch:** develop (62da92c)
**Previous audit:** 20260729-0025-develop-bc76370 | **Commits since:** 19 (704 files changed, +223,718 -26,608)

---

## Unreleased Changes (bc76370 → 62da92c)

### Summary
- 19 commits, 704 files changed
- 223,718 insertions, 26,608 deletions
- 37 domain audit reports generated

### New Audit Findings (this run)

#### P0 Critical

| ID | Finding | Evidence |
|----|---------|----------|
| REL-P0-001 | No migration rollback scripts — 68 one-way migrations | `supabase/migrations/*.sql` |
| REL-P0-002 | No OpenAPI/Swagger spec committed | `docs/API_ENDPOINT_INVENTORY.md` |
| REL-P0-003 | No MIME/content-type validation on document upload | `documents.ts:158-295` |
| REL-P0-004 | No entitlement gating based on subscription status | No middleware exists |
| REL-P0-005 | SMTP config optional — email delivery silently fails in production | `config/env.ts:13-17` |
| REL-P0-006 | Jira/JSM/M365 inbound webhook signatures are optional | `webhooks.ts:217-352` |

#### P1 High (selected)

| ID | Finding | Evidence |
|----|---------|----------|
| REL-P1-001 | Tenant isolation bypassed in test mode | `org-access.ts:44` |
| REL-P1-002 | Users API returns full profile of any user (no org gate) | `users.ts:160-176` |
| REL-P1-003 | Avatar upload has no ownership verification | `profiles.ts:141-188` |
| REL-P1-004 | No typed DB client — `as any` casts throughout | All route files |
| REL-P1-005 | No soft-delete on tickets/projects/documents | All entity routes |
| REL-P1-006 | DB query metric defined but never called (`recordDbQuery`) | `metrics.ts:22-28` |
| REL-P1-007 | Worker has no Prometheus metrics | `worker/src/main.ts` |
| REL-P1-008 | Caddyfile.prod missing CSP header | `Caddyfile.prod` |
| REL-P1-009 | Terraform backend state bucket drift | `providers.tf:5` vs `env/*.hcl:4` |
| REL-P1-010 | No container vulnerability scanning | No workflow step |
| REL-P1-011 | No SBOM generation in CI | No workflow |
| REL-P1-012 | No database index audit — table scans on key tables | Missing migration |
| REL-P1-013 | No RTO/RPO defined | All docs |
| REL-P1-014 | Terraform state stored only locally | `terraform/` directory |
| REL-P1-015 | No service worker or offline support | No SW file |

### Audit Coverage

| Domain | Report | Status |
|--------|--------|--------|
| Repository Inventory | 01 | ✅ |
| Architecture & Topology | 02 | ✅ |
| Feature Implementation | 03 | ✅ |
| Usability & Workflow | 04 | ✅ |
| UI/UX & Accessibility | 05 | ✅ |
| Security & Tenancy | 06 | ✅ |
| Data Schema & Migrations | 07 | ✅ |
| API Contracts & Realtime | 08 | ✅ |
| Testing & Quality | 09 | ✅ |
| CI/CD & Governance | 10 | ✅ |
| Supply Chain & Secrets | 11 | ✅ |
| Infrastructure & Drift | 12 | ✅ |
| Resilience & Recovery | 13 | ✅ |
| Observability & Monitoring | 14 | ✅ |
| Performance & Cost | 15 | ✅ |
| Mobile & PWA | 17 | ✅ |
| Privacy & Compliance | 18 | ✅ |
| Platform Evolution | 19 | ✅ |
| AI & Agent Readiness | 20 | ✅ |
| Repo Hygiene & Tech Debt | 21 | ✅ |
| Access Control Matrix | 24 | ✅ |
| Multi-Tenant Isolation | 25 | ✅ |
| Admin Abuse Cases | 26 | ✅ |
| Webhook Security | 27 | ✅ |
| File Upload Security | 28 | ✅ |
| Billing & Payments | 29 | ✅ |
| Notification Delivery | 30 | ✅ |
| Search & Indexing | 31 | ✅ |
| Backup & DR | 32 | ✅ |
| Incident Tabletop | 33 | ✅ |
| Branch Protection | 34 | ✅ |
| SBOM & License Policy | 35 | ✅ |
| Container Security | 36 | ✅ |
| Supabase RLS | 37 | ✅ |
| Env & Secret Rotation | 38 | ✅ |
| Analytics & Privacy | 39 | ✅ |
| **Documentation/DevEx** | **16** | **❌ Absent** |

---

## What Changed: Detailed File Inventory

### Audit Infrastructure
- Added 37 domain audit reports to `prompts/repo-deep-dive/20260730-0650-develop-62da92c/`
- Previous run output preserved at `20260729-0025-develop-bc76370/`

### No Application Code Changes
This audit run produced no modifications to application code, infrastructure configs, tests, or documentation. It is a read-only assessment generating 37 evidence-based domain reports and this aggregated final output.

---

## Release Versioning

| Component | Version | Notes |
|-----------|:-------:|-------|
| Commit | 62da92c | develop branch |
| API | N/A | No version change |
| Web | N/A | No version change |
| Worker | N/A | No version change |
| SDK | N/A | No version change |
| Audit run | 20260730-0650-develop-62da92c | Full codebase deep-dive |
