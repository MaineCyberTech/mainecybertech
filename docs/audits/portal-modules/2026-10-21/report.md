# Client Portal Module Deep Dive — 2026-10-21

**Repository:** `MaineCyberTech/mainecybertech` · **Audit snapshot:** `7478aafe` · **Rebased/re-checked against:** `develop` @ `de100712`
**Scope:** every client-facing portal section under `apps/web/app/(portal)/portal/**`
**Method:** static review of the route tree, portal nav/permission map, server components, server actions, client components, SDK modules, API routes, migrations/RLS, feature docs, and the existing E2E specs, followed by live checks against the dev stack and the hosted Supabase data. Where a finding depends on seeded role data it is called out.

> **Baseline reconciliation:** the first pass reviewed the docs-branch snapshot at `7478aafe`. Before remediation the patch was rebased onto `develop` (`de100712`) and every finding was re-checked. A few items had already been fixed on `develop` — user-scoped response-cache keys, the billing summary query, the billing sync button gate, onboarding redirect placement, and API-side document visibility. Those are retained as “verified fixed” notes rather than re-fixed; the remaining findings still reproduce on `develop` and on the running dev stack.

---

## 1. Executive summary

The portal is **broad but shallow**. It has:

- **86 page routes** and **70 sidebar/nav entries** across five groups, mapping to the 60-module prompt-pack plus core workspace features.
- **A real backend for almost every module** — API route, SDK module, SQL table, and an admin surface exist in nearly all cases.
- **A genuinely usable interactive core** — Dashboard, Projects, Documents, Support, Notifications, Profile, AI Triage, Camera Calculator, CAB, Onboarding, Forms, Proposals, Feedback and Billing all have real screens with real data.
- **A very large read-only middle** — roughly 50 of the 70 nav entries only list data. Many are provider-managed telemetry that arguably *should* be read-only, but they lack drill-downs, filters, exports, and context.
- **A small but damaging set of "looks finished, isn't" surfaces** — the Services hub, Security Suite/Security Ops hubs, Governance, Field Services, and Edu Automation are narrow or static views under broad labels.

The two biggest themes are:

1. **The portal is not safely client-scoped yet.** A `visibility` ("internal" vs "client_visible") column exists on at least ten module tables, but **no portal query or API list filter reads it**. Internal proposals, QBRs, approvals, KB drafts, runbook drafts, training drafts, internal service-catalog entries, assets, findings, vendor contracts and domain monitors can appear in the client portal. Proposal detail also renders comments marked `is_internal`.
2. **Client actions are missing or unreachable.** Clients can submit tickets, upload documents, comment on projects, and fill forms, but cannot submit an approval request, change request, DNS change, file upload link, identity verification, insurance evidence, offboarding request, or training enrollment — even though the APIs and permissions exist for several of these. Meanwhile, the one proposal action that exists ("Approve Proposal") is wired to an API that only accepts **draft** proposals, so it fails on the only status where the button renders.

### Highest-impact verified defects

| # | Severity | Defect | Evidence |
|---|----------|--------|----------|
| 1 | Critical | Portal list endpoints never filter `visibility`, so internal records leak to clients (proposals, QBR, approvals, KB, runbooks, training, service catalog, assets, findings, vendors, domain monitors, file requests) | `packages/sdk` lists; API list handlers (e.g. `apps/api/src/routes/proposals.ts:79`, `qbr.ts:26`, `approvals.ts:122`, `knowledge-base.ts:30`, `training-hub.ts:86`, `service-catalog.ts:25`) |
| 2 | Critical | Proposal detail displays internal comments; internal/draft proposals are listed | `apps/web/app/(portal)/portal/proposals/[id]/page.tsx:245-255`; `apps/api/src/routes/proposals.ts:108-146` |
| 3 | Critical | "Private" document upload is silently uploaded as organization-visible | `apps/web/app/(portal)/portal/documents/actions.ts:34` vs. the visibility select at `PortalDocumentsCenterClient.tsx:217-229` |
| 4 | Critical | Password change never verifies the current password; the field is collected and discarded | `apps/web/app/(portal)/portal/profile/ProfileClient.tsx:74-90`; `apps/api/src/routes/auth.ts:348-383` |
| 5 | Critical | Dashboard calls the admin-only audit endpoint for every client, so every client sees a "could not load dashboard data" banner | `apps/web/app/(portal)/portal/dashboard/page.tsx:88`; `apps/api/src/routes/audit.ts:22` |
| 6 | High | "Approve Proposal" calls a draft-only endpoint and always fails for a sent proposal | `apps/web/app/(portal)/portal/proposals/[id]/page.tsx:286-290`; `apps/api/src/routes/proposals.ts:693-712` |
| 7 | High | Dynamic-form create catches `redirect()`'s `NEXT_REDIRECT`, creates the record, then returns an error and never navigates (onboarding was already fixed on `develop`) | `.../dynamic-client-forms-builder/actions.ts` |
| 8 | High | AI Triage is hidden from client roles because the `ai` permission is seeded `scope = 'admin'` | `supabase/migrations/5302118_permission_matrix_full_catalog.sql:310`; portal nav `module: "ai"` |
| 9 | High | Most portal lists show only the API's default first 25 rows with no pager and label the count as if it were the total | e.g. `apps/api/src/routes/assets.ts:72`; all list pages without `searchParams` |
| 10 | High | SLA page multiplies an already-percent `breachedRate` by 100 | `apps/web/app/(portal)/portal/sla/page.tsx:55`; `apps/api/src/routes/sla.ts:53` |
| 11 | High | Phishing page reads non-existent fields (`name`/`campaign`, `sent_count`, `completed_at`), so names are blank and metrics show N/A | `.../phishing-simulations/page.tsx:45-53` vs. `phishing_campaigns` schema |
| 12 | High | Offboarding page reads non-existent fields (`name`/`employee`/`user`, `offboard_date`), so names are blank and dates show N/A | `.../offboarding/page.tsx:46-52` vs. `offboarding_checklists.employee_name/offboarding_date` |
| 13 | High | Billing shows a "Sync from Stripe" button to roles without `billing:manage`; client_admin gets a 403 | `.../billing/BillingPageClient.tsx:83-93,197-203`; `apps/api/src/routes/billing.ts:207` |
| 14 | High | Dynamic-forms "no-code builder" is a raw JSON textarea | `.../dynamic-client-forms-builder/new/FormCreateForm.tsx:9-11,65-78` |
| 15 | High | Onboarding checklist is disabled read-only even though clients are the ones who need to complete it | `.../client-onboarding-command-center/[id]/page.tsx:99-120` |
| 16 | Medium | Change-request list reads `scheduled_at`; the column is `implementation_date`, so the scheduled date never renders | `.../change-requests/page.tsx:51-52` |
| 17 | Medium | DMARC list reads `issues_count`; the column is `issues` (JSON), so "0 issues" is always shown | `.../dmarc-coach/page.tsx:54` vs. `dmarc_analyses.issues` |
| 18 | Medium | Hardware staging checklist is rendered with `JSON.stringify` | `.../hardware-staging/[id]/page.tsx:74` |
| 19 | Medium | Network "diagram" pages render node/edge text lists, not a diagram | `.../network-diagrams/[id]/page.tsx:67-108` |
| 20 | Medium | 31 of 86 portal pages omit `PortalSubnav`; the pages that include it render the entire 22-item Security group as horizontal tabs | `PortalSubnav.tsx`; group counts from `portal-nav.ts` |
| 21 | Critical | The authenticated response cache was keyed per org for org-scoped routes, so private documents/filtered lists could be served to another user. Fixed with an opt-in `userScoped` cache key used by the documents list. | `apps/api/src/middleware/cache.ts` (`buildCacheKey`), `apps/api/src/routes/documents.ts` |
| 22 | High (fixed on `develop`) | `/billing/summary` always 500'd (`qb.eq is not a function`) because it awaited the Postgrest thenable before adding filters. `develop` now builds the query synchronously. | `apps/api/src/routes/billing.ts` |

### Maturity snapshot

Legend: **A** = complete and intuitive; **B** = usable, notable gaps; **C** = read-only/limited but still useful; **D** = shell or misleading label; **F** = broken primary flow.

| Group | Modules | A/B | C | D/F |
|---|---:|---:|---:|---:|
| Core | 9 | 7 | 1 | 1 |
| Operations | 17 | 2 | 10 | 5 |
| Security | 22 | 4 | 12 | 6 |
| Business | 14 | 2 | 7 | 5 |
| Advanced | 8 | 2 | 3 | 3 |
| **Total** | **70** | **17** | **33** | **20** |

About **14 of 70** nav entries expose any client-side write at all (projects, documents, support, billing, notifications, feedback, profile, camera calculator, KB, AI triage, proposals, onboarding, forms, CAB). Three of those write flows are broken outright (proposals, onboarding, forms) and AI Triage is role-blocked, leaving roughly **10 genuinely usable write surfaces** for a client account.

---

## 2. How the portal is wired

A portal module normally consists of:

1. **Route** — `apps/web/app/(portal)/portal/<module>/page.tsx` (server component).
2. **Navigation** — `apps/web/lib/navigation/portal-nav.ts`.
3. **Permission** — `PORTAL_ROUTE_PERMISSIONS` in `apps/web/app/(portal)/layout.tsx`, plus `RouteGuard` and the API's `requirePermission`.
4. **Data** — `getApiClient()` → SDK module → `/api/v1/...` → Supabase, usually with `organizationId`/`organization_id`.
5. **Admin counterpart** — `apps/web/app/(admin)/admin/...` (usually the only place with create/edit/delete).
6. **Detail route** — only a minority of modules have one.
7. **Tests** — a 2–4 test E2E smoke spec that usually only asserts the heading renders, plus unit tests for selected components/actions.

This is a clean, consistent architecture. The problems are not architectural; they are in **what the client layer is allowed to see and do**, and in **the assumptions carried over from admin screens**.

Two important consequences of the current pattern:

- The portal is largely a **read-only projection of admin-managed tables**. That is appropriate for telemetry (backups, patching, endpoints, domain monitors) but inappropriate for request/decision modules (approvals, change requests, DNS, offboarding, identity verification, insurance evidence, training).
- Because E2E runs with a global admin session (see the fixtures), **client-role and restricted-role behaviour is not exercised**. That is why permission mismatches (AI Triage, CAB approve, billing sync, client_user onboarding) survive a green suite.

---

## 3. Cross-cutting findings

### C1 — Client visibility is a dead field (Critical)

`visibility` is written by validators/API and displayed in a few admin pages, but it is never used to scope a portal read. Verified tables and list handlers:

| Table | Portal page | List filter |
|---|---|---|
| `approval_requests` | `/portal/approvals` | none (`approvals.ts:122`) |
| `proposals` | `/portal/proposals` | none (`proposals.ts:79`) |
| `qbr_reports` | `/portal/qbr` | none (`qbr.ts:26`) |
| `knowledge_base_articles` | `/portal/client-knowledge-base` | no `is_published` filter |
| `training_courses` | `/portal/training-hub` | no `status` filter |
| `client_runbooks` | `/portal/runbooks` | no `status` filter (generic final CRUD) |
| `service_catalog` | `/portal/service-catalog` | no `visibility` filter |
| `findings` | `/portal/findings` | no `visibility` filter |
| `assets` | `/portal/assets` | no `visibility` filter |
| `vendor_contracts` | `/portal/vendor-contracts` | no `visibility` filter |
| `domain_monitors` | `/portal/domain-monitors` | no `visibility` filter |
| `file_requests` | `/portal/file-requests` | no `visibility` filter |

