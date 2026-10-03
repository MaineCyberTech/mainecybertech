# Module Audit — Purpose, Implementation Status & Gaps (2026-08-05)

Deep-dive audit of every module area: what each module should accomplish, how fully it is
implemented (API / SDK / admin UI / portal UI / worker), and current gaps. Based on a
full read of all 56 API route files, 52 admin pages, 64 portal pages, worker tasks, and
the permission catalog (5302118).

## Executive summary

Every module area exists at the basic level: **list renders, create works, data
persists** (all have API routes + SDK + admin/portal pages + seeded data). The two gap
patterns reported by users are real and widespread:

1. **"Can add data but can't edit what's listed"** — 32 admin list pages + 54 portal
   pages are create-or-view-only. No module in the admin app has record deletion
   (except api-keys, documents, tickets, webhooks, store promotions). 13 admin modules
   have working edit pages that are never linked from the list (only reachable by
   typing the URL). 32 admin list pages have no edit route at all
   (edu-automation ×11, field-services ×6, final ×11, governance ×4).
2. **"Adds data but nothing fulfills the task"** — most modules are record-keeping
   dashboards (store what's configured, show it back). Only ~15 modules have real
   business logic that acts on the data (state machines, scoring engines, worker
   tasks, external calls). The rest are pure CRUD repositories.

## Confirmed bugs

| #   | Severity       | Bug                                                                                                                                                                                                | Impact                                                          |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A   | Crash          | `search.ts:77` filters documents by a `type` column that doesn't exist → PostgREST 400                                                                                                             | Admin global search 500s on every query                         |
| B   | Functional     | `tickets.ts:164` filters memberships by `role` (column is `role_id`)                                                                                                                               | "Notify org admins on ticket create" never fires                |
| C   | Security/UX    | `documents` share-link route registered after `requireAuth`; `max_access` not enforced on access_count                                                                                             | External share recipients get 401; link limits unenforced       |
| D   | Security       | by-id PATCH/DELETE not org-scoped on `status-page`, `uptime-monitor`, `dmarc-coach`, `license-optimizer`                                                                                           | Cross-tenant writes                                             |
| E   | Functional     | `batch.ts` PATCH validates the full create schema                                                                                                                                                  | Partial edits fail on website-monitors/licenses/status/dmarc    |
| F   | Functional     | `file-requests` has no upload endpoint                                                                                                                                                             | `storage_path`/`notify_on_upload`/`upload_count` are write-only |
| G   | Data integrity | 3 tables served by two routers with different schemas (`sop_library`, `insurance_evidence`, `satisfaction_pulses`)                                                                                 | Schema drift risk                                               |
| —   | Broken UI      | `/admin/vendors`, `/admin/security-ops`, `/admin/security-suite` 404 (loading.tsx only); proposals "New"/"Edit" → stub/404; qbr detail → 404; portal "New Onboarding"/"New Form"/"Fill Form" → 404 | Dead navigation                                                 |
| —   | Dead code      | `updateProjectBasics` + `addPortalTicketComment` server actions exist but are never imported                                                                                                       | Features half-built                                             |

## Module table

Legend — API: ✅ full CRUD / ◐ partial / — none. **BL** = business logic beyond CRUD.
Tiers: 1 = create+read+edit+delete, 2 = C+R+E (no delete), 3 = C+R only (key gap),
4 = view-only. `*` = edit page exists but not linked from the list (orphaned).

### CORE (both portals)

| Module          | Purpose                                              | API                                                                       | Admin                                             | Portal                                              | Gaps                            |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | ------------------------------- |
| Dashboard       | Org health summary + quick actions                   | ✅ read (summary, 30s cache)                                              | 4                                                 | 4 by design                                         | No per-org variant              |
| Tickets/Support | Intake, triage, status lifecycle, comments, SLA      | ✅ full; CSV, bulk, optimistic locking, 5-min comment edit, webhook+email | 1                                                 | 3 (no reply form — action unused; no status change) | Bug B; portal reply missing     |
| Documents       | Secure storage, versions, sharing, preview, bulk ops | ✅ full; upload allowlist, versioning, signed share links, bulk RPC       | 1                                                 | 2 (no entity delete)                                | Bug C; no version delete        |
| Projects        | Project/task planning, tracking, approvals           | ✅ full; compound, RPCs, CSV, Jira                                        | 2 (project record not editable — actions unwired) | 2 (comments/approve)                                | Admin project edit UI missing   |
| Approvals       | Formal approve/reject workflow                       | ✅ full; state machine, comments/timeline, CSV                            | 4+actions                                         | 4 (no approve button)                               | Portal approvals dead read-only |
| Notifications   | In-app + email alerts, prefs, SSE                    | ◐ (no update; SSE, dedup)                                                 | 4+mark-read                                       | 4+mark-read                                         | —                               |
| Profile         | Self-service profile/avatar/password                 | ✅ (PATCH own)                                                            | —                                                 | 2 (self-edit)                                       | —                               |

### ADMIN

| Module            | Purpose                              | API                                          | Admin        | Portal      | Gaps                           |
| ----------------- | ------------------------------------ | -------------------------------------------- | ------------ | ----------- | ------------------------------ |
| Organizations     | Tenant CRUD, domains, branding       | ✅ full; compound, logo upload, cache        | 2            | —           | Create ignores branding fields |
| Users             | Users, memberships, roles, overrides | ◐ (no create/delete — via bulk invite/auth)  | 2            | —           | —                              |
| Roles/Permissions | RBAC matrix + overrides              | ✅ full; compound, cache                     | 2            | —           | —                              |
| Audit             | Compliance log viewer + export       | ✅ read + CSV/JSON                           | 4+export     | —           | —                              |
| Billing           | Stripe invoices/subs/payments        | ✅ read + /sync + portal URL                 | 4            | 4 by design | —                              |
| Settings          | Platform settings, test email        | **no route file**                            | 4+test-email | —           | Module key exists, no API      |
| Health            | Service probes                       | ✅ DB + Stripe + JSM                         | 4            | —           | —                              |
| Search            | Global cross-entity search           | ✅                                           | —            | —           | **Bug A (500)**                |
| Bulk Invite       | CSV user import                      | ✅ parse→createUser→membership               | tool         | —           | No invite email                |
| Webhooks/API Keys | Webhook mgmt + hashed keys           | ✅ full; SSRF guard, HMAC test, delivery log | 1            | —           | —                              |

### SECURITY

| Module                | Purpose                                | API                       | Admin                  | Portal                  | Gaps                                              |
| --------------------- | -------------------------------------- | ------------------------- | ---------------------- | ----------------------- | ------------------------------------------------- |
| M365 Hardening        | Tenant M365 assessment + scores        | ✅ full; scan (simulated) | 2\*                    | 4                       | Scan is fake timestamp bump (real scan in worker) |
| Incident Response     | Incident tracking through stages       | ✅ full                   | 2\*                    | 4                       | —                                                 |
| Identity Verification | Verify identity for privileged actions | ✅ full; verify action    | 2\*                    | 4                       | —                                                 |
| Endpoint Security     | Device posture/compliance              | ✅ full; coverage calc    | 2\*                    | 4                       | —                                                 |
| Patch Compliance      | Patch coverage                         | ✅ full; /stats           | 2\*                    | 4                       | —                                                 |
| Offboarding           | Employee offboarding checklist         | ✅ full; complete-step    | 2\*                    | 4 (checkboxes disabled) | Portal checklist not interactive                  |
| Break Glass           | Emergency account registry             | ✅ full                   | 2\*                    | 4                       | —                                                 |
| Onboarding Clients    | New-client onboarding checklist        | ✅ full                   | 2\*                    | 4                       | —                                                 |
| Risk Register         | Risk register + scoring                | ✅ full; assess scoring   | 3                      | 4                       | —                                                 |
| Tabletop              | Tabletop exercise planning             | ✅ full (CRUD only)       | 3                      | 4                       | No exercise flow (schedule→run→report)            |
| Retention             | Data retention policy tracking         | ✅ full                   | 3                      | —                       | Worker purge exists; no policy enforcement link   |
| Change Requests       | Change state machine                   | ✅ full; 5-step           | 3                      | 4                       | Portal can't submit a change request              |
| DMARC Coach           | DMARC/SPF/DKIM assessment + grading    | ✅ full; grading engine   | 2\* (dmarc) + 4 (view) | 4                       | Bug D                                             |

### OPERATIONS

| Module                  | Purpose                                        | API                                                                                                              | Admin                                     | Portal           | Gaps                                                           |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------- | -------------------------------------------------------------- |
| Assets                  | Asset lifecycle/warranty tracking              | ✅ full; CSV, stats                                                                                              | 2                                         | 4                | —                                                              |
| Findings                | Findings triage → verify/resolve               | ✅ full; state machine, CSV                                                                                      | 2                                         | 4                | —                                                              |
| Domain/Website Monitors | External monitoring config + results           | ✅ full; stats                                                                                                   | 2 / 2\*                                   | 4                | Bug E (website PATCH)                                          |
| Uptime Monitor          | Status-check config + uptime history           | ✅ full; dashboard, 7/30/90-day                                                                                  | 4 (view-only!)                            | 4                | Bug D; admin can't create checks                               |
| Status Page             | Public status components/incidents/maintenance | ✅ full; public page                                                                                             | 2\* + 4                                   | 4                | Bug D                                                          |
| Licenses                | License tracking + savings                     | ✅ full; savings calc                                                                                            | 2\*                                       | 4                | Bug E PATCH full-schema                                        |
| License Optimizer       | Utilization <70% → savings                     | ✅ full; reclaimable list                                                                                        | 4                                         | 4                | Bug D; different table than Licenses                           |
| Service Catalog         | Catalog of offered services                    | ✅ full                                                                                                          | 2\*                                       | 4                | —                                                              |
| QBR                     | Quarterly business review generation           | ◐ generate only; no edit/export                                                                                  | 4 (stubs/404)                             | 4                | Admin can't create (stub), detail 404s                         |
| Proposals               | Proposal builder + approval flow               | ✅ full; totals, submit-approval, publish                                                                        | 4 (stub/404)                              | 2-lite (approve) | Admin CRUD UI missing; totals stale on item PATCH              |
| Vendors                 | Contract/contact registry + renewals           | ✅ full; renewals window                                                                                         | contracts/contacts 2; **vendors hub 404** | 4                | /admin/vendors broken                                          |
| Time Entries            | Tech time tracking (billable)                  | ✅ full                                                                                                          | 3                                         | 4                | Portal can't log time                                          |
| Backup/DR               | Backup status + risk analysis                  | ✅ full; stats, risk score                                                                                       | 3                                         | 4                | —                                                              |
| Field Services (6)      | Surveys/calcs + deployment tracking            | ✅ full; real calculators (camera storage, ISP score, UniFi plan), diagram export                                | 3 (all C+R only)                          | 4                | Camera POST /calculate doesn't persist; no edit                |
| Edu Automation (11)     | Compliance/training/KB/automation suite        | ✅ full; compliance score, phishing launch, scorecard evaluate, KB search/rate, automation execute (status flip) | 3 (all C+R only)                          | 4                | Execute is a status flip; KB generator boilerplate; no real AI |
| Governance (4)          | Change/risk/retention/exercises                | ✅ full (change+risk have logic)                                                                                 | 3 (all C+R only)                          | 4                | —                                                              |
| Security Suite/Ops hubs | Grouping hubs                                  | —                                                                                                                | **404 pages**                             | 4                | Sidebar links to 404                                           |
| Final Batch (11)        | Record-keeping modules                         | ✅ full; budgets variance, procurement compare, sharepoint summary                                               | 3 (all C+R only)                          | 4                | Biggest add-only block: 11 modules with zero edit/delete       |
| SLA                     | SLA metrics                                    | ✅ read-only /metrics                                                                                            | 4                                         | 4 by design      | `sla:create/edit/delete` keys have no endpoints                |
| Business OS             | Exec dashboards                                | ✅ read-only aggregates                                                                                          | 4                                         | —                | `business-os:edit` key unused                                  |

### CLIENTS

| Module                    | Purpose                                    | API                                             | Admin                           | Portal                                  | Gaps                                                                        |
| ------------------------- | ------------------------------------------ | ----------------------------------------------- | ------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| File Requests             | Client requests file w/ secure upload link | ✅ full; public token endpoint                  | 2                               | 4                                       | **Bug F: no upload endpoint**                                               |
| Insurance Binder          | Insurance evidence collection              | ✅ full; coverage report                        | 4                               | 4                                       | No evidence file upload                                                     |
| Training Hub              | Courses/lessons/enrollments                | ✅ full; enroll, progress                       | 4 (view-only!)                  | 4                                       | Admin can't create courses                                                  |
| Onboarding Command Center | Multi-phase onboarding tracker             | ✅ full; complete-phase, CSV                    | 2                               | 4 + broken "New Onboarding" (404)       | Portal create button dead                                                   |
| Dynamic Forms             | Custom client forms + submissions          | ✅ full; publish, submit, CSV                   | 3                               | 4 + broken "New Form"/"Fill Form" (404) | Portal create/fill buttons dead                                             |
| Satisfaction Pulse        | CSAT pulse surveys                         | ✅ full; respond, templates, CSV                | 3                               | 4                                       | Respond requires auth (no anonymous widget)                                 |
| AI                        | Ticket triage + copilot                    | ◐ (no delete); heuristic engine, convert→ticket | 3                               | 4                                       | No real LLM; no draft delete                                                |
| Store                     | Storefront + marketing mgmt                | ◐ promotions/quotes; analytics                  | 1 (promotions), 4 (rest static) | 4                                       | No admin CRUD for products/campaigns; quotes read-only; no analytics export |

### WORKER (what actually "fulfills" data in the background)

`stripe-reconcile`, `jira-sync`, `jsm-sync`, `m365-calendar-sync` (real external
integrations), `module-tasks` (scan-type tasks: m365 hardening, backups, license
optimizer, DMARC, status, uptime, phishing — these DO process seeded data),
`webhook-dispatcher`/`webhook-retry`, `scheduled-notifications`, `notification-email`,
`retention`, `public-interaction-retention`, `orphan-cleanup`.

## Priority roadmap

1. Bug A (search 500) + Bug C (share links) — crash + core feature
2. Wire the 13 orphaned admin edit routes (link from lists)
3. Portal support reply form (wire existing `addPortalTicketComment`)
4. Tier-3 buildout: generic update/delete actions + `[id]` edit pages for the 32
   create-only admin modules (shared `RecordDetail` + config-driven actions)
5. Fix broken 404 links (admin hubs, proposals/qbr UI, portal new/fill buttons)
6. Bugs B/D/E/F — functional + security issues
7. "Fulfill the task" upgrades — file-request upload endpoint, real M365 scan,
   tabletop exercise flow, portal change-request submission, portal approvals
   approve button, admin training-hub/uptime create UI
