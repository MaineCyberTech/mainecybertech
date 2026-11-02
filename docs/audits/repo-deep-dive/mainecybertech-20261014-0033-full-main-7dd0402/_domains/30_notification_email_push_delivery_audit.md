# Notification, Email, and Push Delivery Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 30) · Area code: NOTIF
- Scope limitations: static read-only review at 7dd0402. No SMTP/VAPID/Redis/live send exercised; no test suite executed (no `node_modules`/`pnpm`). Delivery reliability is verified from code, alert rules and metrics wiring; end-to-end sends remain `not exercised` in-repo.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (23 NOTIF findings).

## Executive Summary

The notification system is in strong shape at 7dd0402. Every P1 is `verified-fixed`: preferences are enforced on both send paths, API notifications have email-side idempotency, delivery failures and SMTP skips are alerted, and the preference write path persists with the resolved org. The Web Push channel is fully implemented (table + RLS, VAPID, RFC 8291/8292 sender, service-worker handlers, UI) and the remaining push gaps are none.

Two rows stay `partially-fixed` and both are operator decisions rather than code gaps: SMTP is still optional in production (now loud + alerted, not silent), and the Alertmanager→ntfy critical receiver is optional with no in-repo delivery exercise. One new P2: the one-click unsubscribe is an unauthenticated GET with a non-expiring token and no `List-Unsubscribe` header, so enterprise link-prefetch scanners can silently opt users out.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| NOTIF-P1-001 | P1 | Notification preferences are stored and displayed but never enforced on any send path | verified-fixed |
| NOTIF-P1-002 | P1 | API-originated notifications bypass the dedup unique index | verified-fixed |
| NOTIF-P1-003 | P1 | No delivery observability: email/notification failures are silent and unalerted | verified-fixed |
| NOTIF-P1-004 | P1 | Preference writes omit `organization_id` (NOT NULL) so toggles cannot persist | verified-fixed |
| NOTIF-P2-001 | P2 | Web Push channel is entirely absent | verified-fixed |
| NOTIF-P2-002 | P2 | SMTP remains optional; email degrades to no-op in production | partially-fixed |
| NOTIF-P2-003 | P2 | Worker lacks an `unhandledRejection` handler | verified-fixed |
| NOTIF-P2-004 | P2 | Scheduled reminder inserts and email sends are not atomic | verified-fixed |
| NOTIF-P2-005 | P2 | Sensitive ticket content stored/emailed verbatim | verified-fixed |
| NOTIF-P2-006 | P2 | API inline email fallback has no retry | verified-fixed |
| NOTIF-P2-007 | P2 | Realtime/SSE notification channel scoped by user only | verified-fixed |
| NOTIF-P2-008 | P2 | Backup-failure alerting cannot be trusted to deliver | verified-fixed |
| NOTIF-P2-009 | P2 | `notifyAndEmail` enqueues email when the in-app notification was deduped | verified-fixed |
| NOTIF-P2-010 | P2 | Delivery SLO counts a queued hand-off as success | verified-fixed |
| NOTIF-P2-011 | P2 | Alertmanager→ntfy critical delivery optional in production, no exercise evidence | partially-fixed |
| NOTIF-P3-001 | P3 | No email template system | verified-fixed |
| NOTIF-P3-002 | P3 | `sms` channel is a dead preference option | verified-fixed |
| NOTIF-P3-003 | P3 | SSE polling fallback interval not cleared on unmount | verified-fixed |
| NOTIF-P3-004 | P3 | Preferences PUT body `organizationId` without scope assertion | verified-fixed |
| NOTIF-P3-005 | P3 | No unsubscribe link or global opt-out | verified-fixed |
| NOTIF-P3-006 | P3 | Worker reminder preference lookups omit the organization | verified-fixed |
| NOTIF-P3-007 | P3 | No per-recipient send throttle | verified-fixed |
| NOTIF-P3-008 | P3 | Worker ticket-responded deep link built from unescaped metadata | verified-fixed |
| NOTIF-P2-012 | P2 | Unauthenticated GET unsubscribe with no expiry/confirmation; link scanners can silently opt users out | **open (new)** |

### Re-verification evidence (headline rows)

- **NOTIF-P1-001/002** — `lib/notification-channels.ts:56-114` (enforcement), `lib/notify.ts:100-123,161-164,192-201` (dedup + email claim), worker mirror `notification-store.ts:219-231`.
- **NOTIF-P1-003/010** — `prometheus.rules.yml:257-304` (`MCTNotificationDeliveryFailureRateHigh`, `MCTNotificationEmailSkipped`); API enqueue recorded as `queued` (`api/lib/metrics.ts:246-253`); SLO #4 from worker terminal outcomes (`docs/SLO.md:17-27`).
- **NOTIF-P2-001** — `5302453_push_subscriptions.sql`, `routes/push-subscriptions.ts`, `worker/src/push.ts`, `tasks/notification-push.ts`, `public/sw.js`, `PushNotificationSettings.tsx`.
- **NOTIF-P2-011** — `deploy-do.yml:845-863` (watchdog fail-closed) vs `:865-868` (critical receiver warns only); `docs/MONITORING_AND_ALERTING.md:391` still records delivery as not exercised.
- **NOTIF-P2-012 (new)** — `routes/notification-unsubscribe.ts:24-58`, `lib/unsubscribe-token.ts:44-56` (no expiry), no `List-Unsubscribe` header anywhere (`grep` = 0 hits).

## Recommendations

1. **This month (new P2):** add RFC 8058 one-click (`List-Unsubscribe` + `List-Unsubscribe-Post`, POST handler) and a confirmation page for the in-body link; add token expiry/use-once.
2. **This month (partial rows):** provision SMTP and the critical ntfy receiver, and record one real critical-alert exercise in the monitoring runbook (operator actions).
3. **Later:** consider per-channel SLOs and a push delivery exercise once VAPID keys are provisioned.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| `List-Unsubscribe-Post` header + POST route | Stops scanner-triggered opt-outs | `lib/notify.ts`, `routes/notification-unsubscribe.ts` |
| Critical-receiver fail-closed in prod | Removes the last silent alert path | `.github/workflows/deploy-do.yml:865-868` |

## Suggested Tests

- Unit: unsubscribe token expiry/one-time semantics (new); GET prefetch does not mutate without confirmation (new).
- Integration: two identical `notifyAndEmail` calls → one row, one email job (exists); worker multi-org opt-out only suppresses that org (exists).
- Manual: synthetic critical alert through Alertmanager→ntfy, recorded in the runbook (operator).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will SMTP and the critical ntfy receiver be provisioned? | Determines whether the two partial rows close | Operator secrets + one exercise artifact |
