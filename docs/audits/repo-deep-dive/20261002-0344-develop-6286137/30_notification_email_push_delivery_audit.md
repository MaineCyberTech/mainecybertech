# Notification, Email, and Push Delivery Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:/temp/mainecybertech (mainecybertech-portal monorepo)
- Branch: develop
- Commit SHA: 62861370 (6286137017c4b7c77e83ee420ec11382d984f263; `git log -1` → "docs: record the widened a11y default gate")
- Generated at: 2026-10-02T03:44Z
- Auditor: Principal repository auditor (fresh audit at HEAD; prior `20260730-0650-develop-62da92c/30_*` and `20260801-0233-develop-a585f1d/30_*` used only as regression checklists)
- Area code: NOTIF
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/30_notification_email_push_delivery_audit.md
- Scope limitations:
  - AUDIT-ONLY. No application code, config, migration, or infra file was modified. Only this report was written.
  - No email, push, or SMS was sent, and no provider (SMTP/Supabase Realtime) was contacted. All statements are code-path and artifact analysis at the audited commit.
  - No live SMTP server, Redis broker, or Supabase Realtime channel was available in the audit environment, so delivery claims are `supported` by code/configuration, not reproduced against a running provider.
  - Secret values were never read or printed; only key names and paths are cited.
  - The worker runs `QUEUE_BACKEND=inline` by default (`apps/worker/src/env.ts:11`); production compose pins `bullmq`. Runtime queue behaviour is analysed from source, not exercised.

## Scope

Reviewed at commit 62861370 (branch `develop`):

- **Notification models / schema:** `supabase/migrations/5302029_create_notifications_table.sql`, `5302107_notification_dedup_and_indexes.sql`, `5302051_optimistic_locking_version_columns.sql`, `5302113_add_check_constraints.sql`, `5302129_supabase_rls_audit_fixes.sql` (notification_preferences RLS).
- **In-app delivery:** `apps/api/src/routes/notifications.ts` (SSE stream, list, unread-count, read, mark-all-read, admin create, delete), `apps/web/components/NotificationBell.tsx`, `apps/web/components/NotificationsPageClient.tsx`, `apps/web/lib/notifications-actions.ts`.
- **Notification creation helper & email fan-out:** `apps/api/src/lib/notify.ts` (`createNotification`, `notifyAndEmail`, `escapeHtml`).
- **Email sender:** `apps/api/src/lib/email.ts` (inline fallback), `apps/worker/src/email.ts` (SMTP retry/backoff), `apps/worker/src/tasks/notification-email.ts`.
- **Preferences:** `apps/api/src/routes/notification-preferences.ts`, `apps/web/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient.tsx`, `NotificationBell.tsx` prefs panel.
- **Scheduled/reminder jobs:** `apps/worker/src/tasks/scheduled-notifications.ts`, `apps/worker/src/tasks/index.ts`, `apps/worker/src/schedule-config.ts`, `apps/worker/src/main.ts`.
- **Other notification producers:** `apps/api/src/routes/tickets.ts` (create/assign/comment), `apps/worker/src/tasks/module-tasks.ts` (license-optimizer, vendor-contracts, renewal, approval-overdue, phishing-campaign-send).
- **Config:** `apps/api/src/config/env.ts`, `apps/worker/src/env.ts`, `apps/worker/.env.example`, root `docker-compose.yml`, `infra/digitalocean/docker-compose.yml`.
- **Queue / failure handling:** `apps/api/src/lib/task-producer.ts`, `apps/worker/src/consumer-bullmq.ts`, `apps/worker/src/consumer-sqs.ts`, `apps/worker/src/task-registry.ts`, `apps/worker/src/shutdown.ts`.
- **Audit logs:** `apps/api/src/services/audit.ts` call sites in notifications/preferences/admin routes.
- **Rate limiting:** `apps/api/src/middleware/rate-limit.ts`, `apps/api/src/app.ts`.
- **Tests / docs:** `apps/api/src/__tests__/notifications.test.ts`, `notification-preferences.test.ts`, `admin.test.ts`, `tenant-scoping-guard.test.ts`, `apps/worker/src/__tests__/tasks/task-handlers.test.ts`, `schedule-config.test.ts`, `apps/web/e2e/portal/notifications*.spec.ts`, `apps/web/e2e/admin/notifications.spec.ts`, `docs/GAP_ANALYSIS.md`.

Not reviewed in depth (owned by sibling prompts, cross-referenced not duplicated): general resilience/queue/DLQ semantics (`13`, RES-*), secret rotation inventory (`38`, SECRET-*), full API contract surface (`08`, API-*), webhook signature/replay (`27`, WH-*), RLS policy correctness (`37`).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `supabase/migrations/5302029_create_notifications_table.sql` | Schema | Base `notifications` table + RLS | `title`/`body` plaintext; insert policy `with check (true)` |
| `supabase/migrations/5302107_notification_dedup_and_indexes.sql` | Schema | Dedup + indexes | `notification_key TEXT` + **partial unique index** `idx_notifications_key`; user/created + unread indexes |
| `supabase/migrations/5302051_optimistic_locking_version_columns.sql:34` | Schema | Preferences versioning | `notification_preferences.version` default 1 |
| `apps/api/src/lib/notify.ts` | Source | In-app + email helper | `createNotification` (service role, no key, no prefs check); `notifyAndEmail` (subject prefix, escaping, queue→inline fallback) |
| `apps/api/src/routes/notifications.ts` | Source | API surface | SSE stream (sanitized, 5-min JWT revalidation), admin create with `notification_key` dedup, read/mark-all/delete |
| `apps/api/src/lib/email.ts` | Source | API inline email | Recreates transporter per call; no retry; recipient redacted in logs |
| `apps/worker/src/email.ts` | Source | Worker email | 3 attempts, `1000ms * 2^n` backoff, 10s connection/socket/greeting timeouts |
| `apps/worker/src/tasks/notification-email.ts` | Source | Queued email task | Validates `to`/`subject`; returns `ok:false` on failure (BullMQ retries) |
| `apps/worker/src/tasks/scheduled-notifications.ts` | Source | Reminder/due job | `task-due` scan, `recentlyNotified` (10-min window), per-action idempotency; sends in-app + email |
| `apps/worker/src/schedule-config.ts:49-54` | Config | `scheduled-notifications` scheduled daily | `intervalMs=24h`, `offsetMin=95`, `payload {type:"task-due"}` |
| `apps/worker/src/main.ts` | Source | Worker lifecycle | `uncaughtException` only (line 30); **no `unhandledRejection`** |
| `apps/api/src/routes/notification-preferences.ts` | Source | Preferences API | `MODULES` 5, `CHANNELS = [email, sms, in_app]`; GET/PUT upsert |
| `apps/web/.../NotificationPreferencesClient.tsx` | Source | Preferences UI | 5 modules × 2 channels (email/in-app); copy "Changes take effect immediately" |
| `apps/web/components/NotificationBell.tsx` | Source | Bell + SSE client | EventSource + 30s polling fallback; email toggle writes `channel:"email"` |
| `apps/api/src/routes/tickets.ts` | Source | Ticket notifications | Title + comment body slice sent by email + in-app, no prefs check |
| `apps/worker/src/tasks/module-tasks.ts` | Source | Scan notifications | License/vendor/renewal/approval inserts; per-row dedupe; phishing emails |
| `apps/api/src/routes/admin.ts:52-86` | Source | Test-email endpoint | `rateLimitEmail`; audit `admin.test_email` |
| `apps/api/src/config/env.ts:13-17` | Config | API SMTP keys optional | No required-if-email validation |
| `apps/worker/src/env.ts:29-33` | Config | Worker SMTP keys optional | Same |
| `apps/api/src/main.ts:12-21` | Source | SMTP startup warning | `logger.warn` only when `NODE_ENV=production` |
| `apps/api/src/lib/task-producer.ts` | Source | BullMQ producer | `attempts:3`, exp backoff 5000ms, never throws |
| `apps/worker/src/consumer-bullmq.ts` | Source | Consumer | Throws on `ok:false` → retry; `lockDuration=WORKER_TIMEOUT` |
| `apps/worker/src/task-registry.ts:63-68` | Source | Error capture | Strips raw payload from Sentry (PII conscious) |
| `apps/api/src/middleware/rate-limit.ts` | Source | Rate limits | `rateLimitByUser`, `rateLimitAuth`, `rateLimitEmail` |
| `apps/api/src/__tests__/*`, `apps/worker/src/__tests__/*` | Tests | Coverage | notifications, preferences, schedule-config, task-handlers; **no email/SSE/delivery tests** |
| `docs/GAP_ANALYSIS.md:102` | Docs | Test-email feature | "Send Test Email" admin button implemented |

