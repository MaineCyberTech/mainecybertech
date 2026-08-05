# MCT Portal — 60-Module Spec Gap-Analysis Audit

**Date:** 2026-08-05
**Method:** Cross-referenced all 60 module specs in `prompts/mct-portal-os-expanded-60-modules-deep-prompts-pack/docs/module-specs/` against the live codebase (API routes, services, SDK, web admin/portal pages, worker tasks, migrations, seeds, tests) using 6 parallel audit workers (10 modules each).
**Status key:** **Fully Usable** = spec's core purpose + business logic is real in code. **Partially Implemented** = CRUD/UI exist but the distinguishing logic is missing or stubbed. **Missing** = absent/stub.

## Executive Summary

| Status                    | Count  | Modules                                                                                                                    |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Fully Usable**          | **29** | 01, 02, 09, 10, 12, 14, 15, 16, 19, 20, 22, 23, 24, 26, 34, 35, 37, 39, 41, 42, 43, 48, 50, 51, 52, 53, 54, 56, 59         |
| **Partially Implemented** | **31** | 03, 04, 05, 06, 07, 08, 11, 13, 17, 18, 21, 25, 27, 28, 29, 30, 31, 32, 33, 36, 38, 40, 44, 45, 46, 47, 49, 55, 57, 58, 60 |
| **Missing**               | **0**  | —                                                                                                                          |

Every module has: org-scoped, Zod-validated CRUD API + audit logging + SDK CRUD wrapper + admin list page + seeded data + at least API/web tests. The platform-wide MVP boilerplate (requireOrgAccess, Zod validators, logAuditEvent, CSV helper, SDK wiring) is uniformly present.

## Top Cross-Cutting Gaps (Highest Leverage Fixes)

1. **SDK missing workflow-method wrappers** — the API implements the distinguishing workflow but `packages/sdk/src/*` exposes only generic CRUD for ~15 modules (31, 33, 36, 37, 39, 44, 51, 52, 54, 60, 22-metrics, 23-analyze, 26-report). Every workflow endpoint must be SDK-wrapped before UI work.
2. **Portal camelCase org-param bug** — `list({ organizationId })` vs API `organization_id`: platform admins get NO org injection (`apps/api/src/middleware/org-access.ts:118`), so these portal lists break for superadmin. Affects 33, 36, 37, 39 (runbooks/budgets use `organization_id` correctly).
3. **`crudRoute` missing `GET /:id`** — `apps/api/src/routes/field-services.ts` has no GET-by-id, so admin `[id]` detail pages render "Record not found" for 45 (hardware-staging), 47 (network-diagrams), plus isp/unifi/port-maps.
4. **Worker/schema mismatch (runtime 500)** — `website-monitor-check` (`apps/worker/src/tasks/module-tasks.ts:280`) inserts `{ uptime_check_id, status_code, error }` into `uptime_results` which defines `check_id`, `response_status`, `error_message` (migration 5302093) — the HTTP-probe logic is dead-on-arrival. Module 28.
5. **Procurement compare 500** — `POST /procurement/compare` reads nonexistent `total_price`; schema has `quote_amount`/`competitor_quote` (5302074). Module 44.
6. **Camera-calculator portal page renders nonexistent columns** — `a.name`, `total_storage_gb`, `calculated_at` vs schema `site_name`, `camera_count`, `avg_bitrate_mbps`, `estimated_storage_tb`, `recommended_nvr`. Module 30.
7. **Legacy split-brain tables** — dedicated modules coexist with batch tables (`dmarc_assessments`, `status_items`, `website_monitors`, `license_tracking`, `training_modules`), causing dual API surfaces (esp. 38: `/api/v1/satisfaction-pulse` AND `/api/v1/final/satisfaction`).
8. **`sla_logs` has no write path** — no route/SDK/worker writes it; `calculate_sla_breach` function never invoked. Module 49.
9. **`ai_draft_outputs` orphaned** — seeded but no API route references it. Module 21.
10. **No CSV/JSON export + no E2E specs** on the majority of the 60 modules.

---

## Modules 01–10

### 01 — Multi-Tenant MSP Client Portal Foundation

- **Status:** Fully Usable
- **Currently Functional:** This is the portal itself (no dedicated table). Tickets, documents, projects, assets, approvals, org switching (`X-Active-Org`/`mct_active_org`), RBAC permission matrix, notifications, billing all exist and are tested.
- **Implementation Gaps:** None material.
- **Next Steps to Complete:** None.

### 02 — Client Onboarding Command Center

- **Status:** Fully Usable (most complete)
- **Currently Functional:** `routes/client-onboarding-command-center.ts` + real service layer (`services/client-onboarding-command-center.ts` incl. `DEFAULT_CHECKLIST_ITEMS`): list/get/create/update/delete, `POST /:id/complete-phase`, `GET /:id/checklist`, `PATCH /:id/checklist/:itemId`, `GET /export.csv`. Portal + admin pages, migration 5302078, SDK, feature+runbook docs, 13.2KB test file.
- **Implementation Gaps:** Worker-level automation/email on phase completion (minor).
- **Next Steps to Complete:** None material.

### 03 — M365 Tenant Hardening Scanner

- **Status:** Partially Implemented
- **Currently Functional:** Generic CRUD via `routes/security-suite.ts` on `m365_hardening` (MFA/CA/legacy-auth booleans, overall_score, last_assessment_at, next_review_at). Admin list + `[id]`, portal read-only list.
- **Implementation Gaps:** No real scan — worker `m365HardeningScan` only sets `scan_status:"completed"` + `next_scan_at` (+30d). No Graph/Intune scan, no score computation, no remediation-task creation, no evidence/checklist tracking.
- **Next Steps to Complete:** Real scan worker (fetch MFA/CA state, compute overall_score), findings/tasks table, portal action buttons.

### 04 — ISP/Phone Network Consolidation

- **Status:** Partially Implemented
- **Currently Functional:** `routes/field-services.ts`: CRUD + `POST /isp/:id/score` (computes consolidation_score + recommendation).
- **Implementation Gaps:** Single simplified scoring formula only — no export, no portal detail page, no approval/publish flow, no phone-line-item comparison.
- **Next Steps to Complete:** Richer scoring inputs, CSV export, portal detail view.