Even the RLS policies for these tables only check organization membership. `proposals`, for example, has `proposals_select_org` with an org-membership predicate and no visibility predicate (`5302059_proposal_builder.sql:40`), and `qbr_reports_select_org` is the same (`5302063_qbr_reports.sql:30`). Turning on `RLS_READS_ENABLED` for these modules would not fix it.

**Impact:** clients can see internal-only records and drafts, including pricing/proposal data, internal approvals, draft QBRs and unpublished knowledge. This is both a confidentiality issue and a trust issue — the admin UI offers `internal`/`client_visible` as a real choice, so operators will assume it works.

**Fix:** add a shared server-side scope helper (`clientVisible()` / `publishedOnly()`) and apply it in every portal query or in the API when the caller is a client role. Add a migration-level `visibility = 'client_visible'` predicate to the RLS policies as defense in depth. At minimum: proposals, QBR, approvals, findings, assets, vendors, service catalog, domain monitors, file requests, KB, training, runbooks.

### C2 — "Approve Proposal" is wired to the wrong endpoint (Critical/High)

The detail page renders "Approve Proposal" only when `proposal.status === "sent"`, but the action calls `proposals.submitForApproval()` (`/proposals/:id/submit-approval`), which:

- requires `proposals:edit`,
- rejects any status other than `draft` (`proposals.ts:711`),
- and moves a draft **to** `sent` rather than approving a sent proposal.

So the button is guaranteed to return 400 on the status where it appears. There is no client-decision endpoint in `proposals.ts`; the approval request created at submission is never closed by the proposal flow.

**Fix:** add `POST /proposals/:id/client-approve` (and reject/request-changes), transition `sent → approved/rejected`, optionally call `approvals.approve()` on the linked request, and audit it. Until then, remove the button.

### C3 — Internal comments are visible on proposals (Critical)

`proposals.get()` returns all `module_comments` with no `is_internal` predicate (`proposals.ts:108-146`), and the portal renders every one, tagging internal ones with a lock icon but still showing the body (`proposals/[id]/page.tsx:245-255`). A client can read the account team's internal notes.

**Fix:** filter `is_internal === false` for client roles, both in the endpoint and in the page. Audit other modules that use `module_comments` (findings detail does not show comments today, but the endpoint exists).

### C4 — Document "Private" is not private (Critical)

The upload form offers `Organization` and `Private` (`PortalDocumentsCenterClient.tsx:217-229`), but `uploadPortalDocument` hardcodes `visibility: "org"` (`documents/actions.ts:34`). The selected value is never read.

**Fix:** read `formData.get("visibility")`, validate against the enum (`private|org|internal|public`), and pass it through. Then verify `documents` RLS is enabled for reads; `documents.list` has no per-user filter and relies entirely on `can_read_document()`.

### C5 — Password change does not re-authenticate (Critical)

`ProfileClient` collects `pwCurrent` but never sends it (`ProfileClient.tsx:30,74-90`). It calls `auth.resetPassword(email, pwNew)`, and `/auth/reset-password` only checks that the email equals the authenticated user's email, then updates the password (`auth.ts:348-383`). A stolen session can permanently take over the account without knowing the old password. The UI also enforces only 6 characters while the API enforces a stronger policy.

**Fix:** require and verify the current password (or a fresh re-auth/MFA step) before `updateUserById`; align client and server validation; rotate sessions after a password change.

### C6 — Redirect is swallowed in two create flows (High)

Both actions call `redirect()` inside a `try` whose `catch` returns `{ok:false,error:e.message}`:

- `client-onboarding-command-center/actions.ts:37`
- `dynamic-client-forms-builder/actions.ts:62`

`redirect()` throws `NEXT_REDIRECT`; the catch converts it into an error result. The record is created, the client sees "NEXT_REDIRECT"/failure, and the user is left on the create page. Retrying creates duplicates. The support page has the correct pattern (`if (error.message === "NEXT_REDIRECT") throw error`), which shows the intended fix.

### C7 — Permission/UI mismatches (High)

| Surface | Who sees it | What happens |
|---|---|---|
| `/portal/ai-triage` | Nav is filtered by `ai:view`; `ai` is seeded `scope = 'admin'` (`5302118:310`) | Clients do not see it; if deep-linked, the API returns 403. The feature doc says client users are primary users. |
| "Sync from Stripe" | All billing viewers | Requires `billing:manage`; `client_admin` lacks it, `client_billing` has it. Client admins get a 403. |
| CAB schedule/approve | All governance viewers | `governance:edit`; `client_admin` can schedule/approve, `client_user` sees buttons that 403. The feature doc describes CAB as an MSP-staff tool. |
| "New Onboarding" | Client viewers | `client-onboarding-command-center:create`; `client_user` lacks it, `client_admin` has it. The docs say create is admin/super_admin only. |
| "New Form" / form builder | Client viewers | `dynamic-forms:create/edit`; docs describe the builder as admin and the portal as form-fill only. |
| `/portal/store` | Fixed by migration `5302423` (view granted to client roles) | Good example of the fix pattern. |

The general rule should be: **the server component must pass `can(module, action)` to the client component and hide/disable action controls**, and the page should explain provider-managed data rather than offering controls that will 403.

### C8 — List pagination is effectively missing (High)

Almost every list API defaults to `limit=25` (100 max). Only three portal lists support paging:

- `/portal/hardware-staging` (`searchParams` + `AdminPagination`)
- `/portal/device-profiles`
- `/portal/network-diagrams`

Everything else calls `list({ organizationId })` and renders `items.length`, e.g. assets, findings, QBR, approvals, tickets, documents, proposals, vendors, domain monitors, security suite/ops, patching, endpoints, M365, phishing, compliance, KB, insurance, licenses, DMARC, SharePoint, SaaS, scorecards, offboarding, uptime, time entries. For an org with 26+ documents or tickets, the 26th item is invisible, and the "N documents" label is wrong.

**Fix:** a shared `PortalListPage`/`usePortalList` with page/limit, total, search, filter, sort and empty/error handling. At minimum add a pager to the top 10 lists and display `total`, not `items.length`.

### C9 — Error feedback is inconsistent (High)

- Projects, proposals, task approval and KB create use `<form action={...}>` with actions that return `{ok:false,...}`; the return value is discarded, so failures are silent (the KB action even documents this: "the list simply won't update").
- Notification preferences swallow both load and save errors (`NotificationPreferencesClient.tsx:44-52,89-96`) and still claim "saved" in the success path only.
- Billing/profile/KB actions sometimes show errors, sometimes not.
- `console.error` + `DataErrorNote` is used on most server-rendered lists, which is good, but a transient error and an authorization error are indistinguishable to the user.

**Fix:** standardize on actions returning a discriminated result and either use `useActionState`/`useFormState` or call the action from a small client wrapper (as Support does). Show inline errors and a retry; map 402 → upgrade prompt, 403 → permission explanation.

### C10 — Entitlements are not reflected in navigation (High)

`resolveOrgEntitlements()` gates `findings`, `security-ops`, `governance`, `training-hub`, `service-catalog`, `qbr` (`apps/api/src/lib/entitlements.ts`). The portal layout fetches `clientPortal.getBootstrap()` on the overview page but the sidebar/nav only filters by RBAC. A lapsed org still sees those modules; clicking them yields a 402 and a generic "could not load" note. There is no upgrade/contact-sales affordance in the portal.

**Fix:** fetch `enabledModules` in the portal layout, hide or badge unentitled modules, and route to an "Upgrade / contact your account team" page on 402. The `/portal/client-portal` page already knows the enabled modules; make it the source of truth.

### C11 — Broad labels hide narrow data (High)

Five "hub" pages are single-table lists or static shells:

| Page | Label | What it actually shows |
|---|---|---|
| `/portal/services` | Service Hub | Nine static descriptive cards from `portal-service-hub.json`; no org data, no links, no actions (`services/page.tsx:30-31`) |
| `/portal/security-suite` | Security Suite | M365 hardening records only (`security-suite/page.tsx:33`) |
| `/portal/security-ops` | Security Operations | `onboarding_clients` records only (`security-ops/page.tsx:33`) |
| `/portal/governance` | Governance | `change_requests` only, duplicating `/portal/change-requests` (`governance/page.tsx:21`) |
| `/portal/field-services` | Field Services | ISP assessments only (`field-services/page.tsx:21`) |
| `/portal/edu-automation` | Education Automation | Compliance records only; `edu-automation` is admin-scope so clients cannot see it anyway |

These are the pages most likely to make a client think the portal is unfinished. Either turn them into real aggregate dashboards (counts + recent items + links) or remove/rename them.

### C12 — Internal MSP tools are exposed in the client nav (High)

The 70-item nav includes the form **builder**, CAB scheduling/decisions, onboarding record creation, automation workflows, device profiles, SOP library, break glass, patch/endpoint/M365 telemetry, edu-automation, and the full governance suite. Some are legitimately client-visible as read-only posture; others are internal operating tools. The result is a sidebar that looks like an MSP admin console and a client experience with 60+ mostly empty lists.

A client portal should be organized around client jobs (get help, see work, review/approve, manage account, stay secure, request a change, buy a service), not around the MSP's internal module inventory. See §6 for a proposed regroup.

### C13 — Raw internals leak into the UI (Medium)

- `StatusPill` renders the raw status string, so clients see `PENDING_REVIEW`, `IN_PROGRESS`, `NOT_STARTED` rather than "Pending review".
- Raw UUIDs are shown for `requested_by`, `generated_by`, `onboarding_lead`, etc. (approvals, QBR, change requests, onboarding detail).
- Hardware staging checklists render `JSON.stringify(item)` (`hardware-staging/[id]/page.tsx:74`).
- Dynamic-form submissions render raw `JSON.stringify(answers)` (`dynamic-client-forms-builder/[id]/page.tsx:174-176`).
- The document detail page shows the storage bucket name (`documents/[documentId]/page.tsx:127`).
- The form builder exposes raw JSON as its primary editing surface.

### C14 — Breadcrumb and subnav inconsistencies (Medium)

- Eight breadcrumb links point at `/portal`, which has **no page** and no middleware redirect (`/portal` 404s): proposals, onboarding list/new/detail, forms list/detail. The public route `/portal` is only matched by middleware's auth check; it does not redirect.
- Profile and MFA pages pass `current="dashboard"` to `PortalSubnav`, so no tab is active and the Core group is shown.
- Timeline passes `current="projects"`, so the Projects tabs render while the sidebar highlights Timeline (Advanced group).
- 31 of 86 pages do not render `PortalSubnav` at all, so navigation varies page to page.
- When it is rendered, it shows the **entire group**: 22 tabs for Security, 17 for Operations, 14 for Business. On mobile this is a horizontally scrolling wall.

### C15 — Dead code / unused setup (Low)

- `apps/web/components/store/CategoryVisualHeader.tsx` — no imports.
- `apps/web/components/portal/PortalAdminQuickSwitch.tsx` — only referenced by its unit test; `PortalHeaderActions` already provides the Admin link.
- `portal_module_settings` table exists with RLS and per-org `settings` JSON, but **no API, SDK, or UI reads or writes it**. It is the natural home for per-org nav/module configuration.
- The `visibility` columns described in C1 are effectively write-only.
- Several SDK/API capabilities are unused by the portal: `assets.stats`, `findings.stats`, `approvals.stats`, `domainMonitors.stats`, `licenseOptimizer.summary/reclaimable`, `insuranceBinder.coverageReport`, `uptimeMonitor.getResults/getUptime/dashboard`, `securitySuite.endpoints.coverage`, `securityOps.patchCompliance.stats`, `final.backups.stats/riskAnalysis`, `final.timeEntries.summary`, `final.procurement.compare`, `final.sharepoint.structureSummary`, `trainingHub.myCourses/enroll/progress/lessons`, `knowledgeBase.get/search`, `proposals.exportData`, `qbr.get`, `approvals.get/comments/timeline`, `assets.get`, etc.

