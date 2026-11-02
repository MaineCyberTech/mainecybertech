# Webhook Delivery, Replay, and Idempotency — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261011-0426-full-main-8d299b8`)
- Area code: WH
- Scope limitations: static verification; no live webhook traffic. `promtool` rule tests were executed (pass); jest worker/API suites were not run (no `node_modules`).

## Scope

Re-verified all 23 previous WH findings at `7dd0402` (outbound dispatch/idempotency, inbound provider auth, DLQ/retry, retention, docs) and traced the idempotency TTL mechanics end-to-end.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `apps/api/src/lib/webhook-dispatcher.ts`, `apps/worker/src/tasks/{webhook-dispatcher,webhook-retry}.ts` | Read | Atomic claims, leases, upserts, retry ownership |
| `apps/api/src/routes/{webhooks,webhook-management}.ts` | Read | Provider auth, dedup TTLs, DLQ replay |
| `apps/api/src/lib/idempotency.ts` | Read | `IDEMPOTENCY_TTL_SECONDS` (24h) reset path |
| `apps/api/src/middleware/webhook-body.ts`, `lib/webhook-schemas.ts` | Read | Caps + shapes |
| `supabase/migrations/5302053/5302441/5302452/5302454` | Read | Unique key, secret metadata, DELETE policy, retention indexes |
| `infra/digitalocean/prometheus.rules.yml` + rule tests | Executed via promtool | DLQ + reconciliation alerts validated |

## Executive Summary

22 of 23 previous findings are verified fixed — the outbound dispatcher now claims atomically at both layers, provider ingress is authenticated and capped, the DLQ is replayable and claimed, and retention purges are bounded and indexed. One P2 remains partially fixed with a precise, still-live defect: the M365 7-day replay claim is immediately re-stored with the shared 24-hour TTL by `logWebhookDelivery`, so the effective replay window is 24h. Re-verification also surfaced a related new P3: once that window (or any dedup window) lapses, a provider redelivery collides with the unique `webhook_deliveries.idempotency_key` and returns a permanent 500 because the 23505 conflict is not handled on the inbound log path.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| WH-P1-001 | P1 | verified-fixed | Outbound idempotency non-atomic / absent in worker | Atomic claims + `Idempotency-Key` on both dispatchers; delivery upsert |
| WH-P1-002 | P1 | verified-fixed | M365 auth depends on unwritten `M365_CLIENT_STATE` | Written by `deploy-do.yml`/compose; dead `M365_WEBHOOK_SECRET` removed; 501 when unset |
| WH-P2-001 | P2 | partially-fixed | M365 no enforced replay window | 7-day claim (`webhooks.ts:37,925`) overwritten to 24h by `storeIdempotencyKey` (`idempotency.ts:50,142-145`) via `logWebhookDelivery:91` |
| WH-P2-002 | P2 | verified-fixed | Inline dispatcher fixed retry_count / duplicated retry | Actual attempts + dead_letter flag; single retry owner |
| WH-P2-003 | P2 | verified-fixed | Delivery/DLQ outcomes unmetered | `recordWebhookDelivery`/`recordWebhookDeadLetter` wired |
| WH-P2-004 | P2 | verified-fixed | Jira/JSM signature falls back to re-serialized JSON | `rawBodyBuffer` fails closed when absent |
| WH-P2-005 | P2 | verified-fixed | `webhook_dead_letters` no DELETE policy | `5302452` manage-scoped DELETE + assertion |
| WH-P2-006 | P2 | verified-fixed | No per-provider payload cap/schema | `webhook-body.ts` caps + `webhook-schemas.ts` shapes |
| WH-P2-007 | P2 | verified-fixed | Webhook reads not manage-gated | `webhooks:view` gates on reads |
| WH-P2-008 | P2 | verified-fixed | Signing secrets plaintext, no rotation | `5302441` + decrypt-fail-closed dispatch |
| WH-P2-009 | P2 | verified-fixed | SSRF DNS-rebinding TOCTOU | `pinnedFetch` on all four outbound call sites |
| WH-P2-010 | P2 | verified-fixed | No DLQ/reconciliation alerting | Rules `:219-253`, `:348-367` + unit tests pass |
| WH-P2-011 | P2 | verified-fixed | DLQ retry of inline failures no-ops | Refuses summary-only rows with 409, keeps the row |
| WH-P2-012 | P2 | verified-fixed | `webhook-retry` no row claim | Atomic lease claim before send |
| WH-P3-001 | P3 | verified-fixed | Test endpoint random key, no dedup | Deterministic key + claim + upsert |
| WH-P3-002 | P3 | verified-fixed | No event catalog | `docs/WEBHOOKS.md` + catalog CI test |
| WH-P3-003 | P3 | verified-fixed | Worker dispatcher no idempotency key | Key derived/carried through the queue |
| WH-P3-004 | P3 | verified-fixed | Raw body typed string, consumed Buffer | `captureRawBody` stores Buffer; Stripe verifies bytes |
| WH-P3-005 | P3 | verified-fixed | Retried deliveries drop envelope timestamp | Persisted body replayed verbatim |
| WH-P3-006 | P3 | verified-fixed | Delivery inserts ignore conflicts | Upsert on `idempotency_key` |
| WH-P3-007 | P3 | verified-fixed | Outbound response bodies unbounded | `MAX_RESPONSE_BYTES = 64KiB` in pinned-fetch |
| WH-P3-008 | P3 | verified-fixed | M365 batch processes only `value[0]` | Full batch loop with per-notification dedup/audit |
| WH-P3-009 | P3 | verified-fixed | No retention for delivery/DLQ tables | Bounded purges + `5302454` indexes |
| WH-P3-010 | P3 | open (new) | Redelivery after the dedup TTL 500s permanently | Unique `idempotency_key` + unhandled 23505 in `logWebhookDelivery` |

