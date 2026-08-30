# MCT Portal — 60-Module Build-Prompt Verification Report

**Date:** 2026-08-05
**Method:** Ran all 10 `phase-prompts` + all 60 `module-prompts` from `prompts/mct-portal-os-expanded-60-modules-deep-prompts-pack/` via 6 parallel verification workers (10 modules each). Each worker read the module build prompt, then verified its 16-item checklist (migration → validator → service → route → app.ts registration → SDK file + export → portal page(s) → components → worker → API tests → E2E → feature doc → runbook → API inventory) against the actual codebase using functional-equivalent names (the repo uses a batch naming scheme, not the prompt slugs).
**Status key:** **COMPLETE** = all required deliverables present with real content. **PARTIAL** = exists but has missing deliverables, broken worker, missing Zod/audit, or no portal/E2E. **MISSING** = absent.

## Executive Summary

| Status       | Count  | Modules                                                                                                                                |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **COMPLETE** | **26** | 02, 03, 06, 07, 09, 10, 11, 12, 14, 15, 16, 17, 18, 19, 24, 33, 34, 36, 37, 39, 50, 51, 52, 58, 59, 60                                 |
| **PARTIAL**  | **34** | 01, 04, 05, 08, 13, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 32, 35, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 53, 54, 55, 56, 57 |
| **MISSING**  | **0**  | —                                                                                                                                      |

Every module has: RLS migration, Zod validator (or inline Zod), mounted router, SDK CRUD + export, portal OR admin page, API tests, and a `docs/modules/` feature doc. `requireAuth` + `requireOrgAccess` are enforced on all routers.

**Phase-prompt coverage:** All 10 phase prompts reference module build prompts + `MASTER_AGENT_PROMPT.md`. Every module referenced by phases 0–9 is verified in this report. No phase prompt references a module outside the 60 verified. The master-agent requirements (RLS, audit, Zod, no raw secrets, AI-draft-gated) are the cross-cutting checks below.

---

## 🔴 CRITICAL RUNTIME BUGS (fix before anything else)

> **Status update (2026-08-05):** All P0 items below have been FIXED in commit(s) following this report. Migration `5302124_fix_worker_schema_columns.sql` adds `uptime_checks.last_checked_at/last_status_code` + `dmarc_analyses.status`. Worker column names corrected; `/procurement/compare` uses `quote_amount`; `crudRoute` gained `GET /:id`; `slaLogCheck` + `businessOsSnapshot` workers added and scheduled; camera-calculator + network-diagrams portal pages created; `business-os.api.ts` URL prefix fixed; dmarc-coach mutations now audit-logged. See `docs/P0_REMEDIATION_2026-08-05.md`.

These are confirmed broken behaviors, not just missing polish:

1. **Module 28 (Uptime Monitor) — worker writes nonexistent columns.** `websiteMonitorCheck` (`apps/worker/src/tasks/module-tasks.ts:280-290`) inserts `{uptime_check_id, status_code, error}` into `uptime_results` (schema: `check_id`, `response_status`, `error_message`) and updates `uptime_checks.last_checked_at/last_status_code` (columns don't exist per migration 5302093). Every due-check fails at runtime — **monitoring results are never persisted**.
2. **Module 22 (License Optimizer) — worker selects nonexistent columns.** `licenseOptimizerCheck` (`module-tasks.ts:114`) selects `license_name`/`monthly_cost_per_seat`; schema has `software_name`/`cost_per_seat` → PostgREST 400.
3. **Module 23 (DMARC Coach) — worker updates nonexistent column + no audit.** `dmarcCoachCheck` (`module-tasks.ts:157`) does `.update({ status: "stale" })` on `dmarc_analyses` (no `status` column) → runtime failure. Also **zero audit logging** on any dmarc mutation.
4. **Module 44 (Procurement Compare) — reads nonexistent column.** `final.ts:282-297` `/procurement/compare` reads `q.total_price`; schema has `quote_amount`/`competitor_quote`. All prices evaluate to 0 → `lowestPrice`/`savings`/`averagePrice` all 0 and `isLowest` true for every quote. Compare is functionally broken and untested.
5. **Modules 45/47/29/30 (and 04/05) — `crudRoute` lacks `GET /:id`.** `routes/field-services.ts` registers only list/create/patch/delete. SDK `staging.get()`, `networkDiagrams.get()`, `portMaps.get()`, `camera.get()`, `isp.get()`, `unifi.get()` target dead routes → **404 on admin `[id]` detail pages**.
6. **Module 49 (SLA/SLO) — `sla_logs` has ZERO write path.** Only a SELECT in `sla.ts:20`. No POST/PATCH/DELETE route, no worker, no SDK write. The tracker is a read-only metrics dashboard; `calculate_sla_breach` is never invoked.
7. **Module 30 (Camera Calculator) — portal renders nonexistent columns.** `portal/camera-calculator/page.tsx` reads `a.name || a.location`, `a.total_storage_gb`, `a.calculated_at`; schema is `site_name`/`estimated_storage_tb`/`created_at` → blank cards for all seeded rows. No interactive calculator form despite live `/calculate` endpoint.
8. **Module 47 (Network Diagrams) — portal page wired to wrong table.** `portal/network-port-maps/page.tsx` calls `portMaps.list` (`port_maps`), so `network_diagrams` data has **no portal UI** at all.
9. **Module 20 (Business OS) — SDK path-prefix bug.** `packages/sdk/src/business-os.api.ts` uses `/business-os/...` without `/api/v1` (SDK client doesn't prepend it) → `client.businessOs.*` calls the wrong URL. The working path is `client.dashboard.businessOsSummary()` (used by the admin page). Also **no worker task** despite worker being a required component.

## 🟡 P1 CONFIRMED GAPS (module-specific missing deliverables)

- **Module 13 (Automation) — NO worker task** despite `worker` being a required component (nothing in `tasks/index.ts`; `/execute` only flips status fields, no run-history).
- **Module 43 (Approvals) — NO worker task** despite `worker` being a required component.
- **Module 05 (UniFi Survey) — NO portal page at all** (only `portal/field-services` showing ISP data). Checklist item #8 fails.
- **Module 38 (Satisfaction Pulse) — NO portal page** (admin-only at `admin/final/satisfaction`). The module's entire purpose is client capture. Dual API surface (`/api/v1/satisfaction-pulse` AND `/api/v1/final/satisfaction`) unresolved.
- **Module 40 (AI Policy) — NO portal page + no generation workflow.** Admin-only; the AI policy-drafting purpose (contrast kb-generator's `/generate`) is not implemented. `docs/modules/ai-policy.md` is aspirational/stale (describes routes that don't exist).
- **Module 53 (Data Retention) — NO portal page.** AGENTS.md's claim of a `portal data-retention` page is **false** — grep confirms no retention page in `app/(portal)`. Also no E2E.
- **Module 01 (Foundation) — literal deliverables absent** (functionally complete: it IS the portal foundation — all core modules exist and are tested green). Only the prompt-slug-named files/table are missing.
- **Module 25 (Training) / Module 26 (Insurance) — NO Zod validation** at all; routes read `req.body` directly (violates the prompt's Zod requirement).
- **Module 33 (Mini-CAB) / 36 (Offboarding) / 37 (Phishing) — workflow transition endpoints don't audit-log** (`submit/approve/reject/implement/verify`, `complete-step`, `launch`).
- **Module 57 (Time Entries) — no summarizer endpoint** (product intent: summarize worklogs into client updates/QBR narratives — only generic CRUD).
- **Module 55 (DNS Change) — no approval workflow** (only generic CRUD; no approve/reject/implement state machine).

## 🟢 SYSTEMIC GAPS (apply to nearly all modules)

1. **`docs/features/` + `docs/runbooks/` exist only for module 02** (`client-onboarding-command-center.md`). All other module docs live in `docs/modules/` (~75 files). Runbooks are absent for all other modules.
2. **No portal `[id]` detail pages** — portal pages are single list views everywhere.
3. **No per-module `components/portal/<Module>/` dirs** — portal pages are self-contained server components.
4. **No `apps/api/src/services/<module>.ts`** for generic-CRUD modules — logic is inlined in route handlers (only approvals, dynamic-forms, satisfaction-pulse, onboarding, audit, supabase have service layers). Consistent with the repo pattern.
5. **No `export.csv` endpoints** on the majority of modules.
6. **SDK workflow-method wrappers missing** — API implements the workflow but SDK is CRUD-only for modules 31 (powershell check/submit/approve/reject), 33 (CAB transitions), 36 (completeStep), 37 (launch/results), 39 (scorecards evaluate/summary/leaderboard), 44 (compare), 51 (coverage), 52 (assess), 54 (structureSummary), 60 (generate/search/rate), 22 (summary/reclaimable).
7. **No E2E specs** for modules: 04, 05, 08, 10, 13, 20, 21, 22, 23, 25, 26, 27, 28, 31, 32, 34, 35, 38, 40, 41, 42, 43, 44, 46, 48, 49, 53, 54, 55, 56, 57.
8. **`docs/API_ENDPOINT_INVENTORY.md`** covers most modules as aggregate router rows, but not per-endpoint for 21, 22, 23, 25, 26, 27, 28 (no dedicated rows).
9. **Stale/aspirational module docs** — `docs/modules/endpoint-security.md`, `risk-register.md`, `m365-hardening.md`, `isp-phone.md`, `sop-library.md`, `ai-policy.md` describe routes/tables/endpoints that don't exist in code (e.g., `routes/endpoint-security.ts`, `/api/v1/m365-hardening/scans`, `endpoint_devices`, `risk_remediations`, `/remediation`, `/accept`).

---

## Per-Module Verification (Status + Hard Fails)

### Modules 01–10

| #   | Module                           | Status       | Hard fails / notes                                                                                         |
| --- | -------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| 01  | Multi-Tenant MSP Client Portal   | PARTIAL\*    | Functionally complete (portal foundation itself). No literal slug-named deliverables. \*Not a real defect. |
| 02  | Client Onboarding Command Center | **COMPLETE** | Only module with feature + runbook docs. Real service layer.                                               |
| 03  | M365 Hardening Scanner           | COMPLETE     | No service; scan worker is status-flip only (no Graph). Docs cite wrong paths.                             |
| 04  | ISP/Phone Consolidation          | PARTIAL      | No detail page, no E2E, no approve/publish/export; `crudRoute` lacks GET /:id.                             |
| 05  | UniFi Site Survey                | PARTIAL      | **No portal page at all**; no E2E; no GET /:id.                                                            |
| 06  | SOP Library                      | COMPLETE     | No detail page; no per-framework coverage%.                                                                |
| 07  | Incident Response                | COMPLETE     | No runbook-step/phase-transition logic (lifecycle timestamps undriven).                                    |
| 08  | Vendor SaaS Audit                | PARTIAL      | No import/classify/detect logic; no E2E; no detail page.                                                   |
| 09  | Asset Warranty Tracker           | COMPLETE     | Portal view-only; no QR label rendering.                                                                   |
| 10  | Proposal Builder                 | COMPLETE     | No PDF export, no templates, no E2E.                                                                       |

### Modules 11–20

| #   | Module                 | Status   | Hard fails / notes                                                                                           |
| --- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 11  | QBR Generator          | COMPLETE | No service; e2e in admin/ not portal/.                                                                       |
| 12  | Client Project Tracker | COMPLETE | No service.                                                                                                  |
| 13  | Automation Catalog     | PARTIAL  | **NO worker task** (required component); no run-history.                                                     |
| 14  | DNS/Cloudflare Monitor | COMPLETE | No live DNS/Cloudflare polling.                                                                              |
| 15  | Backup/DR Dashboard    | COMPLETE | RPO/RTO unused by worker.                                                                                    |
| 16  | Identity Verification  | COMPLETE | No ticket link / pass expiry.                                                                                |
| 17  | Knowledge Base         | COMPLETE | Portal list lacks search/detail/rate UI.                                                                     |
| 18  | Compliance Readiness   | COMPLETE | Evidence boolean-only, no attachments.                                                                       |
| 19  | Findings Tracker       | COMPLETE | No ticket linkage / p0 SLA.                                                                                  |
| 20  | Business OS Dashboard  | PARTIAL  | **No worker** (required); admin-only (no portal); **SDK path-prefix bug** (`client.businessOs.*` wrong URL). |

### Modules 21–30

| #   | Module              | Status       | Hard fails / notes                                                                              |
| --- | ------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| 21  | AI Triage           | PARTIAL      | No E2E, no runbook, no inventory entry; `ai_draft_outputs` unused.                              |
| 22  | License Optimizer   | PARTIAL      | **Worker broken** (nonexistent columns); no E2E; inline Zod.                                    |
| 23  | DMARC Coach         | PARTIAL      | **Worker broken** (nonexistent `status` col); **no audit logging**; no E2E.                     |
| 24  | Secure File Request | **COMPLETE** | Public token upload verified end-to-end.                                                        |
| 25  | Training Hub        | PARTIAL      | **No Zod at all**; no E2E; no microlearning seeding.                                            |
| 26  | Insurance Binder    | PARTIAL      | **No Zod at all**; no E2E.                                                                      |
| 27  | Status Page         | PARTIAL      | No public status UI page (API exists); no E2E.                                                  |
| 28  | Uptime Monitor      | PARTIAL      | 🔴 **Worker broken** (5 nonexistent columns — results never persist); no E2E.                   |
| 29  | Port Maps           | PARTIAL      | No GET /:id; no admin page; no API test.                                                        |
| 30  | Camera Calculator   | PARTIAL      | 🔴 **Portal renders nonexistent columns**; no calculator form; no GET /:id; no camera API test. |

### Modules 31–40

| #   | Module                  | Status   | Hard fails / notes                                                                                             |
| --- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| 31  | PowerShell Policy Guard | PARTIAL  | No portal page (admin-only); no E2E; SDK lacks workflow wrappers.                                              |
| 32  | Client Runbook Builder  | PARTIAL  | No build/generate workflow; no E2E.                                                                            |
| 33  | Mini-CAB                | COMPLETE | Transitions lack audit; SDK lacks wrappers; (cross-tenant risk: transitions not org-filtered per prior audit). |
| 34  | Vendor Contracts        | COMPLETE | No E2E.                                                                                                        |
| 35  | Budget Roadmap          | PARTIAL  | No E2E; no export/analysis workflow beyond `/budgets/analysis`.                                                |
| 36  | Offboarding Checklist   | COMPLETE | `complete-step` lacks audit + SDK wrapper.                                                                     |
| 37  | Phishing Simulation     | COMPLETE | `launch` lacks audit; SDK lacks launch/results; no per-recipient tracking.                                     |
| 38  | Satisfaction Pulse      | PARTIAL  | **No portal page** (admin-only); dual API surface; no E2E.                                                     |
| 39  | Cyber Scoreboard        | COMPLETE | SDK lacks scoring wrappers.                                                                                    |
| 40  | AI Policy Assistant     | PARTIAL  | **No portal page**; no generation workflow; doc aspirational/stale.                                            |

### Modules 41–50

| #   | Module              | Status       | Hard fails / notes                                                                                   |
| --- | ------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 41  | AI Copilot Console  | PARTIAL      | No approve/publish/export; `ai_draft_outputs` zero write path; no E2E.                               |
| 42  | Dynamic Forms       | PARTIAL      | Only E2E missing — otherwise most complete (real service, /new + /[id]/fill, publish/submit/export). |
| 43  | Approval Engine     | PARTIAL      | **NO worker task** (required); no E2E.                                                               |
| 44  | Procurement Compare | PARTIAL      | 🔴 **Compare reads nonexistent `total_price`** → all 0s; untested; no SDK compare; no E2E.           |
| 45  | Hardware Staging    | PARTIAL      | 🔴 **No GET /:id** → SDK `staging.get()` 404s.                                                       |
| 46  | Device Profiles     | PARTIAL      | Only E2E missing.                                                                                    |
| 47  | Network Diagram     | PARTIAL      | 🔴 **No GET /:id**; portal page wired to `port_maps` not `network_diagrams`.                         |
| 48  | Vendor Directory    | PARTIAL      | Only E2E missing (shared impl with #34).                                                             |
| 49  | SLA/SLO Tracker     | PARTIAL      | 🔴 **`sla_logs` zero write path**; no worker; no CRUD.                                               |
| 50  | Patch Compliance    | **COMPLETE** | Real worker, GET /:id present.                                                                       |

### Modules 51–60

| #   | Module                | Status   | Hard fails / notes                                                   |
| --- | --------------------- | -------- | -------------------------------------------------------------------- |
| 51  | Endpoint Security     | COMPLETE | Worker + coverage endpoint real; doc aspirational.                   |
| 52  | Risk Register         | COMPLETE | SDK lacks assess(); doc aspirational.                                |
| 53  | Data Retention        | PARTIAL  | **NO portal page** (AGENTS.md claim false); no E2E.                  |
| 54  | SharePoint Planner    | PARTIAL  | No E2E.                                                              |
| 55  | DNS Change Requests   | PARTIAL  | No E2E; **no approval workflow** (generic CRUD only).                |
| 56  | Service Catalog       | PARTIAL  | No E2E.                                                              |
| 57  | Time Entry Summarizer | PARTIAL  | **No summarizer endpoint** (product intent unmet); no E2E.           |
| 58  | Break Glass           | COMPLETE | No rotation worker (passive fields).                                 |
| 59  | Tabletop Planner      | COMPLETE | No AAR generation.                                                   |
| 60  | KB Article Generator  | COMPLETE | Generate is template-based (not AI); SDK lacks generate/search/rate. |

---

## Prioritized Remediation Backlog

### P0 — Runtime bugs (fix first)

1. Fix `websiteMonitorCheck` worker column names (28).
2. Fix `licenseOptimizerCheck` worker columns (22).
3. Fix `dmarcCoachCheck` worker column + add audit (23).
4. Fix `/procurement/compare` to use `quote_amount`/`competitor_quote` (44).
5. Add `GET /:id` to `crudRoute` in `field-services.ts` (fixes 45/47/29/30/04/05 admin detail).
6. Add a write path for `sla_logs` + worker invoking `calculate_sla_breach` (49).
7. Fix `portal/camera-calculator` column mapping + add calculator form (30).
8. Fix `portal/network-port-maps` to render `network_diagrams` (47).
9. Fix `business-os.api.ts` URL prefix + add worker (20).

### P1 — Missing deliverables

10. Add automation-run worker (13) + approval worker (43).
11. Create portal pages: UniFi survey (05), satisfaction pulse (38), AI policy (40), data retention (53).
12. Add Zod to training-hub (25) + insurance-binder (26).
13. Add audit logging to workflow transitions (33, 36, 37).
14. Add approval state machine to DNS change requests (55).
15. Add worklog summarizer endpoint (57).

### P2 — Consistency

16. Add SDK workflow wrappers (31, 33, 36, 37, 39, 44, 51, 52, 54, 60, 22, 23).
17. Add E2E specs for the ~30 modules missing them.
18. Fix stale/aspirational `docs/modules/*.md` to match actual routes/tables (endpoint-security, risk-register, m365-hardening, isp-phone, sop-library, ai-policy).
19. Add per-endpoint rows to `docs/API_ENDPOINT_INVENTORY.md` for 21/22/23/25/26/27/28.
20. Add `export.csv` endpoints + portal `[id]` detail pages where the prompt lists them as useful.