### C17 — The response cache was scoped per org, not per user (Critical)

`buildCacheKey()` appended only `:org=<id>` for authenticated requests
(`apps/api/src/middleware/cache.ts`). The documents list is cached for 30s, so
one user's response — including private documents — could be served to another
user in the same org. The same class of leak applied to any visibility-scoped
list once filtering was added: a staff request could populate the cache with
internal records and a client request could then read them.

**Fix:** `ResponseCacheOptions` gained a `userScoped` flag. Documents — whose
list varies by private/organization visibility — opts in, so its key includes
both `user=<id>` and `org=<id>`. Org-only routes keep sharing entries between
members for performance. The live check used the pre-rebase code: client_admin
saw 4 documents (including their private one), client_user saw 3, and
client_admin saw 4 again on the cached follow-up. A regression test covers the
user-scoped key and the existing same-scope sharing behaviour.

### C16 — Performance and consistency (Low/Medium)

- `/portal/timeline` does `projects.list()` and then one `listTasks()` per project (N+1) instead of using the existing `projects.getCompound()` endpoint used by `/portal/projects`.
- `/portal/projects/[projectId]` fires `markTaskRead` once per task on every page load (N calls); a single bulk endpoint would be better.
- `usePermissions()` is called both by `RouteGuard` and by `PortalSubnav`/sidebar with no server seed in `RouteGuard`, producing an extra client permissions request and a brief fail-open flash.
- Date/currency formatting is mostly centralized in `lib/format.ts`; status labels are not.

---

## 4. Module-by-module deep dive

For each module: **Intent** = what the feature doc/module spec says it should do; **Wiring** = what actually exists; **Client can** = the real interaction surface; **Gaps / issues** = verified missing or broken behaviour; **UX** = the rating from the legend above.

### 4.1 Core (9 modules)

#### Dashboard — `/portal/dashboard` · Rating B
- **Intent:** at-a-glance workspace: org health, recent projects/tickets/documents, quick actions.
- **Wiring:** `organizations.get`, `projects.list`, `tickets.list`, `documents.list`, `audit.list` (5 parallel calls); no dedicated portal summary endpoint; links into projects/support/documents.
- **Client can:** open the five most recent items, create a ticket, upload a document.
- **Gaps / issues:** the audit call is admin-only (`audit.ts:22` requires `requireAdmin`), so `loadFailed` is set on **every** client load and the amber `DataErrorNote` always shows. "Recent Activity" is always empty for clients. No KPI tiles (open tickets, overdue invoices, unread docs, projects at risk), no onboarding/entitlement banner, no export. The page fetches 5 lists but only shows 5 rows from each; `auditActionLabel` is a hand-maintained map.
- **UX:** the best-looking landing page in the portal; the persistent error banner undermines it. Fix by removing the audit call and building a client-safe activity feed from tickets/projects/documents (or add a `/dashboard/portal-summary` endpoint).

#### Projects — `/portal/projects` and `/portal/projects/[projectId]` · Rating A-
- **Intent:** client project/task tracker with comments, approvals, unread state.
- **Wiring:** `projects.getCompound()` (single compound request), `getDetail`, `markTaskRead`, `approveTask`, `addPortalTaskComment`, `addUpdate`; admin project pages; `ProjectTasksWithViews`, `ProjectTimelineView`, `ProjectCalendarView`.
- **Client can:** view projects/tasks, expand task details, read/post comments, post project updates, approve tasks flagged `approval_required`, see unread badges.
- **Gaps / issues:** server actions return `{ok:false}` but the `<form action={...}>` usage discards the result, so a failed comment/update/approval is silent. Mark-read is N calls per page load. No attachments, no project files link, no task search/filter, no project-level date/status editing (correctly admin-only), no pagination on the project list.
- **UX:** the strongest module. Clear cards, expandable tasks, unread affordances, good detail layout. Add error feedback and attachments, and it is genuinely complete.

#### Documents — `/portal/documents` and `/portal/documents/[documentId]` · Rating A-
- **Intent:** secure document library with upload, preview, versions, external share links, bulk metadata.
- **Wiring:** `documents.list/upload/createSignedUrl/get/versions/shares/bulkFolder/bulkMetadata`; `DocumentPreview`, `DocumentVersionsClient`, `DocumentShareClient`; public share route.
- **Client can:** upload, search/sort in list/table/grid views, bulk-set folder and metadata, preview/download, create/revoke share links, view versions.
- **Gaps / issues:** **the visibility select is ignored and every upload is `org`** (`actions.ts:34`); "Private" is a false affordance. List is capped at 25 with no pager; the grid view silently slices to 30. No rename/description edit, no delete, no upload size/type guidance. Storage bucket name is shown. Share creation is gated only by `documents:create`, not a `can_share` check. Internal comments? none.
- **UX:** the richest and most polished client module. Fix the privacy bug first; then add pagination and rename.

#### Support — `/portal/support` and `/portal/support/[ticketId]` · Rating B+
- **Intent:** ticket intake, conversation, status tracking, SLA.
- **Wiring:** `tickets.list/create/get/listComments`, `addPortalTicketComment`; accessible modal with focus trap; internal comments filtered on detail.
- **Client can:** submit a ticket (title/priority/category/description), see open/closed/all, open a ticket, reply, view status/priority and comments.
- **Gaps / issues:** list capped at 25 with no search/pager/filter; no attachments, no close/reopen, no CSAT, no escalation, no SLA timer, no "related asset/project" links. Category is free text. Ticket detail hides internal comments correctly, which is the right pattern to reuse elsewhere.
- **UX:** good modal, useful stat cards, clear conversation. The missing lifecycle actions are the main gap.

#### Billing — `/portal/billing` · Rating B
- **Intent:** invoices, subscriptions, payment method, Stripe customer portal.
- **Wiring:** `billing.summary/listSubscriptions/listInvoices/getBillingCustomer/createPortalSession`; Stripe portal.
- **Client can:** view counts, active plan, billing details, invoice table, download PDFs, open the Stripe customer portal.
- **Gaps / issues:** `develop` has already gated "Sync from Stripe" on `billing:manage` (BILL-P3-007), so the earlier 403 is fixed for roles without manage. Still missing: a payment-failure banner, plan upgrade/change, and paging for invoices beyond 50.
- **UX:** clean table and summary cards; the sync control is now correctly permission-gated.

#### Approvals — `/portal/approvals` · Rating C
- **Intent:** submit approval requests, reviewers decide, comments/timeline.
- **Wiring:** full API (`create/list/get/update/approve/reject/cancel/comments/timeline/stats/export`), SDK, admin inbox with workflow actions. Portal has only a read-only list.
- **Client can:** view rows (subject, status, priority, type, requester UUID, due date).
- **Gaps / issues:** no create form despite `approvals:create` being granted to client roles; no detail route; no comments/timeline; no filters; internal-visibility requests leak; 25-row cap. `approvals.stats` is unused.
- **UX:** a plain list with no next action. This is one of the clearest "permission exists, UI missing" modules.

#### Notifications — `/portal/notifications` and `/portal/notifications/preferences` · Rating A-
- **Intent:** notification history, read state, channel/module preferences, SSE real-time updates.
- **Wiring:** `notifications.list/markRead/markAllRead/listPreferences/updatePreferences`; SSE; header bell; preference matrix.
- **Client can:** filter all/unread/read and by module, page through notifications, mark one/all read, toggle email/in-app per module and save.
- **Gaps / issues:** preference load/save failures are swallowed; only five module categories; no per-project/per-ticket mute; no digest cadence; the copy says "Preferences are saved immediately" but there is a Save button.
- **UX:** solid and consistent. Add error handling and a few more categories.

#### Feedback — `/portal/feedback` · Rating B
- **Intent:** client satisfaction pulse (CSAT) feeding the account team.
- **Wiring:** `satisfactionPulse.create`; admin satisfaction-pulse pages/templates.
- **Client can:** set a 0–10 rating, optional subject, comment, submit.
- **Gaps / issues:** no feedback history, no survey templates, numeric input instead of a 0–10 scale/stars, no anonymous option, no follow-up or ticket link. Feedback lands in `satisfaction_pulses` alongside the separate admin pulse/template flow (duplicate models).
- **UX:** simple and clear. A 0–10 selector and a "your previous feedback" panel would make it feel finished.

#### Profile — `/portal/profile` and `/portal/profile/security` · Rating B (security issue)
- **Intent:** self-service profile, avatar, password, MFA/recovery.
- **Wiring:** `users.me`, `profiles.update/uploadAvatar`, `auth.resetPassword`, MFA factors/recovery; `ProfileClient`, `MfaSettingsClient`.
- **Client can:** edit name/phone/title, upload an avatar, "change password", enroll/verify TOTP, generate/reveal/revoke recovery codes.
- **Gaps / issues:** **current password is collected but never sent/verified** (C5); API only checks session ownership; 6-char client minimum vs stronger API policy; no email change; no session/device list; `PortalSubnav current="dashboard"` so no tab is active. Duplicate `<hr>` at lines 232–234.
- **UX:** clean and complete-looking; the password flow is a real security defect, not a polish item.

### 4.2 Operations (17 modules)

#### Assets — `/portal/assets` · Rating C
- **Intent:** client asset/warranty register.
- **Wiring:** `assets.list`; admin assets list/detail with stats, comments, timeline, CSV.
- **Client can:** view name, make/model, type, status, warranty expiry.
- **Gaps / issues:** no detail page, no search/filter, 25-row cap with a misleading count, no "request warranty claim", no assigned user/location, no link to tickets/findings/documents, no stats/export.
- **UX:** plain cards, no next action. A detail page and warranty-expiring summary would add most of the value.

#### Findings — `/portal/findings` and `/portal/findings/[id]` · Rating B-
- **Intent:** open findings/remediation tracker for the client.
- **Wiring:** `findings.list/get`; admin state machine, stats, comments, timeline, CSV; portal detail shows description, affected systems, remediation plan, verification steps, dates.
- **Client can:** read findings and their remediation detail.
- **Gaps / issues:** no acknowledge/accept-risk/dispute, no comments/timeline (API supports both), no remediation-request CTA (ticket), no severity filters, 25-row cap, internal `visibility` not filtered.
- **UX:** detail page is well structured; the list is bare. Add "Ask about this" / "Accept risk" actions and stats.

#### QBR Reports — `/portal/qbr` · Rating D
- **Intent:** quarterly business review reports, generated by the MSP and delivered to the client.
- **Wiring:** `qbr.list`; admin generate/detail; table has `summary`, `report_data`, `visibility`, `approved_at`, `sent_to_client_at`.
- **Client can:** see title, period, status, generated-by UUID, created date.
- **Gaps / issues:** no detail route, no summary/report content, no PDF/print/export, no approval/sent state distinction, internal/draft QBRs not filtered, 25-row cap. The report is the product; the portal shows only its title.
- **UX:** a dead-end list. This is one of the highest-value quick wins: add `/portal/qbr/[id]` using `qbr.get` and a print stylesheet.