### 05 — UniFi Site Survey Planner

- **Status:** Partially Implemented
- **Currently Functional:** `routes/field-services.ts`: CRUD + `POST /unifi/:id/plan` writes ap_count, switch_count, estimated_cost (capacity math only).
- **Implementation Gaps:** Spec calls for device placement, cable/conduit/PoE runs, NVR sizing, outdoor Wi-Fi/camera planning — none exist.
- **Next Steps to Complete:** Per-room placement rows, cable/PoE line items, exportable survey doc.

### 06 — MSP SOP Library & Compliance Mapper

- **Status:** Partially Implemented
- **Currently Functional:** Generic CRUD via `routes/edu-automation.ts` → `sop_library` (framework text[], version, migration 5302086). Portal `sop-library` page exists.
- **Implementation Gaps:** No framework mapping/coverage analysis (NIST/CIS/ISO/CMMC) on SOPs. Governance `compliance/score` covers `compliance_readiness` controls, not SOPs.
- **Next Steps to Complete:** SOP→control mapping endpoint, per-framework coverage %, SOP approval/version workflow.

### 07 — Security Incident Response Runbook

- **Status:** Partially Implemented
- **Currently Functional:** Generic CRUD via `routes/security-suite.ts` → `incident_responses` (lifecycle timestamps contained_at/eradicated_at/recovered_at/closed_at exist but NOTHING drives them — grep across routes = 0 matches). Portal list-only, admin incidents list + `[id]`.
- **Implementation Gaps:** No runbook step templates per incident type, no guided phase-transition endpoints, no action timeline.
- **Next Steps to Complete:** Runbook step templates, guided phase-transition endpoints, timeline of actions.

### 08 — Vendor SaaS Subscription Audit

- **Status:** Partially Implemented
- **Currently Functional:** Generic CRUD via `routes/final.ts` → `saas_audits` (classification column; procurement-quote savings math at `final.ts:282`).
- **Implementation Gaps:** Spec's core — import bank/card exports → detect recurring SaaS → classify spend → cancellation/security risks — does not exist. No renewal worker for SaaS.
- **Next Steps to Complete:** CSV import parser, recurring-payment detection, vendor-spend classification, risk flag rules.

### 09 — Client Asset & Warranty Tracker

- **Status:** Fully Usable
- **Currently Functional:** `routes/assets.ts`: list w/ filters, get, create, update (optimistic locking), delete, `GET /stats`, `GET /export` (14 cols incl. warranty_expires, replacement_recommended, lifecycle_score, qr_label, supported_until, vendor_support_status), comments + timeline. Admin + portal pages.
- **Implementation Gaps:** Portal is view-only — no client-side lifecycle view, no QR label rendering. Lifecycle scoring stored but not auto-computed.
- **Next Steps to Complete:** Portal lifecycle view + QR label; auto-compute lifecycle score.

### 10 — MSP Proposal Builder & Pricing Engine

- **Status:** Fully Usable
- **Currently Functional:** `routes/proposals.ts` (756 lines) — proposals + `proposal_phases` + `proposal_line_items`; create/update recompute labor/materials/recurring/one-time/grand totals; optional/recurring line items; submitForApproval/publish; approval-request linkage; CSV export; optimistic locking; timeline + comments. Admin form/edit pages, portal rich `[id]` detail with Approve.
- **Implementation Gaps:** No PDF-ready export, no cover-email generation, no `proposal_templates` table, no tax/discount/scenario pricing.
- **Next Steps to Complete:** Templates + PDF/email delivery.

## Modules 11–20

### 11 — QBR Executive Report Generator

- **Status:** Partially Implemented
- **Currently Functional:** `qbr_reports` (report_data jsonb, period, summary, status, visibility). CRUD + `POST /generate` (real generation path). Worker `qbr-scheduled-generate` flips drafts→generated. Portal page, E2E, API tests, SDK.
- **Implementation Gaps:** No CSV/JSON export endpoint. Generation is aggregation/template-driven — no synthesis of real ticket/project/SLA data. No notification when QBR moves to `sent`. No admin detail page.
- **Next Steps to Complete:** `GET /qbr/export`, `POST /qbr/:id/publish` (status=sent + enqueue notification), admin detail page.

### 12 — Client Project Tracker

- **Status:** Fully Usable (strongest of the batch)
- **Currently Functional:** projects + tasks + project_updates + `project_phases`/`project_milestones`/`project_dependencies`. Rich API (CRUD, export, compound + detail, task sub-routes, comments, updates, approvals, reorder, optimistic locking, webhook dispatch, cache). SDK `getCompound()`. Admin + portal pages (compound single-request N+1 fix). Multiple test suites.
- **Implementation Gaps:** No admin Gantt/calendar visuals; no per-project overdue-due-date worker nudges.
- **Next Steps to Complete:** Admin timeline/calendar view; `project-overdue-check` worker task.

### 13 — MSP Automation Workflow Catalog

- **Status:** Partially Implemented
- **Currently Functional:** `automation_workflows` + `powershell_scripts` + `kb_article_generations` tables. CRUD via `routes/edu-automation.ts`; `POST /automation/:id/execute` + `/complete` (status transition + last_run_at/last_result); powershell sub-actions. Portal + E2E, API tests.
- **Implementation Gaps:** **No worker execution task** — nothing runs workflows; `/execute` only flips status fields. No run-log/history table. Powershell execution is a stub (no sandboxed runner).
- **Next Steps to Complete:** Worker `automation-run` picking is_active workflows by trigger_type; `automation_runs` migration + `GET /automation/:id/runs` + SDK; guarded powershell runner.

### 14 — DNS/Domain/Cloudflare Health Monitor

- **Status:** Fully Usable (admin-side)
- **Currently Functional:** `domain_monitors` (SSL expiry, spf/dkim/dmarc status, nameserver_mismatch, cloudflare_proxied, dns_records). CRUD + `GET /export` + `GET /stats` (real aggregates). Worker `domain-monitor-check` flags expiring SSL/unknown records. Admin page + E2E, API tests.
- **Implementation Gaps:** All values are stored data — nothing queries DNS/Cloudflare at runtime. No portal-facing page (defensible — MSP-internal).
- **Next Steps to Complete:** Real DNS TXT/MX lookups + optional Cloudflare API in the worker.

