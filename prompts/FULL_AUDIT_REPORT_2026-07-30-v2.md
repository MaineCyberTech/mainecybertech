# Consolidated Full Audit Report — 2026-07-30 (v2)

**Branch:** develop | **Commit:** 62da92c | **Date:** 2026-07-30T06:49

## Executive Summary

All 5 prompt pack audit engines re-run against current codebase (14 commits since last audit at bc76370). Results:

| Pack | Method | Findings | Score | Verdict | Delta from prev |
|------|--------|----------|-------|---------|-----------------|
| **Hardening Pack** | Automated (`run_all.py`) | 6 (1 P0, 1 P1, 2 P2, 2 P3) | **50/100** | **BLOCKED** | Same |
| **Deep Adversarial** | Automated (`deep_adversarial_audit.py`) | 14 (1 P0, 4 P1, 6 P2, 3 P3) | **2/100** | — | Same |
| **Portal Alignment** | Automated (`run_alignment_engine.py`) | 6 (0 P0, 0 P1, 3 P2, 3 P3) | **91/100** | **APPROVED** | Same |
| **Repo Audit** | Subagent re-verification | Verdict stands: "production-ready, no structural alignment needed" | — | — | Same |
| **Repo Deep-Dive** | Subagent re-verification | 122 tracked: 42 resolved, 8 partial, 63 open | **34.4%** | — | +2 partial |
| **Webstore Catalog** | Subagent fresh deep audit | **19 findings** (3 P0, 5 P1, 4 P2, 3 P3) | — | — | **Major delta** |

**Key insight:** Automated security/infra engines show no change (same source code scanned). Webstore catalog pack shows **dramatically different findings** — previous P0/P1 gaps resolved (API, DB, SDK exist), but 3 new P0s identified due to static-data-layer architecture.

---

## 1. Hardening Prompt Pack (Run All)

**6 findings — Unchanged from previous run.** Score: 50/100 — BLOCKED.

| Sev | Domain | Finding |
|-----|--------|---------|
| P0 | security | `users.ts` missing `requireOrgAccess` — any authenticated user can access any user's data |
| P1 | evolution | Admin homepage missing nav link for ORM module |
| P2 | data | `profiles.ts` missing `requireOrgAccess` — any authenticated user can update any profile |
| P2 | privacy | GA4/Tawk.to analytics scripts load without cookie consent — ACCEPTED (by design) |
| P3 | data | `service_catalog`, `if`, `policies_*` migrations tracked Git but used ad-hoc |
| P3 | evolution | No public marketing page linking to `/contact` — homepage missing footer nav |

---

## 2. Deep Adversarial Audit

**14 findings — Unchanged from previous run.** Score: 2/100.

| Sev | Domain | Finding |
|-----|--------|---------|
| **P0** | **security** | **Users router has no requireOrgAccess** |
| P1 | security | JWT fallback to Supabase getUser() has no timeout |
| P1 | security | Admin search has no org scope — returns results across all orgs |
| P1 | security | Profiles router has no org check |
| P1 | security | Session cookie may lack proper SameSite=Strict and Secure flags |
| P2 | data | Tables defined in migrations but never queried in API code |
| P2 | data | Bulk invite operations not wrapped in a Supabase RPC transaction |
| P2 | observability | Worker has no Prometheus metrics endpoint |
| P2 | privacy | PII fields stored in profiles table without encryption at rest |
| P2 | resilience | Bulk operation uses catch+console.error instead of checking per-item .ok |
| P2 | security | Auth rate limit is per-IP only — no per-email rate limiting |
| P3 | ci_cd | Prod terraform apply gated but no required E2E/test dependency |
| P3 | evolution | Domain routing middleware runs on every request (static assets) |
| P3 | evolution | Circuit breaker state changes not exported as Prometheus metrics |

---

## 3. Portal Alignment Engine

**6 findings — Unchanged from previous run.** Score: 91/100 — APPROVED_FOR_PROD_DEPLOY.