## Verification Performed

| Evidence / claim | Type | Why relevant | Outcome | Notes |
| ---------------- | ---- | ------------ | ------- | ----- |
| Sibling 13: "scheduled-notifications job is now scheduled" | Cross-check | Task explicitly asks to verify independently | **supported** | `schedule-config.ts:49-54` schedules it daily; `main.ts:123-149` iterates `scheduledScans`; `schedule-config.test.ts:31,66-67` asserts name+payload |
| Sibling 13: "worker lacks `unhandledRejection`" | Cross-check | Verify independently | **supported** | Repo-wide grep for `unhandledRejection` returns only `apps/api/src/main.ts:73`; `apps/worker/src/main.ts` registers only `uncaughtException` (line 30) |
| Sibling 38: "reminder workflow absence" | Cross-check | Verify independently | **partially supported** | No `*rotation*`/`*reminder*` GitHub workflow exists (that claim is about secret-rotation reminders). But scheduled *notification reminder jobs* DO exist in `apps/worker` (`scheduled-notifications` task-due + `approval-overdue-check`). Two distinct meanings; only the workflow-reminder claim holds. |
| Prior 62da92c NOTIF-P1-001: "no duplicate notification prevention" | Regression | Re-audit at HEAD | **partially supported (regressed scope)** | Dedup added: `notification_key` + partial unique index (`5302107`), `recentlyNotified` (`scheduled-notifications.ts:55-74`), per-action idempotency in `module-tasks.ts`. But `notify.ts:createNotification` still inserts **without** `notification_key`, so the API fan-out path bypasses the unique index. |
| Prior 62da92c NOTIF-P0-001: "no email without SMTP" | Regression | Re-audit at HEAD | **partially supported (still open)** | SMTP keys remain `.optional()` in both env schemas; production only warns (`api/main.ts:19`); `sendEmail` returns `false` and skips when `SMTP_HOST` unset (`worker/email.ts:16-19`, `api/lib/email.ts:14-17`) |
| Preferences actually gate sends | Special check | "Check preference/consent before sends" | **unsupported** | `notification_preferences` is read/written **only** by `routes/notification-preferences.ts` (grep: 2 matches) and the UI. No send path (`notify.ts`, `scheduled-notifications.ts`, `module-tasks.ts`, `tickets.ts`) queries it. UI claims "Changes take effect immediately." |
| Dedup is idempotent under retry | Special check | "Scheduled sends must be idempotent" | **partially supported** | Task-level dedupe exists but the in-app insert and email send are **not atomic** (insert then send, no transaction), and `createInAppNotification` swallows insert errors → a retried task can re-email while the in-app row was dropped |
| SSE sends only safe fields | Prior NOTIF-P1-002 | Regression | **supported (fixed)** | `sanitizeNotification` (`notifications.ts:17-27`) whitelists id/title/module/module_id/action/read/created_at — body excluded from SSE payload despite the earlier claim |
| SSE re-validates auth | Special check | Session revocation | **supported** | 5-minute JWT re-verify loop (`notifications.ts:55-86`); emits `auth_expired` and ends stream |
| Email retry/backoff exists | Extended check | Retry discipline | **supported** | `worker/email.ts:35-59` — 3 attempts, exponential backoff, timeouts |
| API inline email has retry | Extended check | Failover path | **unsupported** | `api/lib/email.ts` sends once, no retry; only reached when Redis enqueue fails (`notify.ts:77-80`) |
| Notification delivery metrics/alerts | Extended check | Failure visibility | **unsupported** | `taskExecutionsTotal`/`taskExecutionDuration` counters exist (`task-registry.ts`), but no notification/email-specific metric and no alert rule for email failure |
| Push / VAPID implementation | Scope item | Push subscriptions | **unsupported (absent)** | Grep for `vapid|web-push|pushManager|serviceWorker` returns only docs/prompts; no code, no env key, no service worker in `apps/web` |
| Tenant scoping of notification reads | Scope item | Tenant isolation | **supported** | `notifications.ts` filters `.eq("user_id", req.authUser!.userId)` on list/unread/read/delete; route is in `tenant-scoping-guard.test.ts` allowlist as user-scoped |
| Sensitive content in bodies | Scope item | PII in previews | **partially supported** | SSE sanitized, but DB `body` stores full ticket title + 100-char comment excerpt; email sends body verbatim; SMTP "new ticket" leaves `to:"***"` but subject retained |
| Rate limiting of sends | Scope item | Abuse | **partially supported** | Global `rateLimitByUser` + `rateLimitEmail` on test-email; admin `POST /notifications` has no dedicated send limit |
| Secret values printed | Safety | Never print | **pass** | Only key names cited; no `.env` values read |

## Executive Summary

The notification subsystem is **materially more developed** than the 62da92c/21a10d6 audits described, and several previous findings are genuinely fixed rather than restated. In-app delivery is real: `notifications` table with RLS, an SSE stream that now sends only a whitelisted field set and revalidates the JWT every 5 minutes, a 30-second polling fallback in `NotificationBell`, a per-module/per-channel preferences UI and API, audit logging on read/create/delete, and a dedicated admin "Send Test Email" path.

**Verified strengths**
- **In-app dedup now exists at two layers:** a `notification_key` column with a partial unique index (`5302107`) enforced on the admin create endpoint (`notifications.ts:270-297`), plus a `recentlyNotified` 10-minute window and per-action `alerted`/`existing` lookups in the scheduled/scan tasks (`scheduled-notifications.ts:55-74,124-132`; `module-tasks.ts:378-387,904-912`).
- **Email retry/backoff is implemented** in the worker (`apps/worker/src/email.ts`): 3 attempts, exponential backoff, and 10s connection/socket/greeting timeouts, with the queued task (`notification-email.ts`) returning `ok:false` so BullMQ re-delivers.
- **SSE payload is now sanitized** (`sanitizeNotification`), so the earlier "full body over SSE" concern no longer holds.
- **Scheduled reminder jobs are real and scheduled:** `schedule-config.ts:49-54` runs `scheduled-notifications` daily with a `task-due` payload; `approval-overdue-check` and other scan-driven reminders also run from `main.ts`.
- **PII-aware error handling:** `task-registry.ts:63-68` deliberately strips raw payloads before shipping to Sentry; `api/lib/email.ts:38-43` redacts the recipient.

**Major risks (this audit)**
1. **Consent/preferences are not enforced anywhere.** `notification_preferences` is written and displayed but never read by a send path. A user who disables email for a module still receives email. This is the single largest correctness/privacy gap and the prompt's explicit special check.
2. **API-originated notifications bypass dedup.** `lib/notify.ts:createNotification` inserts without `notification_key`, so the unique index that protects the admin endpoint does nothing for ticket/comment/assignment notifications — duplicate rows remain possible on retry/replay.
3. **No push channel exists.** No Web Push, no VAPID keys, no service worker. Time-sensitive alerts depend on the user having a browser tab open (SSE/poll).
4. **Email is best-effort and unobserved.** SMTP is optional, production only logs a warning; the API inline fallback has no retry; and there is no metric or alert for email failure, so "notifications are being delivered" is unverifiable.
5. **Worker has no `unhandledRejection` handler** (confirmed, matching sibling 13), so a stray rejection in a notification timer path is neither logged consistently nor captured by Sentry.
6. **Sensitive content in bodies.** Ticket titles and 100-char comment excerpts are stored and emailed verbatim; there is no sensitivity filter or redaction, and notification bodies persist for 90 days (`retention.ts`).