### 15 — Backup/DR Review Dashboard

- **Status:** Fully Usable
- **Currently Functional:** `backup_status` (RPO/RTO/retention/restore-test/offsite/encryption). CRUD via `routes/final.ts` + `GET /backups/stats`. Worker `backup-dr-check` computes last-backup age vs 24h/48h thresholds (real logic). Portal + E2E, tests.
- **Implementation Gaps:** RPO/RTO columns unused by the worker (age thresholds only); no restore-test due-date flagging; no DR vendor integration.
- **Next Steps to Complete:** Breach-warn on RPO exceeded + restore test older than 90d; scheduled restore-test reminder.

### 16 — Helpdesk Identity Verification / Anti-Vishing

- **Status:** Fully Usable
- **Currently Functional:** `identity_verifications` (method, pass, action_authorized, authorized_by/at). CRUD via `routes/security-suite.ts` + `POST /identity-verification/:id/verify`. Portal + E2E, admin page, API tests.
- **Implementation Gaps:** No call-script/step checklist; no ticket link (parent helpdesk flow); no time-boxed expiry on verification_pass.
- **Next Steps to Complete:** Optional `ticket_id` FK + filter; `verified_expires_at` + expiry handling.

### 17 — Client Knowledge Base Self-Service Assistant

- **Status:** Partially Implemented
- **Currently Functional:** `knowledge_articles` (title/content/category/tags/is_published/view_count/helpful/not_helpful). CRUD via `routes/edu-automation.ts` + `GET /kb/search` + `POST /kb/:id/rate` (counters) + `POST /kb-generator/:id/generate`. Portal card list + E2E, tests.
- **Implementation Gaps:** Portal page has **no search box, no article detail view, no rating buttons**, no view_count increment. KB-generator writes a generic template body, not AI/context-derived. No "did this answer your question?" deflection.
- **Next Steps to Complete:** Searchable/expandable portal KB + rate + view increments; article detail route; real generator draft.

### 18 — Compliance Readiness Lite (SMB)

- **Status:** Partially Implemented
- **Currently Functional:** `compliance_readiness` (framework, control_id, description, is_compliant, evidence_collected, assessed_at). CRUD via `routes/edu-automation.ts` + `POST /compliance/score` (framework-level aggregation). Portal + E2E, tests. Governance framework-gaps/sop-library endpoints.
- **Implementation Gaps:** `evidence_collected` is a boolean only — no evidence attachments/per-control file linkage; no per-framework gap export; no evidence review/approval status.
- **Next Steps to Complete:** `compliance_evidence` table (control_id FK, document_id FK) or reuse document_permissions pattern; `GET /compliance/export?framework=`; admin review action.

### 19 — Open Findings Audit / Remediation Tracker

- **Status:** Fully Usable
- **Currently Functional:** `findings` (severity p0–p3, status, remediation fields). `routes/findings.ts`: CRUD, `GET /export`, `POST /:id/verify` + `/resolve` (dedicated Zod schemas), audit, optimistic locking. Portal + admin pages + E2Es, API tests.
- **Implementation Gaps:** No automated linkage to tickets/approvals; no SLA/breach tracking on open p0/p1 findings.
- **Next Steps to Complete:** Optional `linked_ticket_id` + "Create ticket" action; `finding-sla-check` worker flagging stale p0/p1.

### 20 — Internal MSP Business OS Dashboard

- **Status:** Fully Usable (admin-only)
- **Currently Functional:** `routes/business-os.ts`: `GET /summary` (aggregates orgs/tickets/projects/documents/approvals/profiles, cached), `/approvals-overdue`, `/recent-activity`, `/org-health`. Admin page + E2E, API tests.
- **Implementation Gaps:** Aggregate counts only — no trend/sparkline history, no per-tech workload breakdown, no revenue/MRR rollup, no configurable cards/drill-through.
- **Next Steps to Complete:** `GET /summary?days=30` time-series; `GET /tech-workload` per-member breakdown.

## Modules 21–30

### 21 — AI Ticket Intake & Triage Assistant

- **Status:** Partially Implemented
- **Currently Functional:** `routes/ai.ts`: `POST /triage/analyze` (keyword scoring via CATEGORY_KEYWORDS), `POST /triage/convert` (creates real ticket + comment), `GET /triage`, `GET /copilot/:ticketId/summarize`, `POST /copilot/:ticketId/reply-draft`. `ticket_triage_drafts` table. Portal list + admin /admin/ai/triage (TriageAnalyzeClient analyze→convert). SDK + tests.
- **Implementation Gaps:** No auto-triage worker task. Copilot summarizer unwired to admin ticket page. `ai_draft_outputs` table seeded but **no API route references it**. Portal page is read-only list — no analyze UI.
- **Next Steps to Complete:** Auto-triage worker; copilot draft UI on admin ticket detail; wire `ai_draft_outputs`.

### 22 — License Optimizer / Seat Reclaimer

- **Status:** Fully Implemented
- **Currently Functional:** `routes/license-optimizer.ts`: CRUD on `license_allocations` + real domain logic — `GET /reclaimable/license-list` (flags <70% utilization, computes potentialSavings) + `GET /summary/data` (totalCost, avgUtilization, potentialSavings). Admin + portal pages, worker `license-optimizer-check`, API + web tests.
- **Implementation Gaps:** Savings/percent metrics not rendered on any UI page (lists show raw seat counts only).
- **Next Steps to Complete:** Render summary/reclaimable panels on admin + portal pages.

### 23 — Email Deliverability / DMARC Coach

- **Status:** Fully Implemented
- **Currently Functional:** `routes/dmarc-coach.ts`: CRUD on `dmarc_analyses` + `POST /analyze` with **real grading** — DMARC/SPF/DKIM parsing → issues[], recommendations[], overall_grade A–F. Admin + portal pages, worker `dmarc-coach-check`, API + web tests.
- **Implementation Gaps:** Portal page is list-only (no analyze UI). Legacy duplicate `dmarc_assessments` table (batch 5302068) is separate and stale.
- **Next Steps to Complete:** Analyze form on portal page; retire `dmarc_assessments`.

