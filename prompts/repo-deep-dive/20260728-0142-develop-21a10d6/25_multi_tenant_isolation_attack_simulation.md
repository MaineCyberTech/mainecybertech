# Multi-Tenant Isolation Attack Simulation

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** MTI

## Executive Summary

Simulated 23 attack vectors across 8 surface areas. Strong application-layer tenant isolation via `requireOrgAccess` middleware in 37 route files, and comprehensive RLS policies. However, `getSupabaseAdmin()` (service_role) bypasses all RLS — **application-layer middleware is the sole line of defense**.

**Risk Score: 42/100 (HIGH)** — 3 Critical, 8 High, 5 Medium findings.

## Critical Findings

### MTI-001: Tickets `GET /:id` No Entity-to-Org Verification

**Severity:** CRITICAL
**Evidence:** `tickets.ts:98-112` fetches ticket by `req.params.id` with NO `organization_id` filter. `requireOrgAccess` checks user belongs to SOME org, but does NOT verify the ticket belongs to that org. `getSupabaseAdmin()` bypasses RLS.
**Attack:** User A (Org A) calls `GET /api/v1/tickets/ticket-123?organization_id=OrgA` → passes org check → returns ticket-123 even if it belongs to Org B.
**Affected routes:** All 60 module routes with `GET /:id` patterns.

### MTI-002: Projects `GET /:id/detail` Cross-Org Member Data Exposure

**Severity:** CRITICAL
**Evidence:** `projects.ts:226-320` — initial project fetch has no org filter. Downstream queries expose membership data, profiles, tasks, comments from other orgs.

### MTI-004: Bulk Ticket Update No Org Filtering

**Severity:** CRITICAL
**Evidence:** `tickets.ts:397-436` — `POST /api/v1/tickets/bulk` accepts `ids` array with no org validation. `bulk_update_with_version` RPC updates any ticket by ID.

## High Findings

- **MTI-003:** Entity sub-resource routes (comments, tasks) lack org verification
- **MTI-005:** Document bulk folder/metadata operations no org filter
- **MTI-006:** Admin search exposes ALL org data (by-design but no audit trail)
- **MTI-008:** Cache key uses non-existent `authUser.orgId` — falls back to userId
- **MTI-016:** Dashboard counts ALL orgs for any admin
- **MTI-018:** Audit log viewer exposes ALL orgs
- **MTI-020:** All API queries bypass RLS via service_role

## Key Recommendation

Add `.eq("organization_id", orgId)` to all entity-by-ID fetches in every route file. This is the single highest-impact fix.
