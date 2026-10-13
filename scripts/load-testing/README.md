# Load Testing

k6 load-testing scripts for the MCT API. They are executed by
[`load-test.yml`](../../.github/workflows/load-test.yml) on a weekly schedule
(smoke + failure injection) and by manual dispatch (any scenario). Committed
budgets live in [`budgets.js`](budgets.js); k6 exits 99 when a threshold
fails, so a run that exceeds a p95/p99 latency or error-rate budget fails the
workflow (audit TEST-P2-004).

## Scripts

| Script                  | Purpose                                                      | Run Command                                                                                                             |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `api.basic.smoke.js`    | Smoke test — validates API availability under minimal load   | `k6 run scripts/load-testing/api.basic.smoke.js`                                                                        |
| `tickets.load.js`       | Load test — CRUD operations on tickets endpoint              | `k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<token> scripts/load-testing/tickets.load.js`               |
| `auth.load.js`          | Load test — authentication endpoints (sign-in, me, callback) | `k6 run -e API_BASE_URL=http://localhost:4000 -e TEST_EMAIL=... -e TEST_PASSWORD=... scripts/load-testing/auth.load.js` |
| `sse.load.js`           | Load test — Server-Sent Events notifications stream          | `k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<token> scripts/load-testing/sse.load.js`                   |
| `health.spike.js`       | Spike test — health endpoint high-throughput validation      | `k6 run -e API_BASE_URL=http://localhost:4000 scripts/load-testing/health.spike.js`                                     |
| `failure.injection.js`  | Negative control — must FAIL (exit 99) on an injected 5xx burst | `SUMMARY_PATH=failure-injection-summary.json k6 run scripts/load-testing/failure.injection.js` (see below)            |

## Usage

```bash
# Install k6
# macOS: brew install k6
# Windows: choco install k6
# Linux: https://k6.io/docs/getting-started/installation/

# Run smoke test
k6 run scripts/load-testing/api.basic.smoke.js

# Run tickets load test (requires auth token)
k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<your-jwt> scripts/load-testing/tickets.load.js

# Run auth load test (requires test credentials)
k6 run -e API_BASE_URL=http://localhost:4000 -e TEST_EMAIL=test@example.com -e TEST_PASSWORD=password123 scripts/load-testing/auth.load.js

# Run SSE load test (requires auth token)
k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<your-jwt> scripts/load-testing/sse.load.js

# Run health spike test
k6 run -e API_BASE_URL=http://localhost:4000 scripts/load-testing/health.spike.js
```

Set `SUMMARY_PATH=<file.json>` to have any script write its full metrics JSON
(used by CI for the recorded baseline artifact; `load-test.yml` uploads
`k6-summaries` for 30 days).

## Environment Variables

| Variable        | Required                              | Description                                 |
| --------------- | ------------------------------------- | ------------------------------------------- |
| `API_BASE_URL`  | No (default: `http://localhost:4000`) | Base URL of the API server                  |
| `AUTH_TOKEN`    | For authenticated endpoints           | JWT access token for authenticated requests |
| `TEST_EMAIL`    | For auth tests                        | Test user email                             |
| `TEST_PASSWORD` | For auth tests                        | Test user password                          |
| `SUMMARY_PATH`  | No                                    | Write the full k6 metrics JSON to this path |

## Committed budgets

`budgets.js` is the single source of truth. Numbers target the public API over
the internet (a single shared droplet), so they carry headroom over the
in-stack SLOs in [`docs/SLO.md`](../../docs/SLO.md) (availability ≥ 99.9%,
latency p95 < 500 ms). Changing a budget is a reviewed change — the workflow
has no override input.

| Scenario           | Script                  | Error rate | p95     | p99     |
| ------------------ | ----------------------- | ---------- | ------- | ------- |
| `smoke`            | `api.basic.smoke.js`    | < 1%       | < 2000ms | < 3000ms |
| `tickets`          | `tickets.load.js`       | < 5%       | < 3000ms | < 5000ms |
| `auth`             | `auth.load.js`          | < 2%       | < 5000ms | < 8000ms |
| `sse`              | `sse.load.js`           | < 1%       | < 1000ms | < 2500ms |
| `spike`            | `health.spike.js`       | < 0.1%     | < 250ms  | < 500ms  |
| `failure-injection`| `failure.injection.js`  | < 1% (must breach) | < 2000ms | < 3000ms |

## CI: `load-test.yml`

- **Schedule** — weekly (Monday 09:30 UTC): the `smoke` scenario plus the
  failure-injection control against the dev API.
- **Dispatch** — `scenario` (smoke/tickets/auth/sse/spike/failure-injection),
  `target` (dev/prod) and an optional `api_base_url` override. The target
  defaults to the public dev API and can be pinned for all runs with the
  `LOAD_TEST_API_URL` repository variable.
- **Heavy scenarios are dispatch-only** (`tickets`/`auth`/`sse`/`spike`): the
  target is a single shared droplet, so an unattended 1000-VU spike would be
  an outage, not a test. `tickets` creates real tickets — prefer a dedicated
  test account/org.
- **Credentials** — `tickets`/`sse` need `LOAD_TEST_AUTH_TOKEN`; `auth` needs
  `LOAD_TEST_TEST_EMAIL` / `LOAD_TEST_TEST_PASSWORD`. Missing credentials fail
  the run before any load is generated. See
  [`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](../../docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md).
- **Prod** — dispatch attaches the approval-gated `prod-approval` environment
  and is restricted to the `main` branch. Failures notify via the existing
  ntfy/Slack pattern.

## Failure injection

`fault-injector.mjs` is a loopback-only reverse proxy in front of the target
API that can flip to a simulated edge/dependency **5xx burst**
(`POST /__control {"mode":"inject"}`). `load-test.yml` runs three phases and
asserts each one:

1. **Baseline** (injector pass-through): `api.basic.smoke.js` must pass the
   committed budgets.
2. **Injected burst**: `failure.injection.js` observes the 503s and the
   committed error-rate budget **must fail the run** (k6 exit 99). The
   workflow pins the reason — all functional checks passed and
   `http_req_failed` breached — so budgets cannot silently stop failing on a
   5xx burst.
3. **Recovery** (injector pass-through): `api.basic.smoke.js` must pass again.

This is a negative control for the enforced thresholds. Dependency-kill drills
(Redis/queue/Supabase-down against the droplet) remain manual follow-ups.

## Thresholds

Each script defines its thresholds from `budgets.js` and CI enforces them via
the k6 exit code (99 = threshold breach). If a scenario legitimately needs a
different budget, change `budgets.js` in a reviewed PR and record the reason.