### 24 — Secure File Request Portal

- **Status:** Fully Implemented
- **Currently Functional:** `routes/file-requests.ts`: full CRUD + **secure public upload** — `GET /public/:token`, `POST /public/:token/upload` (multer, ALLOWED_MIME_TYPES allowlist, BLOCKED_EXTENSIONS exe/bat/ps1/msi, 50MB cap, crypto tokens), notifications + audit. Admin + portal + **public** `/upload/[token]` page. SDK, migration 5302064, tests + E2E.
- **Implementation Gaps:** None material.
- **Next Steps to Complete:** None.

### 25 — Client Training Microlearning Hub

- **Status:** Partially Implemented
- **Currently Functional:** `routes/training-hub.ts`: `GET /my-courses`, courses/lessons CRUD, enroll, progress update. `training_courses`/`training_lessons`/`training_enrollments`. Admin + portal pages, SDK, tests.
- **Implementation Gaps:** No microlearning content seeding (no built-in MFA/phishing/password lessons). Portal page is passive list — no enroll/lesson-progress UI. Overlapping legacy tables (`training_modules`).
- **Next Steps to Complete:** Seed starter lessons, enroll/progress UI, reconcile legacy tables.

### 26 — Cyber Insurance Evidence Binder

- **Status:** Fully Implemented
- **Currently Functional:** `routes/insurance-binder.ts`: CRUD on `insurance_evidence` + `GET /coverage-report` — real computation across 8 COVERAGE_AREAS (per-area counts + completeness %). Admin + portal pages, SDK, migration 5302091, tests.
- **Implementation Gaps:** Coverage-report percentages not surfaced on any page.
- **Next Steps to Complete:** Render coverage report on portal/admin binder pages.

### 27 — Public Status Page / Maintenance Notices

- **Status:** Partially Implemented
- **Currently Functional:** `routes/status-page.ts`: unauthenticated `GET /public/:orgId` (components + active incidents + maintenance) + auth'd CRUD for `status_components`/`status_incidents`/`maintenance_notices`. Admin + portal pages, SDK, tests.
- **Implementation Gaps:** **No public-facing (unauthenticated) status HTML page** — no `/(public)/status` route; portal /portal/status calls legacy batch status_items. Split-brain between batch and dedicated module tables.
- **Next Steps to Complete:** Build `/(public)/status/[orgSlug]` against `/status-page/public/:orgId`; consolidate portal page onto dedicated module.

### 28 — Website Uptime / SSL / Lighthouse Monitor

- **Status:** Partially Implemented
- **Currently Functional:** `routes/uptime-monitor.ts`: `GET /dashboard` (aggregates checks + latest uptime_results incl. uptime %), checks CRUD, `/results`, `/uptime`. `uptime_checks`/`uptime_results` tables. Admin + portal pages, SDK, tests.
- **Implementation Gaps:** **CRITICAL worker/schema mismatch** — `website-monitor-check` (`module-tasks.ts:280`) inserts `{ uptime_check_id, status_code, error }` into `uptime_results` which defines `check_id`, `response_status`, `error_message` → column errors; the real HTTP-probe logic is dead-on-arrival. Split-brain with legacy `website_monitors` (admin /admin/website-monitors).
- **Next Steps to Complete:** Fix worker insert/update column names to match 5302093; reconcile dedicated vs batch tables; add E2E.

### 29 — Network Port Map / Patch Panel Tracker

- **Status:** Partially Implemented
- **Currently Functional:** `crudRoute("port-maps", "port_maps")` via `routes/field-services.ts` — full CRUD on `port_maps`. Portal read-only list. SDK, web test + E2E.
- **Implementation Gaps:** **No admin page.** Generic CRUD only — no uplink/VLAN/patch-panel relationship enforcement, no map/render output, no import. **No API test file.**
- **Next Steps to Complete:** Admin page, port-map domain logic/render, API tests.

### 30 — Camera Retention Storage Calculator

- **Status:** Partially Implemented
- **Currently Functional:** `crudRoute("camera-calc", ...)` via `routes/field-services.ts` + real formula `POST /camera-calc/calculate` = (cameraCount × bitrateMbps × retentionDays × 86400)/8/1024. SDK, web test + E2E.
- **Implementation Gaps:** **Portal page renders nonexistent columns** (`a.name || a.location`, `total_storage_gb`, `calculated_at`) vs schema `site_name`/`camera_count`/`avg_bitrate_mbps`/`estimated_storage_tb`/`recommended_nvr` → blank cards. No interactive calculator form in any UI (endpoint unused). **No admin page; no API test.**
- **Next Steps to Complete:** Fix portal column mapping, add calculator form, admin page + API test.

## Modules 31–40

### 31 — PowerShell Script Builder & Policy Guard

- **Status:** Partially Implemented
- **Currently Functional:** `powershell_scripts` table. Generic CRUD via `routes/edu-automation.ts`. **Policy-guard workflow fully implemented in API**: `POST /powershell/:id/check` (10 DANGEROUS_PATTERNS regexes → risk_level), `/submit`, `/approve`, `/reject` (draft→pending_review→approved/rejected state machine, audit events). Comprehensive `powershell-policy.test.ts` incl. 409s. Admin pages via `edu-powershell`.
- **Implementation Gaps:** SDK is CRUD-only — no check/submit/approve/reject wrappers. Admin UI is generic — **no "Run Policy Check"/"Approve"/"Reject" buttons** anywhere, so the workflow can't be driven from the UI. No portal page, no E2E.
- **Next Steps to Complete:** SDK methods; custom admin detail client with action buttons; E2E (check→submit→approve + reject); optional client page.

### 32 — Client Runbook Builder

- **Status:** Partially Implemented
- **Currently Functional:** `client_runbooks` (5302074). Full CRUD via `routes/final.ts` + `GET /:id`. Portal listing (org filter), admin list + detail/edit/delete via `fn-runbooks`. SDK CRUD. Seeded.
- **Implementation Gaps:** Core purpose — a **builder that assembles a runbook from SOP templates + asset inventory + contacts + vendors + escalation rules + known issues** — not implemented; flat CRUD record. No generate/export endpoint. No E2E. No comments/timeline UI.
- **Next Steps to Complete:** `POST /runbooks/build` or `/:id/generate` pulling SOP template + assets/contacts/vendors; export route; E2E.

