# Notification, Email and Push Delivery — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: NOTIF
- Scope limitations: read-only static review; no SMTP/APNs/FCM/Web-Push traffic, no hosted Redis or Postgres. SMTP and VAPID are operator-provisioned and absent from the lab.

## Scope

Re-verified all 24 previous NOTIF findings at `6b7aa1a`: preference resolution/enforcement, in-app and email dedup, push channel, reminder jobs, tenant scoping, unsubscribe/opt-out, retries and failure handling, sensitive content redaction, delivery observability/SLO, alert delivery and templates. The diff changed the unsubscribe route/token, added RFC 8058 headers and the notification dedup-index migration, and added an expiry + POST flow that directly addresses `NOTIF-P2-012`.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| In-app channel | `api/lib/notify.ts`, worker `notification-store.ts` | Bell notifications | Working | Low | Dedup claim via `notification_key` |
| Email (API) | `api/lib/notify.ts` + `api/lib/email.ts` | Inline/queued email | Working if SMTP set | Medium | SMTP optional (P2-002) |
| Email (worker) | `worker/tasks/notification-email.ts`, `email.ts` | Queue send + retry | Working | Low | Terminal metrics |
| Push | `worker/tasks/notification-push.ts`, `push.ts`, `web/public/sw.js` | Web Push | Working if VAPID set | Low | 404/410 revoke |
| Preferences | `api/lib/notification-channels.ts`, routes/UI | Per-module + global opt-out | Partial | Medium | Global opt-out UI gap (P2-013) |
| Unsubscribe | `routes/notification-unsubscribe.ts`, `lib/unsubscribe-token.ts` | One-click opt-out | Working | Low | 90-day token, POST |
| Reminders | `worker/tasks/scheduled-notifications.ts` | Scheduled/ticket/custom | Working | Low | Claim + redaction |
| Dedup | unique index `idx_notifications_key`, `notification_key` | Prevent duplicates | Working in code | High | Migration collision (P1-002) |
| Throttle | `api/lib/notification-throttle.ts` | 30 emails/hour/recipient | Working | Low | Fail-open |
| Observability | `prometheus.rules.yml`, `docs/SLO.md` | Delivery SLO/alerts | Working | Low | Alert delivery unexercised |

