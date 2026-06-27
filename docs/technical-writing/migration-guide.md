# MCT Portal Migration Guide

## Overview

This document provides comprehensive guidance for deploying changes, managing database migrations, and troubleshooting deployment issues for the MCT client portal.

## Migration Types

### 1. Database Migrations (Supabase)

#### Running Migrations

```bash
# Local development
pnpm supabase:reset:auto    # Full reset with seed data
pnpm supabase:env:sync      # Sync local env with Supabase

# Production (via CI/CD)
# Migrations run automatically via GitHub Actions on merge to main
```

#### Migration Naming Convention

All migrations follow the timestamp-based convention:

```
<YYYYMMDDHHMMSS>_<descriptive_name>.sql
```

Examples:
- `20240115120000_create_users_table.sql`
- `20240115120001_add_email_uniqueness_constraint.sql`
- `20240115120002_update_user_status_enum.sql`

See `docs/migrations/naming-guide.md` for detailed guidelines.

#### Creating New Migrations

```bash
# Create new migration file
supabase migration new <descriptive_name>

# Example
supabase migration new add_user_avatar_column
# Creates: supabase/migrations/20240626120000_add_user_avatar_column.sql
```

#### Migration Best Practices

1. **Always use transactions** (automatic with Supabase)
2. **Make migrations idempotent** when possible
3. **Add indexes concurrently** for large tables:
   ```sql
   CREATE INDEX CONCURRENTLY idx_tickets_status ON tickets(status);
   ```
4. **Test on staging first** - Run against production-like data
5. **Have rollback plan** - Document rollback steps in migration file comments

### 2. Application Deployments

#### API Deployment

```bash
# Local build
pnpm --filter=api build

# Production (via CI/CD)
# Triggered on merge to main branch
# Runs: pnpm build -> pnpm test -> docker build -> deploy to DigitalOcean
```

#### Web Deployment

```bash
# Local development
pnpm --filter=web dev

# Production build
pnpm --filter=web build
# Output: apps/web/.next/standalone

# Production (via CI/CD)
# Triggered on merge to main
# Runs: pnpm build -> pnpm test -> pnpm e2e -> docker build -> deploy
```

#### Worker Deployment

```bash
# Local development
pnpm --filter=worker dev

# Production (via CI/CD)
# Runs alongside API deployment
# Includes health check verification
```

### 3. Configuration Changes

#### Environment Variables

**Adding New Variables:**
1. Add to `apps/api/.env.example` (and web/worker equivalents)
2. Update `docs/ENVIRONMENT_VARIABLES.md`
3. Add to GitHub Secrets for CI/CD
4. Update Terraform variables if infrastructure-related

**Required for Each Environment:**
| Variable | Dev | Prod |
|----------|-----|------|
| `SUPABASE_URL` | ✅ | ✅ |
| `SUPABASE_ANON_KEY` | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ |
| `JWT_SECRET` | ✅ | ✅ |
| `CORS_ORIGIN` | ✅ | ✅ |
| `STRIPE_SECRET_KEY` | ✅ | ✅ |

#### Feature Flags (Future)

When feature flags are implemented:
```typescript
// Feature flag configuration
const flags = {
  NEW_TICKET_UI: process.env.FEATURE_NEW_TICKET_UI === 'true',
  ADVANCED_SEARCH: process.env.FEATURE_ADVANCED_SEARCH === 'true',
};
```

## Deployment Procedures

### Standard Deployment (Production)

1. **Pre-deployment Checklist**
   - [ ] All tests passing (local `pnpm test`)
   - [ ] TypeScript checks passing (`pnpm typecheck`)
   - [ ] Linting passing (`pnpm lint`)
   - [ ] E2E tests passing (`pnpm e2e`)
   - [ ] Code review approved

2. **Deployment Process**
   - Merge to `main` branch
   - GitHub Actions runs validation pipeline
   - On success: automatic deployment to DigitalOcean
   - Health checks verify deployment
   - Rollback on health check failure

