# Webhook Delivery, Replay, and Idempotency Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** WH

## Executive Summary

**Overall: 4/10.** Strong inbound path (Stripe SDK verification, HMAC-based signatures, deterministic idempotency keys, Redis-backed dedup, audit logging). **Outbound path is critically non-functional** — the entire event dispatcher is missing. Test endpoint bypasses circuit breaker infrastructure and sends secrets in plaintext.

**12 findings** (4 Critical, 4 High, 4 Medium)

## Critical Findings

### WH-01: No Automated Outbound Webhook Dispatcher

**Evidence:** `webhook_endpoints` table, CRUD, delivery log exist. No dispatcher code found. The outbound webhook feature is non-functional.
**Recommendation:** Create worker task that queries `webhook_endpoints`, sends POST via `HttpClient`, logs to `webhook_deliveries`.

### WH-02: Test Endpoint Uses Raw `fetch()` Without HttpClient

**Evidence:** `webhook-management.ts:222` — uses raw `fetch()` instead of `HttpClient`, bypassing circuit breaker, timeout, and retry.
**Recommendation:** Replace with `HttpClient.post()`.

### WH-03: Test Endpoint Sends Secret in Plaintext

**Evidence:** `webhook-management.ts:214` — `headers["X-Webhook-Signature"] = webhook.secret` — sends the raw secret instead of computed HMAC.
**Recommendation:** Compute HMAC-SHA256 signature over the payload.

## High Findings

- **WH-04:** Jira/JSM idempotency keys fall back to `"unknown"` for missing fields — collision risk
- **WH-05:** `recordWebhookDelivery()` metric counter defined but never called
- **WH-06:** Delivery log has `webhook_id: null` — cannot correlate to endpoints
- **WH-07:** No retry logic for failed webhook processing (schema exists in 5302050, no code)

## Medium Findings

- **WH-08:** M365 idempotency key may be non-deterministic (uses `resource` which could be subscription ID)
- **WH-09:** Jira/JSM/M365 signature verification is optional (gated by env var presence)
- **WH-10:** No retry/circuit breaker on outbound dispatcher (stub)
- **WH-11:** Test endpoint doesn't check for existing idempotency keys before insertion