## New finding detail

### WH-P3-010 — Provider redelivery after the dedup TTL fails permanently with 500

- Evidence: `apps/api/src/routes/webhooks.ts:64-92` (`logWebhookDelivery` throws `AppError("DB_ERROR")` on any insert error), `supabase/migrations/5302053_webhook_idempotency.sql:14-25` (unique constraint on `webhook_deliveries.idempotency_key`), `apps/api/src/lib/idempotency.ts:50` (24h default TTL), `retention.ts` (delivery rows live 90 days). Contrast: `webhook-management.ts:266-270` explicitly handles `23505` for DLQ replays.
- Impact: a Stripe dashboard redelivery or Graph replay of an already-processed event that arrives after the dedup TTL claims fresh, then fails the delivery-row insert forever (claim released on each retry) — the provider sees persistent 500s and the event is never re-acknowledged. Reliability/operator impact; not a confidentiality issue.
- Fix: treat `23505` in `logWebhookDelivery` as “already processed” (return success and re-store the claim), or make the dedup claim TTL ≥ the delivery-row retention.
- Validation: unit test that a second `logWebhookDelivery` for the same key returns success (no throw).

## Recommendations

1. **Make the M365 (and provider) replay window real (WH-P2-001 + WH-P3-010)** — add a TTL parameter to `storeIdempotencyKey` and re-store with the same TTL, or stop re-storing on the delivery-log path; handle `23505` as an idempotent success.
2. **Document the replay windows** in `docs/WEBHOOKS.md` per provider (M365 7d, Stripe/Jira/JSM 24h) and add a test asserting the effective TTL.
3. Keep the per-provider caps/schemas current when adding providers.

## Suggested tests

- API: `logWebhookDelivery` duplicate-key test (23505 → 2xx), M365 duplicate after simulated TTL expiry.
- Worker: retry lease concurrency test (already present) extended with a crash-recovery case.
- Contract: `docs/WEBHOOKS.md` catalog parity (already in CI).

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Should the delivery log outlive the dedup claim? | Determines the right fix (TTL vs conflict handling) | Owner decision on replay semantics |
| Do operators use Stripe dashboard redelivery? | Likelihood of WH-P3-010 | Ops runbook / incident history |
