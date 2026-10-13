# Shared Package Extraction Plan

Status: accepted direction, incremental execution (EVOL-P3-006).
Related: [`evaluation/db-package-evaluation.md`](evaluation/db-package-evaluation.md).

## Current state

| Package | Contents | Build | Consumers |
| --- | --- | --- | --- |
| `@mct/config` | eslint/tsconfig bases, `date`, `env` schemas | none (source) | api, worker, web (tooling) |
| `@mct/sdk` | typed API client, `database.types`, `module-registry`, `webhook-events` | none (source) | api, web, worker |
| `@mct/ui` | tokens, theme provider, primitives | none (source) | web |

The packages are consumed as TypeScript source through pnpm workspace links
(tsup/Next compile them). That is deliberate for now — it keeps the
zero-build local loop — but it means every consumer pays the typecheck and
transpile cost, and the packages cannot be published or versioned
independently.

DB client setup is no longer fully duplicated: `@mct/config/env` owns the
shared Supabase auth options, the client timeout and `resolveRedisUrl`
(EVOL-P3-005), and both `apps/api/src/services/supabase.ts` and
`apps/worker/src/services/supabase.ts` consume them. The remaining
process-specific layers (circuit breaker + metrics in the API, plain client in
the worker) stay app-local.

## Extraction plan

### Phase 1 — shared configuration (done)

- `@mct/config/env`: shared zod fragments (`nodeEnvSchema`,
  `supabaseEnvShape`, `redisEnvShape`, `queueBackendSchema`, `smtpEnvShape`,
  `sentryEnvShape`) and client defaults (`supabaseAuthOptions`,
  `SUPABASE_CLIENT_DB_TIMEOUT_MS`, `resolveRedisUrl`).
- Per-app schemas compose them and keep app-specific keys local, so the
  schemas stay explicit while the duplicated fragments have one source.

### Phase 2 — `@mct/db` (next, requires an ADR)

Move the client factories into a package only when the following are decided
(recorded in `docs/adr/`):

1. **Boundary**: does `@mct/db` own only client creation (URL/key/options) or
   also query helpers and typed table access?
2. **Instrumentation**: the API client wraps fetch with the circuit breaker
   and Prometheus histogram. The package must accept an injectable `fetch`
   (and keep the app-local metrics wiring) or move the metrics registry too.
3. **Types**: `Database` types are generated into `@mct/sdk`. `@mct/db` should
   re-export them rather than duplicate the generated file.
4. **Testing**: the API's client tests (circuit breaker, scoped-client
   selection) are app-level; the package gets its own unit tests.

Do not start Phase 2 before the ADR lands — the current split is correct, just
duplicated at the edges.

### Phase 3 — `@mct/sdk` build step

Add a tsup build (`dist/` + `exports` pointing at it) once an external
consumer (mobile app, partner integration) needs a versioned client. Until
then, source consumption is cheaper. The build must keep the subpath exports
(`database.types`, `module-registry`, `webhook-events`) and the
`generate-db-types.js --check` guard working against `src/`.

### Phase 4 — `@mct/ui` packaging (optional)

Only if a second UI consumer appears. The web app is the only renderer today;
packaging the kit adds build/versioning overhead without a second consumer.

## Guardrails

- Any extraction must keep `pnpm install --frozen-lockfile` green (lockfile is
  committed) and CI's `typecheck` + `test:coverage` steps green.
- Shared catalogs (`module-registry`, `webhook-events`) remain dependency-free
  so every app can import them without pulling a runtime.
- New shared code lands with a consumer in the same PR; no speculative
  packages.
