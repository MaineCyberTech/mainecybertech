# 27_webhook_delivery_replay_idempotency_audit — Prompt 27 - Webhook Delivery, Replay, and Idempotency Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `27_webhook_delivery_replay_idempotency_audit.md` (area WH, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5; no live webhook traffic. All 24 previous WH findings are now verified fixed: 24/24, 0 partial, 0 regressed, 0 new. The two last residuals closed in this diff: M365 now passes its 7-day replay window to storeIdempotencyKey (WH-P2-001) and logWebhookDelivery collapses a 23505 delivery-key collision to a duplicate 200 instead of a permanent 500 (WH-P3-010). Executed: promtool check rules / test rules against infra/digitalocean/prometheus.rules.yml (26 rules SUCCESS). Key code: lib/webhook-dispatcher.ts, worker/tasks/{webhook-dispatcher,webhook-retry}.ts, routes/{webhooks,webhook-management}.ts, lib/idempotency.ts, middleware/webhook-body.ts, lib/webhook-schemas.ts; migrations 5302053/5302441/5302452/5302454. Residual outside WH: alert delivery remains unexercised (OBS-P2-014/NOTIF-P2-011); webhook signing-secret rotation remains operator-advisory.

## Findings

| ID | Severity | Title |
|---|---|---|
| WH-P1-001 | P1 | Outbound webhook idempotency is non-atomic in the API and absent in the worker dispatcher |
| WH-P1-002 | P1 | M365 webhook auth depends on `M365_CLIENT_STATE` which the deploy pipeline does not write, while `M365_WEBHOOK_SECRET` is dead config |
| WH-P2-001 | P2 | M365 inbound notifications have no enforced timestamp/replay window |
| WH-P2-002 | P2 | Inline dispatcher records a fixed `retry_count` and duplicates the worker's retry logic |
| WH-P2-003 | P2 | Outbound and DLQ delivery outcomes are not metered; only inbound success increments the counter |
| WH-P2-004 | P2 | Inbound Jira/JSM signature falls back to re-serialized JSON when `req.rawBody` is absent |
| WH-P2-005 | P2 | `webhook_dead_letters` has no DELETE policy while the API deletes via the RLS client |
| WH-P2-006 | P2 | No per-provider payload schema or size cap on webhook ingress (global 10mb JSON limit) |
| WH-P2-007 | P2 | Webhook endpoint and delivery reads are available to any org member (not manage-gated) |
| WH-P2-008 | P2 | Webhook signing secrets are stored plaintext with no rotation or expiry |
| WH-P2-009 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window |
| WH-P2-010 | P2 | No alerting when webhook dead-letters accumulate or payment reconciliation drifts |
| WH-P2-011 | P2 | Admin dead-letter retry of inline-dispatched failures no-ops and deletes the DLQ row |
| WH-P2-012 | P2 | `webhook-retry` has no row claim: concurrent retry runs can double-send deliveries |
| WH-P3-001 | P3 | Test endpoint generates a random idempotency key and never dedups |
| WH-P3-002 | P3 | No committed event catalog or webhook documentation for consumers |
| WH-P3-003 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key |
| WH-P3-004 | P3 | Webhook raw body typed as `string` but consumed as `Buffer` |
| WH-P3-005 | P3 | Retried deliveries replay a body without the envelope `timestamp` (payload drift) |
| WH-P3-006 | P3 | Delivery inserts ignore unique-key conflicts, losing the successful-attempt record |
| WH-P3-007 | P3 | Outbound webhook response bodies are read without a size cap |
| WH-P3-008 | P3 | M365 handler processes only the first notification in a batch (value[0]) |
| WH-P3-009 | P3 | No retention/cleanup for webhook_deliveries and webhook_dead_letters |
| WH-P3-010 | P3 | Provider redelivery after the dedup TTL fails permanently with 500 (unique delivery-log key not conflict-handled) |
