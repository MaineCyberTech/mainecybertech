# Webhook Delivery, Replay and Idempotency — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: WH
- Scope limitations: read-only static review; no live provider traffic, no hosted Redis/Postgres replay. Prometheus rules were validated with `promtool` in Docker.

## Scope

Re-verified all 24 previous WH findings at `6b7aa1a`: inbound Stripe/Jira/JSM/M365 authentication, raw-body handling, per-provider size/schema gates, replay windows, outbound dispatcher claims, retry/lease behaviour, DLQ and test endpoints, secret encryption/rotation metadata, SSRF, retention, alerting and event documentation.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `promtool check rules` / `test rules` (`prom/prometheus:v3.5.1`) | Executed | 26 rules SUCCESS; rule tests SUCCESS |
| `apps/api/src/routes/webhooks.ts` | Read | 7-day M365 claim + `logWebhookDelivery` TTL and 23505 handling |
| `apps/api/src/lib/{webhook-dispatcher,idempotency,pinned-fetch,webhook-signature}.ts` | Read | Atomic claims, TTL helper, signed fetch, raw-body fail-closed |
| `apps/api/src/routes/webhook-management.ts` | Read | Manage/view gates, test dedup, DLQ 409, secret metadata |
| `apps/worker/src/tasks/{webhook-dispatcher,webhook-retry}.ts` | Read | Worker claims, lease, replay body, decrypt-before-sign |
| `supabase/migrations/{5302441,5302452,5302454}` | Read | Secret metadata, DLQ DELETE policy, retention indexes |
| `docs/WEBHOOKS.md`, `apps/api/src/__tests__/webhook-event-catalog.test.ts` | Read | Committed event catalog and parity test |

## Executive Summary

All 24 previous WH findings are **verified fixed** at this commit. The two residuals that were still open at `7dd0402` closed in this diff:

1. **WH-P2-001** — the M365 7-day idempotency claim was previously re-stored with the shared 24-hour TTL by `logWebhookDelivery`. The function now accepts a caller TTL, stores the completion marker for the same 7 days as the claim, and M365 passes `M365_REPLAY_WINDOW_SECONDS` explicitly.
2. **WH-P3-010** — a provider redelivery after the dedup window used to hit the unique `webhook_deliveries.idempotency_key` and return a permanent 500. `logWebhookDelivery` now detects SQLSTATE 23505 and returns `duplicate`, which the handlers acknowledge with 200.

No new WH findings were identified. Alert delivery itself remains unexercised and is tracked under `OBS-P2-014`/`NOTIF-P2-011`; webhook secret rotation is encrypted/recorded but remains operator-advisory, as documented in `5302441`.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| WH-P1-001 | P1 | verified-fixed | Non-atomic outbound idempotency | `lib/webhook-dispatcher.ts:203-206`; worker `:111-127` |
| WH-P1-002 | P1 | verified-fixed | M365_CLIENT_STATE undeployed / dead secret | `deploy-do.yml:688,787`; `compose:111`; 501 when unset |
| WH-P2-001 | P2 | verified-fixed | M365 replay window overwritten to 24h | `webhooks.ts:37,944,957-968`; TTL-aware `storeIdempotencyKey` |
| WH-P2-002 | P2 | verified-fixed | Fixed `retry_count` in inline dispatcher | `lib/webhook-dispatcher.ts:272-290` records `result.attempts` |
| WH-P2-003 | P2 | verified-fixed | Outbound/DLQ outcomes unmetered | Metrics on API/worker/retry paths; rules `:219-253` |
| WH-P2-004 | P2 | verified-fixed | Jira/JSM signature re-serialized fallback | `webhook-body.ts:41-50`; fail-closed `:680-689,788-797` |
| WH-P2-005 | P2 | verified-fixed | webhook_dead_letters no DELETE policy | `5302452:23-36` + assertion |
| WH-P2-006 | P2 | verified-fixed | No per-provider schema/size cap | `webhook-body.ts:20-40,62-80`; `webhook-schemas.ts` |
| WH-P2-007 | P2 | verified-fixed | Reads not manage-gated | `webhooks:view` on reads, `manage` on writes |
| WH-P2-008 | P2 | verified-fixed | Plaintext secret / no rotation metadata | Encrypt at rest, masked reads, 90-day expiry metadata, decrypt-before-sign |
| WH-P2-009 | P2 | verified-fixed | DNS-rebinding TOCTOU | `pinnedFetch` on all six call sites |
| WH-P2-010 | P2 | verified-fixed | No DLQ/payment alerts | `prometheus.rules.yml:219-253,348-367`; promtool SUCCESS |
| WH-P2-011 | P2 | verified-fixed | DLQ retry no-ops and deletes row | 409 on summary-only payload; row kept |
| WH-P2-012 | P2 | verified-fixed | Retry runs double-send | Exact-match claim + 5-minute lease `webhook-retry.ts:12-45` |
| WH-P3-001 | P3 | verified-fixed | Test ping random key | Deterministic key + atomic claim `:556-568` |
| WH-P3-002 | P3 | verified-fixed | No event catalog/docs | `docs/WEBHOOKS.md`; parity test |
| WH-P3-003 | P3 | verified-fixed | Worker dispatcher no key | `worker/tasks/webhook-dispatcher.ts:47-64,104-127` |
| WH-P3-004 | P3 | verified-fixed | Raw body string vs Buffer | Buffer capture; Stripe verifies bytes |
| WH-P3-005 | P3 | verified-fixed | Retry body drift | Persisted `request_body` replayed verbatim |
| WH-P3-006 | P3 | verified-fixed | Lost delivery record on conflict | Upsert on `idempotency_key` |
| WH-P3-007 | P3 | verified-fixed | Unbounded response body | 64KiB cap in `pinned-fetch.ts` |
| WH-P3-008 | P3 | verified-fixed | M365 only `value[0]` | Loop over all notifications |
| WH-P3-009 | P3 | verified-fixed | No webhook retention | 90d/180d bounded purges + indexes |
| WH-P3-010 | P3 | verified-fixed | Redelivery after TTL 500s | 23505 -> duplicate -> 200 |

