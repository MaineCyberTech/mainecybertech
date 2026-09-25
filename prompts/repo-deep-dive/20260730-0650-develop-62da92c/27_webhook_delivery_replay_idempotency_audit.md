# Prompt 27 — Webhook Delivery, Replay, and Idempotency Audit

**Repo:** `mainecybertech-portal` (develop @ 62da92c)
**Date:** 2026-07-30  
**Run ID:** `20260730-0650-develop-62da92c`

---

## Evidence Inventory

### Inbound Endpoints
- **Stripe:** `POST /api/v1/webhooks/stripe` — `webhooks.ts:62-203`
  - Signature verification via `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)`
  - Handles `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`, `checkout.session.completed`
  - Upserts into `invoices`, `subscriptions`, `billing_customers` tables
  - Idempotency key: `stripe-{event.id}` (deterministic)
- **Jira:** `POST /api/v1/webhooks/jira` — `webhooks.ts:205-267`
  - Optional HMAC-SHA256 signature via `x-hub-signature` header
  - Syncs issue status to `project_tasks` via `external_jira_issue_key`
  - Idempotency key: `jira-{webhookEvent}-{issueKey}` (deterministic)
- **JSM:** `POST /api/v1/webhooks/jsm` — `webhooks.ts:269-336`
  - Optional HMAC-SHA256 signature via `x-hub-signature` header
  - Syncs issue status to `tickets` via `external_jsm_issue_key`
  - Idempotency key: `jsm-{webhookEvent}-{issueKey}` (deterministic)
- **M365:** `POST /api/v1/webhooks/m365` — `webhooks.ts:338-374`
  - Optional HMAC-SHA256 signature via `x-hub-signature` header
  - Logs event to audit_logs + webhook_deliveries
  - Idempotency key: `m365-{resource}-{changeType}` (deterministic)

### Outbound Dispatch
- `lib/webhook-dispatcher.ts:6-112` — `dispatchWebhook(event, organizationId, data)`
  - Queries active `webhook_endpoints` matching event type
  - HMAC-SHA256 signing per-endpoint secret
  - 10s timeout per delivery via AbortController
  - Idempotency key: `wh-out-{endpoint.id}-{event}-{Date.now()}` (timestamp-based — NOT deterministic)
  - Only stores idempotency key on success (line 87)
  - Updates `last_success_at` / `last_failure_at` on endpoint
  - No retry loop — single attempt per dispatch call
  - Catches all errors and logs but does not rethrow

### Signature Verification
- `lib/webhook-signature.ts` — `verifyWebhookSignature(rawBody, signature, secret)`
  - Uses `timingSafeEqual` for constant-time comparison
  - HMAC-SHA256 with hex digest
  - Stripe: SDK-level `constructEvent()` — not using this helper

### Timestamp Tolerance
- No timestamp tolerance check on any inbound handler
- Jira/JSM/M365 signatures don't include timestamps (HMAC of raw body only)
- No replay attack protection via timestamp window

### Replay Nonce
- No explicit replay nonce mechanism
- Idempotency keys serve as implicit replay protection (within 24h TTL)
- No nonce/sequence number in webhook payloads

### Idempotency Keys
- Global system: `lib/idempotency.ts:1-139`
  - Redis-backed with in-memory Map fallback
  - TTL: 24 hours
  - In-memory max: 10,000 entries with LRU eviction
  - Serialized lock via `memoryMutex` promise chain (race condition protection for in-memory mode)
  - Methods: `checkIdempotencyKey`, `storeIdempotencyKey`, `deleteIdempotencyKey`
- DB-level dedup: `webhook_deliveries.idempotency_key` column with unique constraint (migration 5302053)
- Inbound: deterministic keys based on event source + event ID
- Outbound: timestamp-based key (not deterministic — retry generates different key)

### Retry Backoff
- No automated retry for inbound or outbound webhooks
- Migration 5302050 adds `retry_count`, `next_retry_at`, `dead_letter` columns to `webhook_deliveries` but no worker consumes them
- `webhook_dead_letters` table exists for manually moving failed deliveries

### Dead-Letter Queues
- `webhook_dead_letters` table with RLS policies (migration 5302050)
- Not populated by current dispatch code — no DLQ insertion logic in `webhook-dispatcher.ts`
- Manual review path only

### Secrets
- Webhook secrets stored as env vars (optional): `STRIPE_WEBHOOK_SECRET`, `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`
- Per-endpoint secrets stored in `webhook_endpoints.secret` column (plaintext in DB — not hashed)
- Secret rotation: `docs/JWT_ROTATION.md` covers JWT only, no webhook secret rotation doc