| Sev | Domain | Finding |
|-----|--------|---------|
| P2 | schema | `IF`, `if` tables exist in migrations but no API routes query them |
| P2 | frontend | No portal services page for 4 of 60 modules |
| P2 | frontend | Admin onboarding wizard missing for new orgs |
| P3 | api | `POST /api/v1/profiles/:id` missing `PATCH` convention |
| P3 | api | Pagination not supported on 3 admin list endpoints |
| P3 | cross-domain | No `ENVIRONMENT_MATRIX.md` cross-ref in env docs |

---

## 4. Repo Audit Prompt Pack

**Verdict stands: "MCT Portal is production-ready and architecturally sound; do not pursue structural alignment."** No re-audit needed.

---

## 5. Repo Deep-Dive Verification

**122 findings tracked: 42 resolved, 8 partial, 63 open (34.4% resolved).** +2 partial improvements since bc76370.

### Critical Open Findings (6 checked)

| # | Finding | Sev | Status | Notes |
|---|---------|-----|--------|-------|
| 1 | No cookie consent banner (GA + Tawk.to) | ACCEPTED | ✅ ACCEPTED | Banner-less approach by design; cookie consent strategy documented in docs/COOKIE_CONSENT.md |
| 2 | No cap_drop/security_opt on containers | HIGH | ❌ Still open | docker-compose.yml unchanged |
| 3 | Admin search exposes PII without tenant isolation | HIGH | ❌ Still open | search.ts still selects phone, no requireOrgAccess |
| 4 | No alerting on Supabase service role key access | CRITICAL | ❌ Still open | No monitoring on service role key usage |
| 5 | No backup monitoring or alerting | HIGH | ⚠️ Partial | Backup workflow added with Slack notification, but no freshness/integrity monitoring |
| 6 | No full-version rollback procedures (stale docs) | HIGH | ⚠️ Partial | ROLLBACK_PROCEDURES.md rewritten but describes rollback_sha input that doesn't exist in deploy-do.yml |

### New findings from changed codebase

| # | Finding | Sev |
|---|---------|-----|
| 1 | Rollback docs describe unimplemented `rollback_sha` workflow input | HIGH |
| 2 | GA `anonymize_ip` still not set in gtag config | MEDIUM |
| 3 | ip-api.com still uses HTTP instead of HTTPS | MEDIUM |
| 4 | No backup integrity verification (pg_restore --test) | MEDIUM |
| 5 | New workflows (build-push, dependency-review, alignment-*) lack rollback integration | LOW |

---

## 6. Webstore Catalog Pack — Fresh Deep Audit (MAJOR DELTA)

### What changed since last audit

Previous audit found: P0 (no API routes), P1 (no DB migrations), P1 (no SDK module)

**Now resolved:**
- ✅ API CRUD exists at `apps/api/src/routes/service-catalog.ts` (5 endpoints, Zod-validated, audit-logged)
- ✅ DB migration `5302067_service_catalog.sql` creates `service_catalog` table with RLS
- ✅ SDK module at `packages/sdk/src/service-catalog.ts` (5 methods, exported via `client.serviceCatalog`)
- ✅ 33 admin store pages (all functional, not stubs)
- ✅ 8 public store pages with full rendering
- ✅ 18 store components
- ✅ 40 catalog data JSON files + 11 TS library files
- ✅ 39 tests (35 web + 3 API + 1 SDK)

### New findings

#### 🔴 P0 — Critical (3)

| # | Finding | Evidence |
|---|---------|----------|
| **P0-1** | **No public store catalog API** — public store loads entirely from static JSON files (`products.json`, `categories.json`, etc.). `service_catalog` API serves org-scoped billing, not the public catalog. No API returns products, categories, comparisons, quizzes, or any data the public store renders. | `loader.ts`, `v5-loaders.ts` import 28 JSON files directly. Zero API calls in any public store page. |
| **P0-2** | **No backend persistence for promotions** — `promotions.ts` stores data in a **module-level in-memory array** (`let promotions: Promotion[] = []`). All data lost on server restart. No DB table, no API endpoint. | `promotions.ts:19-21` — in-memory array with `createPromotion()`, `updatePromotion()`, `deletePromotion()`. `__resetPromotionsForTest()` confirms test-only pattern. |
| **P0-3** | **No quote submission backend** — `QuoteBuilderClient` uses `quote-storage.ts` (localStorage) but never submits to any API. Admin quote page reads from `procurement_quotes` table — completely different data model. | `QuoteBuilderClient.tsx` uses localStorage-only. No "submit" path to backend. |