Counts: 24 verified-fixed, 0 partially-fixed, 0 regressed, 0 new.

## Key fixes verified in this diff

### WH-P2-001 — M365 replay window

`routes/webhooks.ts:944` claims `m365Key` for `M365_REPLAY_WINDOW_SECONDS` (7 days). After processing, `logWebhookDelivery(..., M365_REPLAY_WINDOW_SECONDS)` (`:957-968`) stores the `done` marker with that TTL; `lib/idempotency.ts:143-158` honours the caller TTL. A redelivery inside 7 days is rejected by the claim, and a redelivery after the claim but inside the 90-day delivery-row retention now returns 200 as a duplicate instead of 500.

### WH-P3-010 — unique delivery-log collision

`logWebhookDelivery` (`routes/webhooks.ts:64-110`) catches `code === "23505"` and returns `"duplicate"`; M365 increments `duplicates` (`:969`) and the handler responds `{received:true, processed, duplicates}`. This is the same idempotent outcome the DLQ replay path already had.

## Residuals and cross-domain notes

- **Alert delivery** remains unexercised (`OBS-P2-014`/`NOTIF-P2-011`); the rules and tests are present, but no live paging run is recorded.
- **Secret rotation** is encrypted at rest and carries `secret_expires_at`, but expiry is advisory by design (`5302441` comment: enforcing it could silently drop events). Operators must rotate; there is no automated rotation job.
- **M365 after 7 days**: a captured notification older than the 7-day claim window is not distinguishable from a new one (Graph does not sign or timestamp). This is a bounded, documented residual rather than an open finding.

## Recommendations

1. Keep the 23505/duplicate test in `webhooks.test.ts` and add a replay-after-TTL case for M365.
2. Surface `secret_expires_at` in the admin webhook list/alert when it is in the past; rotation is currently invisible to operators.
3. Exercise one real DLQ alert end-to-end and link it in the observability evidence.

## Suggested tests

- M365: deliver the same notification at t+6d (duplicate) and t+8d (200 duplicate, no 500).
- Signature: Jira/JSM with `req.rawBody` absent -> 401.
- Retry: two concurrent `webhook-retry` runs -> one send.
- Secret: rotate -> old secret still verifies during the overlap window; unreadable secret -> dead-letter, never unsigned.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which provider redelivery windows are contractually expected? | Sets the TTL for Stripe/Jira/JSM claims | Provider docs / support agreement |
| Is advisory secret expiry acceptable? | Rotation can silently lapse | Security owner sign-off |
| Has any DLQ alert fired in a real environment? | Alert delivery is unproven | Alertmanager/run URL |