**Recommended next actions:** enforce preferences (and an unsubscribe/opt-out path) inside `createNotification`/`notifyAndEmail`; set `notification_key` in `createNotification` and align the scan inserts with the unique index; make SMTP required in production (or fail the deploy gate); add a notification-delivery metric and alert; add the worker `unhandledRejection` handler; and either implement Web Push + VAPID or document the channel as intentionally out of scope.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Notification model | `notifications` table (`5302029`) | In-app rows | Implemented | Medium | `title`/`body` plaintext; insert RLS `with check (true)` |
| Dedup key | `notification_key` + partial unique index (`5302107`) | Prevent duplicates | Implemented (partial) | Medium | Only admin endpoint sets it; `notify.ts` does not |
| In-app SSE | `notifications.ts` `GET /stream` | Real-time push | Implemented | Low | Sanitized payload; 5-min JWT re-check; 30s keepalive |
| In-app polling | `NotificationBell.tsx` | Fallback | Implemented | Low | 30s `fetchUnread`; silent error handling |
| Notification list/read/delete | `notifications.ts` | User inbox | Implemented | Low | User-scoped; audit logged |
| Admin create | `notifications.ts` `POST /` | Admin push | Implemented | Medium | `requireAdmin`; dedup via key; no prefs check |
| Notify helper | `lib/notify.ts` | In-app + email fan-out | Implemented | High | No key, no prefs, no dedup, best-effort |
| API email | `lib/email.ts` | Inline SMTP fallback | Implemented | Medium | No retry; new transporter per call |
| Worker email | `worker/email.ts` | SMTP send | Implemented | Low | 3 attempts + backoff + timeouts |
| Email task | `tasks/notification-email.ts` | Queued send | Implemented | Low | BullMQ retry on `ok:false` |
| Preferences table | `notification_preferences` | Consent store | Implemented | High | Never consulted by sends |
| Preferences API | `routes/notification-preferences.ts` | GET/PUT | Implemented | Medium | Channels include `sms`/`in_app`; RLS self-or-admin |
| Preferences UI | `NotificationPreferencesClient.tsx` | Per-module toggles | Implemented | High | Copy claims immediate effect (false) |
| Scheduled reminder | `tasks/scheduled-notifications.ts` | task-due/membership/ticket/custom | Implemented + scheduled | Medium | Dedup window 10 min / 7d; email body verbatim |
| Schedule config | `schedule-config.ts:49-54` | Daily cadence | Implemented | Low | `offsetMin 95`; verified by test |
| Scan reminders | `tasks/module-tasks.ts` | License/vendor/renewal/approval | Implemented | Low-Medium | Per-row dedup; no prefs; no key |
| Test email | `routes/admin.ts:52-86` + `EmailTestClient.tsx` | SMTP verification | Implemented | Low | `rateLimitEmail`; audited |
| Push / VAPID | — | Browser push | **Absent** | Medium | No code, env, or service worker |
| Email templates | — (inline HTML in `notify.ts`) | Branding | Partial | Low | `escapeHtml` present; no template engine |
| Unsubscribe/opt-out | — | Global opt-out | **Absent** | High | Per-module toggle only, and unenforced |
| Rate limiting | `middleware/rate-limit.ts` | Abuse control | Implemented (partial) | Low-Medium | Global per-user; `rateLimitEmail` for test-email |
| Audit logs | `services/audit.ts` call sites | Traceability | Implemented | Low | read/create/delete/mark-all/prefs/test-email |
| Delivery metrics | `task-registry.ts` counters | Observability | Partial | High | Generic task counters; no email/notification metric or alert |
| Worker rejection handling | `worker/main.ts` | Crash visibility | Partial | Medium | `uncaughtException` only; no `unhandledRejection` |
| Tests | `apps/*/__tests__` | Verification | Partial | Medium | API notifications/prefs + schedule config; no email/SSE/delivery/dedup tests |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| --- | ---: | --- | --- | --- |
| Notification models | 3 | `5302029` table + RLS; `5302107` indexes; `sanitizeNotification` | Plaintext body; `notification_key` only set on one path | Set key everywhere; consider body sensitivity field |
| Email templates | 2 | Inline HTML in `notify.ts:70-72`; `escapeHtml` both senders | No template engine/branding; no unsubscribe footer | Adopt one shared template with footer + prefs link |
| Push subscriptions | 0 | No `web-push`/VAPID/service worker (grep) | Entire channel absent | Implement or document as out of scope |
| VAPID/config | 0 | No VAPID env keys in either schema | No push config | Add keys if push is pursued |
| Reminder jobs | 3 | `scheduled-notifications.ts` + `schedule-config.ts`; scheduled | No prefs check; no completion-overlap guard; not tested end-to-end | Preferences + per-scan overlap guard + tests |
| Preferences | 2 | Table + API + UI complete | **Not enforced on any send** | Enforce in `createNotification`/`notifyAndEmail` |
| Tenant scoping | 3 | user_id filters; allowlisted as user-scoped; prefs RLS self-or-admin | Notification bodies store org content; SSE filter is user_id only | Add org context assertions; keep guard green |
| Unsubscribe/opt-out | 1 | Per-module `enabled` toggle only | No global opt-out; toggle unenforced; no email unsubscribe link | Enforce toggle; add global opt-out + link |
| Retries | 3 | Worker email 3× + backoff; BullMQ 3 attempts | API inline email no retry; no notification-specific retry test | Add API retry or always queue; add tests |
| Failure handling | 2 | `sendEmail` returns bool; task returns `ok:false`; sanitized Sentry | `createNotification` swallows errors; no DLQ/metric/alert for email | Surface failures; add metric + alert; task DLQ (see 13/RES-*) |
| Duplicate prevention | 3 | `notification_key` unique index; `recentlyNotified`; per-row dedupe | `notify.ts` bypasses index; insert+send not atomic | Set key in `createNotification`; consider upsert |
| Rate limiting | 3 | Global per-user limiter; `rateLimitEmail`; `rateLimitAuth` | No dedicated limit on admin create/bulk notification | Add per-recipient send throttling |

## Detailed Review

### Item: Notification model, dedup, and RLS

- Evidence: `supabase/migrations/5302029_create_notifications_table.sql`, `5302107_notification_dedup_and_indexes.sql`, `apps/api/src/routes/notifications.ts`.
- What it does: Stores `user_id`, optional `organization_id`, `title`, `body`, `module`, `module_id`, `action`, `read`, `read_at`, `created_at`, plus (added later) `notification_key`. RLS restricts select/update/delete to `user_id = auth.uid()`; insert is `with check (true)`.
- How it appears to work: The admin create endpoint computes `notificationKey = userId-module-moduleId-action`, looks it up, returns the existing row on hit, and inserts `notification_key` on miss; the partial unique index enforces uniqueness for non-null keys. The helper `createNotification` does **not** set the key.
- Dependencies: Supabase service role.
- Current controls: unique index, admin dedup lookup, user-scoped RLS.
- Missing controls: key set on the main fan-out path; body sensitivity; insert-policy `with check (true)` allows any authenticated insert (mitigated by API using service role).
- Risks: Medium (duplicate rows from API path; PII in body).
- Recommended improvement: Give `createNotification` a deterministic `notification_key` (upsert on conflict) and add a `sensitivity`/`redact` step.
- Suggested tests: two identical `createNotification` calls → one row; retried scheduled task → one email.
- Suggested docs: notification data model + dedup semantics.

### Item: In-app SSE stream

- Evidence: `apps/api/src/routes/notifications.ts:30-146`, `apps/web/components/NotificationBell.tsx:81-119`.
- What it does: Opens `text/event-stream`, subscribes to Supabase Realtime `postgres_changes` INSERT/UPDATE filtered by `user_id`, pushes sanitized rows, sends initial 5 unread, keepalive every 30s, and re-verifies the JWT every 5 minutes.
- How it appears to work: `sanitizeNotification` whitelists fields (no body) — the prior "full body over SSE" issue is fixed. The client falls back to 30s polling when `es.onerror` fires. Note the fallback interval created inside `es.onerror` is not cleared on unmount (`NotificationBell.tsx:108-113`) — a minor leak.
- Dependencies: Supabase Realtime; cookie session.
- Current controls: field whitelist, auth re-validation, polling fallback.
- Missing controls: backfill/ack on reconnect; the error-path interval cleanup.
- Risks: Low.
- Recommended improvement: clear the fallback interval in the effect cleanup; add an E2E test that reconnects.
- Suggested tests: SSE payload contains no `body`; revoked JWT ends the stream with `auth_expired`.
- Suggested docs: realtime notification behaviour.

### Item: Notification creation and email fan-out (`notify.ts`)

- Evidence: `apps/api/src/lib/notify.ts`, callers `routes/tickets.ts:181,261,357`, `routes/admin.ts`, `apps/api/src/main.ts:12-21`.
- What it does: `createNotification` best-effort inserts; `notifyAndEmail` also builds subject `[Maine CyberTech] <title>`, text with a deep link, escaped HTML, then enqueues `notification-email` and falls back to inline `sendEmail` when the queue is unavailable.
- How it appears to work: There is no preference/consent lookup, no `notification_key`, and `createNotification`'s try/catch only logs. Email recipients are passed by callers (e.g. `assignee.email`).
- Dependencies: Supabase, Redis (optional), SMTP.
- Current controls: HTML escaping, deep-link construction, queue→inline fallback.
- Missing controls: consent enforcement, dedup key, failure surfacing, template/footer/unsubscribe.
- Risks: High (unenforced consent; duplicates; silent loss).
- Recommended improvement: add a `resolveChannels(userId, module, orgId)` that reads `notification_preferences` before insert/send; set a deterministic key; return/emit a metric on failure.
- Suggested tests: disabled email module → no `notification-email` job; disabled in_app → no insert.
- Suggested docs: notification delivery contract.

