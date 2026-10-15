# 25_multi_tenant_isolation_attack_simulation — Prompt 25 - Multi-Tenant Isolation Attack Simulation

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `25_multi_tenant_isolation_attack_simulation.md` (area MT, prompt)

## Verification Performed

Domain subagent produced 14 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| MT-P1-001 | P1 | Audit log list and export are not org-scoped by default |
| MT-P1-002 | P1 | Platform dashboards expose all-tenant aggregates to any single-org admin |
| MT-P1-003 | P1 | Public file-request upload authorizes with a permission unioned across all orgs |
| MT-P1-004 | P1 | Response cache keys omit the caller's tenant scope, so all-tenant responses can be served to single-org members |
| MT-P2-001 | P2 | Admin global search lists all organizations and can fall through unscoped |
| MT-P2-002 | P2 | By-id org filters are conditional, so they fail open if the org gate is not reached |
| MT-P2-003 | P2 | Storage writer path and RLS org-derivation disagree (`orgs/<uuid>/` vs `<uuid>/`) |
| MT-P2-004 | P2 | Realtime/SSE notification channel is scoped by user only, with no org assertion |
| MT-P2-005 | P2 | Platform-admin cross-tenant access is role-key based, broad, and unalerted |
| MT-P2-006 | P2 | Platform-wide report generators run as service role with no tenant guard on scope inputs |
| MT-P2-007 | P2 | Client-portal entitlement routes order requireAdmin before requireOrgAccess, bypassing the org-pinned admin check |
| MT-P2-008 | P2 | Platform-wide store intake and analytics endpoints are readable by any tenant admin with no cross-tenant gate |
| MT-P3-001 | P3 | No automated cross-tenant isolation regression suite for application-layer scoping |
| MT-P3-002 | P3 | Admin notification create accepts an arbitrary recipient and org-less rows bypass the SSE scope assertion |
