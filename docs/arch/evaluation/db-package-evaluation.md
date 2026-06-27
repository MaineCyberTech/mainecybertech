# Shared DB Package Evaluation

## Executive Summary

This document evaluates the feasibility and benefits of creating a shared `@mct/db` package for the MCT Client Portal monorepo.

## Current State Analysis

### Current Database Access Patterns

| Service | Database Access | Pattern |
|---------|-----------------|---------|
| API | Supabase Admin Client | Direct `supabaseAdmin` instance in `apps/api/src/services/supabase.ts` |
| API | Supabase User Client | Per-request `supabaseUser` with JWT |
| Worker | Supabase Admin Client | Direct in `apps/worker/src/main.ts` |
| Web | None | No direct DB access (uses SDK/API) |

### Current Code Duplication

| Component | API | Worker | Duplication |
|-----------|-----|--------|-------------|
| Supabase client creation | ✅ | ✅ | High |
| Admin client factory | ✅ | ✅ | Medium |
| User client with JWT | ✅ | ❌ | N/A |
| Circuit breaker wrapper | ✅ | ❌ | Low |
| Error handling | ✅ | ✅ | Medium |

## Evaluation Criteria

| Criterion | Weight | Current Score | With Shared Package |
|-----------|--------|---------------|---------------------|
| Code Duplication Reduction | 30% | 4/10 | 8/10 |
| Maintainability | 25% | 5/10 | 7/10 |
| Type Safety | 20% | 6/10 | 8/10 |
| Performance | 15% | 7/10 | 7/10 |
| Complexity | 10% | 8/10 | 5/10 |

**Weighted Score: 5.8/10 (Current) → 6.8/10 (With Shared Package)**

## Detailed Analysis

### Benefits of Shared Package

#### 1. **Eliminates Client Initialization Duplication**
```typescript
// Before: Duplicated in api/src/services/supabase.ts and worker/src/main.ts
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// After: Single source of truth
import { createAdminClient, createUserClient } from '@mct/db';
const admin = createAdminClient();
const user = createUserClient(jwt);
```

#### 2. **Centralized Configuration**
- Single source for Supabase URL/keys
- Consistent client options across services
- Easy to update globally

#### 3. **Type Safety**
```typescript
// Shared types
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: UserInsert; Update: UserUpdate };
      tickets: { Row: Ticket; Insert: TicketInsert; Update: TicketUpdate };
      // ...
    };
  };
}
```

#### 4. **Consistent Error Handling**
```typescript
// Shared error wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Database error in ${context}`, { error });
    throw new DatabaseError(context, error);
  }
}
```

### Drawbacks & Risks

#### 1. **Added Complexity**
- New package to maintain and version
- Additional dependency in `package.json`
- Build pipeline complexity

#### 2. **Coupling Concerns**
- API and Worker have different access patterns
- API needs both admin and user clients
- Worker only needs admin client
- Shared package might force unwanted coupling

#### 3. **Deployment Complexity**
- Need to publish/package `@mct/db` before deploying services
- Version synchronization across services
- Potential for version mismatch

#### 3. **Migration Overhead**
- Existing code works perfectly
- Refactoring risk for minimal gain
- Current pattern is well-understood by team

## Recommendation

### **Keep Current Approach** - Do Not Create Shared Package

**Rationale:**
1. **Current duplication is minimal and well-understood** - Only ~50 lines of client initialization code
2. **Services have different needs** - API needs user client + admin; Worker only needs admin
3. **No immediate pain point** - Current approach works reliably
4. **YAGNI principle** - Don't add complexity until there's a real need
5. **Single-tenant architecture** - No multi-tenant complexity requiring shared utilities

### When to Reconsider

Create shared `@mct/db` package **IF** any of these occur:
- [ ] Expands to multi-tenant SaaS with complex tenant isolation
- [ ] Team grows significantly requiring stricter code standards
- [ ] Need advanced connection pooling/management across services
- [ ] Seeking significant code consolidation (>500 lines duplication)
- [ ] Adding new services that need database access
- [ ] Regulatory requirements demand centralized audit trail

## Alternative Improvements (Lower Effort)

Instead of a shared package, consider these incremental improvements:

### 1. Shared Utility Functions (Already Done)
```typescript
// apps/web/lib/test-utils.ts - Already created
export function createMockBuilder() { ... }
export function setupAdminPageMocks() { ... }
```

### 2. Shared Configuration Constants
```typescript
// packages/config/src/constants.ts
export const SUPABASE_CLIENT_OPTIONS = {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
  global: { headers: { 'x-application-name': 'mct-portal' } }
};
```

### 3. Shared Error Classes
```typescript
// packages/config/src/errors.ts
export class DatabaseError extends Error {
  constructor(public readonly context: string, public readonly originalError: Error) {
    super(`Database error in ${context}: ${originalError.message}`);
  }
}
```

### 4. Shared Type Definitions
```typescript
// packages/config/src/types.ts
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}
```

## Decision Matrix

| Factor | Shared Package | Current Approach + Utilities |
|--------|----------------|------------------------------|
| **Code Reduction** | ~50 lines | ~50 lines (via utilities) |
| **Maintenance Burden** | High | Low |
| **Type Safety** | Excellent | Good (with shared types) |
| **Deployment Complexity** | Medium | None |
| **Team Learning Curve** | Medium | None |
| **Risk** | Medium | None |
| **Time to Implement** | 1-2 weeks | Already done |

## Conclusion

**Decision: Do not create `@mct/db` package at this time.**

The current architecture with service-specific Supabase clients is:
- ✅ Well-understood and maintainable
- ✅ Appropriately scoped for single-tenant platform
- ✅ No immediate scaling or maintenance issues
- ✅ Zero technical debt from this decision

**Action Items:**
1. ✅ Keep current service-specific Supabase clients
2. ✅ Continue using shared utility functions (`test-utils.ts`, etc.)
3. ✅ Add shared type definitions to `@mct/config` if needed
4. ⬜ Re-evaluate when expanding to multi-tenant SaaS

---

*Last updated: 2026-06-26*
*MCT Portal Architecture Team*