# PHASE 3 — API CONTRACT VALIDATION

## Objective

Validate that the Express API routes and the SDK client methods agree on: HTTP methods, URL paths, request/response shapes, and status codes.

## Scope

IN: apps/api/src/routes/ (all .ts), packages/sdk/src/ (all .ts)
OUT: frontend-only usage patterns, third-party SDKs

## Validate

1. **Route vs SDK method parity** — every Express route has a corresponding SDK method in the right API class
2. **HTTP method alignment** — SDK method uses same method (GET/POST/PUT/PATCH/DELETE) as the Express handler
3. **URL path parity** — SDK constructs the same URL as the Express route definition
4. **Response shape** — SDK response type matches the actual JSON shape from the route
5. **Error handling** — SDK correctly handles the API's `{ ok, error }` / `success(data)` pattern
6. **Auth requirements** — routes with requireAuth have SDK methods that pass tokens; public routes don't

## Output Format (`engine/outputs/api_contract.json`)

```json
[
  {
    "severity": "P0|P1|P2|P3",
    "phase": 3,
    "category": "contract",
    "route": "GET|POST /api/v1/resource/:id",
    "sdk_method": "sdk.resource.get()",
    "file_api": "apps/api/src/routes/resource.ts:12",
    "file_sdk": "packages/sdk/src/resource.ts:45",
    "issue": "Method mismatch: API uses PATCH, SDK uses PUT",
    "impact": "405 Method Not Allowed at runtime",
    "fix": "Change SDK call to PATCH or API route to PUT"
  }
]
```

## Severity Definitions for Phase 3

- P0: Route exists in API but no SDK method (or vice versa); method mismatch causes runtime error
- P1: Response shape mismatch; SDK expects array but API returns object
- P2: Missing optional parameter in SDK; auth header not passed
- P3: Naming inconsistency (camelCase vs snake_case); missing doc comment

---

automation:
checks: - id: CON-001
desc: "Count API routes by method"
grep: "router\.(get|post|put|patch|delete)\("
path: "apps/api/src/routes/"
expect: "full count of routes by method" - id: CON-002
desc: "Count SDK methods by class"
grep: "async\s+\w+\(|class\s+\w+Api"
path: "packages/sdk/src/"
expect: "full count of methods by API class" - id: CON-003
desc: "Check for hardcoded URLs in SDK vs route patterns"
grep: "api/v1"
path: "packages/sdk/src/"
expect: "SDK URL paths match Express route patterns"
