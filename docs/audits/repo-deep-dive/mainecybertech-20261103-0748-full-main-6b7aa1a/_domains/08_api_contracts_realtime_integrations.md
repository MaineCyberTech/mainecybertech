# API Contracts, Realtime and Integrations — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: API
- Scope limitations: read-only static review; no live API, websocket or provider calls. Jest/pnpm suites were not run (no `node_modules`). `scripts/openapi-audit.js` was executed.

## Scope

Re-verified all 15 previous API findings at `6b7aa1a`: route permission coverage, integration sync result semantics, error-envelope consistency, SDK idempotency, webhook dispatch, search scoping, OpenAPI/docs exposure, realtime reconnect, metrics auth, batch-sync enqueue paths, and the dynamic-forms export contract. New code in this diff (client-visibility filters, `sla` permission gate, proposal client decision) was reviewed for contract changes.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `node scripts/openapi-audit.js` | Executed | 455 live routes vs 697 spec entries; 0 MISSING; 242 allow-listed EXTRA; exit 0 |
| `apps/api/src/routes/{search,docs,admin,webhooks,dynamic-client-forms-builder,governance}.ts` | Read | Route contract/auth behaviour |
| `apps/api/src/middleware/{rate-limit,idempotency,request-timeout,request-id,error}.ts` | Read | Error envelope and retry semantics |
| `packages/sdk/src/client.ts`, `packages/sdk/src/dynamic-client-forms-builder{,.api}.ts` | Read | Retry/idempotency and export contract |
| `apps/worker/src/tasks/{jira-sync,jsm-sync,stripe-reconcile,m365-calendar-sync}.ts` | Read | Integration success/failure semantics |
| `apps/web/components/NotificationBell.tsx` | Read | Realtime reconnect/auth_expired handling |

## Executive Summary

Ten of fifteen prior API findings are verified fixed; five remain partial with narrow, specific residuals. The 429 envelope gap is now fixed, the OpenAPI EXTRA warnings are gated by a reviewed allowlist, and `/metrics`, the docs routes, the SDK idempotency key, the dispatcher claim and the realtime reconnect all remain fixed. The two substantive residuals are unchanged: nine project mutation routes plus the asset/finding comment routes still rely on org scoping without `requirePermission` (API-P2-001), and `jira-sync` still returns `ok: true` after counting per-item errors (API-P2-002). A smaller contract gap remains in `GET /dynamic-forms/export.csv`: it now returns CSV but still ignores `format=json`, which the SDK advertises.

The new proposal client-decision contract gap (staff-only `proposals:edit`, client roles unable to decide) is tracked cross-domain as `ADMIN-P2-010`; it is not re-scored here to avoid duplicate finding IDs.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| API-P2-001 | P2 | partially-fixed | Mutations unguarded by `requirePermission` | Residual: `projects.ts:869,934,971,1010,1039,1084,1185,1220,1252`, `assets.ts:376`, `findings.ts:478` |
| API-P2-002 | P2 | partially-fixed | Syncs report success while dropping items | `jira-sync.ts:206` still `{ok:true}` after errors at `:114-122,:184`; JSM fixed |
| API-P2-003 | P2 | verified-fixed | Error-handling contract contradicted code | `docs/API_ERROR_HANDLING.md:19-67`; request-id/400 mapping |
| API-P2-004 | P2 | verified-fixed | SDK retries unsafe requests without key | `packages/sdk/src/client.ts:213-220,337-341` |
| API-P2-005 | P2 | verified-fixed | Webhook dispatcher non-atomic claim | `lib/webhook-dispatcher.ts:203-206`; worker `:111-127` |
| API-P2-006 | P2 | verified-fixed | Search cross-tenant fallback | `routes/search.ts:95-128`; `search-portal.ts:45-66` |
| API-P2-007 | P2 | verified-fixed | Public OpenAPI + CSP-blocked UI | `routes/docs.ts:21-39` 404s in production |
| API-P3-001 | P3 | partially-fixed | 429/408/409 envelope inconsistencies | 429 fixed (`rate-limit.ts:15`); idempotency 400/409 + 408 remain bare |
| API-P3-002 | P3 | partially-fixed | OpenAPI unbound; EXTRA warnings | EXTRA now fails unless allow-listed; no commit/digest in `docs/openapi.yaml:1-4` |
| API-P3-003 | P3 | verified-fixed | Realtime no reconnect | `NotificationBell.tsx:112-188` |
| API-P3-004 | P3 | verified-fixed | Public `/metrics` | `app.ts:152-165` fails closed |
| API-P3-005 | P3 | verified-fixed | Batch syncs never dispatched | `routes/admin.ts:127-169` enqueues |
| API-P3-006 | P3 | verified-fixed | M365 duplicate calendar events | `m365-calendar-sync.ts:103-139` PATCHes stored id |
| API-P3-007 | P3 | verified-fixed | M365 batch only `value[0]` | `routes/webhooks.ts:920-982` iterates all |
| API-P3-008 | P3 | partially-fixed | `export.csv` ignores format | CSV fixed; `format=json` still ignored while SDK offers it |

