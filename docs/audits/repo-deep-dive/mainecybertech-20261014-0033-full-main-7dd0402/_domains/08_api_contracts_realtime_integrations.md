# API Contracts, Realtime, and Integrations — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261011-0426-full-main-8d299b8`)
- Area code: API
- Scope limitations: static verification; no live API calls. `openapi-audit.js` was executed; jest suites were not run (no `node_modules`).

## Scope

Re-verified all 14 previous API findings at `7dd0402` (contracts, error handling, realtime, integration syncs) and scanned for new contract inconsistencies.

## Verification performed

| Evidence | Type | Notes |
|---|---|---|
| `node scripts/openapi-audit.js` | Executed | 453 live routes vs 695 spec entries, **0 MISSING** (exit 0); 242 dynamic/EXTRA warnings |
| `docs/API_ERROR_HANDLING.md`, `docs/API_RATE_LIMITING.md` | Read | Contract vs implementation |
| `apps/api/src/middleware/{rate-limit,idempotency,request-timeout,request-id}.ts` | Read | Envelope behaviour |
| `packages/sdk/src/client.ts` | Read | Idempotency-Key + If-Match support |
| `apps/api/src/routes/{search,docs,admin,webhooks,dynamic-client-forms-builder}.ts` | Read | Scoping, gating, M365 batch, export contract |
| `apps/worker/src/tasks/{jira-sync,jsm-sync,stripe-reconcile,m365-calendar-sync}.ts` | Read | Failure reporting / idempotency |
| `apps/web/components/NotificationBell.tsx` | Read | SSE reconnect |

## Executive Summary

Ten of fourteen previous findings are verified fixed, including the two P2 integration-sync fixes that matter most operationally (JSM retry + failure reporting, Stripe reconciliation fails on drift) and the whole realtime/M365 batch set. Four remain partially fixed with unchanged, specific residuals: unguarded intra-tenant mutations in projects/assets/findings, `jira-sync` still reports `ok:true` with counted errors, non-enveloped 429/408/idempotency responses vs documented contract, and the OpenAPI artifact still lacks commit binding with EXTRA warnings unallowlisted. One new P3: `GET /dynamic-forms/export.csv` returns JSON while OpenAPI documents CSV.

## Findings

| ID | Sev | Status | Title | Re-verification note (short) |
|---|---|---|---|---|
| API-P2-001 | P2 | partially-fixed | Mutations unguarded by `requirePermission` | Governance + client-onboarding guarded; residual `projects.ts:869,934,971,1010,1039,1084,1185,1220,1252`, `assets.ts:366`, `findings.ts:469` (org-scope only) |
| API-P2-002 | P2 | partially-fixed | Integration syncs report success while dropping items | JSM + Stripe fixed; `jira-sync.ts:206` still `{ok:true}` with `errors++` |
| API-P2-003 | P2 | verified-fixed | Error-handling contract contradicted implementation | `docs/API_ERROR_HANDLING.md:19-67` matches code; `X-Request-ID` emitted (`request-id.ts:18`) |
| API-P2-004 | P2 | verified-fixed | SDK retries unsafe requests without Idempotency-Key | `client.ts:213-220,337-341` mint once per logical call |
| API-P2-005 | P2 | verified-fixed | Non-atomic outbound idempotency | Atomic SET NX claim + upsert (`lib/webhook-dispatcher.ts:182-200`) |
| API-P2-006 | P2 | verified-fixed | Search falls through to unscoped query | `search.ts:106-126` orgScope + `["__none__"]` fail-closed |
| API-P2-007 | P2 | verified-fixed | OpenAPI public / Swagger UI CSP | `docs.ts:21-39` 404 in production; audit 0 MISSING |
| API-P3-001 | P3 | partially-fixed | Minor contract inconsistencies | X-Request-ID done; 429 plain text (`rate-limit.ts:27-38`) vs documented envelope; 400/409 idempotency + 408 timeout non-enveloped |
| API-P3-002 | P3 | partially-fixed | OpenAPI not commit-bound; CI warns on EXTRA | Audit fails on MISSING (ran clean); no commit binding; EXTRA still a warning |
| API-P3-003 | P3 | verified-fixed | Realtime has no reconnect / auth_expired handling | `NotificationBell.tsx:112-188` bounded backoff + terminal auth_expired |
| API-P3-004 | P3 | verified-fixed | `/metrics` public when token unset | `app.ts:153-160` 404s without `METRICS_TOKEN` |
| API-P3-005 | P3 | verified-fixed | Batch sync tasks never dispatched | `admin.ts:127-169` enqueue endpoint |
| API-P3-006 | P3 | verified-fixed | M365 calendar duplicates | `m365-calendar-sync.ts:103-139` persists/PATCHes event id |
| API-P3-007 | P3 | verified-fixed | M365 webhook only processes first notification | `webhooks.ts:881-947` full batch loop |
| API-P3-008 | P3 | open (new) | `/dynamic-forms/export.csv` returns JSON, not CSV | `routes/dynamic-client-forms-builder.ts:71-85` + service ignores `format`; OpenAPI says CSV |

## New finding detail

### API-P3-008 — GET /dynamic-forms/export.csv ignores format and returns JSON

- Evidence: `apps/api/src/routes/dynamic-client-forms-builder.ts:71-85` always `res.json(result)`; `apps/api/src/services/dynamic-client-forms-builder.ts:327-356` ignores `options.format`; `docs/openapi.yaml:4102-4107` summarises “Export dynamic forms (CSV)”.
- Impact: a caller following the spec receives a JSON body for a `.csv` route; no CSV formula-injection exposure (no CSV is produced), but the contract is wrong and the route name misleads. No in-repo web call site, so latent.
- Fix: either implement CSV via `lib/csv.ts` + `sendExportResponse` (with the formula guard) or rename the route to `export.json` and correct the spec.
- Validation: contract test asserting `Content-Type: text/csv` and a guarded CSV body for `format=csv`.

## Recommendations

1. **Finish the permission-gate sweep (API-P2-001 / CHAIN-P2-001)** — add `requirePermission("projects","edit"/"create")` to task-comment/update/approve routes, `assets:edit` to asset comments, `findings:edit` to finding comments; or document the deliberate “any member may comment” policy.
2. **Make jira-sync honest (API-P2-002)** — return `ok:false` when `errors > 0`, mirroring JSM/Stripe.
3. **Envelope the outliers (API-P3-001)** — a custom handler for `express-rate-limit`, the idempotency 400/409 and timeout 408 responses, or update `docs/API_RATE_LIMITING.md` to the actual shapes.
4. **Bind the OpenAPI artifact (API-P3-002)** — add the source commit + spec version to the generated header and commit an EXTRA allowlist for dynamic registrations.
5. **Fix or rename the dynamic-forms export (API-P3-008)**.

## Suggested tests

- Route-level 403 tests for every mutating route without a permission middleware (fail if a new unguarded mutation appears) — this would also lock in API-P2-001.
- Contract tests: 429/408/409 body shape vs `docs/API_ERROR_HANDLING.md`.
- Worker test: `jira-sync` with a per-item failure returns `ok:false`.
- OpenAPI: assert the generated header carries the commit and that EXTRA ⊆ allowlist.

## Open questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is “any org member may comment” intended for projects/assets/findings? | Decides whether the residual is a bug or a policy | Product decision / ADR |
| Should the dynamic-forms export be CSV or JSON? | Contract ownership | Feature owner |