### Tenant Scoping
- Stripe webhook: queries `billing_customers` by `stripe_customer_id` to resolve organization
- Jira/JSM webhooks: scoped by `external_jira_issue_key` / `external_jsm_issue_key` which contain org context indirectly
- M365 webhook: logs event without tenant scoping (audit event includes metadata)
- Outbound dispatch: scoped by `organization_id` in endpoint query

### Payload Schema/Size
- Express JSON body limit: 10MB
- No explicit payload schema validation for inbound webhooks (beyond Stripe SDK)
- Jira/JSM body parsed as raw JSON without Zod validation

### Timeouts
- Outbound dispatch: 10s per endpoint
- Inbound: no explicit timeout per handler (relies on Supabase client 30s db timeout)
- Stripe expects 200 response within ~10s for retry avoidance

### Delivery Logs
- `webhook_deliveries` table records: webhook_id, event, status, request_body, response_status, response_body, error, duration_ms, idempotency_key, retry_count, next_retry_at, dead_letter
- Admin UI at `/api/v1/webhook-endpoints/:id/deliveries` — paginated delivery history
- `recordWebhookDelivery()` at `lib/metrics.ts` — Prometheus counter for success/failure

### Admin Management
- CRUD: `/api/v1/webhook-endpoints` — `webhook-management.ts:1-307`
  - Requires admin for create/update/delete
  - Zod validation on create/update
  - Optimistic locking on update (requireIfMatch + checkVersionMatch)
  - Test endpoint: `POST /:id/test` — sends ping event, records delivery, updates failure/success timestamps

### Tests/Docs
- API webhook tests at `apps/api/src/__tests__/webhook-management.test.ts`
- No dedicated docs for webhook architecture (covered in `docs/BILLING.md` for Stripe, `docs/JIRA_JSM_INTEGRATION.md` for Jira/JSM)

---

## Webhook Inventory

| Webhook | Direction | Auth | Idempotency | Retry | DLQ | Tenant Scope |
|---|---|---|---|---|---|---|
| Stripe | Inbound | ✅ constructEvent() | ✅ Deterministic | ❌ None | ❌ Not populated | ✅ Via billing_customers |
| Jira | Inbound | ⚠️ Optional HMAC | ✅ Deterministic | ❌ None | ❌ Not populated | ✅ Via jira_issue_key |
| JSM | Inbound | ⚠️ Optional HMAC | ✅ Deterministic | ❌ None | ❌ Not populated | ✅ Via jsm_issue_key |
| M365 | Inbound | ⚠️ Optional HMAC | ✅ Deterministic | ❌ None | ❌ Not populated | ⚠️ Audit log only |
| Outbound | Outbound | ✅ HMAC per-endpoint | ⚠️ Timestamp-based | ❌ None | ❌ Manual only | ✅ Via organization_id |

---

## Findings

### WH-P0-001 — Inbound webhook signatures for Jira/JSM/M365 are optional (P0 Critical)

**Evidence:** `webhooks.ts:217-226` (Jira), `webhooks.ts:281-290` (JSM), `webhooks.ts:343-352` (M365) — signature verification is wrapped in `if (secret) { ... }`. If the env var is not configured, the webhook endpoint accepts any HTTP request without authentication.

**Risk:** An attacker who discovers the webhook URL can forge Jira/JSM/M365 events, causing unauthorized task/ticket status changes. Since rate limiting skips webhook paths, brute-force URL discovery is feasible.

**Recommendation:** Make webhook secrets required in production env. Add a startup check that logs a WARN (or fails in prod) if inbound webhook secrets are missing. Add IP allowlisting for Jira/JSM/M365 webhook sources.

---

### WH-P1-001 — No timestamp tolerance / replay window (P1 High)

**Evidence:** None of the 4 inbound webhook handlers check event timestamps. Stripe events have `event.created` but it's not validated against a clock-skew window. Jira/JSM/M365 signatures don't include timestamps in the HMAC payload.

**Risk:** Captured webhook payloads (from logs, network intercepts, or leaked delivery records) can be replayed within the 24h idempotency window. If the idempotency key scheme is bypassed or the key store is flushed, replays succeed.

**Recommendation:** Add `toleranceWindow` check (5-minute max clock skew) for Stripe webhooks using `event.created`. For Jira/JSM/M365, include timestamp in the signature payload or add a timestamp field that's validated server-side.

---

### WH-P1-002 — Outbound dispatch idempotency key is timestamp-based, not deterministic (P1 High)

**Evidence:** `webhook-dispatcher.ts:32` — `const idempotencyKey = 'wh-out-${endpoint.id}-${event}-${Date.now()}'`. Each invocation generates a unique key even for the same logical event.

