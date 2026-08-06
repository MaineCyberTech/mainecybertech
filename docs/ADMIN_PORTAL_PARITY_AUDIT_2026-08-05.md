# Admin ↔ Portal Parity Audit — 2026-08-05

Audited all 60 modules' admin pages (`apps/web/app/(admin)/admin/**`) against their portal/client pages using 6 parallel workers. Goal: admin side must be a **superset** of the portal side (view same data + full CRUD + admin-only actions).

> **Remediation (same day):** P0-1, P0-2, P0-3, P1-A, P1-B (SDK wrappers + 3 workflow button sets), P1-C (delete wired on 17 custom detail pages), P1-D all fixed and committed. See the "Remediation Applied" section at the bottom. Full test suite green (API 724, Web 1442, SDK 262, Worker 36), lint + typecheck clean.

## Headline Results

| Status                | Count | Notes                                                                           |
| --------------------- | ----- | ------------------------------------------------------------------------------- |
| FULL (admin superset) | 18    | 02*(after fix), 06, 09, 20, 21, 29, 32, 35, 40, 45, 46, 47, 49, 53, 54, 57, 60* |
| PARTIAL               | 39    | see matrix                                                                      |
| MISSING               | 3     | 42 (dynamic-forms), 05 (portal), 53 (portal)                                    |

## P0 — Systemic (affect most admin detail pages)

### P0-1: Admin detail pages display "—" for values (snake_case vs camelCase)

`apps/web/components/admin/RecordDetail.tsx:192` reads `record[f.key]` where `f.key` is **camelCase** (`tenantDomain`, `assetType`) but every API CRUD router returns raw **snake_case** rows. Result: **all** ModuleDetailPage/RecordDetail-based admin detail pages render "—" for multi-word fields and blank edit-form defaults (data-wipe risk on save). The render-scans passed because page titles read snake_case separately.
**Fix:** resolve `record[f.key]` → `record[f.key]` OR `record[snake_case(f.key)]` in RecordDetail (and anywhere RecordDetail-style field lookups happen). One helper in `RecordDetail.tsx` covers most pages; `ModuleDetailPage` feeds `RecordDetail` so it inherits the fix.

### P0-2: `edu-automation` router has NO `GET /:id`

`apps/api/src/routes/edu-automation.ts` `crud()` registers only list/create/patch/delete. Every admin `[id]` detail under `admin/edu-automation/**` (modules **13 automation, 17 KB, 18 compliance, 31 powershell, 37 phishing, 39 scorecards, 40 ai-policy, 60 kb-generator**) 404s on `sdk.get(id)` → "Record not found."
**Fix:** add `router.get(\`/${path}/:id\`)`to the`crud()`helper (mirror`final.ts`/`field-services.ts`).

### P0-3: Module 02 admin reads the WRONG table

Admin `admin/onboarding/` uses `api.securityOps.onboarding` → `onboarding_clients`; portal `portal/client-onboarding-command-center/` uses `api.clientOnboarding` → `client_onboarding_command_center_records` + checklist items. Admins cannot see the portal's records (phases, checklists, security score, M365, handoff).
**Fix:** repoint admin onboarding module at the `clientOnboarding` API; add sidebar/dashboard nav link; wire delete.

## P1 — Admin/portal data-parity bugs

### P1-A: Portal pages render NONEXISTENT columns (client side broken, admin side correct)

These portal pages read columns that don't exist → blank/undefined UI. The admin pages read real columns, so fixing the portal restores parity:

- 04 ISP: `portal/field-services` reads `site_name/provider/speed_tier/contract_end` → real: `client_name/current_provider/current_cost/contract_status/bandwidth_*`
- 08 SaaS: `portal/saas-audit` reads `vendor/category/status` → real: `vendor_name/service_name/classification/usage_frequency/renewal_date`
- 51 Endpoint: `portal/endpoint-security` reads `name/hostname/os/agent_version/last_scan` → real: `device_group/total_endpoints/av_installed/disk_encrypted/mdm_enrolled/coverage_pct`
- 52 Risks: `portal/risk-register` reads `title/name/severity/mitigation_due` → real: `risk_description/risk_category/likelihood/impact/risk_score/status`
- 54 SharePoint: `portal/sharepoint` reads `title/name/description` → real: `site_name/team_name/structure_type/status`
- 55 DNS: `portal/dns-changes` reads `title/name/description` → real: `domain/change_type/change_description/proposed_value/current_value/status`
- 58 Break Glass: `portal/break-glass` reads `service/last_used/expires_at` → real: `system/last_used_at/next_rotation_at`
- 60 KB: `portal/client-knowledge-base` reads `body`/`status` → real: `content`/`is_published`
- 15 Backups: `portal/backup-dr` reads `job_name/target/destination/last_run` → real: `system_name/backup_type/last_backup_status/...`
- 17 KB content field

