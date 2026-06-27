# API Error Handling Documentation

## Overview
This document describes the standardized error handling patterns, response formats, and best practices for the MCT Client Portal API.

## Error Response Format

### Standard Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {},
    "request_id": "req_1234567890abcdef"
  }
}
```

### HTTP Status Codes

| Status Code | Category | Description |
|-------------|----------|-------------|
| 400 | Client Error | Bad Request - Invalid input or malformed request |
| 401 | Client Error | Unauthorized - Missing or invalid authentication |
| 403 | Client Error | Forbidden - Insufficient permissions |
| 404 | Client Error | Not Found - Resource does not exist |
| 409 | Client Error | Conflict - Resource already exists or state conflict |
| 422 | Client Error | Unprocessable Entity - Validation failed |
| 429 | Client Error | Too Many Requests - Rate limiting |
| 500 | Server Error | Internal Server Error - Unexpected condition |
| 502 | Server Error | Bad Gateway - Upstream service failure |
| 503 | Server Error | Service Unavailable - Temporary overload |

## Error Codes Reference

### Authentication Errors (`AUTH_*`)

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | Wrong username/password |
| `AUTH_TOKEN_EXPIRED` | 401 | Authentication token has expired | JWT token expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid authentication token | Malformed or tampered JWT |
| `AUTH_TOKEN_MISSING` | 401 | Authentication required | No token provided |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired, please log in again | Session timeout |

### Authorization Errors (`PERM_*`)

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `PERM_INSUFFICIENT` | 403 | Insufficient permissions to access this resource | User lacks required role |
| `PERM_ORG_ACCESS_DENIED` | 403 | Access denied to this organization | Not a member of org |
| `PERM_RESOURCE_OWNER_ONLY` | 403 | Only the resource owner can perform this action | Not the creator/owner |
| `PERM_ADMIN_REQUIRED` | 403 | Admin access required | Non-admin user |

### Validation Errors (`VALIDATION_*`)

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `VALIDATION_FAILED` | 422 | Input validation failed | Zod schema validation failed |
| `VALIDATION_REQUIRED_FIELD` | 422 | Required field is missing | Required field not provided |
| `VALIDATION_INVALID_FORMAT` | 422 | Invalid format for field | Wrong data type/format |
| `VALIDATION_CONSTRAINT_VIOLATION` | 422 | Value violates constraint | Check constraint failed |

### Resource Errors (`RESOURCE_*`)

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `RESOURCE_NOT_FOUND` | 404 | Resource not found | ID doesn't exist |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists | Duplicate unique field |
| `RESOURCE_CONFLICT` | 409 | Resource state conflict | Concurrent modification |
| `RESOURCE_LOCKED` | 409 | Resource is locked | Concurrent edit detected |

### System Errors (`SYSTEM_*`)

| Code | HTTP Status | Message | Cause |
|------|-------------|---------|-------|
| `SYSTEM_INTERNAL_ERROR` | 500 | An unexpected error occurred | Unhandled exception |
| `SYSTEM_DATABASE_ERROR` | 500 | Database operation failed | Query/connection error |
| `SYSTEM_EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable | Third-party API failure |
| `SYSTEM_RATE_LIMITED` | 429 | Too many requests | Rate limit exceeded |

## Error Response Examples

### Validation Error (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input validation failed",
    "details": {
      "field_errors": [
        {
          "field": "email",
          "code": "VALIDATION_INVALID_FORMAT",
          "message": "Invalid email format"
        },
        {
          "field": "password",
          "code": "VALIDATION_CONSTRAINT_VIOLATION",
          "message": "Password must be at least 8 characters"
        }
      ]
    },
    "request_id": "req_1234567890abcdef"
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Your session has expired. Please log in again.",
    "request_id": "req_1234567890abcdef"
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Ticket not found",
    "details": {
      "resource_type": "ticket",
      "resource_id": "ticket_123"
    },
    "request_id": "req_1234567890abcdef"
  }
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": {
    "code": "SYSTEM_INTERNAL_ERROR",
    "message": "An unexpected error occurred. Our team has been notified.",
    "request_id": "req_1234567890abcdef"
  }
}
```

## Implementation Guidelines

### 1. Always Include Request ID
Every error response must include a unique `request_id` for tracing.

```typescript
const requestId = crypto.randomUUID();
// Include in all error responses
```

### 2. Use Typed Error Classes
```typescript
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, any>) {
    super('VALIDATION_FAILED', 'Input validation failed', 422, details);
  }
}
```

### 3. Error Middleware Pattern
```typescript
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        request_id: requestId
      }
    });
  }
  
  // Log unexpected errors
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    requestId,
    path: req.path
  });
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'SYSTEM_INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: requestId
    }
  });
}
```

## Client-Side Error Handling

### React Query Error Handling
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['tickets'],
  queryFn: () => api.tickets.list()
});

if (isError) {
  const apiError = error as ApiErrorResponse;
  switch (apiError.error.code) {
    case 'AUTH_TOKEN_EXPIRED':
      // Redirect to login
      navigate('/login');
      break;
    case 'PERM_INSUFFICIENT':
      showToast('You do not have permission to view this resource');
      break;
    default:
      showToast(`Error: ${apiError.error.message}`);
  }
}
```

### Toast/Notification Patterns
```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'AUTH_TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  'AUTH_INVALID_CREDENTIALS': 'Invalid email or password.',
  'VALIDATION_FAILED': 'Please check your input and try again.',
  'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
  'PERM_INSUFFICIENT': 'You do not have permission to perform this action.',
  'SYSTEM_INTERNAL_ERROR': 'An unexpected error occurred. Please try again later.',
  'SYSTEM_RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
};

function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || 'An unexpected error occurred. Please try again.';
}
```

## Logging Standards

### Structured Logging Format
```typescript
logger.error('API Error', {
  requestId: 'req_1234567890abcdef',
  userId: 'user_9876543210abcdef',
  error: {
    code: 'VALIDATION_FAILED',
    message: 'Email format invalid',
    path: '/api/v1/tickets',
    method: 'POST'
  },
  timestamp: new Date().toISOString()
});
```

### Required Log Fields
- `requestId` - Unique request identifier
- `userId` - Authenticated user (if available)
- `error.code` - Standardized error code
- `error.message` - Human-readable message
- `path` - Request path
- `method` - HTTP method
- `timestamp` - ISO 8601 format

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Error Rate by Type** - Track 4xx vs 5xx ratios
2. **Error Rate by Endpoint** - Identify problematic endpoints
3. **Error Rate by User** - Detect problematic users/accounts
4. **Latency Impact** - Errors often correlate with slow responses

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| 5xx Error Rate | > 1% | > 5% |
| 4xx Error Rate | > 10% | > 25% |
| Auth Error Rate | > 5% | > 20% |
| Validation Error Rate | > 15% | > 30% |

## Best Practices Summary

1. **Never expose stack traces** in production error responses
2. **Always include request_id** for traceability
3. **Use consistent error codes** across all endpoints
4. **Log server errors** with full context for debugging
5. **Return user-friendly messages** in error responses
6. **Implement retry logic** for transient errors (network, timeouts)
7. **Rate limit** authentication endpoints
8. **Validate early** - fail fast with clear validation errors
9. **Sanitize error details** - don't leak sensitive data
10. **Test error paths** - Write tests for error scenarios

---

*Last updated: 2026-06-26*
*MCT Portal API Team*