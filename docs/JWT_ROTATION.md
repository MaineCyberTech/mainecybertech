# JWT Secret Rotation Policy

## Overview
The API supports multiple JWT secrets for zero-downtime key rotation. The `JWT_SECRET` environment variable accepts comma-separated values, with the **first secret used for signing** and **all secrets accepted for verification**.

## Current Implementation

**File:** `apps/api/src/middleware/auth.ts` (lines 20-26)

```typescript
function getJwtSecrets(): string[] {
  const env = getEnv();
  if (!env.JWT_SECRET) return [];
  return env.JWT_SECRET.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
```

The `requireAuth` middleware tries each secret in order until one verifies successfully.

## Rotation Procedure

### 1. Generate New Secret
```bash
# Generate a new 256-bit secret
openssl rand -base64 32
# Example output: K7gNuZsE9fKqR2mX5vP8yL3nB6wTcQ1hR4uI7oA0jZs=
```

### 2. Update GitHub Environment Secrets
Add the new secret to the **front** of the comma-separated list:

**Before:**
```
JWT_SECRET=old-secret-1
```

**After (rotation in progress):**
```
JWT_SECRET=new-secret-1,old-secret-1
```

### 3. Deploy
Trigger deployment for both `dev` and `prod` environments. The API will:
- Sign new tokens with `new-secret-1`
- Accept tokens signed with either `new-secret-1` or `old-secret-1`

### 4. Wait for Token Expiry
Wait for all existing tokens signed with `old-secret-1` to expire (default JWT expiry is 24 hours, configurable via `JWT_EXPIRY`).

### 5. Remove Old Secret
After all old tokens have expired:

```
JWT_SECRET=new-secret-1
```

## Environment Configuration

| Environment | Secret Location |
|-------------|-----------------|
| `dev` | GitHub Environment `dev` → `JWT_SECRET` |
| `prod` | GitHub Environment `prod` → `JWT_SECRET` |

Both are injected into the container via `.env` file written during deployment (see `.github/workflows/deploy-do.yml`).

## Verification
After rotation, verify:
1. New logins work (tokens signed with new secret)
2. Existing sessions remain valid (old secret still accepted)
3. No authentication errors in logs

## Emergency Rotation
If a secret is compromised:
1. Immediately add new secret to front of list
2. Deploy to all environments
3. Force logout all users (optional: clear all sessions in Supabase)
4. Remove compromised secret after token expiry

## Notes
- The rotation supports **multiple old secrets** simultaneously
- No code changes required for rotation
- Rotation is transparent to users
- The `JWT_SECRET` must never be logged or exposed in CI/CD logs