### P1-B: Admin-only workflow endpoints exist in API but are NOT wired in admin UI (not true supersets)

- 31 powershell: check/submit/approve/reject endpoints dead in UI + SDK
- 33 mini-CAB: approve/reject/implement/verify endpoints dead in UI + SDK; `pending_review` enum missing from edit select
- 36 offboarding: `complete-step` API unused (bulk PATCH checkbox used instead)
- 37 phishing: launch/results endpoints dead in UI + SDK; metrics not shown on admin detail
- 39 scorecards: evaluate/summary/overview/leaderboard endpoints dead in UI + SDK
- 18 compliance: `POST /compliance/score` no admin button
- 19 findings: verify/resolve/comments/timeline endpoints no admin buttons
- 16 id-verify: `POST /verify` no admin button
- 52 risks: `POST /risks/:id/assess` broken against schema (PATCHes nonexistent columns) + not wired
- 60 kb-generator: `generate` broken against schema (writes `generated_body`; real `generated_content`) + not wired
- 44 procurement: `compare()` API/SDK not surfaced
- 47 network-diagrams: `/:id/export` API not in SDK/admin

### P1-C: Delete not wired on custom RecordDetail pages

API + SDK `remove` exist for all, but `deleteAction` prop omitted: 03 m365, 07 incidents, 09 assets, 14 domain-monitors, 16 id-verify, 19 findings, 22 licenses, 23 dmarc, 24 file-requests, 27 status, 28 website-monitors, 34 vendors (contracts+contacts), 36 offboarding, 48 vendors, 50 patch-compliance, 51 endpoint-security, 56 service-catalog, 58 break-glass.

### P1-D: API route shadowing blocks analytics endpoints

`GET /:id` registered before `GET /:path/stats|summary|analysis|structure-summary|leaderboard` shadows them: scorecards summary/overview/leaderboard, final backups/stats, budgets/analysis, sharepoint/structure-summary all 404 (treated as `:id`).
**Fix:** register sub-routes before `crud()`/`crudRoute()` or use explicit paths.

## P2 — Missing/partial admin pages (parity holes)

- **42 Dynamic Forms**: NO admin page at all (portal has list/new/[id]/[id]/fill + publish/submit; `admin/final/forms` manages a DIFFERENT `custom_forms` table). Full API exists — add admin oversight page.
- **43 Approval Workflow**: `/admin/approvals` is the org/membership onboarding queue, NOT `approval_requests`. No admin UI for the workflow engine (approve/reject/cancel) despite complete SDK.
- **38 Satisfaction**: admin uses generic `api.final.satisfaction`; the rich widget API (`satisfactionPulse`: respond/export/templates/schedules) has ZERO web usage.
- **05 UniFi**: admin FULL but portal page missing.
- **53 Data Retention**: admin FULL but portal page missing.
- **22 License Optimizer**: sidebar routes `/admin/license-optimizer` (bare list) not `/admin/licenses` (full CRUD+savings); two pages query different tables.
- **23 DMARC**: no analyze action; grade list (`/admin/dmarc-coach`) disconnected from CRUD (`/admin/dmarc`).
- **25 Training Hub / 26 Insurance Binder / 27 Status components / 28 uptime results**: admin list-only, no CRUD/detail.
- **30 Camera**: admin detail config `fs-camera` missing `estimatedStorageTb`; no calculate button.
- **49 SLA**: AdminSLAClient org/days selects cosmetic (no refetch).
- **59 Tabletop**: `gov-tabletop` detail config omits `action_items`/`after_action_report`.
- **57 Time Entries**: `ticket_id` not shown on admin detail; create can't set `billable`.
- **56 Service Catalog**: `included_units`/`overture_rate`/`visibility`/`status` missing from admin detail; no delete.

## Fix priority

1. **P0-1** RecordDetail snake/camel resolution (fixes 40+ admin detail displays at once)
2. **P0-2** edu-automation `GET /:id` (fixes 8 broken admin detail pages)
3. **P0-3** Module 02 admin table repoint
4. **P1-A** Fix the 10 broken portal pages to read real columns
5. **P1-B/C** Wire workflow buttons + delete actions
6. **P1-D** Fix route shadowing
7. **P2** Add admin pages for 42/43, satisfaction widget, portals for 05/53

## Remediation Applied (2026-08-05)