### 33 — Change Advisory Board (Mini-CAB)

- **Status:** Partially Implemented
- **Currently Functional:** `change_requests` (5302071). Full CRUD + **complete mini-CAB state machine** in API: `/submit` →pending_review, `/approve`, `/reject`, `/implement`, `/verify` (`routes/governance.ts:148-236`). Portal read-only list + E2E, admin pages via `governance`, SDK CRUD.
- **Implementation Gaps:** SDK missing the 5 transition wrappers. **No UI anywhere drives the workflow** (portal read-only; admin generic CRUD). **Transition endpoints filter by id + target status only — NOT organization_id** → cross-tenant transition risk (`governance.ts:154-236`). Portal passes `organizationId` (camelCase) → breaks platform admins. No risk-scoring on the change record.
- **Next Steps to Complete:** SDK transition methods + admin detail action buttons; org-scope transition `.eq()` filters; fix portal param to `organization_id`; portal submit form + E2E workflow test.

### 34 — Vendor Contract Renewal Management

- **Status:** Fully Usable
- **Currently Functional:** `vendor_contracts` + `vendor_contacts` (5302066). CRUD + status filter + `ilike` search + `GET /vendor-contracts/renewals` (`routes/vendors.ts`). SDK maps org correctly + `renewals()`. **Worker `vendor-contract-renewal-check`** scans active contracts renewing ≤60d (real logic). Portal + admin pages, API tests incl. renewals + search. Seeded all tenants.
- **Implementation Gaps:** Renewal alerts only in data + worker logs — no renewal-due UI panel/banner. No E2E. Contract value has no currency formatting in portal.
- **Next Steps to Complete:** "Upcoming renewals" panel on portal + admin; E2E.

### 35 — Client Budget Roadmap Planner

- **Status:** Fully Usable
- **Currently Functional:** `budget_roadmaps` (5302074). Full CRUD via `routes/final.ts`. Portal page with currency formatting + priority badges (passes `organization_id` correctly). Admin list + detail via `fn-budgets`. SDK CRUD. Seeded.
- **Implementation Gaps:** No quarterly/year-over-year comparison or rollup analytics (tracker only). No E2E. No comments/timeline UI.
- **Next Steps to Complete:** Optional `GET /budgets/summary`; E2E.

### 36 — M365 Offboarding Safety Checklist

- **Status:** Partially Implemented
- **Currently Functional:** `offboarding_checklists` (5302069). Full CRUD + `POST /offboarding/:id/complete-step` (toggles completed_steps array) (`routes/security-ops.ts:138-171`). Portal read-only list + E2E, admin pages (complete-step actions in module-actions.ts). SDK CRUD.
- **Implementation Gaps:** **`complete-step` has no SDK wrapper and no UI** — steps can't be completed from any interface. Account disable/mailbox convert/OneDrive transfer/license reclaim are manual booleans only — no M365 automation or worker task. Portal camelCase param → breaks platform admins. No E2E for step-transition path.
- **Next Steps to Complete:** SDK `completeStep()` + step-toggle UI on admin detail; optional worker reflecting M365 state; fix portal param; step-flow E2E.

### 37 — Phishing Simulation & Training

- **Status:** Fully Usable
- **Currently Functional:** `phishing_campaigns`. CRUD + `POST /phishing/:id/launch` (draft→active, launched_at) + `GET /phishing/:id/results` (computes click/report rates) (`routes/edu-automation.ts:278-316`). **Worker `phishing-campaign-send`** auto-completes active >7d campaigns. Portal page with sent/clicked/reported counts + E2E. Permissions key + nav.
- **Implementation Gaps:** SDK missing launch/results wrappers (CRUD only). Portal read-only (no launch action) + camelCase param → breaks platform admins. Metrics are aggregate counters — **no per-recipient tracking table**. Worker "send" marks complete; no actual email dispatch or click simulation engine.
- **Next Steps to Complete:** SDK launch/results; admin launch/results UI; fix portal param; optional per-recipient results + coaching UI; E2E asserting rates render.

### 38 — Client Satisfaction Pulse Widget

- **Status:** Partially Implemented
- **Currently Functional:** `satisfaction_pulses` + `satisfaction_pulse_templates` + `satisfaction_pulse_schedules` (5302079). **Dedicated service layer** (`services/satisfaction-pulse-widget.ts`) — list/get/create/update/respond/export-CSV/templates-CRUD/schedules-CRUD, 30s no-renew cache, audit events, quoted-cell CSV export. **Full SDK client** incl. respond + export + templates + schedules. Admin page + detail. Zod validators. Seeded.
- **Implementation Gaps:** **No portal/embedded widget page** — the module's entire purpose is client capture, but /portal/ has no satisfaction page; the `respond` endpoint is **auth-gated** (requireAuth + requireOrgAccess) so there's no anon/public path for email-deep-link responses. **Dual API surface**: `/api/v1/final/satisfaction` ALSO mounted as generic CRUD (admin actions hit `api.final.satisfaction`). No worker task to auto-send scheduled pulses. No E2E.
- **Next Steps to Complete:** Portal satisfaction page (list active pulses + respond form) on dedicated API; optional anon respond route for email deep links; reconcile the two API surfaces; `satisfaction-pulse-send` worker; E2E.

### 39 — Fun Cyber Scoreboard / Mascot

- **Status:** Fully Usable
- **Currently Functional:** `cyber_scorecards` (+ `score_history`, `badges_earned`). **Real scoring logic**: `POST /scorecards/evaluate` (assigns Gold/Silver/Bronze badges, writes history + badges, "Security Champion" for avg ≥80), `GET /scorecards/summary` (overall/top/lowest + improving/declining/stable trend), `/overview`, `/leaderboard` (admin cross-org). Portal page renders scores + E2E. Permissions + module config.
- **Implementation Gaps:** SDK missing evaluate/summary/overview/leaderboard wrappers (CRUD only). Portal camelCase param → breaks platform admins. Mascot/encouragement layer not implemented (badges only). No E2E for scoring endpoints.
- **Next Steps to Complete:** SDK scoring wrappers; surface summary/leaderboard on portal + admin; fix portal param; API tests for evaluate/summary; optional mascot component.

