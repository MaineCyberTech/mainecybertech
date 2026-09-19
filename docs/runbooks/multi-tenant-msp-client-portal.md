# Multi-Tenant MSP Client Portal - Runbook

## Owner

Platform Engineering / Service Delivery Operations

## Normal Operation

### Daily

- Monitor portal error boundaries (dashboard, projects, documents) for 5xx spikes
- Confirm active-org resolution for multi-org users (org switcher cookie)
- Spot-check that ticket creation and document upload work for a sample org

### Weekly

- Review audit log volume and any failed `requireOrgAccess` denials
- Verify membership approval queue has no stale pending requests
- Confirm rate-limit counters are not being exhausted by portal lists (per-user 600/15min)

### Monthly

- Audit roles/permissions assignments against client agreements
- Rotate JWT secret per `docs/JWT_ROTATION.md`
- Review RLS policy drift between environments

## Common Failures

### 1. Tenant Isolation Breach

**Symptoms**: A user sees another organization's records, or an org-scoped query returns data outside the active org
**Causes**:

- Router mounted without `requireOrgAccess`
- Entity route filters by `id` only and skips `organization_id`
- Active-org cookie points at a non-member org
  **Resolution**:

1. Reproduce with the affected user and org
2. Verify the router uses `requireOrgAccess` (all entity routers do)
3. Confirm by-id routes filter on `organization_id` (e.g. `GET /api/v1/tickets/:id`)
4. Check RLS policies: `psql -c "SELECT * FROM pg_policies WHERE tablename = 'tickets';"`
5. Clear the `mct_active_org` cookie and retry

### 2. Platform Admin Default Org Misrouting

**Symptoms**: Superadmin/admin can't find a project/document outside their "default" org; 404 "Project not found"
**Causes**:

- `resolveDefaultOrgId` injected the first membership org for a platform admin
- By-id routes applied the injected default org filter
  **Resolution**:

1. Confirm user has an admin/super_admin role in any approved membership
2. Verify request is tagged `orgAccessPlatformAdmin` and no default org is injected
3. Ensure by-id detail routes scope to the entity's own org for platform admins
4. Pass an explicit `organizationId` from the portal page

### 3. Portal Redirect Loop

**Symptoms**: `/login` ↔ `/portal/dashboard` infinite redirect
**Causes**:

- `mct_session` cookie present but middleware JWT decode fails (expired/rotated secret)
- Portal/admin layout redirects to `/login` on a non-401 error
  **Resolution**:

1. Check browser cookies for `mct_session`; decode payload and verify `exp`
2. Confirm `JWT_SECRET` on API matches the secret used to issue the session
3. Layouts must only redirect on 401/403; transient 429/5xx render the error boundary

### 4. Empty Org Lists

**Symptoms**: Portal list pages render "No ... found" even though rows exist
**Causes**:

- `organization_id` query param mismatch (active org vs data org)
- Membership status not `approved`
- API returning 401/403 silently caught by page try/catch
  **Resolution**:

1. Check the request's `X-Active-Org` header value
2. Query the table directly: `SELECT organization_id, count(*) FROM tickets GROUP BY 1;`
3. Verify membership: `SELECT status FROM memberships WHERE user_id = auth.uid() AND organization_id = '<org>';`

## Verification Steps

### Health Check

```bash
# API health
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/me

# Permission union
curl -H "Authorization: Bearer $TOKEN" https://api.mainecybertech.com/api/v1/me/permissions

# Org-scoped list
curl -H "Authorization: Bearer $TOKEN" -H "X-Active-Org: $ORG_ID" \
  https://api.mainecybertech.com/api/v1/tickets
```

### Data Integrity

```sql
-- Memberships without an approved profile
SELECT m.* FROM memberships m
LEFT JOIN profiles p ON p.id = m.user_id
WHERE p.id IS NULL;

-- Orphaned entities (should be empty)
SELECT d.* FROM documents d
LEFT JOIN organizations o ON o.id = d.organization_id
WHERE o.id IS NULL;

-- Suspended orgs still receiving new tickets
SELECT t.organization_id, count(*) FROM tickets t
JOIN organizations o ON o.id = t.organization_id
WHERE o.status = 'suspended'
GROUP BY 1;
```

## Escalation

| Severity                             | Contact           | SLA            |
| ------------------------------------ | ----------------- | -------------- |
| P0 - Cross-tenant data exposure      | Platform Engineer | 15 min         |
| P0 - All portals 5xx                 | Platform Engineer | 30 min         |
| P1 - Single org cannot access portal | Backend Engineer  | 2 hours        |
| P2 - Rate limiting too aggressive    | Backend Engineer  | 4 hours        |
| P3 - Cosmetive list/empty state      | Frontend Engineer | 1 business day |

## Rollback Notes

### Migration Rollback

Core bootstrap tables are shared by every module. Never `DROP` them without a full platform freeze:

```sql
-- Restrictive change example: revoke a bad RLS policy
DROP POLICY IF EXISTS "policy_name" ON public.tickets;
```

### API Rollback

1. Revert `apps/api/src/app.ts` router registration changes
2. Revert `apps/api/src/middleware/org-access.ts` / `resolveDefaultOrgId`
3. Deploy previous API image

### Web Rollback

1. Revert portal layout / RouteGuard / sidebar permission changes
2. Deploy previous Web image

## Monitoring

- **Metric**: `mct_requests_401` (counter) - auth failures, spikes indicate session issues
- **Metric**: `mct_requests_403` (counter) - authorization denials, spikes indicate scope bugs
- **Metric**: `mct_active_orgs` (gauge) - distinct active orgs over time
- **Metric**: `mct_portal_error_boundary_hits` (counter) - client error boundary renders
- **Alert**: 403 rate > 5% of authenticated requests → P1 (possible scope bug)
- **Alert**: Error boundary hits in top-5 portal pages > 10/hour → P2

## Related Documentation

- Feature spec: `docs/features/multi-tenant-msp-client-portal.md`
- Architecture: `docs/CODE_REVIEW_2026-06-16.md`
- API inventory: `docs/API_ENDPOINT_INVENTORY.md`
- Database schema: `supabase/migrations/5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql`
