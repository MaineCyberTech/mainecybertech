# Admin Console Abuse Case Audit — Verification Run

## Audit Metadata

- **Run ID:** 20260729-0025-develop-bc76370
- **Previous Run:** 20260728-0142-develop-21a10d6
- **Finding Area Code:** ADM
- **18 commits between runs** — key remediation:
  - dfb5ef8 — Resolve critical audit findings (P0/P1 security)

## Executive Summary

**Previous findings: 16 (2 P0, 6 P1, 5 P2, 3 P3).** ADM-001 partially resolved (documents DELETE, projects DELETE, tickets bulk all now have
equireAdmin). ADM-002 remains a critical architectural concern.

## Finding Resolution Status

### P0 Findings

| ID                                                                                                                                                                                                                                                                                                                                                                                                                                         | Description                                 | Severity    | Status                 | Evidence                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADM-001                                                                                                                                                                                                                                                                                                                                                                                                                                    | Destructive routes lack requireAdmin        | P0 CRITICAL | **PARTIALLY RESOLVED** | ✅ documents.ts:357 (DELETE /:id), projects.ts:425 (DELETE /:id), ickets.ts:408 (POST /bulk) now have                                             |
| equireAdmin. ❌ Still missing on: ssets.ts:291, pprovals.ts:285, domain-monitors.ts:264, ile-requests.ts:174, indings.ts:266, license-optimizer.ts:123, all batch.ts routes, and module routes in client-onboarding, dmarc-coach, dynamic-client-forms, edu-automation, insurance-binder, proposals, service-catalog, security-suite, security-ops, governance, field-services, final, uptime-monitor, status-page, vendors, training-hub. |
| ADM-002                                                                                                                                                                                                                                                                                                                                                                                                                                    | Single-org admin inherits global privileges | P0 CRITICAL | **STILL OPEN**         | org-access.ts lines 27-38: checkOrgAccess() scans ALL memberships — admin in Org A can access any org through any requireOrgAccess-guarded route. |

### P1 Findings

| ID                                                                                                | Description                                       | Status         | Evidence                                                                                  |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| ADM-003                                                                                           | Bulk invite creates accounts without verification | **STILL OPEN** | ulk.ts:33 — POST /invite uses                                                             |
| equireAuth + requireOrgAccess + requireAdmin but no email verification check at account creation. |
| ADM-004                                                                                           | No confirmation dialog for org status changes     | **STILL OPEN** | Org status change dialogs not found.                                                      |
| ADM-005                                                                                           | Server actions lack requireAdminAccess()          | **STILL OPEN** | Server actions in admin pages checked — no widespread requireAdminAccess() pattern found. |
| ADM-006                                                                                           | Webhook deletion uses browser confirm()           | **STILL OPEN** | Webhook deletion should use type-to-confirm pattern.                                      |
| ADM-007                                                                                           | API key/notification deletion lacks confirmation  | **STILL OPEN** | pi-keys.ts and                                                                            |
| otifications.ts routes checked — confirmation patterns absent for these resource types.           |

### P2 Findings

| ID      | Description                                         | Status         | Evidence                                                                              |
| ------- | --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| ADM-008 | No graduated rate limiting for admin ops            | **STILL OPEN** | Rate limiting is per-user globally, not graduated per-operation type for admin users. |
| ADM-009 | No audit logging for admin read operations          | **STILL OPEN** | Admin search and dashboard reads not logged to audit_events.                          |
| ADM-012 | No soft-delete for organizations/documents/projects | **STILL OPEN** | All deletes are hard.                                                                 |

## New Findings

### ADM-NEW-001: 20+ Module DELETE Routes Still Unprotected

**Severity:** P1 HIGH
**Evidence:** Module CRUD routes (assets, approvals, domain-monitors, file-requests, findings, license-optimizer, insurance-binder, proposals, service-catalog, training-hub, security-suite, security-ops, governance, field-services, final, uptime-monitor, status-page, vendors, batch) all have DELETE routes with only
equireAuth +
equireOrgAccess. No
equireAdmin.
**Risk:** Any approved org member can delete module entities.
**Recommendation:** Add
equireAdmin to all module DELETE routes, consistent with the pattern established for documents/projects/tickets.

## Recommendations

1. Add
   equireAdmin to all remaining module DELETE routes (P0, 1-2 days)
2. Add per-org admin scoping to
   equireOrgAccess (P0, 2-3 days)
3. Add type-to-confirm for webhook, API key, and notification deletion (P1, 1 day)
4. Add requireAdminAccess() check to admin server action patterns (P1, 1 day)

---

_Report generated for run 20260729-0025-develop-bc76370. Cross-referenced against previous run 20260728-0142-develop-21a10d6._