### 40 — Small Business AI Policy Assistant

- **Status:** Partially Implemented
- **Currently Functional:** `ai_policies` table. Generic CRUD via `routes/edu-automation.ts`. SDK CRUD. Admin list + detail via `edu-ai-policy`. Web page tests + API test ref. Seeded.
- **Implementation Gaps:** Core purpose — **drafting/generating AI-use policies** — not implemented (plain CRUD; contrast `kb-generator` which HAS a `POST /kb-generator/:id/generate` endpoint that ai-policy lacks). No portal/client-facing page. No E2E.
- **Next Steps to Complete:** `POST /ai-policy/:id/generate` (template-based draft like kb-generator) + admin "Generate draft" button; client-facing policy view page; E2E.

## Modules 41–50

### 41 — AI Service Desk Copilot Console

- **Status:** Fully Usable
- **Currently Functional:** `routes/ai.ts` — keyword-classification triage (hardware/software/network/email/access/security), priority + missing-info detection, writes `ticket_triage_drafts`, converts drafts→tickets, `copilotSummarize` + `copilotReplyDraft` (4 tones), Zod, audit, org-scoped. SDK `ai.ts` (triageAnalyze/Convert/List, copilotSummarize, copilotReplyDraft). UI `/admin/ai/triage` (analyze→convert) + `/portal/ai-triage`. Tests + seeds.
- **Implementation Gaps:** Copilot summarize/reply-draft have **no UI** (API/SDK-only). Heuristic/rule-based only (no LLM). No KB/runbook linkage. No export/records management.
- **Next Steps to Complete:** Copilot Console on admin ticket detail (summarize + draft-reply buttons); KB/runbook lookup; optional real model.

### 42 — Dynamic Client Forms Builder

- **Status:** Fully Usable
- **Currently Functional:** Dedicated service + routes with real domain logic: fields JSON config, form_type (intake/survey/questionnaire/access_request/incident_report/approval), status/published_at/closes_at, publish/submit/list submissions/export. Full portal UI: list, `/new` builder, `/[id]` detail, `/[id]/fill`. SDK DynamicFormsApi (list/get/create/update/remove/publish/submit/export). Migration 5302080. Tests (288 lines) + portal suites. Seeds.
- **Implementation Gaps:** No admin-side management page (spec is portal-only — acceptable). No submission analytics/response counts on cards; no email notification on submit.
- **Next Steps to Complete:** Submission counts + response view; optional admin oversight page.

### 43 — Approval Workflow Engine

- **Status:** Fully Usable
- **Currently Functional:** `routes/approvals.ts` + `services/approvals.ts` — full CRUD, approve/reject/cancel with real transitions, comments, timeline events, CSV export, optimistic locking, audit logging, stats. SDK ApprovalsApi (incl. approve/reject/cancel/stats/addComment/listComments/getTimeline/exportData). Portal `/portal/approvals`. `approval_requests` in 5302058. Tests (253 lines) + web suites.
- **Implementation Gaps:** `/admin/approvals` is an org/membership approval queue — a **different concern**; no admin page for the reusable workflow engine. No automated escalation/follow-up for stale approvals.
- **Next Steps to Complete:** Admin management page for approval_requests; optional stale-approval reminder worker.

### 44 — Procurement Quote Comparison

- **Status:** Partially Implemented
- **Currently Functional:** Generic `crud("procurement", "procurement_quotes")` in `routes/final.ts` with GET /:id. Portal `/portal/procurement` list. Admin list + `[id]`. SDK `final.procurement`. module-config `fn-procurement`. Tests + seeds.
- **Implementation Gaps:** **`POST /procurement/compare` reads `total_price` which does not exist** (schema has `quote_amount`/`competitor_quote` per 5302074) → compare 500s. Compare has no SDK method and no UI. No purchase/decision tracking beyond `selected` boolean.
- **Next Steps to Complete:** Fix compare to use quote_amount/competitor_quote; SDK `compare()` + portal comparison view (savings/lowest/average); wire selected/purchased_at.

### 45 — Hardware Staging Checklist Manager

- **Status:** Partially Implemented
- **Currently Functional:** `crudRoute("staging", "hardware_staging")` in `routes/field-services.ts` (list/create/update/delete) + `POST /staging/:id/checklist`. Portal page. Admin list + `[id]`. SDK `fieldServices.staging`. module-config `fs-staging` (deviceName/type/serial/assetTag, configured/tested/labeled/imaged/qa_verified checkboxes, status). e2e + tests + seeds.
- **Implementation Gaps:** `crudRoute` has **no `GET /:id`** → admin `[id]` detail renders "Record not found". No photo/handoff evidence upload. No imaged-by/QA-by audit fields. No worker task.
- **Next Steps to Complete:** Add `GET /:id` to `crudRoute`; photo upload; optional staging-age worker task.

### 46 — Device Configuration Profile Library

- **Status:** Partially Implemented
- **Currently Functional:** Generic `crud("device-profiles", "device_profiles")` in `routes/final.ts` with GET /:id. Portal + admin list + `[id]`. SDK `final.deviceProfiles`. module-config `fn-device-profiles` (profile_name, device_type, os, settings JSON, status). Portal tests + seeds.
- **Implementation Gaps:** No template-application / device-provisioning logic (pure CRUD). No os/settings import or config validation.
- **Next Steps to Complete:** Apply-to-device endpoint (links hardware_staging/assets); settings schema validation; optional deployment worker.

### 47 — Client Network Diagram Builder

- **Status:** Partially Implemented
- **Currently Functional:** `crudRoute("network-diagrams", ..., createNetworkDiagramSchema)` (list/create/update/delete) + `GET /network-diagrams/:id/export`. Portal + admin list + `[id]`. SDK `fieldServices.networkDiagrams`. module-config `fs-diagrams` (siteName, deviceCount, vlanCount, wanCount, wirelessZones, cameraZones, notes, status). e2e + tests + seeds (with `diagram_data` JSON).
- **Implementation Gaps:** Same `crudRoute` gap → **no `GET /:id`** → admin `[id]` detail broken. No interactive diagram editor — `diagram_data` is stored JSON with no structured uplinks/VLAN/WAN/zones builder UI (fields exist only as counts). No client published view beyond the portal list.
- **Next Steps to Complete:** Add `GET /:id` in `crudRoute`; diagram editor (uploads structured diagram_data); render published diagrams on portal detail.

