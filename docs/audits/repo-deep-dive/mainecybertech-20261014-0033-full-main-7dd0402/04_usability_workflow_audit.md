# 04_usability_workflow_audit — Prompt 04 - Usability and Workflow Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `04_usability_workflow_audit.md` (area USE, prompt)

## Verification Performed

Domain subagent produced 21 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| USE-P1-001 | P1 | Self-service password reset dead-ends: the email link lands on a page that cannot complete the reset |
| USE-P1-002 | P1 | Signup email-confirmation link points at the API host and 404s, blocking first login |
| USE-P1-003 | P1 | Admin approval queue cannot approve or reject memberships (roleId sent as empty string) |
| USE-P1-004 | P1 | Every SDK delete reports failure after succeeding because the client cannot parse empty 204 bodies |
| USE-P2-001 | P2 | Bulk document operations report success without per-item results (false success on partial failure) |
| USE-P2-002 | P2 | Ticket lists and dashboard counts silently stop at 25 rows (no pagination) in portal and admin |
| USE-P2-003 | P2 | Admin 'Delete Ticket' only closes the ticket; copy promises a restorable soft-delete and Restore is unreachable |
| USE-P2-004 | P2 | Ticket notification deep links 404 in the portal (/portal/tickets/* does not exist) |
| USE-P2-005 | P2 | Notification surfaces swallow failures: preferences save silently fails and a failed list load renders a false empty state |
| USE-P2-006 | P2 | NotificationBell SSE fallback leaks a 30-second polling interval per component instance |
| USE-P2-007 | P2 | Client-onboarding create swallows the redirect: success shows a cryptic error and invites duplicate records |
| USE-P2-008 | P2 | Onboarding checklist items cannot be completed anywhere in the web app |
| USE-P2-009 | P2 | Session/MFA expiry has no user-facing explanation and the ?mfa=required step-up redirect is ignored |
| USE-P2-010 | P2 | Privileged membership/approval actions lack confirmation and success feedback (suspend/reject are one click) |
| USE-P2-011 | P2 | Change Password form collects a Current Password it never checks and advertises a weaker rule than the API enforces |
| USE-P3-001 | P3 | Portal ticket creation gives no success confirmation and the tested action is dead code with a mismatched field name |
| USE-P3-002 | P3 | Offline/poor-network support is absent from the running app (service worker never registered) |
| USE-P3-003 | P3 | Document version history is display-only: no per-version download/restore and it hides itself for single-version documents |
| USE-P3-004 | P3 | Web edit flows never send If-Match, so concurrent admin edits silently overwrite each other |
| USE-P3-005 | P3 | Form error handling is lossy or missing: signup can hang, onboarding errors are generic, bulk invite says 'Request failed' |
| USE-P3-006 | P3 | Notification-bell SSE session expiry redirects to /login?reason=session_expired, but /login only recognizes reason=expired |
