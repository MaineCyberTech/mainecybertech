# API Versioning

## Current Version
The API is currently at **v1**, served at `/api/v1/`.

The contract version of the OpenAPI document (`info.version`, committed as
`docs/openapi.yaml`) is `1.0.0` and is tracked separately from the app release
(`GIT_SHA` / `NEXT_PUBLIC_APP_VERSION`). Both values live in
`apps/api/src/lib/api-version.ts`; bump the contract version on contract
changes, and add a new URL major version only for breaking changes.

## Versioning Strategy
- URL-prefix versioning (`/api/v1/`, `/api/v2/`)
- New major versions get a new URL prefix
- Old versions are maintained for at least 6 months after a replacement is available

## Guidelines
1. **Backward-compatible changes** (new endpoints, optional fields) do NOT require a new version
2. **Breaking changes** (removed fields, changed types) require a new version
3. **Deprecation notice** — endpoints being removed must return `Deprecation`,
   `Sunset` and `Link` headers (see Enforcement below)
4. **Migration docs** — each new version should include a migration guide from the previous version

## Enforcement (EVOL-P3-004)

The policy above is enforced in code, not just documented:

- `apps/api/src/middleware/deprecation.ts` is the single registry of
  deprecated paths (`DEPRECATIONS`). Each entry carries:
  - the RFC 9745 `Deprecation: true` header,
  - the RFC 8594 `Sunset` HTTP-date,
  - RFC 8288 `Link` headers: `rel="successor-version"` (canonical replacement)
    and `rel="deprecation"` (migration notes).
- `deprecationMiddleware()` is mounted app-wide in `apps/api/src/app.ts`, so
  every request to a registered path (including subpaths that no longer match
  a route) advertises its sunset.
- `goneRoute(key)` (`apps/api/src/lib/deprecated-route.ts`) uses the same
  registry for hard-deprecated aliases that fail closed with `410 Gone`.
- `deprecationNotice(key)` attaches the headers to a still-serving route.

### Adding a deprecation

1. Add an entry to `DEPRECATIONS` with `path`, `sunset` (HTTP-date),
   `successor` and `migrationDoc`.
2. Wire it: `goneRoute(key)` when the old path fails closed, or
   `deprecationNotice(key)` when it still serves traffic.
3. Update this document and the successor's module doc.

`apps/api/src/__tests__/deprecation.test.ts` pins the header contract, so a
route marked deprecated cannot silently lose its `Sunset` header.

### Current registry

| Deprecated path | Sunset | Successor |
| --- | --- | --- |
| `/api/v1/final/satisfaction` | Mon, 12 Oct 2026 00:00:00 GMT | `/api/v1/satisfaction-pulse` |
| `/api/v1/edu-automation/sop` | Mon, 12 Oct 2026 00:00:00 GMT | `/api/v1/governance/sop-library` |
| `/api/v1/edu-automation/insurance` | Mon, 12 Oct 2026 00:00:00 GMT | `/api/v1/insurance-binder` |