**Risk:** Retries at the caller level (e.g., worker retries a task) produce different keys, allowing duplicate delivery to the downstream endpoint. The downstream endpoint receives identical payloads with different idempotency keys.

**Recommendation:** Make outbound idempotency keys deterministic by including the **logical event ID** (e.g., `audit_logs.id` or a business key) instead of `Date.now()`. Store the key before the first delivery attempt, not only on success.

---

### WH-P1-003 — No automated retry worker for failed deliveries (P1 High)

**Evidence:** Migration 5302050 adds `retry_count`, `next_retry_at`, `dead_letter` columns but no code reads them. `webhook-dispatcher.ts` has no retry loop. No BullMQ task scheduled for retry.

**Risk:** A transient network failure or downstream endpoint downtime causes permanent delivery failure. Admin must manually retry via the test endpoint.

**Recommendation:** Create a BullMQ worker task `webhook-retry` that scans `webhook_deliveries WHERE retry_count < 3 AND (next_retry_at IS NULL OR next_retry_at <= NOW())`, re-dispatches, and updates retry_count + next_retry_at with exponential backoff (30s, 2min, 10min). Move to `webhook_dead_letters` after exhaustion.

---

### WH-P1-004 — Webhook endpoint secrets stored in plaintext in DB (P1 High)

**Evidence:** `webhook-management.ts:80` — `secret: parsed.secret ?? null` stored directly in `webhook_endpoints.secret` column. No hashing/encryption.

**Risk:** A DB breach exposes all per-endpoint webhook secrets, allowing an attacker to forge outbound webhook deliveries to downstream services.

**Recommendation:** Encrypt secrets at rest using Supabase Vault (`pgsodium`) or app-level encryption (AES-256-GCM with a key encryption key from env). Secret values should only be decryptable by the webhook dispatcher service.

---

### WH-P2-001 — No payload schema validation for Jira/JSM/M365 inbound webhooks (P2 Medium)

**Evidence:** `webhooks.ts:207` — `const event = req.body;` — raw body parsed as any. No Zod schema validates the shape of incoming Jira/JSM/M365 events. Only `event.issue?.key`, `event.issue?.fields?.status?.name` are accessed via optional chaining.

**Risk:** Malformed webhook payloads may crash the handler with unexpected null access patterns. No graceful rejection of invalid payloads.

**Recommendation:** Add Zod schemas for Jira webhook payload, JSM webhook payload, and M365 webhook payload. Return 400 with validation details for malformed payloads.

---

### WH-P2-002 — webhook_dead_letters table is never populated (P2 Medium)

**Evidence:** Migration 5302050 creates `webhook_dead_letters` table with RLS policies. `webhook-dispatcher.ts` never inserts into it. The only code path is manual admin action.

**Risk:** The dead-letter infrastructure is fully plumbed (table, RLS, index) but dead code. Failed deliveries are only visible via webhook_deliveries rows with dead_letter = false.

**Recommendation:** Wire `webhook-dispatcher.ts` to insert into `webhook_dead_letters` when retry_count exceeds threshold. Create an admin endpoint to list and re-process dead letters.

---

### WH-P3-001 — No webhook log retention policy (P3 Low)

**Evidence:** `webhook_deliveries` table has no archival or cleanup logic. Delivery logs accumulate indefinitely.

**Risk:** Storage growth over time. Production delivers thousands of Stripe events monthly which accumulate in the deliveries table.

**Recommendation:** Add a retention policy: delete deliveries older than 90 days (or move to cold storage). Add `created_at` index (already partially covered).

---

## Retry/DLQ Review

| Component | Status | Gap |
|---|---|---|
| retry_count column | ✅ Present | Not incremented by dispatcher |
| next_retry_at column | ✅ Present | Never set by dispatcher |
| dead_letter boolean | ✅ Present | Never set to true |
| webhook_dead_letters table | ✅ Present | Never populated |
| Retry worker | ❌ Absent | No BullMQ consumer |
| Exponential backoff | ❌ Absent | No schedule defined |

---

## Summary

| Severity | Count | Key Areas |
|---|---|---|
| P0 (Critical) | 1 | Optional webhook signatures for Jira/JSM/M365 |
| P1 (High) | 4 | No replay protection, non-deterministic outbound keys, no retry worker, plaintext secrets |
| P2 (Medium) | 2 | No payload validation, dead-letter table unused |
| P3 (Low) | 1 | No retention policy |
| **Total** | **8** | |

Strengths: Stripe webhook has proper SDK-level signature verification, deterministic idempotency keys for all inbound handlers, comprehensive delivery logging, admin management CRUD with optimistic locking, and Redis/fallback idempotency storage. The infrastructure for retry/DLQ is fully plumbed but not wired into active code paths.
