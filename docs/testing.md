# Testing

Canonical testing reference for the monorepo. Counts are measured, not
hand-maintained — the current totals live in [README.md](../README.md) and
[AGENTS.md](../AGENTS.md) and are enforced by
[`scripts/check-docs-counts.mjs`](../scripts/check-docs-counts.mjs) in CI.

## Frameworks per package

| Package | Framework                                   | Environment                                 | Config                          | Command                     |
| ------- | ------------------------------------------- | ------------------------------------------- | ------------------------------- | --------------------------- |
| API     | Jest + ts-jest + supertest                  | `node`                                      | `apps/api/jest.config.mjs`      | `pnpm --filter=api test`    |
| Web     | Jest + ts-jest + Testing Library            | custom jsdom (`jest-custom-environment.js`) | `apps/web/jest.config.mjs`      | `pnpm --filter=web test`    |
| SDK     | Jest + ts-jest (fetch mocked)               | `node`                                      | `packages/sdk/jest.config.mjs`  | `pnpm --filter=sdk test`    |
| Worker  | Jest + ts-jest (env schema + task handlers) | `node`                                      | `apps/worker/jest.config.mjs`   | `pnpm --filter=worker test` |
| UI      | Jest + ts-jest + Testing Library            | `jsdom`                                     | `packages/ui/jest.config.mjs`   | `pnpm --filter=@mct/ui test` |
| E2E     | Playwright (chromium + Pixel 7/iPhone 13 mobile) + axe-core | real browsers against the running stack     | `apps/web/playwright.config.ts` | `pnpm e2e`                  |

## Running suites

Root scripts run through Turborepo:

| Command                                                  | What it does                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm test`                                              | Every package's tests (`turbo run test`)                      |
| `pnpm test:coverage`                                     | Every package with coverage — what CI gates on                |
| `pnpm --filter=api test`                                 | One package                                                   |
| `pnpm --filter=web test:watch`                           | Watch mode (API/Web/Worker define `test:watch`; SDK does not) |
| `pnpm --filter=web test:coverage`                        | One package with coverage                                     |
| `pnpm --filter=api exec jest src/__tests__/auth.test.ts` | One file                                                      |
| `pnpm e2e`                                               | Playwright E2E (`pnpm --filter=web e2e`)                      |

Coverage thresholds (`coverageThreshold.global` in each `jest.config.mjs`; this
table is compared against the configs by `scripts/check-docs-counts.mjs` so it
cannot drift again — TEST-P2-007):

| Package | Branches | Functions | Lines | Statements |
| ------- | -------- | --------- | ----- | ---------- |
| API     | 45       | 70        | 74    | 70         |
| Web     | 39       | 39        | 47    | 47         |
| SDK     | 33       | 38        | 40    | 40         |
| Worker  | 25       | 15        | 12    | 12         |

The worker floor is intentionally the lowest of the four: its suite covers the
scheduled task handlers, not the whole process surface. The branch floor was
raised from 5 to 25 when the `module-tasks` suite landed (TEST-P2-002); raise
the remaining worker thresholds as coverage grows.

`packages/ui` ships a smoke suite (Button/Input/Badge/Avatar/Dialog render and
interaction) but no `coverageThreshold` yet — the first CI run measures the
floor, and the threshold is set just below that measurement in the follow-up
(TEST-P3-005 ratchet note).

**Ratchet plan (TEST-P3-003/004):** each floor is set a few points below the
last *measured* value and is raised in the PR that lands new tests; it is never
set to a number the suite has not already met. The shared `unit-tests` composite
uploads every package's `coverage/` report plus `.jest-results.json` as the
`coverage-reports` artifact on each PR and deploy run, so the measured values
(and "are the floors met?") are observable from CI instead of inferred.

### What `pnpm test:coverage` does NOT cover

`pnpm test:coverage` is the Jest gate only. It does **not** run or prove:

- E2E flows (`pnpm e2e` — separate `e2e.yml` job; prod-only on deploy);
- accessibility scans (`a11y.spec.ts`, 25-route gate);
- visual regression (Chromatic is non-blocking); load tests run on a weekly
  schedule and manual dispatch via `load-test.yml`, with committed budgets
  (p95/p99/error-rate) in `scripts/load-testing/budgets.js` and a
  failure-injection control — see `scripts/load-testing/README.md`;
- migration apply/drift, backup/restore, RLS runtime checks or a prod smoke
  probe (those are separate workflows, or absent — see `docs/CI.md`).

The per-package test totals in `AGENTS.md`/`README.md` are verified against the
`--json` results file each package writes to `.jest-results.json` during
`test:coverage` (CI sets `MCT_VERIFY_TEST_COUNTS=1`); suite counts are counted
from the tree by `scripts/check-docs-counts.mjs`.

## E2E stack

E2E needs the full local stack:

1. `supabase start` and `supabase db reset` (migrations + seeds).
2. API on `:4000` (`pnpm --filter=api dev` from a `.env.local` synced from
   `supabase status`).
3. Web on `:3000` — Playwright starts `pnpm dev` itself outside CI;
   `e2e.yml` builds and starts both apps explicitly.

```bash
pnpm exec playwright install --with-deps chromium webkit
pnpm e2e                 # apps/web/e2e/**/*.spec.ts
```

Environment: `E2E_BASE_URL` (default `http://localhost:3000`),
`E2E_API_URL` (default `http://localhost:4000`; the setup project waits for
this `/health` before retrying a login), `E2E_ADMIN_EMAIL` /
`E2E_ADMIN_PASSWORD` (the defaults target local seed accounts only). The
`setup` project signs in once and writes `.playwright-auth.json`; specs reuse
that session. `apps/web/e2e/fixtures.ts` exports `gotoApp` (prefer it for
authenticated routes: it waits for the shell and gives a deterministic failure
point), `setActiveOrg`, `visibleWithin` (prefer it for data-dependent gates — a
slow render skips a branch instead of failing) and `clickOrGoto`. CI is
single-worker with 2 retries; a test gets 45s, actions 15s, navigations 30s.
The JSON reporter writes `.playwright-results/results.json` and the E2E job
prints a flake summary (retried/flaky tests — TEST-P2-003) to the job summary;
failures upload `.playwright-report/` and `.playwright-results/`.