Counts: 10 verified-fixed, 5 partially-fixed, 0 regressed, 0 new.

## Residual detail

### API-P2-001 — Unguarded mutations

`projects.ts` task-comment/update/task-read/task-approve/portal-comment routes and the asset/finding comment routes check the record belongs to the caller's org but do not call `requirePermission`. A member with read access (including a client role) can therefore add/update/delete comments, mark tasks read, approve a task, or post a portal comment without the module's `create`/`edit` permission. Fix: add the module permission to each route (or a router-level guard with an explicit public allowlist), then extend `route-authorization-guard.test.ts` to assert the permission, not just `requireAuth`/`requireOrgAccess`.

### API-P2-002 — `jira-sync` false success

`apps/worker/src/tasks/jira-sync.ts:114-122` increments `errors` when `fetchJiraIssue` returns null and `:184` increments on a DB update error, but `:206` returns `{ ok: true }` regardless. The task result therefore tells the queue/operator the run succeeded while tasks were skipped. Fix: return `{ok:false,error:`${errors} task(s) failed`}` when `errors > 0` (matching `jsm-sync.ts:230-234`) and add a test with one failing item.

### API-P3-001 — Remaining non-enveloped middleware responses

- `middleware/idempotency.ts:30` — 400 overlong key: `{ error: "Idempotency-Key header too long..." }`.
- `middleware/idempotency.ts:69-73` — 409 in-flight/processed: `{ error, idempotencyKey }`.
- `middleware/request-timeout.ts:37-41` — 408: `{ error: { code, message } }` with no `success:false` or `status`.

`docs/API_ERROR_HANDLING.md:19-30` says every handled error uses `success:false,error:{code,message,status}`. Fix: route each through `failure()` (or move the status into the standard shape) and add contract tests for 400/408/409.

### API-P3-002 — OpenAPI binding

`docs/openapi.yaml:1-4` names the generator but no commit/digest, so a stale artifact cannot be detected by inspection. `scripts/openapi-audit.js` now fails on unlisted EXTRA and 0 MISSING, which is a real improvement. Fix: stamp the generated header with the commit SHA + sha256 of `spec.ts`, and add `--check` to the unit-test action.

### API-P3-008 — `format=json` is a dead option

`routes/dynamic-client-forms-builder.ts:99-110` always calls `sendExportResponse(...)`. The validator still accepts `format` (`validators/dynamic-client-forms-builder.ts:65-70`) and the SDK schema advertises `csv|json` (`packages/sdk/src/dynamic-client-forms-builder.ts:92-97`; `.api.ts:90-96` sends the parameter), so `format=json` silently returns CSV. Fix: either implement JSON in the route when `parsed.format === "json"` or remove `format` from the API validator and SDK schema (a breaking SDK change, so prefer implementing it).

## Cross-domain note

The new `POST /proposals/:id/client-decision` route is gated only by `requirePermission("proposals","edit")`; no client role holds that permission and the route does not require a client identity. It is recorded as `ADMIN-P2-010`, not duplicated here. The new client-visibility filters add `visibility` predicates to assets/findings/proposals/qbr/file-requests/approvals/domain-monitors/service-catalog/vendors; the side-channel gaps are recorded as `SEC-P1-011`/`SEC-P2-019`, not re-scored in this API report.

## Recommendations

1. **API-P2-001** — add `requirePermission` to the residual project/asset/finding mutation routes and assert permissions in the static route guard.
2. **API-P2-002** — return `ok:false` from `jira-sync` when `errors > 0`.
3. **API-P3-001** — wrap idempotency 400/409 and timeout 408 in the shared `failure()` envelope.
4. **API-P3-002** — bind `docs/openapi.yaml` to a commit/digest and make regeneration a `--check`.
5. **API-P3-008** — honour `format=json` or remove it from the API/SDK contract in a coordinated release.

## Suggested tests

- Authorization: a member without `projects:edit` gets 403 on task approve/comment/update routes.
- Integration: `jira-sync` with one failing issue returns `ok:false` and the error count.
- Error contract: 400/408/409 responses match `{success:false,error:{code,message,status}}`.
- OpenAPI: regenerate and `git diff --exit-code`; assert a commit/digest header.
- Export: `GET /dynamic-forms/export.csv?format=json` returns JSON (or the SDK/docs stop offering it).

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is `<org>/<file>` the only supported document path shape long-term? | Keeps the storage-path regex and RLS helper aligned | Storage design decision |
| Should `format=json` remain supported for every export? | SDK compatibility vs CSV-only contract | SDK versioning policy |
| Are the unguarded project mutations intentionally member-editable? | Determines whether API-P2-001 is a bug or a product decision | Product/access-control owner |
