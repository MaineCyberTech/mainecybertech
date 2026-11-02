# Usability and Workflow Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14
- Auditor: subagent (independent re-audit; read-only)
- Area code: USE
- Output path: `docs/audits/mainecybertech/mainecybertech-20261014-0033-full-main-7dd0402/04_usability_workflow_audit.md`
- Scope limitations: repository-only verification (no live environment, no email delivery, no browser run). Every status cites code at the audited commit; runtime claims are marked as not exercised.

## Scope

Re-verification of the 20 `USE` findings from `mainecybertech-20261011-0426-full-main-8d299b8` against `origin/main` @ `7dd0402`, plus a fresh pass over onboarding, auth/reset, navigation, dashboards, forms, search/filter/sort, bulk workflows, admin/support workflows, notifications, preferences, error recovery, empty/loading states, destructive actions and session expiry for new issues.

## Executive Summary

All four P1 findings and 16 of 17 remaining findings are **verified-fixed** at this commit with code and test evidence. The remediation is unusually complete for this domain: the reset and signup email flows now route through the web `/auth/callback` with a trusted-origin redirect and an open-redirect guard; the SDK handles empty 204 bodies; approval/rejection flows confirm and report; bulk operations render per-item results; ticket lists paginate with real totals; notification links, failures and SSE polling were all reworked; checklist items are completable; If-Match is threaded through edit flows; and form error handling is centralized.

One residual defect was found (new `USE-P3-006`): the notification bell's SSE `auth_expired` path redirects to `/login?reason=session_expired`, but the login page only recognises `reason=expired`, so that specific session-expiry path still shows a bare login form.

| Status | Count |
|---|---:|
| verified-fixed | 20 |
| partially-fixed | 0 |
| regressed | 0 |
| open (previous) | 0 |
| new | 1 (`USE-P3-006`, P3) |

## Verification Results

| ID | Sev | Previous status | Re-verified status | Evidence at 7dd0402 |
|---|---|---|---|---|
| USE-P1-001 | P1 | verified-fixed | verified-fixed | `apps/api/src/routes/auth.ts:347` → `/auth/callback?next=/password-reset`; callback exchanges code + `resolvePostAuthRedirect` (`apps/web/lib/auth/callback-redirect.ts`); `auth.test.ts:301` |
| USE-P1-002 | P1 | verified-fixed | verified-fixed | `auth.ts:182-196` builds `emailRedirectTo` from `resolveTrustedRedirectOrigin`; `auth.test.ts:236` |
| USE-P1-003 | P1 | verified-fixed | verified-fixed | status-only PATCH (`approvals/actions.ts:50-73`), optional `roleId` (`validators/membership.ts:9-14`), inline errors |
| USE-P1-004 | P1 | verified-fixed | verified-fixed | empty-body handling in `packages/sdk/src/client.ts:107-152`; tests `client-fetch.test.ts:149-215` |
| USE-P2-001 | P2 | verified-fixed | verified-fixed | `lib/bulk-results.ts`; per-item toasts in admin/portal bulk bars; SDK `BulkUpdateResult` includes `skipped` |
| USE-P2-002 | P2 | verified-fixed | verified-fixed | portal pagination + server totals (`portal/support/page.tsx:28-42`); admin `Show more` + limit=1 counts |
| USE-P2-003 | P2 | verified-fixed | verified-fixed | real hard delete with typed confirmation and honest copy; no Restore UI (`actions.ts:79-104`, `page.tsx:259-262`) |
| USE-P2-004 | P2 | verified-fixed | verified-fixed | `lib/notification-links.ts:13-25` maps portal tickets to `/portal/support/<id>` |
| USE-P2-005 | P2 | verified-fixed | verified-fixed | preferences + list + bell render `role=alert`/retry, no false empty state |
| USE-P2-006 | P2 | verified-fixed | verified-fixed | interval ref with start/stop/cleanup (`NotificationBell.tsx:96-110,185-195`) |
| USE-P2-007 | P2 | verified-fixed | verified-fixed | `redirect()` outside try/catch (`client-onboarding-command-center/actions.ts:36-40`) |
| USE-P2-008 | P2 | verified-fixed | verified-fixed | `ChecklistItemToggle` + `toggleChecklistItemAction` wired on the detail page |
| USE-P2-009 | P2 | verified-fixed | verified-fixed | `?reason=expired` copy (`login/page.tsx:34-39`); `?mfa=required` step-up (`security/page.tsx:19-21`, `MfaSettingsClient.tsx:235-280`) — see new `USE-P3-006` for the bell path |
| USE-P2-010 | P2 | verified-fixed | verified-fixed | ConfirmDialog on access-removing transitions + inline result on approvals and membership forms |
| USE-P2-011 | P2 | verified-fixed | verified-fixed | unused Current Password removed; shared `PasswordPolicyHint` on signup/reset/profile |
| USE-P3-001 | P3 | verified-fixed | verified-fixed | live action reads `subject` and returns the ticket; success banner with link; dashboard `?create=1` |
| USE-P3-002 | P3 | verified-fixed | verified-fixed | `ServiceWorkerRegistrar` mounted in root layout; safe `sw.js`; E2E offline test |
| USE-P3-003 | P3 | verified-fixed | verified-fixed | per-version download/restore + error state + single-version rendering (`DocumentVersionsClient.tsx`) |
| USE-P3-004 | P3 | verified-fixed | verified-fixed | `If-Match` in SDK + ticket/document edit actions; 409 message in `lib/api-error.ts` |
| USE-P3-005 | P3 | verified-fixed | verified-fixed | signup `try/catch/finally`; API messages preserved in onboarding/bulk invite |

## New Findings

### USE-P3-006 — Notification-bell SSE expiry redirect uses a reason value `/login` does not recognise (P3)

- Evidence: `apps/web/components/NotificationBell.tsx:159` navigates to `/login?reason=session_expired`; `apps/web/app/(public)/login/page.tsx:39` only sets the expired banner for `reason === "expired"`; `apps/web/__tests__/components/NotificationBell.test.tsx:177` asserts the unmatched URL.
- Impact: a session that expires while the SSE stream is open lands on a bare login form with no "Your session expired" explanation — the same class of defect `USE-P2-009` fixed for the middleware path.
- Fix: accept both `expired` and `session_expired` in the login page (or emit `reason=expired` from the bell); add a login-page test for the bell value.

## Recommendations

- **This week:** fix `USE-P3-006` (one-line predicate + test); optionally unify the reason vocabulary in one shared constant.
- **This month:** add an E2E that follows a real reset link shape end-to-end (the unit/integration coverage is good, but no test walks the emailed URL in a browser).
- **Later:** keep the per-item bulk-result convention when new bulk actions are added; the `summarizeBulkUpdate` helper is the standard.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is `MFA_ENFORCEMENT_ENABLED` set in production? | Determines whether the step-up path is exercised in the live environment | Droplet env (not in repo) |
| Was the reset/confirm email actually delivered and followed in a non-prod environment? | The code path is fixed and tested, but real GoTrue/SMTP delivery is not exercised by the repo | Operator-run staging check |
