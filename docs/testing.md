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
| E2E     | Playwright (chromium) + axe-core            | real browsers against the running stack     | `apps/web/playwright.config.ts` | `pnpm e2e`                  |

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

Coverage thresholds (`coverageThreshold.global` in each `jest.config.mjs`):

| Package | Branches | Functions | Lines | Statements |
| ------- | -------- | --------- | ----- | ---------- |
| API     | 30       | 50        | 55    | 58         |
| Web     | 38       | 38        | 45    | 46         |
| SDK     | 33       | 38        | 40    | 40         |
| Worker  | 5        | 15        | 12    | 12         |

## E2E stack

E2E needs the full local stack:

1. `supabase start` and `supabase db reset` (migrations + seeds).
2. API on `:4000` (`pnpm --filter=api dev` from a `.env.local` synced from
   `supabase status`).
3. Web on `:3000` — Playwright starts `pnpm dev` itself outside CI;
   `e2e.yml` builds and starts both apps explicitly.

```bash
pnpm exec playwright install chromium
pnpm e2e                 # apps/web/e2e/**/*.spec.ts
```

Environment: `E2E_BASE_URL` (default `http://localhost:3000`),
`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (the defaults target local seed
accounts only). The `setup` project signs in once and writes
`.playwright-auth.json`; specs reuse that session. `apps/web/e2e/fixtures.ts`
exports `gotoApp`, `setActiveOrg`, `visibleWithin` (prefer it for
data-dependent gates — a slow render skips a branch instead of failing) and
`clickOrGoto`. CI is single-worker with 2 retries; a test gets 45s, actions
15s, navigations 30s; failures upload `.playwright-report/` and
`.playwright-results/`.

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