### Item: Email senders

- Evidence: `apps/api/src/lib/email.ts`, `apps/worker/src/email.ts`, `apps/worker/src/tasks/notification-email.ts`, `apps/api/src/routes/admin.ts:52-86`.
- What it does: Both senders build a nodemailer transporter from optional `SMTP_*` env and skip silently when `SMTP_HOST` is unset (worker warns, API warns). The worker adds 3 attempts with exponential backoff and 10s timeouts; the API sends once.
- How it appears to work: Verified from source. The API creates a fresh transporter per call (minor inefficiency); the worker's is per-call too.
- Dependencies: SMTP.
- Current controls: retry/backoff/timeouts (worker), sender default `noreply@mainecybertech.com`, recipient redaction in logs.
- Missing controls: required-if-enabled SMTP, real transactional provider, delivery metric/alert, API retry, shared template.
- Risks: Medium-High (silent drop when SMTP absent; no observability).
- Recommended improvement: make SMTP required in prod deploy and fail the release gate; add a `notification_email_failed_total` counter and alert; reuse a single pooled transporter.
- Suggested tests: `sendEmail` with `SMTP_HOST` unset returns false and increments a counter; worker retries on transient failure.
- Suggested docs: email/SMTP operations runbook + troubleshooting.

### Item: Preferences (API + UI) and enforcement

- Evidence: `apps/api/src/routes/notification-preferences.ts`, `apps/web/.../NotificationPreferencesClient.tsx`, `NotificationBell.tsx:121-185`.
- What it does: GET returns `{preferences, modules, channels}`; PUT upserts rows on `(organization_id,user_id,module_key,channel)` and audits. The UI renders 5 modules × email/in-app toggles and writes `channel:"email"`/`"in_app"`. The bell shows email toggles only.
- How it appears to work: Preferences never influence any send. `CHANNELS` in the API includes `sms` (no sender) — dead option. The UI states "Changes take effect immediately," which is false.
- Dependencies: Supabase.
- Current controls: RLS self-or-admin, audit event, upsert conflict target.
- Missing controls: enforcement, global opt-out, unsubscribe link, preference defaults on critical modules.
- Risks: High (false consent boundaries; misleading UX).
- Recommended improvement: enforce in send paths; fix the UI copy; add a global "pause all" and a one-click unsubscribe token in emails.
- Suggested tests: PUT disable then trigger a send → no email/in-app; UI copy assertion.
- Suggested docs: preference semantics + unsubscribe policy.

### Item: Scheduled and scan-driven reminders

- Evidence: `apps/worker/src/tasks/scheduled-notifications.ts`, `apps/worker/src/schedule-config.ts:49-54`, `apps/worker/src/main.ts:111-149`, `tasks/module-tasks.ts`.
- What it does: `task-due` scans `project_tasks` due within 24h (limit 100), batches profile + dedupe lookups, applies a 7-day `alerted` set, inserts in-app, and emails. `approval-overdue-check`, `license-optimizer-check`, `vendor-contract-renewal-check`, etc. insert notifications with per-row `existing` lookups. `recentlyNotified` gives a 10-minute guard for typed notifications.
- How it appears to work: Verified. Both schedules and the code exist and are tested at the config level (`schedule-config.test.ts`) and handler level (error paths in `task-handlers.test.ts`). The read-then-insert dedup is not atomic (race between two replicas is mitigated by the Redis scan lock, but a retry mid-loop can still double-send because insert and email are separate).
- Dependencies: Supabase; Redis scan lock; SMTP.
- Current controls: scan lock, staggered offsets, dedup windows, batched lookups.
- Missing controls: preference enforcement, idempotency key, completion-overlap guard, delivery assertion.
- Risks: Medium.
- Recommended improvement: write `notification_key` on these inserts; add a completion guard; assert `notified`/`emailed` in a metric.
- Suggested tests: run twice → no duplicate; disabled prefs → no send.
- Suggested docs: scheduled reminder catalogue.

### Item: Queue, retry, and failure visibility

- Evidence: `apps/api/src/lib/task-producer.ts`, `apps/worker/src/consumer-bullmq.ts`, `apps/worker/src/consumer-sqs.ts`, `apps/worker/src/task-registry.ts`, `apps/worker/src/shutdown.ts`, `apps/worker/src/main.ts`.
- What it does: Producers enqueue with `attempts:3` + exponential backoff and never throw; the BullMQ consumer throws on `ok:false` to trigger retry; generic task counters record success/failure/error; Sentry captures exceptions without raw payloads.
- How it appears to work: Verified. There is no notification/email-specific metric, no DLQ for generic tasks (cross-ref 13/RES-P2-002), and no `unhandledRejection` in the worker (cross-ref 13/RES-P2-001).
- Dependencies: Redis (prod), SMTP.
- Current controls: bounded retries, PII-safe Sentry, generic metrics.
- Missing controls: notification metric/alert; worker rejection handler; task DLQ.
- Risks: Medium.
- Recommended improvement: add `notification_delivery_total{channel,status}` and an alert on sustained failure; add the worker handler.
- Suggested tests: failing email task → metric + DLQ row; rejected promise logged.
- Suggested docs: notification observability.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| NOTIF-001 | Notification models | `5302029`, `5302107`, `sanitizeNotification` | Row store + unique key + sanitized SSE | Plaintext body; key not set on main path | P2 | Key everywhere; sensitivity field |
| NOTIF-002 | Email templates | `notify.ts:70-72`, `escapeHtml` | Escaped inline HTML | No engine/branding/footer/unsubscribe | P3 | Shared template + footer |
| NOTIF-003 | Push subscriptions | grep — none | None | Channel absent | P2 | Implement or document out-of-scope |
| NOTIF-004 | VAPID/config | env schemas | None | No push config | P2 | Add keys if pursued |
| NOTIF-005 | Reminder jobs | `scheduled-notifications.ts`, `schedule-config.ts` | Scheduled daily + dedupe | No prefs; non-atomic insert+send | P2 | Prefs + key + overlap guard |
| NOTIF-006 | Preferences | `notification-preferences.ts`, UI | Stored + displayed | **Not enforced** | P1 | Enforce in send path |
| NOTIF-007 | Tenant scoping | `notifications.ts` user_id filters; guard allowlist | User-scoped reads | Bodies carry org content; SSE filter user-only | P3 | Add org assertions |
| NOTIF-008 | Unsubscribe/opt-out | prefs toggle only | Per-module toggle | No global opt-out/link; unenforced | P1 | Global opt-out + email link |
| NOTIF-009 | Retries | `worker/email.ts`; BullMQ | 3× worker; 3× queue | API inline no retry | P2 | Always queue or add retry |
| NOTIF-010 | Failure handling | `sendEmail` bool; task `ok:false` | Degrades gracefully | No metric/alert; swallowed inserts | P1 | Metric + alert + surface errors |
| NOTIF-011 | Duplicate prevention | `notification_key`; `recentlyNotified` | Two-layer dedupe | `notify.ts` bypasses index | P1 | Set key in `createNotification` |
| NOTIF-012 | Rate limiting | `rate-limit.ts` | Global per-user; `rateLimitEmail` | No per-recipient send throttle | P2 | Throttle notifications per recipient |

## Findings

### Finding ID: NOTIF-P1-001 - Notification preferences are stored and displayed but never enforced on any send path

- Severity: P1
- Confidence: High
- Area: Notification preferences / consent
- Evidence:
  - `apps/api/src/routes/notification-preferences.ts:16-94` — the only reader/writer of `notification_preferences` (grep over `apps/` returns 2 matches, both in this file).
  - `apps/api/src/lib/notify.ts:28-81` — `createNotification`/`notifyAndEmail` never query preferences; they insert and send unconditionally.
  - `apps/worker/src/tasks/scheduled-notifications.ts:76-298` and `apps/worker/src/tasks/module-tasks.ts` — reminder/scan sends also ignore preferences.
  - `apps/web/app/(portal)/portal/notifications/preferences/NotificationPreferencesClient.tsx:172-175` — UI copy: "Changes take effect immediately. In-app notifications appear in the bell icon…".
  - `apps/api/src/routes/notification-preferences.ts:14` — `CHANNELS = ["email","sms","in_app"]` includes `sms`, for which no sender exists.