#### SLA — `/portal/sla` · Rating B- (display bug)
- **Intent:** SLA/SLO breach and resolution metrics.
- **Wiring:** `sla.metrics` (summary, by metric, recent); no create/edit endpoints (read-only by design).
- **Client can:** see total, breached, breach rate, resolved, per-metric totals/avg minutes.
- **Gaps / issues:** **`breachedRate` is already 0–100 from the API, but the page multiplies by 100** (`sla/page.tsx:55`), so 20% displays as 2000%. No target-vs-actual, trend, per-ticket drilldown, date range, or export. `recent` is unused.
- **UX:** compact summary; the percentage bug destroys credibility. Fix and add a trend.

#### Time Entries — `/portal/time-entries` · Rating C
- **Intent:** worklog visibility/summarizer for the client.
- **Wiring:** `final.timeEntries.list`; API `summary`, CSV; table `time_entries`.
- **Client can:** see description, hours, date, ticket prefix, billable flag.
- **Gaps / issues:** no summary by project/ticket, no date range, no CSV export, no pagination/filter, no link to the ticket, 25-row cap. No create (probably correct for clients).
- **UX:** a raw ledger. Use the existing `summary` endpoint for totals by project/ticket and add an export.

#### Field Services — `/portal/field-services` · Rating D
- **Intent:** hub for ISP assessments, UniFi surveys, port maps, camera calculations, hardware staging and network diagrams.
- **Wiring:** only `fieldServices.isp.list` on this page; the other six modules have their own pages.
- **Client can:** see ISP assessments only.
- **Gaps / issues:** the page title and nav label promise a hub but show one of six datasets. No links to the sibling pages, no counts, no upcoming visits, no reports. The label is misleading.
- **UX:** either make a real hub (counts + recent + links to the six submodules) or rename it "ISP Assessments".

#### UniFi Site Surveys — `/portal/unifi-site-surveys` · Rating C
- **Intent:** UniFi site survey/deployment planning.
- **Wiring:** `fieldServices.unifi.list`; admin page.
- **Client can:** see site, address, AP/switch/camera/outdoor AP counts, cable runs, PoE budget, NVR storage, survey date, status.
- **Gaps / issues:** no detail, no cost/quote, no photos/floor plan, no deployment checklist, no pagination, no request-a-survey CTA.
- **UX:** information-dense cards; good read-only view, but no next step.

#### Port Maps — `/portal/network-port-maps` · Rating C
- **Intent:** switch/port/patch-panel register.
- **Wiring:** `fieldServices.portMaps.list`; admin page.
- **Client can:** see switch, port, speed, VLAN, PoE, uplink, connected device, wall jack.
- **Gaps / issues:** no search/filter by switch/VLAN/port, no detail, no CSV export, no "report a wrong port" action. Long lists are hard to scan.
- **UX:** readable cards; would benefit from a table + filters.

#### Network Diagrams — `/portal/network-diagrams` and `/[id]` · Rating D
- **Intent:** client network diagram builder/viewer.
- **Wiring:** `networkDiagrams.list/get`; admin page accepts a JSON `{nodes,edges}` blob.
- **Client can:** see diagram name/description, a node bullet list, and an "A → B" edge list.
- **Gaps / issues:** **no diagram is rendered** — just text lists. There is no builder UI on either side; admin edits JSON. No zoom/export/image, no topology layout, no device details.
- **UX:** this is the clearest "not actually built" module. Even a simple SVG/React Flow viewer would transform it.

#### Camera Calculator — `/portal/camera-calculator` · Rating A-
- **Intent:** NVR/storage sizing calculator with saved calculations.
- **Wiring:** `fieldServices.camera.calculate/create/list`; client component; saved rows.
- **Client can:** enter camera count/bitrate/retention/resolution, calculate daily/total storage and recommended NVR, save a calculation, view saved ones.
- **Gaps / issues:** cannot edit/delete saved calculations; site name is auto-generated (`"8 cams @ 4MP"`) with no user label; no camera model/compression/fps inputs; no quote request; no pagination.
- **UX:** one of the best small tools in the portal. Add a site name and "Request quote".

#### Secure File Requests — `/portal/file-requests` · Rating C
- **Intent:** tokenized upload links for clients/vendors to send files without an account.
- **Wiring:** `fileRequests.list`; public `/upload/[token]` and `POST /file-requests/public/:token/upload`; admin detail can copy/revoke links.
- **Client can:** see title, description, upload count/max, expiry, status.
- **Gaps / issues:** **no way to open/copy the upload link** — the entire purpose of the module is unreachable from the portal. No upload history, no revoke, no create, no download of received files, no expiry warning.
- **UX:** a dead list. Add "Open upload page", "Copy link", and received-file history; this is a small change with high value.

#### Hardware Staging — `/portal/hardware-staging` and `/[id]` · Rating C
- **Intent:** staging/QA checklist for devices before deployment.
- **Wiring:** `staging.list/get`; pagination; admin page.
- **Client can:** see device, asset tag, status; detail shows checklist.
- **Gaps / issues:** checklist renders `JSON.stringify(item)` (`[id]/page.tsx:74`), so it is unreadable. No progress/QA sign-off, no assigned technician, no photos/serials, no "approve for deployment", no filters.
- **UX:** list is fine; detail is raw JSON. Render the checklist object fields.

#### Change Requests — `/portal/change-requests` · Rating C
- **Intent:** submit/track change requests through draft → review → approve → implement → verify.
- **Wiring:** full governance API state machine, SDK, admin list; portal list only.
- **Client can:** view title, status, priority, type, "scheduled" date.
- **Gaps / issues:** no create/submit form (permissions grant `change-requests:create` to client_admin); no detail/timeline; **scheduled date reads `scheduled_at`, but the column is `implementation_date`**, so it never shows; 25-row cap; no filters.
- **UX:** a plain card list. Add a "Request a change" form and a detail timeline; fix the date field.

#### DNS Changes — `/portal/dns-changes` · Rating C
- **Intent:** request and approve DNS changes.
- **Wiring:** `final.dnsChanges` CRUD; admin page; API.
- **Client can:** view domain, description, type, proposed value, status, created date.
- **Gaps / issues:** no request form, no approve/reject (admin-only), no detail/timeline, no record validation, 25-row cap.
- **UX:** readable list; the request flow is missing.

#### Procurement — `/portal/procurement` · Rating C
- **Intent:** compare vendor quotes and track selection.
- **Wiring:** `final.procurement` CRUD; `POST /final/procurement/compare`; admin `ProcurementCompareClient`.
- **Client can:** see product, vendor, quote, competitor quote, selected/candidate badge, created date.
- **Gaps / issues:** no comparison view, no "approve purchase", no notes/comparison_notes, no detail, 25-row cap. The comparison UI exists in admin and is not reused.
- **UX:** a list of numbers; the comparison table is the missing piece.

#### Budgets — `/portal/budgets` · Rating C
- **Intent:** multi-year budget roadmap and prioritization.
- **Wiring:** `final.budgets` CRUD; `final.budgets` analysis helper (variance); admin page.
- **Client can:** see item, category, estimated cost, fiscal year/quarter, priority, created date.
- **Gaps / issues:** no add/edit/approve (permissions may allow create for client_admin), no variance/analysis, no totals by year/quarter, no export, 25-row cap.
- **UX:** plain cards; a summary bar and quarter grouping would make it a roadmap.

#### Automation — `/portal/automation` · Rating C
- **Intent:** automation workflow catalog (MSP automation).
- **Wiring:** `eduAutomation.automation.list`; admin page; worker execution.
- **Client can:** see workflow name, trigger, script type, last run/status, active state.
- **Gaps / issues:** no run/trigger, no logs, no detail, no on/off (correctly admin-only). This is an internal MSP tool; clients likely do not need it. `eduAutomation.automation` sits under the admin-scope `edu-automation` module, so the nav may hide it for clients.
- **UX:** a monitoring card list; consider moving it to admin only.

### 4.3 Security (22 modules)

#### Security Suite — `/portal/security-suite` · Rating D
- **Intent:** security posture hub (M365, endpoints, incidents, identity).
- **Wiring:** only `securitySuite.m365.list`; the other security-suite namespaces (endpoints, incidents, identity-verification) have their own pages.
- **Client can:** see M365 tenant hardening boolean checks and score.
- **Gaps / issues:** the label promises a suite but shows one dataset; duplicates `/portal/m365-hardening`; no endpoint/patch/incident/backup counts; no trends or recommendations; 25-row cap. A real hub would aggregate the other six modules.
- **UX:** misleading. Either aggregate or rename to "M365 Hardening".

#### Security Ops — `/portal/security-ops` · Rating D
- **Intent:** security operations hub (onboarding, offboarding, break glass, patching).
- **Wiring:** only `securityOps.onboarding.list` (`onboarding_clients`); the other security-ops namespaces have their own pages.
- **Client can:** see client name, discovery/M365/handoff booleans, status.
- **Gaps / issues:** duplicates the onboarding center and offboarding pages; no patch/break-glass/offboarding summary; 25-row cap. The page title is broader than the data by a wide margin.
- **UX:** misleading. Rename to "Security Onboarding" or aggregate.

#### Domain Monitors — `/portal/domain-monitors` · Rating C
- **Intent:** DNS/SSL/email health monitoring per domain.
- **Wiring:** `domainMonitors.list`; worker scans; admin page with create + stats.
- **Client can:** see domain, SSL valid/expiry, SPF, DKIM, DMARC, Cloudflare proxied, status.
- **Gaps / issues:** no detail, no last-checked/scan history, no issues/recommendations, no re-scan request, no `visibility` filter, 25-row cap. `domainMonitors.stats` unused.
- **UX:** useful at a glance; needs a detail drawer and last-checked.

#### Governance — `/portal/governance` · Rating D
- **Intent:** governance overview (changes, risks, retention, tabletop, CAB).
- **Wiring:** `governance.changes.list` only — identical to `/portal/change-requests`.
- **Client can:** view change requests.
- **Gaps / issues:** duplicate route under a broader label; no risk/retention/tabletop/CAB counts or links; no governance calendar; 25-row cap.
- **UX:** remove it or turn it into a real overview.

#### Data Retention — `/portal/data-retention` · Rating C
- **Intent:** retention policy register (data category, system, period, disposal, regulation).
- **Wiring:** `governance.retention.list`; admin CRUD.
- **Client can:** see category, system, retention days, disposal, regulated flag/reference, next review, status.
- **Gaps / issues:** no detail, no review workflow, no attestation, no export, no evidence link, 25-row cap.
- **UX:** readable cards; adding "reviewed" status and a next-review filter would finish it.

#### Risk Register — `/portal/risk-register` · Rating C
- **Intent:** risk acceptance/assessment register; clients are often the risk owner.
- **Wiring:** `governance.risks.list`; admin detail with assess/accept actions (`RiskAssessButton`, `RiskAcceptButton`); API has scoring/accept endpoints.
- **Client can:** see description, category, likelihood/impact, score, acceptance expiry, status.
- **Gaps / issues:** no detail, no accept/reject risk, no mitigating/compensating controls display, no owner, no filters, 25-row cap. The client-facing decision is missing.
- **UX:** summary cards; the actual risk-acceptance workflow is admin-only.

