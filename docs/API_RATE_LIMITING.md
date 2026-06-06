# API Rate Limiting

## Overview

The MCT API uses rate limiting to prevent abuse and ensure fair usage. There are two rate limiters configured:

## Rate Limiters

### 1. Global IP-based Rate Limiter

| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max requests | 300 per IP |
| Scope | All endpoints |
| Skip | `/health` |

This limiter applies to all requests based on the client's IP address.

### 2. Per-User Rate Limiter

| Setting | Value |
|---------|-------|
| Window | 15 minutes |
| Max requests | 200 per user |
| Scope | All authenticated endpoints |
| Key | Bearer token (first 20 chars) for authenticated requests, IP for unauthenticated |
| Skip | `/health`, `/api/v1/docs`, `/api/v1/openapi.json` |

This limiter provides higher limits for authenticated users and falls back to IP-based limiting for unauthenticated requests.

## Rate Limit Headers

All responses include rate limit information in headers:

```
RateLimit-Limit: 200
RateLimit-Remaining: 195
RateLimit-Reset: 1623456789
```

## Handling Rate Limits

When rate limited, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests from this user, please try again later.",
    "status": 429
  }
}
```

### SDK Behavior

The SDK automatically retries on 429 responses with exponential backoff:

```typescript
const client = MCTClient.create({
  baseUrl: "https://api.mainecybertech.com",
  retries: {
    maxRetries: 3,
    retryableStatuses: [429, 502, 503, 504],
  },
});
```

## Configuration

Rate limits are configured in `apps/api/src/middleware/rate-limit.ts`:

```typescript
export const rateLimitByUser = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                    // 200 requests per window
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      return `user:${auth.slice(7, 27)}`;
    }
    return `ip:${req.ip}`;
  },
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/api/v1/docs" ||
    req.path === "/api/v1/openapi.json" ||
    req.ip === "127.0.0.1" ||
    req.ip === "::1",
});
```

## Bypass for Local Development

Requests from `127.0.0.1` and `::1` (localhost) bypass the per-user rate limiter. This allows the web app's server-side requests to work without hitting rate limits during development.

## Production Recommendations

For production deployments, consider:

1. **Redis-based rate limiting** — Replace in-memory store with Redis for distributed deployments
2. **Custom limits per endpoint** — Higher limits for read-heavy endpoints, lower for mutations
3. **Rate limit by API key** — Different limits for different API consumers
4. **Monitoring** — Track rate limit hits in CloudWatch/Datadog