- What is happening: Preferences are a pure display/CRUD feature. A user who switches a module's email (or in-app) toggle off continues to receive that channel because no send path consults `notification_preferences`. The UI explicitly promises immediate effect.
- Why it matters: Consent is a correctness and privacy boundary. The product knowingly presents controls that do nothing, which is both a trust and (for email) a regulatory risk.
- User / business impact: Users cannot stop unwanted email or in-app noise; the preferences page is misleading; support burden and possible unsubscribe/compliance complaints.
- Security / privacy / reliability impact: Privacy — no consent enforcement; reliability — no way for users to reduce load on the email path.
- Recommended fix: Add `apps/api/src/lib/notification-channels.ts` exposing `resolveChannels({userId, organizationId, module})` that reads `notification_preferences` (service role) and returns enabled channels (defaulting to enabled when no row exists). Call it in `createNotification` (gate in-app insert) and `notifyAndEmail` (gate email). Apply the same gate in `scheduled-notifications.ts` and `module-tasks.ts` before inserting/sending. Fix the UI copy and remove or wire `sms`.
- Suggested validation: Unit test — set `{module:"tickets",channel:"email",enabled:false}` for a user, call `notifyAndEmail`, assert no `notification-email` job and no `notifications` row; integration test in `notification-preferences.test.ts` proving the toggle changes delivery.
- Owner suggestion: Implementation agent (API) + implementation agent (worker).
- Effort estimate: M
- Dependencies: None.
- Status: open
- Endpoint / data path: `POST /api/v1/tickets/:id/comments` → `notifyAndEmail` → `createNotification` + `enqueueTask("notification-email")` (preferences not consulted)
- Attack path: none identified

### Finding ID: NOTIF-P1-002 - API-originated notifications bypass the dedup unique index

- Severity: P1
- Confidence: High
- Area: Notification deduplication
- Evidence:
  - `supabase/migrations/5302107_notification_dedup_and_indexes.sql:2-3` — `notification_key TEXT` + partial unique index `idx_notifications_key`.
  - `apps/api/src/routes/notifications.ts:270-297` — admin create sets `notification_key` and pre-checks for an existing row.
  - `apps/api/src/lib/notify.ts:31-39` — `createNotification` inserts `user_id/organization_id/title/body/module/module_id/action` with **no** `notification_key`.
  - `apps/worker/src/tasks/module-tasks.ts:389-397,914-922` and `scheduled-notifications.ts:37-44` — scan inserts also omit `notification_key`.
- What is happening: The unique index only guards rows whose `notification_key` is non-null. All ticket-driven notifications (create/assign/comment) and all scan notifications leave it null, so retries, webhook replays, or double submits can create duplicate rows and duplicate emails exactly as the prior 62da92c audit described — the fix covers only one of several producers.
- Why it matters: The dedup control that appears implemented is ineffective on the busiest paths; duplicate notifications inflate the bell badge and send duplicate email.
- User / business impact: Noise, inflated unread counts, duplicate emails; erodes confidence in notification reliability.
- Security / privacy / reliability impact: Reliability/UX; no direct security impact.
- Recommended fix: In `createNotification`, compute a deterministic key (e.g. `${userId}-${module}-${moduleId ?? "none"}-${action}`) and use `upsert(..., { onConflict: "notification_key", ignoreDuplicates: true })`. Mirror the key in the scan inserts (or route them through `createNotification`). Keep the admin pre-check for a friendly 200 response.
- Suggested validation: Two `createNotification` calls with identical inputs → one row; retried scheduled `task-due` for the same task → one email (mock `sendEmail`).
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: Existing migration `5302107`.
- Status: partially-fixed (index and admin path fixed; main fan-out path still bypasses)
- Endpoint / data path: `createNotification` → `supabase.from("notifications").insert(...)` (no `notification_key`)
- Attack path: none identified

### Finding ID: NOTIF-P1-003 - No delivery observability: email/notification failures are silent and unalerted

- Severity: P1
- Confidence: High
- Area: Failure handling / observability
- Evidence:
  - `apps/api/src/lib/email.ts:12-45` — returns `false`; caller `notify.ts:78-80` ignores the return value.
  - `apps/worker/src/email.ts:14-59` — returns `false` after retries; `notification-email.ts:18-19` maps it to `ok:false` (retryable) but nothing records a terminal failure.
  - `apps/worker/src/task-registry.ts:44-70` — only generic `taskExecutionsTotal`/`taskExecutionDuration`; no email/notification counters.
  - `apps/api/src/main.ts:12-21` — SMTP missing in production is a `logger.warn` only.
  - No Prometheus rule references email/notification failure (cross-ref 13/RES-P2-005 on in-stack alerting).
- What is happening: When SMTP is unconfigured or a send fails permanently, the only artifacts are log lines and (for queued jobs) a BullMQ failed entry. There is no counter, dashboard, or alert that says "notifications/emails are failing", and the API inline fallback discards the boolean result.
- Why it matters: The prompt's extended check requires end-to-end delivery confidence and dead-man notifications. Here, "email works" is unverifiable and a silent outage would persist until a user complains.
- User / business impact: Missed password/assignment/approval emails go unnoticed; MTTR extended.
- Security / privacy / reliability impact: Reliability/observability; no direct security impact.
- Recommended fix: Emit `notification_delivery_total{channel,status}` (and a failure reason label) from both senders and the task handler; add a Prometheus alert on sustained non-zero failure rate or zero success in a window; make the API inline fallback log/emit on `false`; surface SMTP-missing as a health/deploy gate warning that fails the release check.
- Suggested validation: Simulate `sendMail` rejection and assert the counter increments; alert rule unit test (as done for other rules) or a documented synthetic test.
- Owner suggestion: Platform engineer + implementation agent.
- Effort estimate: M
- Dependencies: Metrics infrastructure (cross-ref 14/observability).
- Status: open
- Endpoint / data path: `sendEmail` → SMTP (no metric) ; `notification-email` task → `ok:false` → BullMQ retry
- Attack path: none identified

### Finding ID: NOTIF-P2-001 - Web Push channel is entirely absent (no subscriptions, no VAPID, no service worker)

- Severity: P2
- Confidence: High
- Area: Push notifications
- Evidence:
  - Repo-wide case-insensitive grep for `vapid|web-push|webpush|pushManager|serviceWorker|showNotification|PushSubscription` returns matches only in `prompts/**` documentation, never in `apps/**` source.
  - `apps/api/src/config/env.ts:3-56` and `apps/worker/src/env.ts:5-43` — no VAPID or push keys.
  - `apps/web` — no `sw.js`/service-worker registration for push; the only realtime channel is SSE + polling (`NotificationBell.tsx`).
  - Prior `20260728-0142-develop-21a10d6/17_mobile_pwa_responsive_access.md:23` already recorded "no `sw.js`, no `navigator.serviceWorker.register()`".
- What is happening: Users receive notifications only while a browser tab is open (SSE) or polling (30s). There is no OS-level push, so time-sensitive alerts (assignment, approval, overdue) are missed when the portal is closed.
- Why it matters: Push is the expected channel for time-sensitive operational alerts; its absence is a product-capability and retention gap.
- User / business impact: Missed critical alerts; lower responsiveness for MSP support workflows.
- Security / privacy / reliability impact: Reliability/UX; browser push also opens permission-UX and subscription-hygiene considerations that are currently unaddressed.
- Recommended fix: Implement Web Push (`web-push` package) with `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` env keys, a `push_subscriptions` table (user_id, endpoint, keys, created_at, disabled_at) with RLS, a service worker, a permission-prompt UX, and a worker task to fan out push alongside email. Alternatively, record an explicit product decision that push is out of scope and remove it from roadmap docs.
- Suggested validation: Integration test that a stored subscription receives a push through a mocked `web-push.sendNotification`; E2E permission flow.
- Owner suggestion: Platform engineer + implementation agent.
- Effort estimate: L
- Dependencies: VAPID key generation; new migration; service worker.
- Status: open
- Endpoint / data path: none (channel not implemented)
- Attack path: none identified

### Finding ID: NOTIF-P2-002 - SMTP remains optional; email silently degrades to no-op in production

- Severity: P2
- Confidence: High
- Area: Sender config / reliability
- Evidence:
  - `apps/api/src/config/env.ts:13-17` — `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/EMAIL_FROM` all `.optional()`.
  - `apps/worker/src/env.ts:29-33` — same optionality.
  - `apps/api/src/main.ts:12-21` — production logs `logger.warn(... "email notifications will fail silently")`; it does not fail the process or the deploy.
  - `apps/worker/src/email.ts:16-19` and `apps/api/src/lib/email.ts:14-17` — `if (!host) { warn; return false; }`.