#### Tabletop Exercises — `/portal/tabletop` · Rating C
- **Intent:** plan/run tabletop exercises and capture after-action reports.
- **Wiring:** `governance.tabletop.list`; admin CRUD; table has scenario, participants, action items, after-action report, completed date.
- **Client can:** see title, scenario, participants, scheduled date, status.
- **Gaps / issues:** no detail, no schedule/RSVP, no run flow, no after-action report, no action-item tracking, 25-row cap. It is a record list, not an exercise planner.
- **UX:** a card list; the actual exercise content is invisible.

#### Incident Response — `/portal/incident-response` and `/[id]` · Rating B-
- **Intent:** incident lifecycle tracking with linked runbook.
- **Wiring:** `securitySuite.incidents.list/get`; detail shows detected/contained/eradicated/recovered/closed dates, affected systems, root cause, description, lessons learned, linked runbook.
- **Client can:** read incidents and their lifecycle.
- **Gaps / issues:** no client updates/comments, no notification/acknowledgement, no status timeline beyond five timestamps, no attachments, 25-row cap.
- **UX:** detail page is good (clear lifecycle dots, linked runbook). Add updates/comms and it is complete.

#### Backup & DR — `/portal/backup-dr` · Rating C
- **Intent:** backup status and disaster-recovery risk review.
- **Wiring:** `final.backups.list`; API `stats` and `riskAnalysis`; worker backup scans; admin page.
- **Client can:** see system, type, last status, last backup, offsite/encrypted flags, status.
- **Gaps / issues:** no risk score, no restore-test evidence, no failed-job detail, no RPO/RTO, no trend, no pagination. The two most valuable endpoints (`stats`, `riskAnalysis`) are unused.
- **UX:** useful at a glance; a "last 7 days / failures / restore test" strip would make it a DR dashboard.

#### Runbooks — `/portal/runbooks` and `/[id]` · Rating B-
- **Intent:** client-facing runbooks/procedures.
- **Wiring:** `final.runbooks.list/get`; detail renders full content; admin CRUD.
- **Client can:** read title/category/version/status and the full procedure.
- **Gaps / issues:** no `status` filter, so **draft runbooks and their full content are visible**; no search, print, export, acknowledgement, or review date; 25-row cap.
- **UX:** simple and readable. Filter to published and add print/export.

#### SOP Library — `/portal/sop-library` · Rating C
- **Intent:** MSP SOP library/compliance mapper.
- **Wiring:** `governance.sopLibrary.list`; duplicate table also served by `eduAutomation.sop`; admin page.
- **Client can:** see title, category, version, updated date, status.
- **Gaps / issues:** **no content/detail** — the page only shows metadata; drafts visible; duplicate data model (`sop_library` served by two routers); 25-row cap.
- **UX:** a metadata list for documents the client cannot read. Add a detail page or remove from the client portal.

#### Break Glass — `/portal/break-glass` · Rating C
- **Intent:** emergency account register with rotation/testing evidence.
- **Wiring:** `securityOps.breakGlass.list`; admin CRUD.
- **Client can:** see account name, system, custodian, last used, next rotation, status.
- **Gaps / issues:** no access procedure, no test history (`last_tested_at`, `test_notes` exist), no rotation log, no "test now" request, 25-row cap.
- **UX:** appropriate read-only posture; add last tested and procedure.

#### Patch Compliance — `/portal/patch-compliance` · Rating C
- **Intent:** patch coverage dashboard.
- **Wiring:** `securityOps.patchCompliance.list`; `stats` endpoint; worker scans.
- **Client can:** see device group, compliance %, pending/critical patches, patched/total, exceptions, last patch date.
- **Gaps / issues:** no trend, no device-level drilldown, no exception list, no stats summary, 25-row cap, no "request patching".
- **UX:** good card density; add a coverage trend and exceptions.

#### Endpoint Security — `/portal/endpoint-security` · Rating C
- **Intent:** endpoint coverage (AV, encryption, MDM).
- **Wiring:** `securitySuite.endpoints.list`; `coverage` endpoint; worker scans.
- **Client can:** see group, total endpoints, AV/encrypted/MDM counts, coverage bar, status.
- **Gaps / issues:** no device list, no trend, no unmanaged-device list, `coverage` endpoint unused, 25-row cap.
- **UX:** clean progress bars; add a device drilldown.

#### M365 Security — `/portal/m365-hardening` · Rating C
- **Intent:** M365 tenant hardening assessment.
- **Wiring:** `securitySuite.m365.list`; worker/scanner; admin page.
- **Client can:** see tenant, MFA/CA/legacy-auth booleans, score, status.
- **Gaps / issues:** no per-control recommendations, no re-scan action, no trend, no conditional-access detail, 25-row cap; duplicates Security Suite.
- **UX:** good summary; the "so what" (recommended actions) is missing.

#### Phishing Simulations — `/portal/phishing-simulations` · Rating F
- **Intent:** phishing campaign results and awareness trend.
- **Wiring:** `eduAutomation.phishing.list`; admin targets panel; worker launch.
- **Client can:** see campaign cards.
- **Gaps / issues:** **field names are wrong** — the table has `campaign_name`, `target_count`, `opened_count`, `ended_at`; the page reads `name`/`campaign`, `sent_count`, `completed_at` (`phishing-simulations/page.tsx:45-55`). Campaign names are blank, "Sent" is N/A, and completion dates never show. No per-target results, no click/report rate, no detail, 25-row cap.
- **UX:** currently broken; fix the mapping and show click/report percentages.

#### Identity Verification — `/portal/identity-verification` · Rating C
- **Intent:** anti-vishing identity verification for privileged requests.
- **Wiring:** `securitySuite.idVerify.list`; `verify` action; admin page.
- **Client can:** see requestor name, method, pass/fail, status.
- **Gaps / issues:** no "request verification" form, no detail/timeline, no authorized action display, no notes, 25-row cap. The module is an internal helpdesk tool but presented to clients.
- **UX:** a status list; the workflow is admin-only.

#### Compliance Readiness — `/portal/compliance-readiness` · Rating B-
- **Intent:** framework/control readiness for small businesses.
- **Wiring:** `compliance.listFrameworks` + `listControls` per framework; admin page.
- **Client can:** see frameworks, controls, status, owner, due date; computed framework status.
- **Gaps / issues:** read-only (no evidence upload/link, no owner assignment, no attestation), N+1 calls per framework, no readiness score/export, no control detail.
- **UX:** good tables and nested structure; the evidence workflow is missing.

#### Client Knowledge Base — `/portal/client-knowledge-base` · Rating C
- **Intent:** self-service knowledge base with search and read.
- **Wiring:** `knowledgeBase.list/create`; admin KB page; API supports `search`, `category`, `get`.
- **Client can:** read article cards with a 2-line excerpt, create an article (if `client-knowledge-base:create`).
- **Gaps / issues:** no search (API supports it), no detail page, full article body never readable, drafts (`is_published=false`) are listed and excerpted, creation publishes immediately, no helpful/not-helpful feedback, no AI assistant, 25-row cap.
- **UX:** a card wall with truncated text. Add search + detail + publish workflow.

#### AI Triage — `/portal/ai-triage` · Rating B (blocked for clients)
- **Intent:** describe an issue, get category/priority/subject/missing info/confidence, convert to a ticket.
- **Wiring:** `ai.triageList/triageAnalyze/triageConvert`; `PortalTriageClient`; tickets create.
- **Client can:** in code, analyze a description and create a ticket; the list shows recent drafts.
- **Gaps / issues:** **the `ai` permission is seeded admin-scope**, so client roles do not receive `ai:view`; the nav entry is hidden and a deep link gets 403. E2E runs as admin, so the flow tests green. Also no delete/edit of drafts, list capped 25, no "edit suggestion before creating" beyond subject.
- **UX:** the analyze → review → ticket flow is well designed. Fix the permission scope (or remove the portal page and keep it admin-only).

#### Status — `/portal/status` · Rating C
- **Intent:** service status/incidents/maintenance for the client.
- **Wiring:** `batch.status.public()` → `status_items` where `is_public=true` and unresolved; per-org status is a separate `status_pages` model.
- **Client can:** see global public incidents/maintenance, severity, scheduled start.
- **Gaps / issues:** not org-specific; no component status; duplicates `/portal/status-pages`; no subscribe/notify; no history.
- **UX:** clean incident cards; the distinction from Status Pages is confusing. Merge or clarify.

#### Status Pages — `/portal/status-pages` · Rating B-
- **Intent:** per-org status page components, incidents and maintenance, plus public page.
- **Wiring:** `statusPage.components/incidents/maintenance`; public `/status/[orgId]`; admin pages.
- **Client can:** see component status, active incidents, scheduled maintenance, and open the public status page.
- **Gaps / issues:** 25-row caps, no component grouping, no incident updates/detail, public link is shown even if the org has not opted in, no subscribe.
- **UX:** the best of the two status views; add grouping and incident detail.

### 4.4 Business (14 modules)

#### Vendor Contracts — `/portal/vendor-contracts` · Rating C
- **Intent:** vendor contract renewal calendar.
- **Wiring:** `vendors.contracts.list`; admin CRUD; worker renewal reminders.
- **Client can:** see vendor, service, contract #, start/end, renewal, value, type, auto-renew, status.
- **Gaps / issues:** no detail, no renewal calendar/timeline, no document attachment, no reminder settings, no filter by expiring, 25-row cap, `visibility` not filtered.
- **UX:** dense cards; add an "expiring in 90 days" view and contract file links.

#### Vendor Contacts — `/portal/vendor-contacts` · Rating C
- **Intent:** vendor escalation directory.
- **Wiring:** `vendors.contacts.list`; admin CRUD; table has `escalation_path`.
- **Client can:** see contact, vendor, role, email, phone, account #, support portal link.
- **Gaps / issues:** **`escalation_path` is not displayed**, email/phone are plain text (no mailto/tel), no copy buttons, no search/filter, 25-row cap, `visibility` not filtered.
- **UX:** readable; add escalation tiers and click-to-contact.

#### Services (My Services) — `/portal/services` · Rating D
- **Intent:** one place to track requested services, quotes, proposals, approved services, project progress, documents, tasks, messages and recommendations.
- **Wiring:** **none** — `getPortalServiceHubData()` reads a static JSON file with nine section names and seven statuses; no API call.
- **Client can:** read nine descriptive cards and a static status legend.
- **Gaps / issues:** no data, no links, no counts, no actions; "Request a New Service" goes to the public `/store`, not the portal store; duplicates Service Catalog and Proposals. This is the most visibly unfinished page in the portal.
- **UX:** a placeholder. Replace with a real hub (open requests, proposals awaiting decision, active projects, recent documents), or remove it and link to the real modules.

#### Service Catalog — `/portal/service-catalog` · Rating C
- **Intent:** the services the MSP offers to the client, with pricing/billing model.
- **Wiring:** `serviceCatalog.list` (per-org), admin CRUD.
- **Client can:** see name, category, billing model/unit, base price, included units, bundled/active badges, description.
- **Gaps / issues:** **no `visibility` filter** — internal services and internal base prices are exposed; `overture_rate` is not shown (good) but base price may still be internal; no detail, no "request this service", no search, 50-row default. `visibility` defaults to `internal`, so most seeded rows are internal yet shown.
- **UX:** a price list with no action. Filter to `client_visible` and add "Request service" → store quote or a portal request.

