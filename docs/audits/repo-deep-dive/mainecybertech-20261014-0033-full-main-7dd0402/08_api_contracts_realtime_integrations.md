# 08_api_contracts_realtime_integrations — Prompt 08 - API Contracts, Realtime, and Integrations Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `08_api_contracts_realtime_integrations.md` (area API, prompt)

## Verification Performed

Read-only re-verification at `7dd0402`; no live API calls. 10 of 14 previous API rows verified fixed, 4 partially fixed, 0 regressed, 1 new P3. Executed: `node scripts/openapi-audit.js` (453 live routes vs 695 spec entries, 0 MISSING, exit 0). Key code: `middleware/{rate-limit,idempotency,request-timeout,request-id}.ts`; `packages/sdk/src/client.ts:213-220,337-341`; `routes/{search,docs,admin,webhooks,dynamic-client-forms-builder}.ts`; `worker/tasks/{jira-sync,jsm-sync,stripe-reconcile,m365-calendar-sync}.ts`. Residuals: unguarded mutation routes in projects/assets/findings (API-P2-001), `jira-sync.ts:206` still returns ok:true with counted errors (API-P2-002), non-enveloped 429/408/idempotency responses vs docs (API-P3-001), OpenAPI not commit-bound + EXTRA warnings (API-P3-002). New: API-P3-008 (`/dynamic-forms/export.csv` returns JSON).

## Findings

| ID | Severity | Title |
|---|---|---|
| API-P2-001 | P2 | Mutations remain unguarded by `requirePermission` in several routers (including a governance state transition) |
| API-P2-002 | P2 | External integration syncs report success while dropping items, and `jsm-sync` has no HTTP retry |
| API-P2-003 | P2 | Published error-handling contract contradicts the implementation (codes, 422, and `request_id`) |
| API-P2-004 | P2 | SDK retries unsafe requests without an `Idempotency-Key` (duplicate creates on transient failure) |
| API-P2-005 | P2 | Outbound webhook dispatcher uses a non-atomic idempotency check (duplicate deliveries under concurrency) |
| API-P2-006 | P2 | Search falls through to an unscoped cross-tenant query |
| API-P2-007 | P2 | OpenAPI schema is public and the Swagger UI is blocked by CSP |
| API-P3-001 | P3 | Minor contract inconsistencies (`rateLimitByUser` non-enveloped 429, capped raw-array lists, no `request_id`) |
| API-P3-002 | P3 | OpenAPI artifact is not bound to a commit and the CI audit warns (not fails) on documented-but-missing routes |
| API-P3-003 | P3 | Realtime client has no reconnect path; server emits `auth_expired` with no documented client handling |
| API-P3-004 | P3 | `/metrics` is fully public when `METRICS_TOKEN` is unset |
| API-P3-005 | P3 | Batch Jira/JSM/M365 sync tasks are registered but never dispatched (no scheduler or enqueue path) |
| API-P3-006 | P3 | M365 calendar sync recreates a calendar event for every task on each run (duplicate events, no idempotency) |
| API-P3-007 | P3 | M365 inbound webhook acknowledges but only processes the first notification of a batch |
| API-P3-008 | P3 | GET /dynamic-forms/export.csv ignores format and returns JSON, contradicting the OpenAPI contract |
