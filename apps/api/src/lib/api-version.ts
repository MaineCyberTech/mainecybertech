/**
 * API version identity (EVOL-P3-004).
 *
 * The HTTP API is URL-prefix versioned (`/api/v1/...`); the OpenAPI document
 * carries a separate contract version because the spec changes on every
 * additive endpoint without a URL bump (docs/API_VERSIONING.md).
 */
export const API_MAJOR_VERSION = "v1";

/**
 * `info.version` of the OpenAPI contract served at /api/v1/openapi.json and
 * committed as docs/openapi.yaml. Bump on contract changes; it is intentionally
 * decoupled from the app release version (GIT_SHA / NEXT_PUBLIC_APP_VERSION)
 * so a client can pin the contract it integrates against.
 */
export const API_CONTRACT_VERSION = "1.0.0";

/** URL prefix for the current major version. */
export const API_PREFIX = `/api/${API_MAJOR_VERSION}`;