#### Store — `/portal/store` · Rating B-
- **Intent:** client-facing catalog browse with promotions/campaigns.
- **Wiring:** DB-first catalog loader, active promotions, active campaigns; links to public product pages.
- **Client can:** browse by category, see promotions/campaigns, open a product on the public storefront.
- **Gaps / issues:** product links go to `/store/{slug}` and leave the portal/authenticated context; no in-portal quote/request; the "Service Finder Quiz" CTA points to `/portal/service-catalog` (`store/page.tsx:234-239`), not the real quiz at `/store/quiz`; product `status` (active/draft/etc.) is shown as a client badge; no search.
- **UX:** attractive catalog; the navigation/CTAs are miswired.

#### Proposals — `/portal/proposals` and `/[id]` · Rating F
- **Intent:** review a proposal, inspect phases/line items/totals, approve or discuss.
- **Wiring:** `proposals.list/get`; phases/items/comments/timeline; admin builder; there is no client-decision endpoint.
- **Client can:** inspect the proposal, comments and timeline; the only button is "Approve Proposal".
- **Gaps / issues:** **approve is wired to the draft-only `submit-approval` endpoint, so it always 400s on `sent`** (C2). The list does not filter `visibility='client_visible'`, so internal/draft proposals are listed. The detail renders internal comments (C3). No reject/request-changes, no PDF/print, no e-signature, 25-row cap.
- **UX:** visually strong detail page (phases, totals, timeline) and a broken primary action. Fix this before calling proposals client-ready.

#### Training Hub — `/portal/training-hub` · Rating C
- **Intent:** microlearning courses with lessons, enrollment and progress.
- **Wiring:** `trainingHub.courses.list`; SDK has `courses.get`, `lessons.list/get`, `enroll`, `progress`, `myCourses`; admin pages.
- **Client can:** see course title, category, difficulty, estimated minutes.
- **Gaps / issues:** **no enroll, no lessons, no progress, no "my courses"** despite the API/SDK; no course detail; draft/archived courses are listed (`status` not filtered); no certificate/completion; 25-row cap.
- **UX:** a catalog card wall with no learning flow. This is a high-value module that is only ~20% built on the client side.

#### Insurance Evidence — `/portal/insurance-binder` · Rating C
- **Intent:** cyber-insurance evidence binder and coverage readiness.
- **Wiring:** `insuranceBinder.list`; API has create/update/delete and `coverageReport`; the table is shared with `edu-automation` insurance (two schema generations).
- **Client can:** see title, coverage area, status, expiry date.
- **Gaps / issues:** **no upload or attach file** (the table has `file_url`, but no upload endpoint/UI); no coverage report, no provider/policy details, no "request evidence", no detail; legacy `evidence_status` vs `status` can disagree; 25-row cap.
- **UX:** a checklist that cannot collect evidence. Add uploads and the coverage report.

#### License Optimizer — `/portal/license-optimizer` · Rating C
- **Intent:** software license utilization and savings/reclaim opportunities.
- **Wiring:** `licenseOptimizer.list`; API has `summary` and `reclaimable`; worker scans; admin page.
- **Client can:** see software, used/total seats, utilization bar, status.
- **Gaps / issues:** no savings total, no reclaimable list, no cost figures, no detail/action, 25-row cap. The two valuable endpoints are unused.
- **UX:** clean bars; add "potential savings" and "reclaim" recommendations.

#### DMARC Coach — `/portal/dmarc-coach` · Rating C-
- **Intent:** DMARC/SPF/DKIM assessment, grade and coaching recommendations.
- **Wiring:** `dmarcCoach.list`; API stores `issues` and `recommendations` JSON; admin analyze form; worker scans.
- **Client can:** see domain, grade, "issues found".
- **Gaps / issues:** **`issues_count` does not exist on `dmarc_analyses`; the column is `issues`**, so the page always says 0 issues (`dmarc-coach/page.tsx:54`). No detail, no recommendations, no re-scan, 25-row cap.
- **UX:** a one-line grade card; the "coach" value is entirely missing.

#### SharePoint & Teams — `/portal/sharepoint` · Rating C
- **Intent:** SharePoint/Teams structure plan.
- **Wiring:** `final.sharepoint.list`; API `structure-summary`; admin page.
- **Client can:** see site, team, structure type, external sharing, sensitivity label, status, created date.
- **Gaps / issues:** no detail, no structure summary, no site provisioning status/timeline, 25-row cap.
- **UX:** readable cards; the actual plan is not shown.

#### SaaS Audit — `/portal/saas-audit` · Rating C
- **Intent:** SaaS subscription spend/usage audit with cancellation risk.
- **Wiring:** `final.saasAudit.list`; admin page.
- **Client can:** see vendor, service, monthly/annual cost, classification, renewal, cancellation risk, data access.
- **Gaps / issues:** no total spend, no renewal calendar, no duplicate/redundant vendor analysis, no recommended action, no detail, 25-row cap.
- **UX:** a raw subscription list; a spend summary would be the first improvement.

#### Cyber Scoreboard — `/portal/scoreboard` · Rating C
- **Intent:** gamified cyber-hygiene scorecards with badges.
- **Wiring:** `eduAutomation.scorecards.list`; admin evaluate/summary; scorecards table.
- **Client can:** see category, score/max, percentage bar, badge, cheer message, last updated.
- **Gaps / issues:** static per-category scores, no history/trend, no leaderboard, no actions to improve, no link to training, 25-row cap.
- **UX:** cheerful and clear; it is a snapshot, not a scoreboard.

#### Client Portal Overview — `/portal/client-portal` · Rating C
- **Intent:** multi-tenant workspace overview: membership, subscription, enabled modules.
- **Wiring:** `clientPortal.getBootstrap()`; entitlements bootstrap.
- **Client can:** see profile greeting, org memberships, role/status, subscription label, enabled modules.
- **Gaps / issues:** duplicates Dashboard with less actionable data; enabled modules are plain chips with no links; no upgrade/contact CTA; breadcrumb links to itself (`/portal/client-portal`); no invoice/ticket/project summary.
- **UX:** a good "account" page in concept; remove the duplication with Dashboard or make it the true home with deep links.

### 4.5 Advanced (8 modules)

#### Timeline — `/portal/timeline` · Rating B-
- **Intent:** cross-project timeline and calendar.
- **Wiring:** `projects.list` + `listTasks` per project; `ProjectTimelineView` + `ProjectCalendarView`.
- **Client can:** see project/task counts, upcoming count, timeline and calendar; click through to project/task.
- **Gaps / issues:** N+1 task calls (use `projects.getCompound()`); no date-range/filter; no milestones/dependencies; passes `current="projects"` to the subnav while the sidebar highlights Timeline; "upcoming" counts tasks with no due date as upcoming; 25-project cap.
- **UX:** useful visual views; the data loading and IA need tightening.

#### Edu Automation — `/portal/edu-automation` · Rating D
- **Intent:** education-sector automation suite (compliance, training, KB, phishing, scorecards, AI policy, PowerShell, automation).
- **Wiring:** only `eduAutomation.compliance.list`; the rest live in admin. The `edu-automation` permission is **admin-scope**, so clients do not get the nav entry.
- **Client can:** see compliance records if they can reach the page.
- **Gaps / issues:** misleading label, one of eleven datasets, hidden for clients. Internal MSP tool in the client nav.
- **UX:** remove from the client portal or replace with a client-facing "Training & Awareness" landing that links to the real training/scoreboard/phishing modules.

#### Device Profiles — `/portal/device-profiles` · Rating C
- **Intent:** standard device configuration profile library.
- **Wiring:** `deviceProfiles.list` with pagination; admin page.
- **Client can:** see profile name, manufacturer, model, type, specs, created date.
- **Gaps / issues:** specs are flattened to `key: value` text; no detail, no copy/apply, no "request this standard", no filter; 25/page.
- **UX:** a tidy read-only library; add profile detail and a request action.

#### Offboarding — `/portal/offboarding` · Rating D (broken fields)
- **Intent:** employee offboarding safety checklist (account disabled, mailbox, OneDrive, license, access review, evidence).
- **Wiring:** `securityOps.offboarding.list`; `complete-step` API; admin page.
- **Client can:** see employee name, department, offboard date, completion, status.
- **Gaps / issues:** **the page reads `name`/`employee`/`user` and `offboard_date`, but the columns are `employee_name` and `offboarding_date`** (`offboarding/page.tsx:46-52`), so names are blank and dates show "N/A". No request form, no checklist display, no completion, 25-row cap.
- **UX:** broken data mapping; after fixing, add a request form and checklist.

#### Client Onboarding Command Center — `/portal/client-onboarding-command-center` (+ new/detail) · Rating D
- **Intent:** repeatable onboarding workspace with seven phases and checklists.
- **Wiring:** full API/SDK (list/get/create/update/delete/checklist/complete-phase/export), admin UI, portal list/create/detail.
- **Client can:** list records, create a record, view phase cards and checklist items.
- **Gaps / issues:** **create redirect is swallowed** (C6) → record is created but the user sees an error and stays put; checklist checkboxes are `disabled` (`[id]/page.tsx:99-120`), so clients cannot complete their own onboarding even though the API grants edit; no complete-phase button; "New Onboarding" is exposed to clients although the feature doc says create is admin/super_admin; Discovery phase status keyed off `record.status === "discovery"` while the record also has `phase`; no filters/pagination.
- **UX:** good visual phase layout; the core interaction is disabled. This is the module where the gap between "looks done" and "is done" is largest.

#### Dynamic Client Forms Builder — `/portal/dynamic-client-forms-builder` (+ new/detail/fill) · Rating D
- **Intent:** no-code form builder (admin) plus client form-fill and submissions (portal).
- **Wiring:** full API/SDK (create/update/publish/submit/submissions), admin builder, portal list/create/detail/fill.
- **Client can:** list forms, create a form, view fields, fill a published form, view submissions.
- **Gaps / issues:** **"no-code" builder is a raw JSON textarea** (`FormCreateForm.tsx:9-11,65-78`); **create redirect is swallowed** (C6); the fill renderer only handles `textarea`, `select`, `number`/text — `checkbox`, `date`, `email`, `file` all become a text input; submissions render raw `JSON.stringify(answers)`; builder form types (`request`/`onboarding`/`feedback`) do not match the documented types (`intake`/`survey`/`access_request`/...); no field reorder UI, validation, conditional logic, or file uploads; create belongs in admin, not the client portal.
- **UX:** the fill flow is usable; the builder is developer-only. Replace the JSON textarea with a field-row editor and move builder to admin.

#### Uptime Monitor — `/portal/uptime-monitor` · Rating C
- **Intent:** website uptime/SSL/Lighthouse monitoring.
- **Wiring:** `uptimeMonitor.listChecks`; SDK/API `getCheck/getResults/getUptime/dashboard`; worker scans; admin read-only page.
- **Client can:** see URL, check type, status.
- **Gaps / issues:** no uptime %, response time, SSL expiry, check history, incident list, or dashboard; no create (correctly admin-only); 25-row cap. Four useful endpoints are unused.
- **UX:** a bare URL list; a status badge is the only value. Add uptime % and a result chart.

#### CAB — `/portal/cab` · Rating C (role mismatch)
- **Intent:** lightweight change advisory board: schedule meetings, add changes, approve/reject.
- **Wiring:** `cab.list/create/addAgendaItem/updateAgendaItem`; `CabMeetingsClient`; governance change requests.
- **Client can:** schedule a meeting, add pending changes to an agenda, approve/reject agenda items.
- **Gaps / issues:** the feature doc describes an **MSP-staff** tool, but the portal exposes write actions to clients. `client_admin` has `governance:edit` and can schedule/decide; `client_user` has view-only and sees buttons that 403. No meeting detail/minutes, no rollback/implementation fields, no attendee management.
- **UX:** functional and clear, but the access model is wrong. Make it staff-only or read-only for clients.

