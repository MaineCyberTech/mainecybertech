# Usability and Workflow Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:29:24Z
- Auditor: subagent (independent re-audit; read-only)
- Area code: USE
- Output path: `docs/audits/mainecybertech/mainecybertech-20261103-0748-full-main-6b7aa1a/04_usability_workflow_audit.md`
- Scope limitations: repository-only verification (no live environment, no email delivery, no browser run). Every status cites code at the audited commit; runtime claims are marked as not exercised.

## Scope

Re-verification of the 21 `USE` findings from `mainecybertech-20261014-0033-full-main-7dd0402` against `origin/main` @ `6b7aa1a`, plus a fresh pass over onboarding, auth/reset, navigation, dashboards, forms, search/filter/sort, bulk workflows, admin/support workflows, notifications, preferences, error recovery, empty/loading states, destructive actions and session expiry. New client request flows (approvals, change requests, DNS changes, identity verification, insurance binder, offboarding, training, QBR, knowledge base, proposals decision) were reviewed in depth because they are new in this window.

Not reviewed: live GoTrue/SMTP delivery, real GitHub environment settings, browser rendering, and production data.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/web/app/(portal)/portal/**` (97 page.tsx) | UI routes | New + existing client workflows | Scanned for pagination, error states, subnav, labels |
| `apps/web/app/(portal)/portal/{approvals,change-requests,dns-changes,identity-verification,insurance-binder,offboarding}/**` | Actions + forms | New request flows | Full read of create/detail/action pairs |
| `apps/web/app/(portal)/portal/proposals/[id]/*` | Client decision UI | Commercial decision path | No confirmation dialog |
| `apps/web/components/SupportCenterClient.tsx`, `DocumentVersionsClient.tsx`, `NotificationBell.tsx`, `NotificationsPageClient.tsx`, `NotificationPreferencesClient.tsx` | Components | Prior fixes | Re-checked exact behaviour |
| `apps/web/app/(dashboard)` admin ticket/document/approval actions | Server actions | Prior fixes | Re-checked per-item results and confirmations |
| `docs/audits/portal-modules/2026-10-21/report.md` | Prior audit | Supplies the remaining portal-list gap (#9) and subnav gap (#20) | Dated evidence, not current state |
| `apps/api/src/routes/{governance,final/crud,security-ops,training-hub}.ts` | API | Default list limits | Confirm 25-row default behind the pages |

## Verification Performed

| Check | Method | Result |
|---|---|---|
| Portal list pagination | Python scan of 97 portal `page.tsx` for `list()` without page/limit and no pager/receipt of `total` | 45 pages affected; 32 render `items.length` as the org total |
| Portal subnav | Scan for `PortalSubnav` import | 40/97 pages omit it |
| New create actions | Read all six `actions.ts` error paths | All rethrow non-redirect errors |
| Proposal decision | Read client component + API endpoint | One-click, UI hides after decision |
| Prior USE fixes | Targeted grep/read of each cited file and test | 21/21 previous findings hold |
| Docs guards | `node scripts/check-docs-links.mjs`, `node scripts/check-docs-counts.mjs` | Both pass (supporting the documentation domain) |

## Executive Summary

The previous usability remediation still holds: all four P1 findings and all 17 remaining P2/P3 findings are **verified-fixed** at this commit (21/21). Password reset and signup still route through the web `/auth/callback` with a trusted-origin guard; approval/delete/bulk flows still report accurately; ticket lists still paginate; notification links, failure states and the SSE fallback are still correct; checklist completion, If-Match concurrency and form error handling remain in place. The bell's `reason=session_expired` gap (USE-P3-006) is now fixed — `/login` accepts both values.

The new client request flows are a different story. They add useful capability but repeat two patterns the ticket work already fixed:

1. **Silent list truncation returned broadly.** 45 portal list pages fetch only the API default 25 rows and show no pager; 32 print the page length as "for your organization". `change-requests` is worst: it prints the API total but renders only 25 rows with no pager.
2. **New create forms have no inline error path.** Six request actions rethrow on API failure, so a 400/402/403/429/network error replaces the form with the generic portal error boundary and loses typed input.
3. **A commercial decision is one click.** Accept/Decline on a client proposal has no confirmation and the UI hides the buttons after the decision.
4. **Navigation is inconsistent.** 40/97 portal pages omit `PortalSubnav`, including all new request flows.

| Status | Count |
|---|---:|
| verified-fixed | 21 |
| partially-fixed | 0 |
| regressed | 0 |
| open (previous) | 0 |
| new | 4 (`USE-P2-012`, `USE-P2-013`, `USE-P3-007`, `USE-P3-008`) |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Portal list pages | `apps/web/app/(portal)/portal/**/page.tsx` | Module lists | 45 without pagination | Medium | New finding USE-P2-012 |
| New request forms | six `*/new/page.tsx` + `actions.ts` | Client submissions | Create works; errors escape | Medium | USE-P3-008 |
| Proposal decision | `ProposalDecisionClient.tsx` | Accept/decline | One click | Medium | USE-P2-013 |
| Portal subnav | `PortalSubnav.tsx` | Contextual nav | 57/97 pages use it | Low | USE-P3-007 |
| Prior P1 flows | auth, SDK, approvals, bulk | Core workflows | Verified fixed | — | See table below |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Onboarding | 4 | Checklist toggle wired; create redirect fixed | No regression | Keep |
| Login/signup/reset | 4 | Callback + trusted origin; both reason values accepted | Recovery-AMR path untested | Add a real recovery-token test |
| Navigation | 3 | 57/97 pages use PortalSubnav | 40 pages inconsistent | USE-P3-007 |
| Dashboards | 4 | Recent activity derived from client-safe data | Heading outline skips levels | UX-P3-012 |
| Forms | 4 | Prior forms keep API messages | Six new actions throw | USE-P3-008 |
| Search/filter/sort | 3 | Ticket filters work | 45 portal lists lack paging | USE-P2-012 |
| Bulk workflows | 4 | Per-item results on documents/tickets | — | Keep convention |
| Admin/support workflows | 4 | Confirm + role=status/alert | — | Keep |
| Notifications | 4 | Preferences/list/bell failures surfaced | — | Keep |
| Preferences | 4 | Save errors surface + reload | — | Keep |
| Error recovery | 3 | Route error boundaries exist | New forms lose input | USE-P3-008 |
| Empty/loading states | 4 | EmptyState + DataErrorNote widely used | False totals on 32 pages | USE-P2-012 |

## Detailed Review

### Item: Prior remediation (21 findings)

- Evidence: see the per-ID table in Findings.
- What it does: the earlier fixes are still present and still covered by tests.
- Current controls: callback redirect allowlist, status-only membership PATCH, empty-body handling, per-item bulk results, pagination for tickets, honest delete, notification link map, SSE interval ref, checklist toggle, If-Match, form error helpers.
- Missing controls: none identified for the prior scope.

### Item: New client request flows

- Evidence: `apps/web/app/(portal)/portal/approvals/**`, `change-requests/**`, `dns-changes/**`, `identity-verification/**`, `insurance-binder/**`, `offboarding/**`.
- What it does: clients can submit approval, change, DNS, identity, insurance and offboarding requests; approvals/change requests have detail pages, the other four are create-only.
- How it appears to work: form → server action → SDK POST → redirect (approvals/change) or back to the list.
- Missing controls: inline error return, pagination/total honesty, confirmation for proposal decisions, consistent subnav, detail routes for the create-only modules (FEAT-P3-010).

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| USE-001 | Onboarding | `ChecklistItemToggle.tsx` | Checkbox wired, optimistic revert | — | — | Keep |
| USE-002 | Login/signup/reset | `auth.ts:347`, `login/page.tsx:34-40` | Trusted callback + both reasons | Recovery AMR untested | P3 | Add test |
| USE-003 | Navigation | `PortalSubnav.tsx` | Contextual tabs where used | 40 pages omit | P3 | USE-P3-007 |
| USE-004 | Dashboards | `dashboard/page.tsx` | Client-safe activity feed | Heading outline | P3 | UX-P3-012 |
| USE-005 | Forms | six `actions.ts` | Validation on the happy path | Errors escape | P3 | USE-P3-008 |
| USE-006 | Search/filter/sort | portal lists | Ticket filters work | 45 unpaginated | P2 | USE-P2-012 |
| USE-007 | Bulk workflows | `bulk-results.ts` | Per-item results | — | — | Keep |
| USE-008 | Admin/support | approvals actions | Confirm + status/alert | — | — | Keep |
| USE-009 | Notifications | bell/prefs/list | Failure states surfaced | — | — | Keep |
| USE-010 | Preferences | preferences client | Save error + reload | — | — | Keep |
| USE-011 | Error recovery | `(portal)/error.tsx` | Route boundary + reset | New forms lose input | P3 | USE-P3-008 |
| USE-012 | Empty/loading | EmptyState / DataErrorNote | Present | False totals | P2 | USE-P2-012 |

## Findings

### Re-verification of previous findings

| ID | Sev | Previous status | Re-verified status | Evidence at 6b7aa1a |
|---|---|---|---|---|
| USE-P1-001 | P1 | verified-fixed | verified-fixed | `auth.ts:347` → callback; `callback/route.ts:8-44`; `auth.test.ts:301` |
| USE-P1-002 | P1 | verified-fixed | verified-fixed | `auth.ts:189-193`; `auth.test.ts:236-296` |
| USE-P1-003 | P1 | verified-fixed | verified-fixed | status-only PATCH (`approvals/actions.ts:52,66`); optional `roleId` (`validators/membership.ts:9-14`) |
| USE-P1-004 | P1 | verified-fixed | verified-fixed | empty-body handling `packages/sdk/src/client.ts:107-152`; `client-fetch.test.ts:149-215` |
| USE-P2-001 | P2 | verified-fixed | verified-fixed | `documents/page.tsx:439-520`; `lib/bulk-results.ts:19-49`; bulk UI reports failed ids |
| USE-P2-002 | P2 | verified-fixed | verified-fixed | portal support paginator (`support/page.tsx:28-42`); admin `Show more` (`tickets/page.tsx:121-155`) |
| USE-P2-003 | P2 | verified-fixed | verified-fixed | hard DELETE + typed confirmation (`tickets/[ticketId]/actions.ts:79-104`); honest copy `page.tsx:259-262` |
| USE-P2-004 | P2 | verified-fixed | verified-fixed | `lib/notification-links.ts:13-25` |
| USE-P2-005 | P2 | verified-fixed | verified-fixed | prefs `role=alert`; list distinguishes loadError from empty (`NotificationsPageClient.tsx:171-178`) |
| USE-P2-006 | P2 | verified-fixed | verified-fixed | `fallbackPollRef` start/stop/cleanup (`NotificationBell.tsx:96-110,185-195`) |
| USE-P2-007 | P2 | verified-fixed | verified-fixed | `redirect()` outside try (`client-onboarding-command-center/actions.ts:36-40`) |
| USE-P2-008 | P2 | verified-fixed | verified-fixed | `ChecklistItemToggle.tsx` + action |
| USE-P2-009 | P2 | verified-fixed | verified-fixed | middleware `?reason=expired`; login accepts both; `?mfa=required` step-up |
| USE-P2-010 | P2 | verified-fixed | verified-fixed | `ConfirmDialog` on access-removing transitions |
| USE-P2-011 | P2 | verified-fixed | verified-fixed | `ProfileClient.tsx:74-98` sends current password; API verifies |
| USE-P3-001 | P3 | verified-fixed | verified-fixed | `support/actions.ts:25-44`; success banner + View ticket |
| USE-P3-002 | P3 | verified-fixed | verified-fixed | `ServiceWorkerRegistrar` mounted in root layout; offline E2E |
| USE-P3-003 | P3 | verified-fixed | verified-fixed | per-version download/restore + retry (`DocumentVersionsClient.tsx:50-105`) |
| USE-P3-004 | P3 | verified-fixed | verified-fixed | SDK `If-Match` (`client.ts:209-210`); 409 message |
| USE-P3-005 | P3 | verified-fixed | verified-fixed | signup try/catch/finally; API messages preserved |
| USE-P3-006 | P3 | open | verified-fixed | `/login` accepts `expired` and `session_expired` (`login/page.tsx:34-40`); bell test URL unchanged |

### Finding ID: USE-P2-012 — 45 portal list pages fetch only the API default 25 rows and show no pager; 32 label the page length as the organization total

- Severity: P2
- Confidence: High
- Area: USE
- Evidence:
  - `apps/web/app/(portal)/portal/automation/page.tsx:39` (list with no limit), `:54` (`items.length ... for your organization`)
  - `apps/web/app/(portal)/portal/backup-dr/page.tsx:21,36`
  - `apps/web/app/(portal)/portal/budgets/page.tsx:21,57`
  - `apps/web/app/(portal)/portal/dns-changes/page.tsx:22,46`
  - `apps/web/app/(portal)/portal/offboarding/page.tsx:22`
  - `apps/web/app/(portal)/portal/change-requests/page.tsx:23` (25-row fetch), `:25` (API total), `:48` (prints total), no pager
  - API defaults: `apps/api/src/routes/governance.ts:51`, `final/crud.ts:35`, `security-ops.ts:45`, `training-hub.ts:84`
  - Scan: 97 portal pages → 45 list pages with no page/limit and no pager; 32 render `items.length` as the org total
- What is happening: the SDK/API defaults every list to 25 rows; the new pages neither pass a larger/pageable limit nor render a pager. Where the API returns `total`, the page prints it but still renders only page 1 (`change-requests`).
- Why it matters: older tickets, changes, findings, assets, etc. become invisible; the displayed count is false on 32 pages, so a client or auditor cannot tell that data is missing.
- User / business impact: clients make decisions on incomplete lists; staff support requests for "missing" records that are simply page 2+.
- Security / privacy / reliability impact: no direct confidentiality impact; it is a correctness/visibility failure.
- Recommended fix: adopt the already-working approvals/QBR pattern (`searchParams` + `limit` + `AdminPagination` + API `total`) on every portal list; at minimum stop printing `items.length` as the total.
- Suggested validation: unit test each list page with 30 mock rows, assert pager and total; Playwright test on `/portal/governance` and `/portal/change-requests` with seeded >25 rows.
- Owner suggestion: Web platform
- Effort estimate: M (mechanical, ~45 pages)
- Dependencies: none
- Status: open

### Finding ID: USE-P2-013 — Client proposal accept/decline is a one-click irreversible decision with no confirmation

- Severity: P2
- Confidence: High
- Area: USE
- Evidence:
  - `apps/web/app/(portal)/portal/proposals/[id]/ProposalDecisionClient.tsx:14-27` (click → `decide()` immediately)
  - `:44-60` (Accept proposal / Decline buttons, no `ConfirmDialog`)
  - `apps/web/app/(portal)/portal/proposals/[id]/page.tsx:304-311` (decision UI hidden once `metadata.clientDecision` is set)
  - `apps/api/src/routes/proposals.ts:798-861` (records `clientDecision`, `clientDecidedAt`, `clientDecidedBy`)
- What is happening: a client can bind the organization to a commercial proposal with one click; the UI removes the decision buttons afterwards and there is no client-side undo.
- Why it matters: mis-clicks on a phone or during a demo commit the organization. The action is not reversible from the product.
- User / business impact: disputed commercial commitments and support escalation.
- Security / privacy / reliability impact: none identified.
- Recommended fix: require a confirmation dialog that repeats the proposal title and total, and either allow re-decision with an audit record or give staff a reset action.
- Suggested validation: component test asserting no API call until confirm; E2E accept flow with cancel.
- Owner suggestion: Web portal + product
- Effort estimate: S
- Dependencies: product decision on re-decision
- Status: open

### Finding ID: USE-P3-007 — 40 of 97 portal pages omit PortalSubnav, including every new request flow

- Severity: P3
- Confidence: High
- Area: USE
- Evidence:
  - Count: 40/97 `apps/web/app/(portal)/portal/**/page.tsx` do not import `PortalSubnav`
  - Examples: `change-requests/page.tsx`, `change-requests/new/page.tsx`, `client-knowledge-base/page.tsx`, `identity-verification/page.tsx`, `offboarding/page.tsx`, `qbr/[id]/page.tsx`
  - `apps/web/components/portal/PortalSubnav.tsx:12-40` renders the contextual sibling tabs
  - The 2026-10-21 portal-modules audit flagged the same inconsistency (#20, `docs/audits/portal-modules/2026-10-21/report.md:252`)
- What is happening: some modules show sibling navigation and some do not, so the same product has two navigation models.
- Why it matters: users cannot discover sibling destinations (e.g. New request) from the page they are on; new flows rely on the sidebar only.
- User / business impact: lower discovery, more back-button use, inconsistent mental model.
- Security / privacy / reliability impact: none.
- Recommended fix: render the subnav in the portal layout (preferred) or add it to every module-level list/detail page; exclude only pages where the group has fewer than two visible items.
- Suggested validation: a route-level test asserting the nav landmark on each module page.
- Owner suggestion: Web platform
- Effort estimate: S–M
- Dependencies: none
- Status: open

### Finding ID: USE-P3-008 — Six new request-creation actions throw on API failure, replacing the form with the generic portal error boundary

- Severity: P3
- Confidence: High
- Area: USE
- Evidence:
  - `apps/web/app/(portal)/portal/approvals/actions.ts:36-37`
  - `apps/web/app/(portal)/portal/change-requests/actions.ts:30-31`
  - `apps/web/app/(portal)/portal/dns-changes/actions.ts:27-28`
  - `apps/web/app/(portal)/portal/identity-verification/actions.ts:26-27`
  - `apps/web/app/(portal)/portal/insurance-binder/actions.ts:29-30`
  - `apps/web/app/(portal)/portal/offboarding/actions.ts:27-28`
  - `apps/web/app/(portal)/error.tsx:36-45` (generic "Something went wrong" + reset)
- What is happening: each action rethrows every non-redirect error; the matching forms are void `action={...}` forms with no inline error state.
- Why it matters: a validation, entitlement (402), permission (403), rate-limit (429) or network error destroys the form and loses the user's input; the error boundary's "Try again" resets the route, not the submit.
- User / business impact: repeat typing, abandoned requests, support load.
- Security / privacy / reliability impact: none.
- Recommended fix: return `{ ok:false, error }` and render an inline `role="alert"` (the pattern already used by `createOnboardingAction` and `createFormAction`).
- Suggested validation: action unit test for a rejected API call; component test that the typed values remain and the alert is announced.
- Owner suggestion: Web platform
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Operators trust a 25-row list as complete | P2 | High | Missed changes/assets | USE-P2-012 | Pager + API total |
| Accidental proposal acceptance | P2 | Medium | Commercial commitment | USE-P2-013 | Confirmation + undo |
| Request form lost on transient error | P3 | Medium | Abandoned requests | USE-P3-008 | Inline errors |
| Inconsistent navigation | P3 | High | Discovery friction | USE-P3-007 | Layout-level subnav |

## Recommendations

### Immediate / Release Blocking

None. No P0/P1 issue found.

### This Week

- Confirm/undo for proposal decisions (`USE-P2-013`).

### This Month

- Add pagination + honest totals to the 45 portal lists (`USE-P2-012`); start with change-requests, governance, DNS, offboarding.
- Return inline errors from the six new request actions (`USE-P3-008`).

### Later / Platform Evolution

- Centralize the portal subnav in the layout (`USE-P3-007`).
- Add a list-page convention test so new modules cannot ship unpaginated.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Replace `items.length` with the API `total` | Stops false totals immediately | 32 portal pages | Grep + unit |
| Add `ConfirmDialog` to proposal decision | Prevents mis-click | `ProposalDecisionClient.tsx` | Component test |
| Add inline error return to the six actions | Keeps typed input | six `actions.ts` + pages | Action test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Portal list pagination sweep | P2 | Web platform | M | none |
| Proposal decision confirmation/undo | P2 | Web portal + product | S | product decision |
| Inline error convention for new actions | P3 | Web platform | S | none |
| Layout-level subnav | P3 | Web platform | S | none |

## Suggested Tests

- Unit: each portal list page with 30 rows → pager visible and total from API.
- Unit: six create actions return `{ok:false}` on API rejection and preserve the message.
- Component: proposal decision does not call the action before confirm; cancel leaves state unchanged.
- E2E: create a change request, submit it, open detail, submit for review (client_admin), and confirm the status transition.
- E2E/mobile: one new create page at 360×800 (no overflow, 16px controls).
- Regression: keep the existing ticket/bulk/reset tests.

## Suggested Documentation Updates

- `docs/WEB_UI_CONVENTIONS.md`: add a "list pages must page and print the API total" rule and a "server actions return errors; do not throw" rule.
- `docs/modules/change-requests.md`: fix the base path (also DOC-P3-012).
- `docs/audits/portal-modules/2026-10-21/report.md`: leave historical, but track the remaining #9/#20 in the current register.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does the email-recovery session actually carry `amr: recovery` through the web callback? | The reset form sends no currentPassword; if the claim is absent the flow 400s | A real Supabase recovery-token exchange in staging |
| Are the create-only request modules intentionally one-way? | Decides whether FEAT-P3-010 needs detail pages | Product decision |
| Should `client_user` be able to submit a change request they can create? | The UI hides Submit for non-`governance:edit` roles | Permission/product decision |

## Appendix

- Portal list scan (reproducible): `python3` walk of `apps/web/app/(portal)/portal/**/page.tsx`; 97 pages, 45 without pager, 32 with `items.length` totals.
- Prior-run comparison: `runs/mainecybertech-20261014-0033-full-main-7dd0402/_domains/04_usability_workflow_audit.json`.
- Guards run: `node scripts/check-docs-links.mjs` → `docs links OK`; `node scripts/check-docs-counts.mjs` → `docs counts OK`.
