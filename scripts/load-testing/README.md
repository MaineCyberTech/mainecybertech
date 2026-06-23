# Load Testing

k6 load-testing scripts for the MCT API.

## Scripts

| Script               | Purpose                                                      | Run Command                                                                                                             |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `api.basic.smoke.js` | Smoke test — validates API availability under minimal load   | `k6 run scripts/load-testing/api.basic.smoke.js`                                                                        |
| `tickets.load.js`    | Load test — CRUD operations on tickets endpoint              | `k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<token> scripts/load-testing/tickets.load.js`               |
| `auth.load.js`       | Load test — authentication endpoints (sign-in, me, callback) | `k6 run -e API_BASE_URL=http://localhost:4000 -e TEST_EMAIL=... -e TEST_PASSWORD=... scripts/load-testing/auth.load.js` |
| `sse.load.js`        | Load test — Server-Sent Events notifications stream          | `k6 run -e API_BASE_URL=http://localhost:4000 -e AUTH_TOKEN=<token> scripts/load-testing/sse.load.js`                   |
| `health.spike.js`    | Spike test — health endpoint high-throughput validation      | `k6 run -e API_BASE_URL=http://localhost:4000 scripts/load-testing/health.spike.js`                                     |

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

## Environment Variables

| Variable        | Required                              | Description                                 |
| --------------- | ------------------------------------- | ------------------------------------------- |
| `API_BASE_URL`  | No (default: `http://localhost:4000`) | Base URL of the API server                  |
| `AUTH_TOKEN`    | For authenticated endpoints           | JWT access token for authenticated requests |
| `TEST_EMAIL`    | For auth tests                        | Test user email                             |
| `TEST_PASSWORD` | For auth tests                        | Test user password                          |

## CI Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Test
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run k6
        uses: grafana/k6-action@v0.2.0
        with:
          filename: scripts/load-testing/tickets.load.js
          env: |
            API_BASE_URL=${{ secrets.STAGING_API_URL }}
            AUTH_TOKEN=${{ secrets.LOAD_TEST_AUTH_TOKEN }}
```

## Thresholds

Each script defines its own thresholds. Common patterns:

- **Smoke**: `<1%` error rate, `p95 < 2s`
- **Load**: `<5%` error rate, `p95 < 3s`
- **Spike**: `<0.1%` error rate, `p99 < 100ms`

Adjust thresholds based on your SLAs.