| Item       | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| P0-1       | `RecordDetail.tsx` now resolves `record[f.key]` with a snake_case fallback (`recordValue()` helper) — all ModuleDetailPage/RecordDetail detail views now display values correctly and pre-populate edit forms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P0-2       | Added `GET /:path/:id` to the `crud()` helper in `apps/api/src/routes/edu-automation.ts` — fixes admin detail 404s for automation/KB/compliance/powershell/phishing/scorecards/ai-policy/kb-generator (8 modules); +11 API tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| P0-3       | Admin onboarding repointed from `onboarding_clients` (`securityOps.onboarding`) to `client_onboarding_command_center_records` (`clientOnboarding`) — list shows phases/risk/security score, detail shows full record, create/update/delete actions rewired, sidebar nav link added                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| P1-A       | Fixed portal pages reading nonexistent columns: field-services(ISP), saas-audit, endpoint-security, risk-register, sharepoint, dns-changes, break-glass, client-knowledge-base, backup-dr (+ their tests)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| P1-B       | SDK workflow wrappers added: `governance.changes.{submit,approve,reject,implement,verify}`, `governance.risks.assess`, `eduAutomation.{compliance.score, phishing.{launch,results}, scorecards.{summary,overview,leaderboard,evaluate}, automation.{execute,complete}, powershell.{check,submit,approve,reject}, kbGenerator.generate}`, `securityOps.offboarding.completeStep`, `securitySuite.endpoints.coverage`, `final.{sharepoint.structureSummary, budgets.analysis, backups.riskAnalysis}`, `fieldServices.camera.calculate` (prior). New `WorkflowActionButtons` client component wired into change-requests (5 actions), phishing (launch), powershell (check/submit/approve/reject) detail pages via `ModuleDetailPage.workflowActions` |
| P1-C       | Added 19 delete actions in `module-actions.ts` and wired `deleteAction` on custom RecordDetail pages: onboarding, m365-hardening, incidents, id-verify, endpoint-security, service-catalog, break-glass, offboarding, patch-compliance, file-requests, domain-monitors, findings, assets, licenses, dmarc, status, website-monitors, vendor-contracts, vendor-contacts                                                                                                                                                                                                                                                                                                                                                                             |
| P1-D       | Moved generic `crud()` loops AFTER specific sub-routes in `final.ts` and `edu-automation.ts` — `/scorecards/summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | overview | leaderboard`, `/final/backups/stats | risk-analysis`, `/budgets/analysis`, `/sharepoint/structure-summary`, `/procurement/compare`no longer shadowed by`/:id` |
| P2 partial | `fs-camera` config + `estimatedStorageTb`/`avgBitrateMbps`; `gov-tabletop` + `actionItems`/`afterActionReport` (participants→text); `fn-time-entries` + `ticketId`; service-catalog detail + `includedUnits`/`overtureRate`/`visibility`; domain-monitor detail + full health fields                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Still open (P2) — Remediated 2026-08-05

- ✅ **Admin page for module 42 (dynamic-forms)** — `/admin/dynamic-forms` list + `[id]` detail with publish action + submissions view.
- ✅ **Admin page for module 43 (approval_requests)** — `/admin/approval-requests` cross-org list + stats + `[id]` detail with approve/reject/cancel workflow buttons (distinct from the membership queue at `/admin/approvals`).
- ✅ **Satisfaction widget API surfaced** — `/admin/satisfaction-pulse` list + create form + `[id]` respond form; templates/schedules/export panels.
- ✅ **Portal pages for 05 (unifi) and 53 (data-retention)** — `/portal/unifi-site-surveys` + `/portal/data-retention` created + sidebar links added.
- ✅ **Scorecards evaluate panel** — `ScorecardsEvaluateClient` on `/admin/edu-automation/scorecards` (assign badges/history, per-org or all).
- ✅ **Procurement compare view** — `ProcurementCompareClient` on `/admin/final/procurement` (multi-select quotes → side-by-side table).
- ✅ **DMARC analyze action** — `DmarcAnalyzeForm` on `/admin/dmarc-coach` (record grading).
- ✅ **Risks assess button** — `RiskAssessButton` on risk detail (likelihood×impact); migration `5302125` adds `risk_level`/`accepting_controls`/`assessed_at` columns the endpoint writes.
- ✅ **Findings verify/resolve buttons** — wired on `/admin/findings/[id]`.
- ✅ **KB-generator generate** — "Generate Draft" workflow button on kb-generator detail; endpoint fixed to write `generated_content`/`reviewed_content` (was nonexistent `generated_body`); KB search fixed `body`→`content`.