Accessibility: `apps/web/e2e/a11y.spec.ts` scans 25 core routes against
`critical`/`serious` axe rules (WCAG 2.0/2.1/2.2 A+AA, `wcag22aa` included).
`A11Y_FULL=1` expands to 68 routes — the weekly, non-blocking
`a11y-breadth.yml` triage run.

## Test patterns

| Pattern                    | Rule                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mock builder               | `createMockBuilder` — chainable object plus `then()` so it is awaitable; includes `filter`, `maybeSingle`, `rpc`, `upsert`.                                                  |
| Async server components    | Call the async component, `await` the JSX, then `render()`.                                                                                                                  |
| Redirect mock              | The mock must throw `"NEXT_REDIRECT"` or execution continues past the redirect.                                                                                              |
| Bulk actions               | Return `{ ok, error }` instead of throwing.                                                                                                                                  |
| DOM text in nested DOM     | Prefer `getAllByText(...).length` over `getByText(...)`.                                                                                                                     |
| `fireEvent` vs `userEvent` | Use `fireEvent` when pnpm symlink resolution fails for `@testing-library/user-event`; wrap async updates in `waitFor`.                                                       |
| Route params               | Pass `params: Promise.resolve({...})` and `searchParams: Promise.resolve({...})`.                                                                                            |
| Worker testability         | `envSchema`, `parseEnv`, `runWorkerTasks` are exported for tests; `pino` and `dotenv/config` are mocked.                                                                     |
| API middleware layering    | Route suites stub `org-access`/`permissions` as pass-through `next()`; enforcement is covered by the dedicated `middleware-*` suites. Never re-add a `NODE_ENV=test` bypass. |

## Where the numbers live

Test totals and per-package counts are stated in [README.md](../README.md) and
[AGENTS.md](../AGENTS.md); `scripts/check-docs-counts.mjs` (wired into
`test.yml` and `validate.yml`) fails the build when they drift. Database types
are separately guarded by `node scripts/generate-db-types.js --check`, and
migration/RLS hygiene by [`scripts/verify-rls.mjs`](../scripts/verify-rls.mjs).