- What is happening: If SMTP is unset, every email path is a silent no-op; the prior 62da92c NOTIF-P0-001 issue remains, downgraded in severity only because the failure is now logged and the deploy matrix lists SMTP as required (`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:43-47`), which is a doc claim not enforced by code (cross-ref 38/SECRET-P1-002).
- Why it matters: A misconfigured production deployment serves the portal without any email, with no hard signal.
- User / business impact: Silent loss of all email notifications.
- Security / privacy / reliability impact: Reliability.
- Recommended fix: Add a superRefine (or startup assertion) requiring SMTP keys when `NODE_ENV=production`, or fail the deploy gate when SMTP is absent; add the delivery metric from NOTIF-P1-003.
- Suggested validation: Env test — production without `SMTP_HOST` throws; deploy CI check.
- Owner suggestion: Implementation agent + platform engineer.
- Effort estimate: S
- Dependencies: Coordinates with 38/SECRET-P1-002 (deploy writer) and 12 (env drift).
- Status: still-open (carried from prior NOTIF-P0-001/P2-002)
- Endpoint / data path: API/worker startup → `getEnv()`/`env` → `sendEmail`
- Attack path: none identified

### Finding ID: NOTIF-P2-003 - Worker lacks an `unhandledRejection` handler (independently verified)

- Severity: P2
- Confidence: High
- Area: Failure handling / worker lifecycle
- Evidence:
  - `apps/worker/src/main.ts:30-35` — only `process.on("uncaughtException", ...)`.
  - `apps/api/src/main.ts:73-75` — the log-and-continue `unhandledRejection` model the worker lacks.
  - Repo-wide grep for `unhandledRejection` returns only the API `main.ts` match.
  - Sibling `13_resilience_recovery_failure_modes.md` (RES-P2-001) reports the same; independently reproduced here.
- What is happening: A rejected promise in a notification timer/scан path not wrapped in `.catch` is not routed to Sentry and follows Node's default behaviour rather than the API's deliberate policy. (Note: `runScheduledTask(...).catch(...)` at `main.ts:65-146` covers the scheduled call sites, reducing — but not eliminating — exposure from other async paths.)
- Why it matters: The worker drives reminders and email; an unhandled rejection can drop scheduled work invisibly.
- User / business impact: Missed reminders/emails; harder incident diagnosis.
- Security / privacy / reliability impact: Reliability/observability.
- Recommended fix: Add `process.on("unhandledRejection", (reason) => { logger.error({ err: reason }, "Unhandled promise rejection — continuing"); Sentry.captureException(reason); })` in `apps/worker/src/main.ts`, mirroring the API.
- Suggested validation: Test firing a rejected promise and asserting the handler logs/captures and the process does not exit.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: None.
- Status: open (cross-reference 13/RES-P2-001 — do not duplicate the fix PR)
- Endpoint / data path: none (process-level)
- Attack path: none identified

### Finding ID: NOTIF-P2-004 - Scheduled reminder inserts and email sends are not atomic; retries can double-send

- Severity: P2
- Confidence: Medium
- Area: Idempotency / reliability
- Evidence:
  - `apps/worker/src/tasks/scheduled-notifications.ts:154-172` — `createInAppNotification` then `sendEmail`, no transaction; `createInAppNotification` swallows insert errors (`:45-47`).
  - `apps/worker/src/tasks/scheduled-notifications.ts:150-152` — dedupe relies on a pre-read `alerted` set built before the loop.
  - `apps/worker/src/consumer-bullmq.ts:22-26` — `ok:false` (including a thrown send) triggers a full retry of the task.
  - `supabase/migrations/5302107` — the unique key that could make the insert idempotent is not written by this path.
- What is happening: If the in-app insert succeeds but the email send fails, the task returns non-`ok` in some branches and BullMQ retries the whole task; on retry the insert can be dropped by the error-swallowing helper while the email is sent again — or, conversely, the in-app row is skipped by the dedupe read while the email is repeated. Because insert and send are separate, there is no all-or-nothing guarantee.
- Why it matters: Duplicate emails are visible to end users; the prompt explicitly requires scheduled sends to be idempotent.
- User / business impact: Duplicate reminder emails; confusing bell state.
- Security / privacy / reliability impact: Reliability.
- Recommended fix: Give the insert a deterministic `notification_key` (see NOTIF-P1-002) so a retry is a no-op insert, and only send email after a successful first insert (use the insert result / upsert to decide). Make `createInAppNotification` return a success boolean instead of swallowing errors.
- Suggested validation: Unit test — first run inserts + emails; simulate send failure; retry run inserts zero new rows and does not re-email the already-notified task.
- Owner suggestion: Implementation agent.
- Effort estimate: M
- Dependencies: NOTIF-P1-002 (shared key scheme).
- Status: open
- Endpoint / data path: BullMQ `scheduled-notifications` → `createInAppNotification` + `sendEmail`
- Attack path: none identified

### Finding ID: NOTIF-P2-005 - Sensitive ticket content is stored and emailed verbatim with no sensitivity filter

- Severity: P2
- Confidence: High
- Area: Sensitive content / privacy
- Evidence:
  - `apps/api/src/routes/tickets.ts:361` — comment notification body embeds the first 100 chars of the comment plus the ticket title.
  - `apps/api/src/lib/notify.ts:66-72` — that body is placed into the email `text` and escaped `html` and sent to every other participant.
  - `apps/worker/src/tasks/scheduled-notifications.ts:147,167-168` — project/task names and bodies emailed verbatim.
  - `supabase/migrations/5302029` — `body`/`title` are plaintext; `retention.ts:52-60` retains them 90 days.
  - SSE is sanitized (`notifications.ts:17-27`), so the browser push path is clean, but storage/email are not.
- What is happening: Notification bodies can contain ticket titles and comment excerpts (potentially including credentials a user pasted, personal data, or security detail). They are persisted in plaintext and delivered by email to recipients who may be external to the ticket.
- Why it matters: Notification previews are a classic PII/sensitive-content leak vector; the prompt's special check requires avoiding sensitive content in previews.
- User / business impact: Possible disclosure of sensitive text to unintended recipients; reputational/compliance risk.
- Security / privacy / reliability impact: Privacy — data minimization/least-disclosure in notifications.
- Recommended fix: Add a notification-body policy: send only an abstract ("New comment on ticket #1234") plus a deep link, or run a redaction/sensitivity pass before storing/emailing. At minimum, exclude comment bodies from email and require re-authentication to view content. Consider a `sensitivity`/`redacted` flag on the row.
- Suggested validation: Test that a comment containing a secret-like string does not appear in the email body or stored notification body; assert link present instead.
- Owner suggestion: Implementation agent + privacy owner.
- Effort estimate: M
- Dependencies: Product decision on preview content; cross-ref 18/privacy and 31/search-privacy.
- Status: open
- Endpoint / data path: `POST /api/v1/tickets/:id/comments` → body slice → `notifications.body` + email
- Attack path: none identified (informational disclosure, not a compromise chain)

### Finding ID: NOTIF-P2-006 - API inline email fallback has no retry and ignores the send result

- Severity: P2
- Confidence: High
- Area: Retry / failover
- Evidence:
  - `apps/api/src/lib/notify.ts:76-80` — when `enqueueTask` returns false, `await sendEmail(emailPayload)` is called and its boolean return is discarded.
  - `apps/api/src/lib/email.ts:12-45` — single attempt, no retry/backoff, unlike `apps/worker/src/email.ts:35-59`.
  - `apps/api/src/lib/task-producer.ts:80-104` — enqueue returns false when the queue is disabled/unreachable (dev default, or a Redis outage).
- What is happening: The "fallback so the notification is never lost" comment overstates the guarantee: the fallback path itself has no retry and its failure is invisible. When Redis is unavailable, notifications that rely on the fallback are send-or-drop.
- Why it matters: The failover path is precisely the one used under degraded conditions, yet it is the least resilient.
- User / business impact: Emails dropped during a Redis/queue incident.
- Security / privacy / reliability impact: Reliability.
- Recommended fix: Route the fallback through the worker email retry logic (export a shared retry helper) or add a bounded retry; log/emit on `false`.
- Suggested validation: Mock `sendEmail` to fail twice then succeed; assert retry; assert a metric/log on terminal failure.
- Owner suggestion: Implementation agent.
- Effort estimate: S
- Dependencies: NOTIF-P1-003 (metric).
- Status: open
- Endpoint / data path: `notifyAndEmail` → `enqueueTask` false → `sendEmail` (single attempt)
- Attack path: none identified