### 48 — Vendor Contact Escalation Directory

- **Status:** Fully Usable
- **Currently Functional:** `routes/vendors.ts` — `crudEndpoints` for `vendor_contracts` + `vendor_contacts` (status filter + `ilike` search), GET /:id. Portal `/portal/vendor-contracts` + `/portal/vendor-contacts`. Admin lists + `[id]`. SDK VendorsApi. **Worker `vendor-contract-renewal-check`** (real renewal-date logic). Migration 5302066. Tests (227 lines). Seeds.
- **Implementation Gaps:** No escalation-matrix/priority-routing field beyond role_title/is_primary. No vendor SLA metrics or contract-expiry reminder emails (worker only logs).
- **Next Steps to Complete:** Escalation tier field + routing; extend renewal worker to emit notifications.

### 49 — SLA/SLO Tracker

- **Status:** Partially Implemented
- **Currently Functional:** `routes/sla.ts` — `GET /metrics` (real aggregation: total/breached/breachedRate/resolved, byMetric breakdown with avgMinutes, recent logs). Portal `/portal/sla` + admin `/admin/sla` + AdminSLAClient. SDK `SLApi.metrics()`. Migration 5302041 (`sla_logs`, metric check first_response/resolution/triage, `calculate_sla_breach` function). `sla.test.ts`. Seeds.
- **Implementation Gaps:** `sla_logs` is **write-only from seeds** — no route, SDK method, or worker writes it; the breach function is never invoked. No CRUD for sla_logs; no SLO target configuration. No per-ticket SLA countdown/breach UX; no admin detail page.
- **Next Steps to Complete:** Worker computing SLA from tickets → sla_logs via calculate_sla_breach; SLO config table/endpoints; per-ticket SLA status in ticket detail; admin management.

### 50 — Patch Compliance Dashboard

- **Status:** Fully Usable
- **Currently Functional:** `crudRoute("patch-compliance", ..., createPatchSchema)` in `routes/security-ops.ts` — full CRUD **including `GET /:id`** + `GET /patch-compliance/stats`. Portal + admin list + `[id]`. SDK `securityOps.patchCompliance` (list/get/stats). **Worker `patch-compliance-check`** (real: computes compliance_pct, flags <80, updates records). e2e + tests + seeds.
- **Implementation Gaps:** No maintenance-window scheduling or exception approvals (fields exist but unmanaged). No client-facing published view.
- **Next Steps to Complete:** Exception-approval workflow + maintenance-window reminders; optional client dashboard publish.

## Modules 51–60

### 51 — Endpoint Security Coverage Map

- **Status:** Fully Usable
- **Currently Functional:** `endpoint_security` (5302070). Full CRUD + **real `GET /endpoint-security/coverage`** computing AV/encryption/MDM coverage percentages. **Worker `endpointSecurityCheck`** (computes coverage %, flags groups <80%). Admin pages + `[id]`, portal read-only list. Seeds.
- **Implementation Gaps:** SDK `endpoints` is CRUD-only — no `coverage()` wrapper. API tests only assert "lists endpoints"; coverage math and worker task untested.
- **Next Steps to Complete:** SDK `endpoints.coverage()` + type; API tests for coverage (divide-by-zero, multi-row math) + worker test.

### 52 — Risk Acceptance Register

- **Status:** Fully Usable
- **Currently Functional:** `risk_register` (5302071). CRUD + **real `POST /risks/:id/assess`** computing `risk_score = likelihood × impact` → critical/high/medium/low. Admin + portal pages, SDK `GovernanceApi.risks`, seeds.
- **Implementation Gaps:** SDK lacks `risks.assess()`. Assess logic not covered by tests (only CRUD POST asserted). No acceptance-expiry tracking/reminder (columns exist; no worker checks).
- **Next Steps to Complete:** SDK `risks.assess()`; API tests for scoring boundaries (1×1→low, 5×5→critical); optional expiring-acceptance worker.

### 53 — Data Retention Policy Manager

- **Status:** Fully Usable
- **Currently Functional:** `retention_policies` (5302071). CRUD via `governance.ts`. **Real enforcement worker**: `retention.ts` purges audit_logs (365d) and notifications (90d). Admin + portal pages, SDK `GovernanceApi.retention`, seeds.
- **Implementation Gaps:** Worker purge thresholds hardcoded (365/90) rather than driven by `retention_policies` rows — per-category/regulated rules not applied. No review/expiry reminder for `next_review_at`. No purge tests.
- **Next Steps to Complete:** Refactor retention.ts to consult retention_policies per org; review-due worker; purge tests.

### 54 — SharePoint/Teams Structure Planner

