# Feature Implementation and Gap Map (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:29:24Z
- Auditor: subagent (independent re-audit; read-only)
- Area code: FEAT
- Output path: `docs/audits/mainecybertech/mainecybertech-20261103-0748-full-main-6b7aa1a/03_feature_implementation_map.md`
- Scope limitations: repository-only; no live API/browser run. Route and OpenAPI coverage were checked with `node scripts/openapi-audit.js`; feature status is derived from code, routes, SDK, UI, tests and docs.

## Scope

Re-verification of the 13 `FEAT` findings from `mainecybertech-20261014-0033-full-main-7dd0402` against `origin/main` @ `6b7aa1a`, plus a fresh map of the features added in this window: client-portal visibility and entitlements, AI draft endpoints, client approvals/change-requests/DNS/identity/insurance/offboarding flows, training enrollment, QBR/KB detail, network-diagram canvas and proposal client decision.

Reviewed: 97 portal pages, 330 total app pages, 455 live API routes, 162 migrations, 30 workflows, 74 module docs, 91 E2E specs. Not reviewed: live data, production routes, email/push delivery.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/app.ts` | Router mount table | Canonical surfaces | 455 live routes |
| `scripts/openapi-audit.js` | Contract guard | Route ↔ spec parity | 0 missing, exit 0 |
| `apps/api/src/routes/ai.ts` | AI | Draft review gate | Create/list/get/review |
| `packages/sdk/src/ai.ts` | SDK | Consumer parity | No drafts methods |
| `apps/web/app/(admin)/admin/ai/page.tsx` | Admin UI | AI consumer | Triage only |
| `apps/web/app/(portal)/portal/**` | Portal UI | New flows | 97 pages |
| `docs/modules/*.md` | Feature docs | Status claims | AI tools, change requests |
| `supabase/migrations/*` | Data | Tables/orphans | 162 migrations |
| `docs/audits/portal-modules/2026-10-21/report.md` | Prior audit | Gap baseline | Dated |

## Verification Performed

| Check | Method | Result |
|---|---|---|
| OpenAPI coverage | `node scripts/openapi-audit.js` | 455 live routes, 0 missing, exit 0 |
| Duplicate CRUD surfaces | grep `crudRoute`/table names | No table registered twice |
| Dead server actions | grep exports vs imports | FEAT-P3-008 fixed |
| AI draft consumer | grep `ai/drafts` in apps/web + packages/sdk | None |
| New portal flows | Directory/method walk | Create-only for 4 modules |
| Seed safety | grep `app.seed_demo` | All demo migrations guarded |
| Prior fixes | Targeted reads | 13/13 verified |

## Executive Summary

All 13 previous `FEAT` findings are **verified-fixed** at this commit. API keys authenticate, demo seeding is flag-gated, store analytics is wired, AI draft writes exist with a one-way review gate, the three duplicated tables have one canonical surface each, the OpenAPI/docs surface is production-disabled, the eleven store previews are labelled, the duplicate scorecard doc and `portal_module_settings` are gone, the dead project action is gone, ticket transitions are enforced, the module-audit docs are historical, and the seven project-detail actions are no longer exported dead code.

The new feature wave is mostly complete end-to-end: approvals, change requests, DNS changes, identity verification, insurance evidence and offboarding all have API + SDK + portal create UI + redirect tests; training enrollment, QBR detail, KB detail, network diagrams and proposal client decisions are wired. Two gaps remain:

1. **AI draft review gate has no consumer.** The API, validators, OpenAPI and tests exist, and `docs/modules/ai-tools.md` describes an SDK, but `packages/sdk/src/ai.ts` has no drafts methods and no admin UI lists `ai_draft_outputs`. The human review gate is unreachable from the product.
2. **Four new client request modules are create-only.** DNS changes, identity verification, insurance binder and offboarding have no `[id]` route and their list rows are non-linked, so the client cannot reopen the record or see status/history.

| Status | Count |
|---|---:|
| verified-fixed | 13 |
| partially-fixed | 0 |
| regressed | 0 |
| open (previous) | 0 |
| new | 2 (`FEAT-P3-009`, `FEAT-P3-010`) |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| API keys | `middleware/api-key.ts` | Machine auth | Working | — | Tested |
| Store analytics | `analytics/page.tsx` + tracker | Events/summary | Working | — | Live endpoints |
| AI triage | `routes/ai.ts` + `AiApi` | Triage/copilot | Working | — | Admin + portal |
| AI drafts | `routes/ai.ts:515-620` | Review gate | API only | Medium | FEAT-P3-009 |
| Approvals | `portal/approvals/**` + API | Client requests | Create/detail | — | Paginated |
| Change requests | `portal/change-requests/**` | Client changes | Create/detail | — | Paginated |
| DNS changes | `portal/dns-changes/**` | Client DNS | Create-only | Medium | FEAT-P3-010 |
| Identity verification | `portal/identity-verification/**` | Client ID | Create-only | Medium | FEAT-P3-010 |
| Insurance binder | `portal/insurance-binder/**` | Client evidence | Create-only | Medium | FEAT-P3-010 |
| Offboarding | `portal/offboarding/**` | Client offboarding | Create-only | Medium | FEAT-P3-010 |
| Training | `portal/training-hub/**` | Enrollment/progress | Detail + progress | — | Tested smoke |
| QBR / KB | `portal/qbr/[id]`, `client-knowledge-base/[id]` | Read detail | Working | — | New |
| Network diagrams | `NetworkDiagramCanvas.tsx` | Visual topology | Working | Low | Colour drift |
| Portal entitlements | `client-portal/*` + admin form | Module gating | Working | — | Uses bootstrap |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Pages/routes | 4 | 330 pages, 97 portal | 4 create-only modules | FEAT-P3-010 |
| Components | 3 | Shared Dialog/Chip; many raw controls | Design-system adoption | UX-P2-005 |
| API endpoints | 5 | 455 routes, 0 missing | — | Keep |
| Server actions | 4 | Prior dead actions removed | 6 new actions throw on error | USE-P3-008 |
| Workers/jobs | 4 | BullMQ production + tests | — | Keep |
| Database entities | 4 | 162 migrations; orphan dropped | Duplicate prefix | DOC-P3-009 |
| Permissions | 3 | Matrix + route guards | Client approvals edit is broad | Review |
| Audit logs | 4 | Mutations log audit events | — | Keep |
| Tests | 3 | 521 suites + 91 E2E | New detail/decision flows smoke-only | Add tests |
| Docs | 3 | 74 module docs | AI draft consumer + change-request path | FEAT-P3-009 / DOC-P3-012 |
| Workflow states | 4 | Ticket/change/approval transitions | — | Keep |
| Failure states | 3 | DataErrorNote/role=alert | New create actions throw | USE-P3-008 |

## Detailed Review

### Item: AI draft review gate

- Evidence: `apps/api/src/routes/ai.ts:515-620`; `validators/ai.ts:33,43`; `openapi/spec.ts:1792-1812`; `ai.test.ts:200-270`; `docs/modules/ai-tools.md:5,18,28-31`.
- What it does: persists an AI output with `status='draft'`, lists/gets it, and allows one approved/rejected transition with reviewer identity/notes.
- Dependencies: `ai_draft_outputs`, permission `ai:create/view/edit`.
- Missing controls: no SDK methods, no admin/portal screen, no queue for reviewers.
- Risk: a documented governance feature cannot be operated by a human.
- Recommendation: add `AiApi.drafts` and a review queue under `/admin/ai`.

### Item: New client request flows

- Evidence: six modules under `apps/web/app/(portal)/portal/`.
- What it does: approvals and change requests have full create/detail; DNS/identity/insurance/offboarding have create only.
- Missing controls: detail/status/history for the latter four; inline error handling; pagination.
- Recommendation: add `[id]` pages and link rows, or declare them one-way and hide the expectation of a status view.

### Item: Client-portal visibility and entitlements

- Evidence: `apps/api/src/lib/client-visibility.ts`; migration `5302463_client_portal_ai_and_visibility.sql`; `client-portal` bootstrap consumed by the portal layout.
- What it does: filters `visibility` for client roles, grants `ai:view` to client roles, normalises legacy values, and hides unentitled nav modules.
- Missing controls: the membership lookup fails open to the staff view on DB error (security domain); no UI test for the nav gating.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| FEAT-001 | Pages/routes | 330 pages | App Router guards | 4 create-only modules | P3 | FEAT-P3-010 |
| FEAT-002 | Components | 557 tsx | Shared primitives | Adoption | P2 | UX-P2-005 |
| FEAT-003 | API endpoints | 455 routes | OpenAPI audit clean | — | — | Keep |
| FEAT-004 | Server actions | 6 new request actions | Redirect preserved | Errors throw | P3 | USE-P3-008 |
| FEAT-005 | Workers/jobs | 29 handlers | BullMQ prod | — | — | Keep |
| FEAT-006 | Database entities | 162 migrations | RLS + types | Duplicate prefix | P3 | DOC-P3-009 |
| FEAT-007 | Permissions | matrix + guards | requirePermission | Client approvals edit broad | P3 | Review SoD |
| FEAT-008 | Audit logs | audit service | Mutations logged | — | — | Keep |
| FEAT-009 | Tests | 521 suites / 91 E2E | Unit + smoke | New detail flows smoke-only | P3 | Add tests |
| FEAT-010 | Docs | 74 module docs | Broad coverage | AI/change-request drift | P3 | Update |
| FEAT-011 | Workflow states | ticket/change/approval | Maps + 409 | — | — | Keep |
| FEAT-012 | Failure states | DataErrorNote/role | Present | New forms throw | P3 | USE-P3-008 |

## Findings

### Re-verification of previous findings

| ID | Sev | Previous status | Re-verified status | Evidence at 6b7aa1a |
|---|---|---|---|---|
| FEAT-P2-001 | P2 | verified-fixed | verified-fixed | `middleware/api-key.ts:70-112`; `auth.ts:67-71`; `api-key-auth.test.ts` |
| FEAT-P2-002 | P2 | verified-fixed | verified-fixed | `app.seed_demo` guard in all demo migrations (`5302119:25`, `5302120:27`, `5302121`, `5302123:31`, `5302126:30`, `5302406:66`) |
| FEAT-P2-003 | P2 | verified-fixed | verified-fixed | `5302440_search_analytics_summary.sql:19`; `analytics/page.tsx:26-41`; trackers |
| FEAT-P2-004 | P2 | verified-fixed | verified-fixed | `ai.ts:515,537,562,578`; `validators/ai.ts:33,43`; `openapi/spec.ts:1792-1812` |
| FEAT-P2-005 | P2 | verified-fixed | verified-fixed | one surface each: `app.ts:207,213,218`; `openapi-audit.js` 455/0 |
| FEAT-P3-001 | P3 | verified-fixed | verified-fixed | `docs.ts:25-30,38,43-59`; openapi audit clean |
| FEAT-P3-002 | P3 | verified-fixed | verified-fixed | `AdminPreviewNote.tsx:9` used by 11 store pages |
| FEAT-P3-003 | P3 | verified-fixed | verified-fixed | only `scoreboards-gamification.md`; `INDEX.md:201` |
| FEAT-P3-004 | P3 | verified-fixed | verified-fixed | `5302460_drop_portal_module_settings.sql:17` |
| FEAT-P3-005 | P3 | verified-fixed | verified-fixed | `updateProjectBasics` 0 matches |
| FEAT-P3-006 | P3 | verified-fixed | verified-fixed | `ticket-status.ts:29-67`; `tickets.ts:262-269,628-664` |
| FEAT-P3-007 | P3 | verified-fixed | verified-fixed | `MODULE_AUDIT.md:3`; `MODULE_SPECS_GAP_AUDIT_2026-08-05.md:3` |
| FEAT-P3-008 | P3 | open | verified-fixed | dead update actions removed; helpers de-exported (`actions.ts:175-296`) |

### Finding ID: FEAT-P3-009 — AI draft review gate has API, OpenAPI and tests but no SDK method or UI consumer

- Severity: P3
- Confidence: High
- Area: FEAT
- Evidence:
  - API: `apps/api/src/routes/ai.ts:515` (create), `:537` (list), `:562` (get), `:578` (review); `persistAiDraft:183`; `validators/ai.ts:33,43`; `openapi/spec.ts:1792-1812`; `apps/api/src/__tests__/ai.test.ts:200-270`.
  - Docs: `docs/modules/ai-tools.md:5` claims an SDK, `:18` claims the review gate, `:28-31` documents the endpoints.
  - Consumer gap: `packages/sdk/src/ai.ts` has only triage/copilot (lines 33-71, no drafts methods); `apps/web/app/(admin)/admin/ai/page.tsx:30` calls `api.ai.triageList` only; `grep -rn "ai/drafts" apps/web packages/sdk` → 0 matches.
- What is happening: the write path the prior audit asked for exists, but nothing in the product can reach it; only raw HTTP clients can.
- Why it matters: the documented "human review gate" for AI output has no human UI; a future AI generator cannot use the SDK to persist/review drafts.
- User / business impact: governance promise is not operable; reviewers cannot approve/reject AI output.
- Security / privacy / reliability impact: un-reviewed AI output cannot be tracked in the product, so the intended control is decorative.
- Recommended fix: add `AiApi.drafts.{create,list,get,review}` and an admin review queue (list pending drafts, show content, approve/reject with notes), or remove the SDK claim and mark the endpoints API-only.
- Suggested validation: SDK unit tests for the four methods; admin page test with a pending draft; review action audit assertion.
- Owner suggestion: AI/backend + web admin
- Effort estimate: M
- Dependencies: `ai:create/view/edit` permissions (present)
- Status: open

### Finding ID: FEAT-P3-010 — Four new client request modules are create-only: no detail route, so the client cannot reopen the record they submitted

- Severity: P3
- Confidence: High
- Area: FEAT
- Evidence:
  - Directory layout: `apps/web/app/(portal)/portal/{dns-changes,identity-verification,insurance-binder,offboarding}/` each contain `page.tsx`, `new/`, `actions.ts` and no `[id]/`.
  - List rows are non-linked `<div>`s: `dns-changes/page.tsx:57-60`, `offboarding/page.tsx:58-70` (the only Links are the create button and Dashboard).
  - API/SDK expose detail/update/lifecycle: `apps/api/src/routes/final/dns-changes.ts`, `security-ops.ts:169-210`, and SDK modules.
  - Prior audit rated these C for the same reason: `docs/audits/portal-modules/2026-10-21/report.md:431,955`.
- What is happening: the create half of the flow was added; the read-back/status half was not.
- Why it matters: a client who submits a DNS/identity/insurance/offboarding request cannot see its status, timeline, reviewer notes or correct a mistake; support must relay everything.
- User / business impact: duplicate submissions, support load, no audit trail for the client.
- Security / privacy / reliability impact: none direct; the API already scopes by org.
- Recommended fix: add a read-only `[id]` detail page per module (status, submitted date, fields, timeline/notes) and link each list row; or explicitly label the flow as one-way and remove the status expectation from the copy.
- Suggested validation: E2E create → redirect/list → open detail → status visible.
- Owner suggestion: @web (portal)
- Effort estimate: M
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| AI review gate unusable | P3 | High | Governance gap | FEAT-P3-009 | SDK + UI |
| Client requests disappear after submit | P3 | High | Duplicates/support | FEAT-P3-010 | Detail pages |
| New actions lose form data | P3 | Medium | Abandoned requests | USE-P3-008 | Inline errors |
| Portal lists hide rows | P2 | High | Incomplete decisions | USE-P2-012 | Pagination |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

- Decide whether the AI draft gate is API-only or needs UI; if UI, schedule it (`FEAT-P3-009`).

### This Month

- Add detail pages for the four create-only modules (`FEAT-P3-010`).
- Add pagination/inline errors to the new flows (USE-P2-012/USE-P3-008).

### Later / Platform Evolution

- Generate the feature map from the module registry + OpenAPI + route tree so gaps are visible automatically.
- Add a "UI consumer exists" check for every documented SDK/API feature.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Link list rows to a detail placeholder | Sets expectation | 4 portal lists | E2E |
| Add SDK drafts methods | Unblocks API consumers | `packages/sdk/src/ai.ts` | SDK test |
| Remove the SDK claim from the AI doc | Stops false documentation | `docs/modules/ai-tools.md` | grep |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| AI draft review UI | P3 | AI + web admin | M | none |
| Four detail pages | P3 | portal | M | none |
| Feature-map generator | P3 | platform | L | registry/OpenAPI |

## Suggested Tests

- Unit: `AiApi.drafts` create/list/get/review paths and payloads.
- Component: admin review queue renders a pending draft and calls review with notes.
- E2E: create a DNS change → list → detail → status visible.
- Contract: every SDK method has a matching OpenAPI entry (extend `openapi-audit`).
- Regression: keep the API key, seed-gate, analytics, ticket-transition and project-action tests.

## Suggested Documentation Updates

- `docs/modules/ai-tools.md`: add the SDK/UI status (or remove the SDK claim).
- `docs/modules/change-requests.md`: fix the base path (DOC-P3-012).
- Add `docs/modules/dns-changes.md` or point to `final-multi-module.md` explicitly for the new portal flow.
- Update the feature matrix with the four create-only modules and their status.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the AI draft gate intended for API-only consumers? | Decides FEAT-P3-009 fix vs doc change | Product/AI owner |
| Are the four request modules intentionally one-way? | Decides FEAT-P3-010 | Product decision |
| Should `client_user` be able to submit a change request it can create? | The UI requires `governance:edit`; client_user has only view | Permission/product decision |
| Should client roles hold `approvals:edit`? | They can decide other users' requests (self-approval is blocked) | Security/product decision |

## Appendix

- Route/table evidence: `app.ts:207` governance, `:213` satisfaction-pulse, `:218` insurance-binder; `openapi-audit.js` 455 live routes, 0 missing.
- New flow files: 21 new portal page/action files (git diff 7dd0402..HEAD).
- Prior-run comparison: `runs/mainecybertech-20261014-0033-full-main-7dd0402/_domains/03_feature_implementation_map.json`.
- Test suites: 521 (AGENTS.md), 91 E2E spec files; the new detail/decision flows have only list-page smoke specs.