### Finding ID: NOTIF-P3-001 - No email template system; repetitive inline HTML diverges between senders

- Severity: P3
- Confidence: High
- Area: Email templates
- Evidence:
  - `apps/api/src/lib/notify.ts:70-72` — inline `<p>…<a>` template.
  - `apps/worker/src/tasks/scheduled-notifications.ts:168,241,281` — three more inline templates.
  - `apps/api/src/routes/admin.ts:60-68` — a fifth inline template for the test email.
  - No template engine (React Email/MJML/Handlebars) present in dependencies.
- What is happening: Each sender hand-builds HTML; there is no shared layout, branding, footer, or unsubscribe link.
- Why it matters: Inconsistent branding and no place to add a compliant unsubscribe footer; duplicated escaping logic (`escapeHtml` is defined twice).
- User / business impact: Lower-quality transactional email; harder to add unsubscribe (NOTIF-P1-004 recommendation).
- Security / privacy / reliability impact: Maintainability; escaping duplication risks divergence.
- Recommended fix: Introduce one shared email-render module (e.g. React Email or a single HTML layout function) used by API and worker, with a footer and merge fields; delete the duplicated `escapeHtml`.
- Suggested validation: Snapshot tests for rendered templates; assert footer/unsubscribe present.
- Owner suggestion: Implementation agent.
- Effort estimate: M
- Dependencies: NOTIF-P1-001 (footer links to preferences).
- Status: open
- Endpoint / data path: all email-producing paths
- Attack path: none identified

### Finding ID: NOTIF-P3-002 - `sms` channel is a dead preference option; UI copy misstates enforcement

- Severity: P3
- Confidence: High
- Area: Preferences / UX consistency
- Evidence:
  - `apps/api/src/routes/notification-preferences.ts:14` — `CHANNELS = ["email","sms","in_app"]`.
  - No SMS sender anywhere (`grep sms` in `apps/**` finds only this constant and UI copy).
  - `NotificationPreferencesClient.tsx:172-175` — copy: "Changes take effect immediately."
- What is happening: The API advertises an `sms` channel with no implementation, and the UI promises an effect that does not occur (see NOTIF-P1-001).
- Why it matters: Misleading controls erode trust and complicate future consent work.
- User / business impact: Confusing settings; false expectation.
- Security / privacy / reliability impact: UX/consent clarity.
- Recommended fix: Remove `sms` from `CHANNELS` until a sender exists, or gate it behind a feature flag; correct the UI copy to match enforced behaviour once NOTIF-P1-001 lands.
- Suggested validation: API test asserting the advertised channels equal the implemented set; UI copy test.
- Owner suggestion: Implementation agent (frontend + API).
- Effort estimate: S
- Dependencies: NOTIF-P1-001.
- Status: open
- Endpoint / data path: `GET /api/v1/notification-preferences`
- Attack path: none identified

### Finding ID: NOTIF-P3-003 - SSE polling fallback interval is not cleared on unmount

- Severity: P3
- Confidence: Medium
- Area: Client reliability
- Evidence:
  - `apps/web/components/NotificationBell.tsx:108-113` — `es.onerror` creates `setInterval(fetchUnread, 30000)` and returns a cleanup function that React does not use (the return value of an event handler is discarded).
  - `apps/web/components/NotificationBell.tsx:115-118` — the effect cleanup closes the EventSource but does not clear that interval.
- What is happening: If SSE fails, a 30s interval is started; on unmount it is not cleared, so polling continues for the life of the page and can stack on repeated error cycles.
- Why it matters: Minor resource leak; a stale interval keeps hitting `/unread-count`.
- User / business impact: Negligible-visual; extra background requests.
- Security / privacy / reliability impact: Reliability/performance.
- Recommended fix: Track the fallback interval in a ref and clear it in the effect cleanup (and before creating a new one).
- Suggested validation: Component test asserting `clearInterval` is called on unmount after an SSE error.
- Owner suggestion: Implementation agent (frontend).
- Effort estimate: S
- Dependencies: None.
- Status: open
- Endpoint / data path: client → `GET /api/v1/notifications/unread-count`
- Attack path: none identified

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| --- | --- | --- | --- | --- | --- |
| Preferences/consent never enforced | P1 | High | High | `notify.ts`, `notification-preferences.ts` only reader | Enforce in send paths (NOTIF-P1-001) |
| API notifications bypass dedup index | P1 | Medium | Medium | `notify.ts:31-39` no `notification_key` | Set key/upsert (NOTIF-P1-002) |
| Email failure invisible (no metric/alert) | P1 | High | High | `email.ts` returns bool; no counters | Metric + alert (NOTIF-P1-003) |
| No push channel → missed alerts | P2 | High | Medium | No VAPID/service worker | Implement or document (NOTIF-P2-001) |
| SMTP optional → silent email outage | P2 | Medium | High | optional env keys; warn only | Required in prod (NOTIF-P2-002) |
| Worker unhandled rejection invisible | P2 | Medium | Medium | `worker/main.ts` lacks handler | Add handler (NOTIF-P2-003) |
| Non-atomic insert+send double-sends on retry | P2 | Medium | Medium | `scheduled-notifications.ts:154-172` | Keyed idempotent insert (NOTIF-P2-004) |
| Sensitive content in stored/emailed bodies | P2 | Medium | High | `tickets.ts:361`, `notify.ts:66-72` | Redact/abstract (NOTIF-P2-005) |
| Inline fallback drops email under Redis outage | P2 | Medium | Medium | `notify.ts:76-80` | Shared retry (NOTIF-P2-006) |

## Recommendations

### Immediate / Release Blocking

1. Enforce notification preferences before every send (NOTIF-P1-001). This is a false-consent control and the prompt's explicit special check.
2. Set `notification_key` (deterministic, upsert) in `createNotification` and the scan inserts so the unique index actually protects all producers (NOTIF-P1-002, NOTIF-P2-004).
3. Decide and enforce SMTP requirement in production (NOTIF-P2-002) — config gate or deploy gate.

### This Week

4. Add notification/email delivery metrics and a failure alert; emit on the API inline fallback (NOTIF-P1-003, NOTIF-P2-006).
5. Add the worker `unhandledRejection` handler (NOTIF-P2-003) — coordinate with 13/RES-P2-001 to avoid duplicate PRs.
6. Add a notification-body policy (abstract or redact comment/ticket content before store/email) (NOTIF-P2-005).

### This Month

7. Implement or explicitly de-scope Web Push + VAPID (NOTIF-P2-001).
8. Add a global "pause all" opt-out and a one-click unsubscribe token in emails (NOTIF-008; ties to NOTIF-P3-001 footer).
9. Introduce a shared email template with footer/branding and remove duplicated `escapeHtml` (NOTIF-P3-001).
10. Fix the preferences UI copy and remove the dead `sms` channel (NOTIF-P3-002).

### Later / Platform Evolution

11. Deliver an end-to-end notification delivery assertion (test send → provider receipt where available) and a dead-man notification for the email path (prompt extended check).
12. Add per-recipient send throttling/rate limits on notification producers (NOTIF-012).
13. Decompose notification logic from the API as suggested in `docs/MASTER_SYSTEM_ARCHITECTURE_REVIEW.md:150` (long-term).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --- | --- | --- | --- |
| Set `notification_key` in `createNotification` | Activates the existing unique index on the busiest path | `apps/api/src/lib/notify.ts` | Two identical calls → one row |
| Add worker `unhandledRejection` handler | Matches API policy; captures stray rejections | `apps/worker/src/main.ts` | Rejected-promise unit test |
| Log/emit on inline `sendEmail` false | Removes a silent-drop blind spot | `apps/api/src/lib/notify.ts` | Mocked failure increments metric/log |
| Clear SSE fallback interval | Stops a client leak | `apps/web/components/NotificationBell.tsx` | Component test asserts clearInterval |
| Correct preferences UI copy | Removes a false promise | `NotificationPreferencesClient.tsx` | Copy assertion test |
| Remove `sms` from advertised channels | Removes dead config | `apps/api/src/routes/notification-preferences.ts` | API test asserts channel set |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| --- | --- | --- | --- | --- |
| Enforce preferences/consent in all send paths | P1 | Implementation agent | M | None |
| Deterministic dedup key across all producers | P1 | Implementation agent | S | `5302107` |
| Email/notification delivery metric + alert | P1 | Platform engineer | M | 14/observability |
| Require SMTP in production | P2 | Implementation agent | S | 38/SECRET-P1-002, 12 |
| Worker `unhandledRejection` handler | P2 | Implementation agent | S | 13/RES-P2-001 |
| Idempotent insert-then-send for reminders | P2 | Implementation agent | M | NOTIF-P1-002 |
| Notification body redaction/abstraction | P2 | Implementation agent + privacy | M | 18/privacy |
| Shared retry for API inline email | P2 | Implementation agent | S | NOTIF-P1-003 |
| Web Push + VAPID (or de-scope) | P2 | Platform engineer | L | New migration |
| Global opt-out + unsubscribe link | P2 | Implementation agent | M | NOTIF-P1-001 |
| Shared email template + footer | P3 | Implementation agent | M | NOTIF-P1-001 |
| Per-recipient send throttle | P2 | Implementation agent | S | `rate-limit.ts` |
| SSE fallback interval cleanup | P3 | Frontend agent | S | None |