---

## 5. Feature-gap themes

These are the recurring gaps behind the module-level notes. Fixing them at the pattern level is cheaper than patching 50 pages.

### 5.1 Missing client "request" workflows
The portal is good at **reading** provider-managed data and weak at **starting** work. APIs exist for most of these, and client roles often already have `create`:

| Client need | API that exists | Portal UI |
|---|---|---|
| Submit an approval request | `POST /approvals` | none |
| Submit a change request | `POST /governance/change-requests` | none |
| Request a DNS change | `POST /final/dns-changes` | none |
| Get a secure upload link / upload | `POST /file-requests`, public `/upload/:token` | no link/copy/open |
| Request identity verification | `POST /security-suite/identity-verification` | none |
| Submit insurance evidence | `POST /insurance-binder` (no file upload) | none |
| Request offboarding | `POST /security-ops/offboarding` | none |
| Enroll in training | `POST /training-hub/courses/:id/enroll` | none |
| Complete onboarding checklist | `PATCH /client-onboarding/:id/checklist/:itemId` | disabled |
| Approve/reject a proposal | no client endpoint | broken button |
| Request a service from the catalog | no portal endpoint (public store quote exists) | none |
| Acknowledge a finding / accept a risk | findings/risk endpoints exist (admin) | none |

Adding these turns the portal from a status viewer into a working client workspace. Most are 1–3 day UI + action tasks because the API/SDK already exist.

### 5.2 No consistent list experience
Search, filters, sorting, totals and pagination are implemented **per page** (documents is the only rich example; hardware/device/diagrams have pagers). Everything else is a fixed first page. A shared component with:

- `page`/`limit`/`total` from the API,
- text search where the API supports it,
- status/severity/date filters,
- a "showing X of Y" label,
- empty/error/loading states,
- optional CSV export,

would upgrade ~50 pages at once. It would also fix the misleading "N items" counts.

### 5.3 No drill-down for telemetry
Assets, findings, QBR, SLA, backups, patches, endpoints, M365, domain monitors, licenses, SaaS, DMARC, time entries, vendors, contracts, devices, uptime and scorecards all stop at a summary card. The APIs already expose detail/stats/history endpoints for most. A generic detail-drawer pattern (`PortalRecordDrawer`) fed by `module.get(id)` + `module.stats()` would add depth without 15 bespoke pages.

### 5.4 Provider-managed vs client-managed is not signalled
A client sees the same visual language for "your ticket" and "our backup appliance". Add a small provenance label:

- **"Managed by Maine CyberTech"** for backups, patching, endpoints, M365, domain monitors, licenses, uptime, monitoring, security posture.
- **"Action needed from you"** for approvals, proposals, onboarding checklists, evidence requests, identity verification, risk acceptance.
- **"Request an update"** CTA on provider-managed modules (creates a change request or ticket with prefilled context).

This one convention would resolve most of the "why is this empty / what do I do here" confusion.

### 5.5 Duplicated modules and data models
| Overlap | Pages | Underlying issue |
|---|---|---|
| Change requests | `/portal/change-requests`, `/portal/governance`, `/portal/cab` | Governance page duplicates changes; CAB uses the same change table |
| Status | `/portal/status`, `/portal/status-pages` | Two status systems (`status_items` vs `status_pages` tables) |
| Onboarding | `/portal/client-onboarding-command-center`, `/portal/security-ops`, `/portal/offboarding` | `client_onboarding_command_center_records` vs `onboarding_clients` vs `offboarding_checklists` |
| M365 | `/portal/m365-hardening`, `/portal/security-suite` | Same endpoint on two pages |
| Service catalog | `/portal/services`, `/portal/service-catalog`, `/portal/store` | Static shell vs per-org catalog vs store catalog |
| Compliance | `/portal/compliance-readiness`, `/portal/edu-automation` | `compliance_controls` vs `edu_automation_compliance` |
| Insurance | `/portal/insurance-binder`, admin `edu-automation/insurance` | Two schema generations on `insurance_evidence` |
| SOP | `/portal/sop-library`, admin `edu-automation/sop` | `sop_library` served by two route families |
| Satisfaction | `/portal/feedback`, admin `satisfaction-pulse` | `satisfaction_pulses` served by two route families |

Pick one canonical model per job, migrate the other, and remove the duplicate nav entry. This is also an opportunity to delete 5–8 of the 70 nav items.

### 5.6 Missing exports and offline artifacts
Clients expect to take things away: QBR PDF, SLA report, asset register CSV, time-entry CSV, insurance binder PDF, compliance readiness report, proposal PDF. Most APIs already have CSV/JSON export or the data needed to build one; the portal exposes almost none.

### 5.7 Cross-module search and navigation
`PortalGlobalSearch` searches only tickets and projects (`search-portal.ts:36-57`). It should also search documents, KB articles, proposals, invoices, findings and assets. The sidebar itself has no search, no favourites, no "recent", and 70 entries in five flyouts (the Security flyout can exceed viewport height). A command palette (`⌘K`) would be the single biggest navigation improvement.

### 5.8 Client-role and entitlement testing
The E2E suite is broad (59 portal specs) but shallow: most specs assert a heading and "list or empty state". It signs in as a global admin, so it cannot catch:

- AI Triage being hidden from clients,
- CAB/billing/onboarding buttons 403ing for `client_user`/`client_admin`,
- internal records leaking into lists,
- the proposal approve 400,
- redirect swallowing on create flows,
- entitlement 402s.

Add a **client persona fixture** (`client_admin` and `client_user`, one active and one lapsed subscription) and a small set of mutation specs (create onboarding, create form, approve proposal, upload private doc, submit approval/change/DNS request). That would have caught 8 of the Critical/High findings in this report.

---

## 6. A simpler information architecture

The current five groups (Core 9, Operations 17, Security 22, Business 14, Advanced 8) mix client jobs with MSP tooling. A client-centric regroup:

1. **Home** — Dashboard, Notifications, Profile/Account, Feedback.
2. **Get Help** — Support, AI Triage, Knowledge Base, Training, Status.
3. **My Work** — Projects, Timeline, Documents, Approvals, Proposals, QBR, Requests (change/DNS/file/offboarding/identity).
4. **My Security** — Findings, Risks, Compliance, Incidents, Insurance, Assets, Security Posture (domain/M365/endpoint/patch/backup as tabs or one overview).
5. **My Business** — Billing, Services & Store, Vendors, Licenses, SaaS, Budgets, Procurement.
6. **Provider Tools** (only for MSP staff / admin, not client nav) — Onboarding Center, CAB, Automation, SOP Library, Break Glass, Device Profiles, Forms Builder, Field Services internal records.

Target: **25–30 client nav entries**, not 70. Keep provider tooling in `/admin`, or expose read-only summaries inside the relevant client job (e.g. "Backup status" inside My Security) rather than as a top-level module.

---

## 7. Prioritized roadmap

### Phase 0 — Hotfixes (1–3 days, no new product surface)
1. Remove the `audit.list` call from `/portal/dashboard`; replace with a client-safe recent-activity feed (tickets/projects/documents) or a `portal-summary` endpoint. (C1/defect 5)
2. Filter portal queries by `visibility`/published status for proposals, QBR, approvals, KB, runbooks, training, service catalog, findings, assets, vendors, domain monitors, file requests. (C1)
3. Proposal detail: hide `is_internal` comments; list only `client_visible` proposals; remove or fix the Approve button (new client-decision endpoint). (C2/C3)
4. Documents: read the `visibility` form field. (C4)
5. Profile: verify current password (or force MFA re-auth) before changing it. (C5)
6. Re-throw `NEXT_REDIRECT` in onboarding/form create actions. (C6)
7. Gate "Sync from Stripe" on `billing:manage`; gate CAB buttons on `governance:edit`; gate "New Onboarding"/"New Form" on their create permissions. (C7)
8. Fix field mappings: SLA rate, phishing, offboarding, change-request date, DMARC issues. (defects 10–12, 16–17)
9. Fix `/portal` breadcrumb links to `/portal/dashboard`; fix Profile/Timeline subnav keys.
10. Hide or re-scope the AI Triage nav entry (grant `ai:view` to client roles if the feature is intended for clients). (defect 8)

### Phase 1 — Make the client portal trustworthy (1–2 weeks)
- Shared client-visibility scope in the API/SDK, plus RLS policies as defense in depth.
- Shared `PortalListPage` with paging/search/filter/sort/total/export; roll out to the top 15 lists.
- Proposal client decision flow (approve/reject/request changes) with comments and audit.
- Client request flows: approval, change request, DNS change, file link open/copy, identity verification, offboarding, insurance evidence upload.
- Training course detail + lessons + enroll + progress + my-courses.
- KB search + article detail + publish/review state.
- QBR detail/print/download.
- File-request copy/open and received-file history.
- Form builder: field-row editor, all field types, validation, move builder to admin.
- Onboarding checklist completion + complete-phase.
- Add client-persona E2E coverage for the above.

### Phase 2 — Depth and insight (3–6 weeks)
- Real hubs: My Services (requests/proposals/projects/documents), Security Posture (M365/endpoints/patching/backups/incidents), Governance overview (changes/risks/retention/tabletop/CAB).
- Detail pages/drawers for assets, findings, risks, backups, patches, endpoints, M365, domain monitors, licenses, SaaS, DMARC, vendors, uptime, time entries.
- Use existing stats/summary/compare/risk/history endpoints for trends and summaries.
- Network diagram renderer (SVG/React Flow) with export.
- Cross-module search + command palette.
- Entitlement-aware nav with upgrade/contact-sales path.
- Exports: QBR PDF, SLA CSV, asset register, time entries, insurance binder, compliance report.

### Phase 3 — Polish and scale (ongoing)
- Nav regroup to 25–30 client jobs; remove/relocate MSP tools.
- Humanize status labels; replace raw UUIDs/JSON with names/components.
- Consistent error/success feedback for every action; map 402/403 to helpful messages.
- Performance: compound endpoints, bulk mark-read, caching, fewer client permission fetches.
- Accessibility pass on the 22-tab subnav, mobile flyouts, tables and modals.
- Delete dead components and unused settings/data fields; finish or remove `portal_module_settings`.

---

## 8. Verification notes and limits

- **Code-verified:** every defect above was traced to a specific file/line; the table in §1 links the evidence.
- **Not click-tested:** no web/API stack was running in this environment, so visual/interaction behaviour is inferred from JSX and actions. The exception is logic that is unambiguous in code (redirect catching, field-name mismatch, permission gates, missing filters).
- **Role-dependent findings:** AI Triage, CAB, billing sync and onboarding create depend on the seeded `5302118`/`5302428` permission data and the `client_admin`/`client_user` role assignments. A custom role or later migration could change them; verify against the live `permissions`/`role_permissions` tables before shipping.
- **RLS caveat:** client-visibility leaks are definite at the API layer because no list handler filters `visibility`; even if `RLS_READS_ENABLED` includes a module, the policies only check organization membership, not `visibility`. `documents` is the exception — its `can_read_document()` policy does consider visibility, but the portal upload writes the wrong value.
- **E2E:** `apps/web/e2e/portal/*.spec.ts` is broad but mostly smoke-level and runs with an admin session; the absence of client-role mutation tests explains why several high-severity issues are not caught.

---

## Appendix A — Nav inventory and verdict