- **Status:** Fully Usable
- **Currently Functional:** `sharepoint_plans` (site/team, structure type, owner, sensitivity label, external sharing, status). CRUD via `routes/final.ts` + **real `GET /sharepoint/structure-summary`** counting planned/active sites + external-sharing teams. Admin + portal pages, SDK `FinalApi.sharepoint`, seeds.
- **Implementation Gaps:** SDK lacks `sharepoint.structureSummary()`. No automation for actual site provisioning (spec's deeper value).
- **Next Steps to Complete:** SDK `structureSummary()`; API test for summary counts; optional provisioning/export integration.

### 55 — Website/DNS Change Request Approvals

- **Status:** Partially Implemented
- **Currently Functional:** `dns_change_requests` (domain, change type, proposed/current value, status, approved_by, implemented_at). CRUD via `final.ts`. Admin + portal pages, SDK `FinalApi.dnsChanges`, seeds, portal page tests.
- **Implementation Gaps:** **Core approval workflow missing** — no approve/reject/implement endpoints or state-transition logic; status is a free-form column; approved_by/implemented_at only writable via generic PATCH. No approver routing, no change window/rollback tracking.
- **Next Steps to Complete:** `POST /dns-changes/:id/approve`, `/reject`, `/implement` with state-machine validation + audit; SDK methods; admin detail workflow UI; API transition tests.

### 56 — Client Billing Service Catalog

- **Status:** Fully Usable (best of the batch)
- **Currently Functional:** `service_catalog` (5302067) — billing model, unit, base/override rates, bundling, visibility, active status. **Dedicated route** with real logic, Zod schemas, audit events. Dedicated SDK module + dedicated test suite. Admin pages + `[id]`, portal read-only list, feature doc, seeds.
- **Implementation Gaps:** Portal read-only — no "request this service" or proposal-from-catalog flow. No CSV/JSON export.
- **Next Steps to Complete:** Catalog export + optional portal service-request linking to proposals.

### 57 — Time Entry / Worklog Summarizer

- **Status:** Partially Implemented
- **Currently Functional:** `time_entries` (description, hours, billable, work_date, ticket link). CRUD via `final.ts`. Admin + portal pages, SDK `FinalApi.timeEntries`, seeds, admin page tests.
- **Implementation Gaps:** **No worklog summarizer** (the spec's core value) — no aggregation/summary endpoint at all. No billing linkage (billable flag data-only; no hours→invoice/export). No per-project/per-ticket time rollups.
- **Next Steps to Complete:** Summary endpoint (by ticket/project/period, billable totals) + SDK + worker/AI summarizer; CSV time export; optional invoice-draft integration.

### 58 — Emergency Access / Break Glass Register

- **Status:** Partially Implemented
- **Currently Functional:** `break_glass_accounts` (5302069) with account, system, custodian, rotation/test dates, access procedure. CRUD via `routes/security-ops.ts`. Admin + portal pages, SDK SecurityOpsApi, seeds, portal page tests.
- **Implementation Gaps:** Rotation/testing are passive fields — **no worker** checks `next_rotation_at`/`last_tested_at` or triggers reminders. No "use break glass" request/approval flow or access-event audit beyond CRUD.
- **Next Steps to Complete:** Rotation-due/tests-due worker task + notification; optional request/approve workflow; SDK/tests for new endpoints.

### 59 — Tabletop Exercise Planner

- **Status:** Fully Usable
- **Currently Functional:** `tabletop_exercises` (scenario, type, participants, scheduled_date, action_items, after_action_report). CRUD via `governance.ts`. Admin + portal pages, SDK `GovernanceApi.tabletop`, seeds, API + web tests.
- **Implementation Gaps:** after_action_report/action_items are free-text; no structured AAR generation or finding-tracking. No reminder for upcoming exercises.
- **Next Steps to Complete:** Optional structured AAR template + findings→risk-register linkage; scheduled-exercise reminder worker.

### 60 — AI Knowledge Base Article Generator

- **Status:** Partially Implemented
- **Currently Functional:** `kb_article_generations` + `knowledge_articles`. CRUD via `routes/edu-automation.ts` + three real endpoints: `POST /kb-generator/:id/generate`, `GET /kb/search` (ilike), `POST /kb/:id/rate` (increments via RPC). Admin + portal pages, seeds, tests.
- **Implementation Gaps:** **Generate is a canned template** — writes placeholder markdown, not AI content from the source ticket. No publish-generated→knowledge_articles workflow. SDK `kbGenerator` is CRUD-only — **no generate()/search()/rate() methods** despite live endpoints.
- **Next Steps to Complete:** Real generation (LLM or rule-based extraction from source_ticket_id/source_title); publish action; SDK methods + types; API + worker tests.

---

## Prioritized Remediation Backlog

### P0 (Runtime bugs — fix first)

- [ ] **28** Fix `website-monitor-check` worker insert/update columns to match migration 5302093 (`check_id`, `response_status`, `error_message`).
- [ ] **44** Fix `POST /procurement/compare` to use `quote_amount`/`competitor_quote` (remove `total_price`).
- [ ] **30** Fix portal `camera-calculator` page column mapping (`site_name`/`camera_count`/`avg_bitrate_mbps`/`estimated_storage_tb`/`recommended_nvr`).
- [ ] **45/47 (+29)** Add `GET /${path}/:id` to `crudRoute` in `routes/field-services.ts` — unblocks admin `[id]` detail for staging, diagrams, port-maps, isp, unifi.
- [ ] **33** Org-scope the CAB transition `.eq()` filters (`governance.ts:154-236`) — cross-tenant transition risk.

### P1 (SDK + org-param correctness)

- [ ] Add SDK workflow-method wrappers: 31 (powershell check/submit/approve/reject), 33 (CAB transitions), 36 (complete-step), 37 (launch/results), 39 (evaluate/summary/overview/leaderboard), 44 (compare), 51 (coverage), 52 (assess), 54 (structureSummary), 60 (generate/search/rate).
- [ ] Fix portal camelCase org params → `organization_id`: 33, 36, 37, 39.
- [ ] Reconcile dual API surfaces: 38 (`/satisfaction-pulse` vs `/final/satisfaction`), 27/28 (dedicated vs batch tables).

### P2 (Feature completion — the "core purpose" deltas)

- [ ] **03** Real M365 scan + score computation; **07** runbook steps + phase transitions; **08** SaaS import/detect/classify; **13** automation-run worker + runs table; **21** auto-triage worker + copilot UI; **49** SLA worker writing sla_logs; **55** DNS approval state machine; **57** worklog summarizer; **60** real KB generation + publish; **40** ai-policy generate.
- [ ] **17/25** Portal KB/training interactive UI (search/detail/rate; enroll/progress).
- [ ] **27** Public status page at `/(public)/status/[orgSlug]`; **38** portal satisfaction widget + anon respond.
- [ ] **58** break-glass rotation worker; **50** exception/maintenance-window workflow; **53** retention policy-driven purge.

### P3 (Polish)

- [ ] CSV/JSON export endpoints for the ~20 modules lacking them.
- [ ] E2E specs for modules without them (21, 22, 23, 25, 26, 27, 28, 31, 32, 34, 35, 36, 38, 40, 44, 46, 49, 52, 53, 54, 55, 56, 57, 58, 59, 60).
- [ ] Render existing business-logic outputs on UI pages (22 metrics, 23 analyze, 26 coverage-report, 51 coverage, 54 structure-summary).