## Domain scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Notification models | 4 | Table + enum + RLS | Index deploy risk | Fix migration version |
| Email templates | 4 | Shared SDK template | — | Keep |
| Push subscriptions | 4 | API/worker/SW/UI | Operator VAPID | Provision keys |
| VAPID/config | 3 | Optional by design | No prod key check | Operator |
| Reminder jobs | 4 | Atomic claim + org-aware prefs | — | — |
| Preferences | 3 | Enforced on sends | Global opt-out invisible | P2-013 |
| Tenant scoping | 4 | Org-aware resolver + SSE assert | — | — |
| Unsubscribe/opt-out | 4 | POST + expiry + headers | Not reversible; no audit | P2-013/P3-009 |
| Retries | 4 | 3x email, queue retry | — | — |
| Failure handling | 4 | Meters + alerts | SMTP no-op | P2-002 |
| Duplicate prevention | 4 | Atomic claim | Migration apply risk | P1-002 |
| Rate limiting | 4 | Per-recipient throttle | — | — |

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/api/src/lib/notify.ts` | Read | API in-app/email/push send path | Preference gate, dedup claim, throttle, push, headers |
| `apps/api/src/lib/notification-channels.ts`, `notification-throttle.ts`, `notification-content.ts` | Read | Preference/rate/sensitivity controls | module + `all` rows, 30/h email cap, redaction |
| `apps/api/src/routes/notification-unsubscribe.ts`, `lib/unsubscribe-token.ts` | Read | One-click unsubscribe | GET no-write, POST opt-out, 90-day token, headers |
| `apps/api/src/middleware/csrf.ts` | Read | CSRF exemption scope | Only `/api/v1/notifications/unsubscribe` |
| `apps/api/src/routes/notification-preferences.ts` | Read | Preference writes | Org resolution + module enum |
| `apps/worker/src/tasks/scheduled-notifications.ts`, `notification-email.ts`, `notification-store.ts`, `email.ts` | Read | Worker reminder/email path | Claims, headers, redaction, org-aware prefs |
| `apps/worker/src/tasks/notification-push.ts`, `apps/worker/src/push.ts`, `apps/web/public/sw.js` | Read | Push delivery | 404/410 revoke, same-origin click, payload |
| `supabase/migrations/5302463_fix_notification_key_dedup_index.sql`, `5302107` | Read | Dedup index | Partial -> full unique index |
| `apps/api/src/__tests__/{notification-unsubscribe,notification-dedup-index,notify-enforcement,unsubscribe-token}.test.ts` | Read | Regression coverage | New unsubscribe + 42P10 tests |
| `infra/digitalocean/prometheus.rules.yml`, `docs/SLO.md` | Executed/Read | Delivery alerts + SLO | `promtool` 26 SUCCESS; tests SUCCESS |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `promtool check rules` / `test rules` | Executed | Notification alert syntax/behaviour | 26 rules SUCCESS; tests SUCCESS |
| Migration chain read | Read | Does `ON CONFLICT (notification_key)` have a full unique index? | Yes at `5302463_fix...:36-39` |
| Migration name collision check | Executed | Can the fix actually apply? | Two `5302463_*` files; preflight fails |
| Unsubscribe tests read | Read | GET no-write, POST write, expiry, bad signature, DB failure | 8 cases cover the fix |
| Send-path walk-through | Read | Preference + dedup + throttle ordering | Email claimed after in-app insert |

## Executive Summary

21 of 24 previous NOTIF findings are **verified fixed**, 3 are **partially fixed**, 0 regressed.

- `NOTIF-P2-012` (mail scanners silently unsubscribing users) is now fixed: GET renders a confirmation page and performs no write; POST is the RFC 8058 one-click target; tokens expire after 90 days; `List-Unsubscribe`/`List-Unsubscribe-Post` headers are sent by both the API and the worker; CSRF is skipped only for this route.
- `NOTIF-P1-002` remains partial for a deployment reason, not a code reason. The new migration replaces the unusable partial unique index with a full unique index (the 42P10 defect was real — the migration header records 536 dev failures), but it shares version `5302463` with `5302463_client_portal_ai_and_visibility.sql`, so `supabase db push` can skip one and the preflight fails (`INV-P1-001`/`DATA-P1-004`). The previous audit's "verified-fixed" claim at `7dd0402` was premature.
- `NOTIF-P2-002` (SMTP optional) and `NOTIF-P2-011` (critical alert delivery optional/unexercised) are unchanged operator-gated residuals.

Two **new findings** were found:

1. **NOTIF-P2-013 (P2):** the global `module_key='all'` email opt-out written by the unsubscribe link is invisible to the preferences UI and cannot be cleared through the API, so after unsubscribing every email toggle still shows "on" while delivery stays suppressed — the user cannot re-enable email without operator action.
2. **NOTIF-P3-009 (P3):** the unsubscribe POST changes a security-relevant preference with no `audit_logs` row (only application logs), unlike the authenticated PUT.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| NOTIF-001 | In-app delivery | `notify.ts` + worker store | Preference + dedup | — | — | Keep |
| NOTIF-002 | Email delivery | API/worker `email.ts` | Queue + 3x retry | SMTP optional | P2 | Provision SMTP |
| NOTIF-003 | Push delivery | push route/worker/SW | VAPID + revoke | Keys optional | P3 | Provision keys |
| NOTIF-004 | VAPID config | `push-subscriptions.ts` | Enabled flag | No prod gate | P3 | Operator |
| NOTIF-005 | Reminder jobs | `scheduled-notifications.ts` | Atomic claim + prefs | — | — | Keep |
| NOTIF-006 | Preferences | `notification-channels.ts` | Enforced on sends | Global opt-out UI | P2 | P2-013 |
| NOTIF-007 | Tenant scoping | resolver + SSE assert | Org exact + assert | — | — | Keep |
| NOTIF-008 | Unsubscribe | token route | POST + expiry + headers | Not reversible; no audit | P2/P3 | P2-013/P3-009 |
| NOTIF-009 | Retries | email retry + queue | 3x/backoff | — | — | Keep |
| NOTIF-010 | Failure handling | metrics + rules | Terminal outcomes + alerts | Alert delivery unproven | P2 | Drill |
| NOTIF-011 | Duplicate prevention | `notification_key` claim | Atomic upsert | Migration collision | P1 | Fix version |
| NOTIF-012 | Rate limiting | throttle | 30/h/recipient | — | — | Keep |

## Findings

| ID | Sev | Status | Title |
|---|---|---|---|
| NOTIF-P1-001 | P1 | verified-fixed | Notification preferences are stored and displayed but never enforced on any send path |
| NOTIF-P1-002 | P1 | partially-fixed | API-originated notifications bypass the dedup unique index |
| NOTIF-P1-003 | P1 | verified-fixed | No delivery observability: email/notification failures are silent and unalerted |
| NOTIF-P1-004 | P1 | verified-fixed | Notification preference writes from the web UI omit `organization_id` (NOT NULL) so toggles cannot persist |
| NOTIF-P2-001 | P2 | verified-fixed | Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker) |
| NOTIF-P2-002 | P2 | partially-fixed | SMTP remains optional; email silently degrades to no-op in production |
| NOTIF-P2-003 | P2 | verified-fixed | Worker lacks an `unhandledRejection` handler |
| NOTIF-P2-004 | P2 | verified-fixed | Scheduled reminder inserts and email sends are not atomic; retries can double-send |
| NOTIF-P2-005 | P2 | verified-fixed | Sensitive ticket content is stored and emailed verbatim with no sensitivity filter |
| NOTIF-P2-006 | P2 | verified-fixed | API inline email fallback has no retry and ignores the send result |
| NOTIF-P2-007 | P2 | verified-fixed | Realtime/SSE notification channel is scoped by user only, with no org assertion |
| NOTIF-P2-008 | P2 | verified-fixed | Backup-failure alerting is present but cannot be trusted to deliver |
| NOTIF-P2-009 | P2 | verified-fixed | notifyAndEmail enqueues email even when the in-app notification was deduped |
| NOTIF-P2-010 | P2 | verified-fixed | Notification delivery SLO counts a queued email hand-off as success and excludes worker send outcomes |
| NOTIF-P2-011 | P2 | partially-fixed | Alertmanager→ntfy critical alert delivery is optional in production and has no in-repo exercise evidence |
| NOTIF-P2-012 | P2 | verified-fixed | One-click unsubscribe is an unauthenticated GET with no expiry or confirmation; mail-security link scanners can silently opt users out |
| NOTIF-P3-001 | P3 | verified-fixed | No email template system; repetitive inline HTML diverges between senders |
| NOTIF-P3-002 | P3 | verified-fixed | `sms` channel is a dead preference option; UI copy misstates enforcement |
| NOTIF-P3-003 | P3 | verified-fixed | SSE polling fallback interval is not cleared on unmount |
| NOTIF-P3-004 | P3 | verified-fixed | `notification-preferences` PUT accepts a body `organizationId` without `assertOrgScopeMatches` |
| NOTIF-P3-005 | P3 | verified-fixed | No unsubscribe link or global opt-out in notification emails |
| NOTIF-P3-006 | P3 | verified-fixed | Worker reminder preference lookups omit the organization, so any org's opt-out suppresses the channel for all |
| NOTIF-P3-007 | P3 | verified-fixed | No per-recipient send throttle on notification producers |
| NOTIF-P3-008 | P3 | verified-fixed | Worker ticket-responded email builds the deep link from unescaped payload metadata (latent XSS-in-email) |
| NOTIF-P2-013 | P2 | open | Global email opt-out is invisible and cannot be reversed in the notification-preferences UI |
| NOTIF-P3-009 | P3 | open | One-click unsubscribe changes delivery preferences without an audit event |

Counts (all 26 findings in this report): **21 verified-fixed, 3 partially-fixed, 0 regressed, 2 new open (P2 x1, P3 x1).**

## Key fixes verified in this diff

### NOTIF-P2-012 — one-click unsubscribe is now prefetch-safe

`GET /api/v1/notifications/unsubscribe` verifies the signed token and returns a confirmation page only (`routes/notification-unsubscribe.ts:110-125`); the write happens on `POST` (`:127-155`). The token payload now carries `exp` and verification rejects missing/expired claims (`lib/unsubscribe-token.ts:33,72-78`; worker mirror `apps/worker/src/lib/unsubscribe-token.ts:20,71`). Both senders attach RFC 8058 headers (`buildListUnsubscribeHeaders`, `:84-90`; wired at `api/lib/notify.ts:441-447` and `worker/tasks/scheduled-notifications.ts:81-82`; header forwarding `api/lib/email.ts:11-14,47-50`, `worker/email.ts:10-13,44-47`). CSRF skips only this path (`middleware/csrf.ts:68-73`). Tests cover GET-no-write, POST-write, RFC 8058 body, tampered/foreign/expired/missing token and DB failure.

### NOTIF-P1-002 — dedup index repaired, but the migration cannot be relied on yet

`notify.ts:100-123` and `worker/notification-store.ts:167-180` upsert with `onConflict: "notification_key"`. PostgreSQL cannot infer the 5302107 partial index for that conflict target, so the deployed behaviour was `42P10` and every deduped insert failed; `5302463_fix_notification_key_dedup_index.sql:36-39` drops the partial index and creates a full unique index. **Residual:** `5302463` is also used by `5302463_client_portal_ai_and_visibility.sql`; `scripts/preflight-check.sh:50-51` fails on the duplicate and `supabase db push --include-all` keys by version, so one of the pair can be skipped on a fresh environment. Until the collision is resolved, treat the dedup fix as "in repo, not guaranteed deployed".

## New findings

### NOTIF-P2-013 — global opt-out is invisible and irreversible (P2, open)

- **Evidence:** `routes/notification-unsubscribe.ts:127-134` writes `module_key='all', channel='email', enabled=false`; `lib/notification-channels.ts:64-88` suppresses email if any matching row is false. The preferences API only accepts `tickets|projects|documents|billing|system` (`routes/notification-preferences.ts:13,51`); the UI renders only those modules and looks up per-module rows (`NotificationPreferencesClient.tsx:14-23,70-71,94-100`; `NotificationBell.tsx:205,267`). There is no DELETE/resubscribe endpoint.
- **What is happening:** after a one-click unsubscribe, no per-module email row exists, so every toggle renders as enabled; saving cannot clear the `all` row; delivery remains suppressed.
- **Why it matters:** a user who unsubscribes (or is unsubscribed by a leaked link) cannot restore email notifications from the product; support must edit `notification_preferences` directly.
- **Recommended fix:** render the global opt-out as a distinct banner/toggle, accept `moduleKey: 'all'` in the PUT (or add DELETE), and have both UIs treat the `all` row as the effective email state.
- **Validation:** UI test: seed an `all/email=false` row, assert the banner/toggle is off, save, assert a re-enabled row or deleted `all` row, and `resolveChannels` returns email=true.
- **Owner:** web/notifications · **Effort:** S · **Target:** this month.

### NOTIF-P3-009 — unsubscribe write has no audit event (P3, open)

- **Evidence:** `routes/notification-unsubscribe.ts:122-147` uses the service-role client and `logger.info`, with no `logAuditEvent`; the authenticated PUT records `notification_preference.update` (`routes/notification-preferences.ts:94-101`).
- **Why it matters:** a security-relevant delivery-preference change (including a leaked-link or forged unsubscribe) has no audit trail for incident response or DSAR reconstruction.
- **Recommended fix:** write a system-actor audit event with `userId`, `organizationId`, `surface: "unsubscribe"` and token expiry; never log the raw token.
- **Validation:** route test asserts one audit row with the expected metadata and no token.
- **Owner:** security/notifications · **Effort:** S · **Target:** next quarter.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Dedup fix skipped by duplicate migration version | P1 | Medium | Deduped notifications fail 42P10 again on fresh envs | NOTIF-P1-002, `5302463_*` pair | Rename one migration; run preflight |
| Users cannot restore email after unsubscribe | P2 | High for anyone who unsubscribes | Silent loss of notifications; support load | NOTIF-P2-013 | Global-opt-out UI + resubscribe path |
| SMTP unset in production | P2 | Operator-dependent | No email at all (metered/alerted) | NOTIF-P2-002 | Provision SMTP; keep alert |
| Critical alert delivery unexercised | P2 | Unknown | Pages may not arrive during an incident | NOTIF-P2-011 | Run a live drill; link evidence |
| Unsubscribe token in query string | P3 | Low | Bearer link in browser history/Referer | `lib/unsubscribe-token.ts`, URL builder | Keep 90-day expiry; consider POST-only link |

## Recommendations

### Immediate / Release Blocking

1. Rename one of the two `5302463_*` migrations so `supabase db push` applies the dedup index fix deterministically (shared with `INV-P1-001`/`DATA-P1-004`).

### This Week

2. Fix `NOTIF-P2-013` so the global opt-out is visible and reversible; add the resubscribe path.
3. Provision SMTP in production and record a test send; otherwise keep `MCTNotificationEmailSkipped` routed to an owner.

### This Month

4. Add the unsubscribe audit event (`NOTIF-P3-009`).
5. Exercise one real Alertmanager→ntfy critical alert and link the run URL (`NOTIF-P2-011`).

### Later / Platform Evolution

6. Consider a preference-history table rather than upsert-only rows, so consent/opt-out changes are auditable and reconstructable.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Show "global email off" banner | Users understand why no email arrives | `NotificationPreferencesClient.tsx`, `NotificationBell.tsx` | Component test |
| Allow `moduleKey: 'all'` | Unsubscribe becomes reversible | `routes/notification-preferences.ts` | API test |
| Log unsubscribe action | Audit trail for preferences | `routes/notification-unsubscribe.ts` | Route test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Global opt-out banner + resubscribe (NOTIF-P2-013) | P2 | web/notifications | S | None |
| Unsubscribe audit event (NOTIF-P3-009) | P3 | security/notifications | S | None |
| Rename duplicate 5302463 migration (NOTIF-P1-002) | P1 | data platform | S | INV-P1-001 |
| Provision SMTP + live send evidence (NOTIF-P2-002) | P2 | operator | S | Provider/DPA |
| Exercise one-critical-alert drill (NOTIF-P2-011) | P2 | observability | S | ntfy/Slack access |

## Suggested Tests

- **Unit:** `resolveChannels` with `all=false` + per-module true → all channels false; with `all=true` → module row wins.
- **Integration:** unsubscribe POST → preferences GET shows the global state; PUT re-enable clears it.
- **Regression:** 42P10 guard test also asserts the migration version is unique (currently it is not).
- **Security:** expired/foreign token → 400 and no write; CSRF exemption only on this path.
- **Delivery:** queue + worker send with `List-Unsubscribe` headers preserved; unroutable push endpoint revoked on 410.

## Suggested Documentation Updates

- `docs/SLO.md` / `docs/MONITORING_AND_ALERTING.md`: record the exact unsubscribe semantics and the global-opt-out recovery path.
- `docs/PRIVACY.md` (notification section): note the audit event once added.
- `docs/ENVIRONMENT_VARIABLES.md`: keep SMTP/VAPID operator gating explicit.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the global email opt-out intended to be reversible by the user? | Drives the UI/API fix | Product decision |
| Which mail clients POST `List-Unsubscribe=One-Click` in practice? | Validates the RFC 8058 path | Provider test matrix |
| Is there an SMTP provider chosen for production? | Email is a no-op without it | Operator config/DPA |
| Has a critical alert reached ntfy? | `NOTIF-P2-011` closure | Alertmanager run artifact |

## Appendix — command output

```
promtool check rules infra/digitalocean/prometheus.rules.yml
  -> SUCCESS: 26 rules found
promtool test rules infra/digitalocean/prometheus.rules.test.yml
  -> SUCCESS
```

No SMTP, push service, Redis or database traffic was generated.