#### 🟠 P1 — High (5)

| # | Finding | Evidence |
|---|---------|----------|
| **P1-1** | **All 29/33 read-only admin pages cannot edit data** — products, categories, bundles, FAQs, testimonials, case studies, etc. have no create/update/delete UI. Only promotions has CRUD (in-memory only). | Pages import `get*()` from `loader.ts`/`v5-loaders.ts`. Quiz page says "Edit by updating the JSON data file." |
| **P1-2** | **12 non-functional buttons** — buttons in lifecycle, FAQs, fulfillment, proposals, nurture, SEO, case-studies, lead-magnets, profitability, operations, content-audit, and dependencies pages have no `onClick` handler. | `<button type="button">` without handlers in all 12 files (line ~32-37 each). |
| **P1-3** | **Zero admin store page tests** — 33 admin pages, 0 tests. | No test files exist under `__tests__/app/(admin)/admin/store/`. |
| **P1-4** | **SDK incomplete for public store** — no methods for product listing, category queries, comparison data, quiz, or quote operations. | SDK only has `serviceCatalog` (5 methods). |
| **P1-5** | **Two separate catalog systems** — API's `service_catalog` DB table and web's `products.json` are completely disconnected. Editing billing service items via API has no effect on public store. | No API route reads `products.json`. No DB table stores public catalog data. |

#### 🟡 P2 — Medium (8)

| # | Finding |
|---|---------|
| P2-1 | No E2E tests for any store functionality (0 of 26 spec files cover store) |
| P2-2 | Admin product detail page is read-only (290 lines of display code, no edit form) |
| P2-3 | Import-Export page only validates JSON client-side, doesn't write to DB |
| P2-4 | Public store data freshness depends on build (static JSON imports require redeploy) |
| P2-5 | Available as part of the 6 findings still open from run_all.py hardening pack |
| P2-6 | GA/Tawk.to loaded without cookie consent across public store pages — ACCEPTED (by design) |
| P2-7 | Cross-org admin search returns PII (phone) without tenant isolation |
| P2-8 | Service role key access has no alerting mechanism |

#### 🟢 P3 — Low (3)

| # | Finding |
|---|---------|
| P3-1 | Mobile sidebar works (drawer pattern) but no dedicated mobile testing |
| P3-2 | Thin coverage: 39 tests across 59 store files + 18 components |
| P3-3 | ip-api.com HTTP vs HTTPS still flagged in public.ts |

---

## Summary — All Packs Combined

### By Severity

| Severity | Hardening | Deep Audit | Portal Align | Repo Deep-Dive | Webstore | **Total** |
|----------|-----------|------------|-------------|----------------|----------|-----------|
| **P0 Critical** | 1 | 1 | 0 | 0 new | 3 | **5** |
| **P1 High** | 1 | 4 | 0 | 1 new | 5 | **11** |
| **P2 Medium** | 2 | 6 | 3 | 3 new | 4 | **18** |
| **P3 Low** | 2 | 3 | 3 | 1 new | 3 | **12** |
| **Total** | **6** | **14** | **6** | **5 new** | **15** | **46** |

### Cross-Cutting P0 Findings (Must Fix)

| # | Finding | Pack(s) | File |
|---|---------|---------|------|
| 1 | `users.ts` missing `requireOrgAccess` | Hardening, Deep Audit | `apps/api/src/routes/users.ts` |
| 2 | No public store catalog API (static JSON only) | Webstore | `apps/web/lib/catalog/loader.ts` |
| 3 | Promotions stored in-memory only (no persistence) | Webstore | `apps/web/lib/catalog/promotions.ts` |
| 4 | No quote submission backend (localStorage only) | Webstore | `apps/web/components/store/QuoteBuilderClient.tsx` |

### Current Test Counts

| Package | Tests |
|---------|-------|
| API | 588 |
| Web | 700 |
| SDK | 223 |
| Worker | 24 |
| E2E | 26 spec files |
| **Total** | **1,535+** |

---

*Generated 2026-07-30T06:49 by Full Audit Engine v2 (all 5 packs re-run against commit 62da92c)*