## Suggested Tests

- **Unit (API):** `createNotification` sets `notification_key`; two identical calls produce one row. `notifyAndEmail` with a disabled email preference enqueues nothing. Inline `sendEmail` failure is surfaced (metric/log).
- **Unit (worker):** `scheduled-notifications` `task-due` run twice → one in-app row and one email (mock `sendEmail`). `recentlyNotified` returns true within the window and false outside. `notification-email` returns `ok:false` on send failure and `ok:true` on success.
- **Unit (email):** `sendEmail` with `SMTP_HOST` unset returns false without throwing; transient failure retries then gives up and returns false; counter increments.
- **Integration (API):** `PUT /api/v1/notification-preferences` disabling a module email, then a ticket comment → assert no email job and (for in_app disable) no row. `POST /api/v1/notifications` dedup returns the existing row (already partially covered).
- **Integration (worker):** BullMQ job with `attempts:3` for a failing email asserts 3 executions and a terminal failure signal; scan lock prevents concurrent `scheduled-notifications` runs.
- **E2E (web):** SSE payload contains no `body`; revoked/expired JWT ends the stream (`auth_expired`); polling fallback interval cleared on unmount.
- **CI:** grep guard that `apps/api/src/lib/notify.ts` references a preferences resolver (or that no `notifications.insert` exists without `notification_key`); env test that production without SMTP fails.
- **Security/privacy:** comment containing a secret-like token is not present in stored body/email; notification preview excludes sensitive fields.
- **Regression:** previous NOTIF findings — no full body over SSE (now passes); dedup on admin endpoint; reminder job scheduled.
- **Manual validation:** admin "Send Test Email" with SMTP configured and unconfigured; observe metric/log and user-facing behaviour.

## Suggested Documentation Updates

- `docs/GAP_ANALYSIS.md` — mark notification preference enforcement status accurately; record push de-scope or plan.
- New `docs/features/notifications.md` — data model, channels, dedup key scheme, preference semantics, unsubscribe policy, retention.
- `docs/MONITORING_AND_ALERTING.md` — add `notification_delivery_total` + email-failure alert and how to verify delivery.
- `docs/TROUBLESHOOTING.md` — "email not sending" section (SMTP unset, queue backend inline, preferences disabled).
- `docs/ENVIRONMENT_VARIABLES.md` — clarify SMTP requirement in production and any new VAPID keys.
- `AGENTS.md` — correct worker consumer description (currently says SQS-based) and document notification channels.
- `docs/SECRETS_ROTATION.md` — add any new push/SMTP keys introduced (cross-ref 38).

## Open Questions

| Question | Why it matters | Evidence needed |
| --- | --- | --- |
| Is a transactional email provider intended instead of raw SMTP? | Affects retry/bounce/observability design | Product/eng decision record |
| Is Web Push in scope for this product? | Determines whether NOTIF-P2-001 is a gap or a non-goal | Roadmap/doc |
| Should comment bodies be excluded from email entirely? | Direct privacy exposure decision | Privacy sign-off |
| What is the expected default when no preference row exists (opt-in vs opt-out)? | Determines consent semantics for NOTIF-P1-001 | Product decision |
| Is the `sms` channel planned? | Whether to keep or remove the constant | Roadmap |
| Who owns notification delivery alerting? | Needed to action NOTIF-P1-003 | Ops owner |

## Appendix

### Notification channel inventory

| Channel | Mechanism | Status | Configuration | Notes |
| --- | --- | --- | --- | --- |
| In-app (SSE) | Supabase Realtime `postgres_changes` | Complete | `notifications` RLS; 5-min JWT recheck | Sanitized payload (no body) |
| In-app (polling) | 30s `unreadCount` poll | Complete | `NotificationBell.tsx` | Fallback on SSE error; interval leak |
| Email | SMTP via worker/API | Partial | `SMTP_*` optional | Worker retries; API fallback no retry; no templates |
| Push (Web Push) | — | Absent | None | No VAPID/service worker |
| SMS | — | Absent | `sms` advertised in prefs API only | No sender |

### Preference review

| Aspect | Current | Recommended |
| --- | --- | --- |
| Per-module/channel toggles | Yes (email/in_app stored) | Keep, and enforce |
| Enforcement on send | None | Enforce in `createNotification`/`notifyAndEmail` |
| Global opt-out | Absent | Add "pause all" |
| Unsubscribe link | Absent | Add to email footer |
| Digest mode | Absent | Consider |
| Dead channel | `sms` advertised | Remove or implement |
| UI copy accuracy | "takes effect immediately" (false) | Correct |

### Delivery reliability review

| Component | Reliable? | Gaps |
| --- | --- | --- |
| SSE stream | Yes | Reconnect backfill/ack; client interval cleanup |
| Polling | Yes | — |
| Worker email | Mostly | No metric/alert; not end-to-end verified |
| API inline email | Weak | No retry; result ignored |
| Queued email | Yes | Terminal failure not persisted |
| Push | n/a | Not implemented |

### Cross-references (no duplication)

- **13 (RES-*):** RES-P2-001 worker `unhandledRejection` (verified independently here as NOTIF-P2-003); RES-P2-002 generic task DLQ (relates to NOTIF-P1-003 failure persistence); RES-P2-005 in-stack alerting (relates to email-failure alerting).
- **38 (SECRET-*):** SECRET-P1-002 deploy writer omits schema keys (relates to NOTIF-P2-002 SMTP requirement); SECRET-P2-002 no rotation *reminder workflow* (distinct from notification reminder jobs — verified); SECRET-P3-001 worker `.env.example` omits `APP_BASE_URL` (affects notification links).
- **08 (API-*):** notification SSE/list contract surface; rate-limit coverage.
- **27 (WH-*):** webhook replay dedupe patterns referenced for notification dedup consistency.

### Key symbols cited

- `createNotification`, `notifyAndEmail`, `escapeHtml` — `apps/api/src/lib/notify.ts`
- `sanitizeNotification`, `GET /stream`, `POST /`, `POST /mark-all-read` — `apps/api/src/routes/notifications.ts`
- `scheduledNotifications`, `recentlyNotified`, `createInAppNotification` — `apps/worker/src/tasks/scheduled-notifications.ts`
- `sendEmail` — `apps/api/src/lib/email.ts`, `apps/worker/src/email.ts`
- `notificationEmail` — `apps/worker/src/tasks/notification-email.ts`
- `scheduledScans` (`scheduled-notifications`) — `apps/worker/src/schedule-config.ts`
- `MODULES`, `CHANNELS` — `apps/api/src/routes/notification-preferences.ts`
- `idx_notifications_key`, `notification_key` — `supabase/migrations/5302107_notification_dedup_and_indexes.sql`

### Verification ledger (supported / partially supported / unsupported / not reproducible)

| Item | Outcome |
| --- | --- |
| Scheduled-notifications job scheduled (sibling 13) | supported |
| Worker lacks `unhandledRejection` (sibling 13) | supported |
| Rotation/reminder workflow absent (sibling 38) | partially supported (workflow claim holds; notification reminder *jobs* exist) |
| Prior NOTIF-P0-001 no email without SMTP | partially supported (still open, downgraded with logging) |
| Prior NOTIF-P1-001 no dedup | partially supported (index + some paths; API path bypasses) |
| Prior NOTIF-P1-002 SSE full body | supported (fixed via `sanitizeNotification`) |
| Preferences enforced before send | unsupported |
| Scheduled sends idempotent | partially supported |
| Email retry/backoff | supported (worker) / unsupported (API inline) |
| Push/VAPID implemented | unsupported (absent) |
| Delivery end-to-end verified | not reproducible (no provider in audit env) |
