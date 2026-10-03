# Business OS

**Category:** Admin
**API Routes:** `apps/api/src/routes/business-os.ts`

## Overview

Admin-only dashboard aggregation endpoints. Provides a summary of platform-wide stats (organizations, tickets, projects, documents, approvals, users), overdue approvals, recent audit activity, and per-organization health metrics. All endpoints are cached at varying TTLs.

## Key Features

- Platform summary with counts across all entities
- Overdue approval requests (past due, still pending)
- Recent audit activity feed
- Per-organization health (open tickets + active projects, sorted by ticket count)
- Varying cache TTLs per endpoint (15s–60s)

## Endpoints

| Method | Path                                  | Description                                        |
| ------ | ------------------------------------- | -------------------------------------------------- |
| GET    | /api/v1/business-os/summary           | Platform-wide stats (cached 30s)                   |
| GET    | /api/v1/business-os/approvals-overdue | Pending approvals past due (cached 30s)            |
| GET    | /api/v1/business-os/recent-activity   | Recent audit logs (cached 15s, configurable limit) |
| GET    | /api/v1/business-os/org-health        | Per-org ticket/project counts (cached 60s)         |

## Data Model

Reads: `organizations`, `tickets`, `projects`, `documents`, `approval_requests`, `profiles`, `audit_logs`
Writes: none (read-only endpoints)

## Access Control

- Admin only — all endpoints require `requireAuth` + `requireAdmin`