| Group | Entry | Route | Rating | Primary gap |
|---|---|---|---|---|
| Core | Dashboard | `/portal/dashboard` | B | Admin-only audit call shows error banner; no KPIs |
| Core | Projects | `/portal/projects` | A- | Silent action failures; N+1 mark-read |
| Core | Documents | `/portal/documents` | A- | Private upload ignored; no pager |
| Core | Support | `/portal/support` | B+ | No attachments/close/CSAT; 25 cap |
| Core | Billing | `/portal/billing` | B | Sync button 403s; no upgrade flow |
| Core | Approvals | `/portal/approvals` | C | Read-only; no create/detail/action |
| Core | Notifications | `/portal/notifications` | A- | Pref errors swallowed; few categories |
| Core | Feedback | `/portal/feedback` | B | No history/templates; numeric input |
| Core | Profile | `/portal/profile` | B | Password re-auth missing |
| Operations | Assets | `/portal/assets` | C | No detail/search/export; 25 cap |
| Operations | Findings | `/portal/findings` | B- | No accept/comment/request action |
| Operations | QBR Reports | `/portal/qbr` | D | No report content/detail/export |
| Operations | SLA | `/portal/sla` | B- | Breach rate ×100 bug |
| Operations | Time Entries | `/portal/time-entries` | C | No summary/export/filter |
| Operations | Field Services | `/portal/field-services` | D | ISP only under a six-module label |
| Operations | UniFi Surveys | `/portal/unifi-site-surveys` | C | No detail/quote/checklist |
| Operations | Port Maps | `/portal/network-port-maps` | C | No search/filter/export |
| Operations | Network Diagrams | `/portal/network-diagrams` | D | No diagram rendering |
| Operations | Camera Calculator | `/portal/camera-calculator` | A- | No edit/delete/site name/quote |
| Operations | Files | `/portal/file-requests` | C | No open/copy link or history |
| Operations | Hardware Staging | `/portal/hardware-staging` | C | Checklist raw JSON; no sign-off |
| Operations | Change Requests | `/portal/change-requests` | C | No submit/detail; date field wrong |
| Operations | DNS Changes | `/portal/dns-changes` | C | No request form/detail |
| Operations | Procurement | `/portal/procurement` | C | No comparison view (API exists) |
| Operations | Budgets | `/portal/budgets` | C | No analysis/totals/actions |
| Operations | Automation | `/portal/automation` | C | Read-only; likely internal-only |
| Security | Security Suite | `/portal/security-suite` | D | M365 only; mislabeled hub |
| Security | Security Ops | `/portal/security-ops` | D | Onboarding only; mislabeled hub |
| Security | Domain Monitors | `/portal/domain-monitors` | C | No detail/history/stats; visibility |
| Security | Governance | `/portal/governance` | D | Duplicate change list |
| Security | Data Retention | `/portal/data-retention` | C | No review/attestation/export |
| Security | Risk Register | `/portal/risk-register` | C | No accept/detail/controls |
| Security | Tabletop | `/portal/tabletop` | C | No run/AAR/detail |
| Security | Incident Response | `/portal/incident-response` | B- | No updates/comms |
| Security | Backup & DR | `/portal/backup-dr` | C | No risk/stats/restore evidence |
| Security | Runbooks | `/portal/runbooks` | B- | Drafts visible; no print/ack |
| Security | SOP Library | `/portal/sop-library` | C | Metadata only; no content |
| Security | Break Glass | `/portal/break-glass` | C | No test/rotation history |
| Security | Patches | `/portal/patch-compliance` | C | No trend/drilldown/exceptions |
| Security | Endpoints | `/portal/endpoint-security` | C | No device list/trend |
| Security | M365 | `/portal/m365-hardening` | C | No recommendations; duplicate |
| Security | Phishing Sims | `/portal/phishing-simulations` | F | Wrong field names; blank/N/A |
| Security | Identity Verification | `/portal/identity-verification` | C | No request/detail |
| Security | Compliance | `/portal/compliance-readiness` | B- | No evidence/attestation/export |
| Security | Knowledge Base | `/portal/client-knowledge-base` | C | No search/detail; drafts visible |
| Security | AI Triage | `/portal/ai-triage` | B | Hidden from clients by permission |
| Security | Status | `/portal/status` | C | Global, not org-specific; duplicate |
| Security | Status Pages | `/portal/status-pages` | B- | No grouping/incident detail |
| Business | Vendors | `/portal/vendor-contracts` | C | No detail/calendar/attachment |
| Business | Vendor Contacts | `/portal/vendor-contacts` | C | Escalation path not shown |
| Business | Services | `/portal/services` | D | Static placeholder |
| Business | My Services | `/portal/service-catalog` | C | Visibility leak; no request CTA |
| Business | Store | `/portal/store` | B- | Leaves portal; quiz CTA wrong |
| Business | Proposals | `/portal/proposals` | F | Approve broken; internal leak |
| Business | Training | `/portal/training-hub` | C | No enroll/lessons/progress |
| Business | Insurance | `/portal/insurance-binder` | C | No upload/coverage report |
| Business | Licenses | `/portal/license-optimizer` | C | No savings/reclaim |
| Business | DMARC Coach | `/portal/dmarc-coach` | C- | Issues always 0; no detail |
| Business | SharePoint | `/portal/sharepoint` | C | No structure summary/detail |
| Business | SaaS Audit | `/portal/saas-audit` | C | No spend total/recommendations |
| Business | Scoreboard | `/portal/scoreboard` | C | Static; no trend/actions |
| Business | Client Portal | `/portal/client-portal` | C | Duplicates dashboard; no links |
| Advanced | Timeline | `/portal/timeline` | B- | N+1; wrong subnav |
| Advanced | Edu Automation | `/portal/edu-automation` | D | One of 11 datasets; admin-scope |
| Advanced | Device Profiles | `/portal/device-profiles` | C | No detail/copy/request |
| Advanced | Offboarding | `/portal/offboarding` | D | Wrong fields; no request/checklist |
| Advanced | Onboarding Center | `/portal/client-onboarding-command-center` | D | Redirect bug; checklist disabled |
| Advanced | Forms Builder | `/portal/dynamic-client-forms-builder` | D | JSON builder; redirect bug; limited fields |
| Advanced | Uptime | `/portal/uptime-monitor` | C | No uptime %/history/dashboard |
| Advanced | CAB | `/portal/cab` | C | Wrong role model for clients |

---

## Appendix B — Quick-win backlog (ordered by impact ÷ effort)

1. Remove dashboard audit call / add client-safe activity.
2. Add a `visibility`/published predicate to every portal query (one shared helper).
3. Hide internal proposal comments; filter proposals to `client_visible`.
4. Read the document visibility field on upload.
5. Re-throw `NEXT_REDIRECT` in onboarding/forms actions.
6. Fix SLA ×100, phishing, offboarding, change-date, DMARC field mappings.
7. Gate billing sync/CAB/onboarding-create buttons by permission.
8. Gate AI Triage permission or remove the portal entry.
9. Fix `/portal` breadcrumbs and Profile/Timeline subnav keys.
10. Add file-request open/copy link.
11. Add a pager/total to the ten most-used lists.
12. Humanize status labels and replace raw UUIDs with names.
13. Add "Request an update" CTA to provider-managed modules.
14. Link the Store quiz CTA to `/store/quiz` and keep product views inside the portal.
15. Replace hardware checklist `JSON.stringify` with a real checklist.

---

*End of report.*

---

## 9. Remediation applied (2026-10-22)

The first remediation batch addresses the Critical/High items that do not require a product redesign:

| Fix | Files |
|---|---|
| Client visibility predicate (role-aware; accepts legacy `client`/`org`/`organization`/`public` values) on proposals, QBR, approvals, findings, assets, vendor contracts, domain monitors, file requests, service catalog, KB, training, runbooks | `apps/api/src/lib/client-visibility.ts` + the corresponding list/detail handlers |
| Proposal list/detail hide internal records and internal comments; broken "Approve Proposal" control removed pending a real client-decision workflow | `apps/api/src/routes/proposals.ts`, `apps/web/app/(portal)/portal/proposals/[id]/page.tsx` |
| Documents: upload honours the Private/Org selector; list/detail/signed URL/versions/shares enforce uploader-or-org visibility for client roles | `apps/web/app/(portal)/portal/documents/actions.ts`, `apps/api/src/routes/documents.ts` |
| Password change verifies the current password (email-recovery sessions are the only exception) | `apps/api/src/routes/auth.ts`, `packages/sdk/src/auth.ts`, `ProfileClient.tsx` |
| Dashboard no longer calls the admin-only audit endpoint; Recent Activity is derived from tickets/projects/documents | `apps/web/app/(portal)/portal/dashboard/page.tsx` |
| `NEXT_REDIRECT` is re-thrown in onboarding/form create actions | `.../client-onboarding-command-center/actions.ts`, `.../dynamic-client-forms-builder/actions.ts` |
| Billing "Sync from Stripe" is hidden unless `billing:manage`; CAB write controls are staff-only; onboarding/form create links are permission-gated | `BillingPageClient.tsx`, `CabMeetingsClient.tsx`, onboarding/forms pages |
| Field fixes: SLA breach rate, phishing fields, offboarding fields, change-request date, DMARC issue count, hardware checklist rendering | portal pages |
| Pagination/counts for assets, findings, proposals, approvals and QBR | portal pages |
| File-request upload link, QBR detail page, breadcrumb/subnav fixes | portal pages |
| AI triage permission scope + visibility normalisation migration | `supabase/migrations/5302463_client_portal_ai_and_visibility.sql` |
| User-scoped response-cache option; the documents list now keys by user+org, preventing cross-user private-document leaks | `apps/api/src/middleware/cache.ts`, `apps/api/src/routes/documents.ts`, `cache.test.ts` |
| Billing summary query construction (verified fixed on `develop`) and sync button permission gate | `apps/api/src/routes/billing.ts`, `BillingPageClient.tsx` |
| Admin visibility selectors for findings/assets/vendor contracts/domain monitors/file requests/service catalog | admin pages + `lib/module-actions.ts` |
| Client request flows: approvals create + detail/comments/decision UI; change-request create + detail/submit; DNS-change request form | `portal/approvals/**`, `portal/change-requests/**`, `portal/dns-changes/**` |
| Training course detail with lessons, self-enrollment and progress; self-enroll now allowed for client `view` roles | `portal/training-hub/**`, `routes/training-hub.ts` |
| Knowledge-base search and article detail | `portal/client-knowledge-base/**` |
| No-code form builder field rows (label/type/required/options/help text/reorder) replacing the raw JSON textarea; form-fill supports checkbox/date/email | `portal/dynamic-client-forms-builder/**` |
| Onboarding checklist service now maps camelCase input to DB columns and defaults `completed_by` to the caller | `services/client-onboarding-command-center.ts` |
| Client request forms for identity verification, employee offboarding and insurance evidence | `portal/identity-verification/**`, `portal/offboarding/**`, `portal/insurance-binder/**` |
| Entitlement-aware portal navigation: plan-gated modules are hidden when the org's `enabledModules` does not include them | `app/(portal)/layout.tsx`, `PortalSidebarLayout.tsx`, `PortalSidebarContent.tsx` |

Verification completed: API `tsc --noEmit` clean; web `tsc --noEmit` clean; SDK `tsc --noEmit` clean; targeted API suites (auth, documents, billing, cache, visibility, approvals, training, onboarding and the 11 module route suites) and 49+ portal page/action tests passing.

Remaining from the roadmap (not in this batch): real client proposal decision workflow, network diagram renderer, remaining list pagination and the nav regroup.
