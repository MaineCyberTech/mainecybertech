# Webhook Delivery, Replay, and Idempotency Audit — Verification Run

## Audit Metadata

- **Run ID:** 20260729-0025-develop-bc76370
- **Previous Run:** 20260728-0142-develop-21a10d6
- **Finding Area Code:** WH
- **18 commits between runs** — key remediation:
  - 7227365 — Implement outbound webhook dispatcher
  - dfb5ef8 — Resolve critical audit findings

## Executive Summary

**Previous Score: 4/10** → **Current Score: 6.5/10** (+2.5)

Three critical findings (WH-01, WH-02, WH-03) fully resolved. The outbound webhook dispatcher now exists, the test endpoint uses HttpClient with proper HMAC signing. Remaining High/Medium findings about idempotency, retry logic, and metric instrumentation are still open.

## Finding Resolution Status

### Critical Findings

| ID    | Description                                       | Severity | Status       | Evidence                                                                                                                                                                                                                                       |
| ----- | ------------------------------------------------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WH-01 | No automated outbound webhook dispatcher          | CRITICAL | **RESOLVED** | pps/worker/src/tasks/webhook-dispatcher.ts (123 lines) — queries active endpoints by event type, sends POST with HMAC-SHA256 signature, logs delivery, updates endpoint status. Registered as "webhook-dispatcher" in ask-registry.ts line 32. |
| WH-02 | Test endpoint uses raw fetch() without HttpClient | CRITICAL | **RESOLVED** | webhook-management.ts:230 now uses httpClients.default.post(webhook.url, payload, { headers }) instead of raw etch().                                                                                                                          |
| WH-03 | Test endpoint sends secret in plaintext           | CRITICAL | **RESOLVED** | webhook-management.ts:217-220 now computes proper HMAC-SHA256 signature: crypto.createHmac("sha256", webhook.secret).update(JSON.stringify(payload)).digest("hex") and sends as X-Webhook-Signature: sha256=....                               |

### High Findings

| ID                                         | Description                                      | Severity       | Status                                                                          | Evidence                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------- |
| WH-04                                      | Jira/JSM idempotency keys fall back to "unknown" | HIGH           | **STILL OPEN**                                                                  | webhooks.ts idempotency keys for Jira/JSM still use event.resource?.id                                                             |     | "unknown" pattern — collision risk when resource ID is missing. |
| WH-05                                      |
| ecordWebhookDelivery() metric never called | HIGH                                             | **STILL OPEN** | Metric counter function defined but not invoked by dispatcher or test endpoint. |
| WH-06                                      | Delivery log webhook_id null                     | HIGH           | **STILL OPEN**                                                                  | While webhook-dispatcher.ts:83 now correctly sets webhook_id: endpoint.id, older delivery records may have null webhook_id.        |
| WH-07                                      | No retry logic for failed webhook processing     | HIGH           | **STILL OPEN**                                                                  | webhook-dispatcher.ts logs failures but has no retry queue or exponential backoff. Schema in migration 5302050 exists but no code. |

### Medium Findings

| ID                                                                   | Description                                     | Severity | Status         | Evidence                                                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------- |
| WH-08                                                                | M365 idempotency key non-deterministic          | MEDIUM   | **STILL OPEN** | webhooks.ts M365 handler uses                                                                |
| esource which may be subscription ID — not guaranteed deterministic. |
| WH-09                                                                | Signature verification optional                 | MEDIUM   | **STILL OPEN** | Jira/JSM/M365 signature verification gated by env var presence.                              |
| WH-10                                                                | No retry/circuit breaker on outbound dispatcher | MEDIUM   | **STILL OPEN** | Dispatcher uses raw etch() with 10s AbortController timeout but no circuit breaker or retry. |
| WH-11                                                                | Test endpoint idempotency key non-deterministic | MEDIUM   | **STILL OPEN** | webhook-management.ts:240: est--- — uses Math.random() making it non-deterministic.          |

## New Findings

### WH-NEW-001: Dispatcher Uses Raw etch() Instead of HttpClient

**Severity:** LOW (mitigated by 10s timeout)
**Evidence:** webhook-dispatcher.ts:67 uses etch(endpoint.url, { ... signal: controller.signal }) instead of httpClients.default.post(). No circuit breaker, no retry, no base URL configuration.
**Recommendation:** Replace with HttpClient.post() for consistency with test endpoint and to benefit from circuit breaker/timeout infrastructure.

### WH-NEW-002: Test Endpoint Idempotency Key Non-Deterministic

**Severity:** LOW
**Evidence:** webhook-management.ts:240 generates key with Math.random() — defeats deterministic dedup purpose.
**Recommendation:** Use crypto.randomUUID() or a deterministic combination like "test--ping".

## Webhook Dispatcher Architecture

`worker task "webhook-dispatcher" triggered
  → query webhook_endpoints WHERE is_active=true AND org matches AND events CONTAINS [event]
  → for each endpoint:
    → compute HMAC-SHA256 signature from secret + body
    → POST to endpoint.url with 10s timeout (AbortController)
    → insert webhook_deliveries record
    → update webhook_endpoints.last_success_at or last_failure_at`

## Recommendations

1. Replace raw etch() with httpClients.default.post() in dispatcher (P1, 1 day)
2. Fix test endpoint idempotency key (P1, 1 hour)
3. Add retry queue for failed webhook deliveries (P2, 2 days)
4. Wire
   ecordWebhookDelivery() metric into dispatcher and test endpoint (P2, 1 day)
5. Fix Jira/JSM idempotency key fallback from "unknown" to crypto.randomUUID() (P2, 1 hour)

---

_Report generated for run 20260729-0025-develop-bc76370. Cross-referenced against previous run 20260728-0142-develop-21a10d6._
