# API Error Handling Documentation

This document describes the **implemented** error contract of the MCT Client
Portal API (audit API-P2-003: the previous version documented a contract the
code never had — 422 validation responses, `*_PREFIXED` code families, and a
`request_id` field in the body).

Source of truth:

| Concern | File |
| --- | --- |
| Envelope + `AppError` | `apps/api/src/types/index.ts` |
| Central handler | `apps/api/src/middleware/error.ts` |
| Request ids | `apps/api/src/middleware/request-id.ts` |
| SDK client error | `packages/sdk/src/client.ts` (`ApiError`) |

## Error response format

Every handled error returns `success: false` with a flat `error` object:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ticket not found",
    "status": 404,
    "details": { "resource_type": "ticket" }
  }
}
```

- `error.status` mirrors the HTTP status code.
- `details` is optional and only present when the throw site supplies it.
- **5xx messages are always generic** (`"An unexpected error occurred"`). The
  real message is logged server-side only, so raw Postgres/RLS/Storage internals
  are never returned to clients.
- The request id is **not** part of the body. Every response carries an
  `X-Request-ID` header — the caller's `x-request-id` when supplied, otherwise a
  generated UUID. Include it when reporting an issue.

## Validation errors (400, not 422)

Zod parse failures are handled centrally and return **400** with code
`VALIDATION` and the Zod issues under `details.issues`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION",
    "message": "Validation failed",
    "status": 400,
    "details": {
      "issues": [
        {
          "code": "invalid_string",
          "path": ["email"],
          "message": "Invalid email"
        }
      ]
    }
  }
}
```

There is no 422 response in the API. Validation failures are 400.

## Status codes in use

| Status | Typical codes | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION`, `BAD_REQUEST`, `INVALID_INPUT`, `WEAK_PASSWORD`, `INVALID_RECOVERY_CODE`, `CAPTCHA_FAILED` | Malformed request or failed validation |
| 401 | `UNAUTHORIZED`, `AUTH_ERROR`, `MISSING_SIGNATURE`, `INVALID_SIGNATURE` | Missing/invalid credentials or signature |
| 403 | `FORBIDDEN`, `MFA_REQUIRED`, `CAPTCHA_REQUIRED` | Authenticated but not allowed |
| 404 | `NOT_FOUND` | Unknown resource |
| 409 | `VERSION_CONFLICT`, `CONFLICT`, `INVALID_STATE` | Concurrency or state conflict |
| 410 | `EXPIRED`, `GONE` | Resource expired or removed |
| 412 | `PRECONDITION_FAILED` | `If-Match` / precondition failure |
| 429 | `FULL` (and rate-limit middleware) | Capacity or rate limit |
| 500 | `DB_ERROR`, `STORAGE_ERROR`, `INTERNAL`, `CONFIG`, `CONFIG_ERROR` | Server-side failure |
| 501 | `NOT_IMPLEMENTED` | Endpoint not implemented |
| 502 | `STRIPE_ERROR`, `SMTP_ERROR` | Upstream provider failure |

Codes are plain strings supplied at the throw site. The same code can appear
with different statuses in rare cases — always trust `error.status` over the
table above.

## Raising errors

```ts
import { AppError } from "../types";

throw new AppError("NOT_FOUND", "Ticket not found", 404);
throw new AppError("FORBIDDEN", "Super admin access required", 403);
```

- The default status is 500; pass an explicit status for 4xx.
- Use `failure(code, message, status, details?)` only when a handler builds the
  envelope directly (the central handler does this for thrown errors).
- Prefer the existing vocabulary above so clients can switch on stable codes.

## Client handling (SDK)

`packages/sdk` throws `ApiError` with `code`, `message`, `status`, and
`details`:

```ts
import { ApiError } from "@mct/sdk";

try {
  await api.tickets.get(id);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 401) redirectToLogin();
    else if (err.status === 404) showNotFound();
    else showToast(err.message);
  }
}
```

## Logging

The central handler logs:

- `AppError`: `logger.warn({ requestId, code, message, status, path, method }, "Application error")`
- `ZodError`: returned as the 400 response (no warn log)
- anything else: `logger.error({ requestId, err, path, method }, "Unexpected error")`

Pino redaction (`apps/api/src/lib/logger.ts`) censors tokens, passwords,
authorization/cookie headers, and email/phone fields.

## Monitoring

Track 4xx vs 5xx ratios per endpoint and auth/validation failure rates; error
responses include `error.status` and the `X-Request-ID` header for correlation
with logs and Sentry.

| Metric | Warning | Critical |
| --- | --- | --- |
| 5xx error rate | > 1% | > 5% |
| 4xx error rate | > 10% | > 25% |
| Auth error rate | > 5% | > 20% |
| Validation error rate | > 15% | > 30% |

## Best practices

1. Never expose stack traces or raw database messages (5xx messages are already
   generic by construction).
2. Use the `X-Request-ID` header for traceability.
3. Reuse the existing code vocabulary; don't invent per-route synonyms.
4. Include `details` only for client-actionable context (field issues, conflict
   versions, missing scopes).
5. Test error paths, not just success paths.

---

*Last updated: 2026-10-10 (API-P2-003: aligned with the implemented contract)*
