# API Versioning

## Current Version
The API is currently at **v1**, served at `/api/v1/`.

## Versioning Strategy
- URL-prefix versioning (`/api/v1/`, `/api/v2/`)
- New major versions get a new URL prefix
- Old versions are maintained for at least 6 months after a replacement is available

## Guidelines
1. **Backward-compatible changes** (new endpoints, optional fields) do NOT require a new version
2. **Breaking changes** (removed fields, changed types) require a new version
3. **Deprecation notice** — endpoints being removed should return a `Sunset` header with a deprecation date
4. **Migration docs** — each new version should include a migration guide from the previous version