3. **Post-deployment Verification**
   - Health endpoints: `/health`, `/metrics`
   - Critical user flows (login, create ticket, upload doc)
   - Error rate monitoring (Sentry)
   - Database migration status

### Emergency Deployment (Hotfix)

1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track review (1 approver minimum)
3. Merge to `main`
4. Monitor deployment closely
5. Backport fix to `develop` if needed

### Rollback Procedures

#### Application Rollback
```bash
# Via GitHub Actions (preferred)
# Go to Actions > deploy-do > Run workflow > select previous SHA

# Or manual Docker rollback on server
docker tag ghcr.io/mainecybertech/mct-api:<previous-sha> ghcr.io/mainecybertech/mct-api:current
docker compose up -d
```

#### Database Rollback
```bash
# Supabase doesn't support automatic rollback
# Manual process:
# 1. Create new migration that reverses changes
# 2. Apply via supabase db push
# 3. Verify data integrity

# For critical rollbacks:
# 1. Restore from point-in-time backup
# 2. Supabase Dashboard > Backups > Restore
```

## Troubleshooting Deployments

### Common Issues

| Issue | Symptom | Resolution |
|-------|---------|------------|
| Health check fails | `/health` returns 503 | Check API logs, verify Supabase connectivity |
| Build fails | TypeScript errors | Run `pnpm typecheck` locally first |
| Test failures | CI pipeline red | Run `pnpm test` locally, fix failures |
| Migration timeout | Deployment hangs | Check Supabase dashboard for locks |
| CORS errors | Frontend can't call API | Verify `CORS_ORIGIN` includes frontend domain |

### Debugging Commands

```bash
# Check deployment logs
gh run view <run-id> --log

# Check service health
curl https://api.mainecybertech.com/health
curl https://app.mainecybertech.com/api/health

# Check database
pnpm supabase:status

# View API logs
ssh root@<server> "docker logs mct-api --tail 100"
```

## Version Management

### Semantic Versioning

| Version | When to Bump |
|---------|--------------|
| MAJOR (1.0.0) | Breaking API changes, schema changes |
| MINOR (1.1.0) | New features, non-breaking |
| PATCH (1.1.1) | Bug fixes, minor improvements |

### Release Process

1. Update version in `package.json` (root and all packages)
2. Update `CHANGELOG.md`
3. Create Git tag: `git tag v1.2.0`
4. Push tag: `git push origin v1.2.0`
5. GitHub Actions creates release

## Rollback Decision Matrix

| Scenario | Rollback Type | Time Estimate |
|----------|---------------|---------------|
| Critical bug in production | Full rollback | 5-10 minutes |
| Performance regression | Partial rollback | 10-15 minutes |
| Data corruption | Database restore | 30-60 minutes |
| Security vulnerability | Immediate rollback + patch | ASAP |

## Communication

### Pre-deployment
- Notify team via Slack `#deployments`
- Include: scope, risk level, rollback plan

### Post-deployment
- Confirm success in `#deployments`
- Note any issues for retrospective
- Update runbooks if new issues discovered

---

## Quick Reference

### Useful Commands

```bash
# Full local test suite
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Full CI simulation
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Database operations
pnpm supabase:start     # Start local Supabase
pnpm supabase:reset:auto # Full reset with seeds
pnpm supabase:status    # Check Supabase status

# Deployment
pnpm deploy             # Trigger manual deploy (if configured)
pnpm e2e                # Run E2E tests
```

### Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/*.sql` | Database schema changes |
| `apps/api/.env.example` | API environment template |
| `apps/web/.env.example` | Web environment template |
| `infra/terraform/digitalocean/` | Infrastructure as Code |
| `.github/workflows/` | CI/CD pipelines |

### Monitoring Endpoints

| Service | Health Check | Metrics |
|---------|--------------|---------|
| API | `GET /health` | `GET /metrics` |
| Web | `GET /` (200 OK) | N/A |
| Worker | `GET /health` | `GET /metrics` |

---

*Last updated: 2026-06-26*
*MCT Portal Engineering Team*