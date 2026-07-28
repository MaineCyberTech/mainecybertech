# SOP Library Compliance Mapper

**Category:** Compliance
**API Routes:** `apps/api/src/routes/sop-library.ts`
**SDK:** `packages/sdk/src/sop-library.ts`

## Overview

Standard Operating Procedure library with compliance framework mapping. Links SOPs to regulatory controls (CMMC 2.0, NIST 800-171, HIPAA, PCI DSS, GDPR) and tracks review cycles, version history, and staff acknowledgment.

## Key Features

- SOP CRUD with rich content (markdown body, category tags, applicable frameworks)
- Compliance control mapping — link each SOP to specific framework controls with evidence references
- Version history with diff tracking and mandatory review period configuration
- Review cycle management with automated reminders at 30/60/90 days before expiry
- Staff acknowledgment tracking — who has read and accepted each SOP
- Gap analysis report — which controls lack associated SOPs

## Endpoints

| Method | Path                         | Description                                                        |
| ------ | ---------------------------- | ------------------------------------------------------------------ |
| GET    | /api/v1/sops                 | List SOPs (paginated, filterable by org/framework/category/status) |
| POST   | /api/v1/sops                 | Create SOP                                                         |
| GET    | /api/v1/sops/:id             | Get SOP with versions and control mappings                         |
| PATCH  | /api/v1/sops/:id             | Update SOP                                                         |
| DELETE | /api/v1/sops/:id             | Delete SOP                                                         |
| POST   | /api/v1/sops/:id/versions    | Create new version                                                 |
| GET    | /api/v1/sops/:id/versions    | List version history                                               |
| POST   | /api/v1/sops/:id/acknowledge | Record staff acknowledgment                                        |
| GET    | /api/v1/sops/:id/gap-report  | Compliance gap analysis                                            |
| GET    | /api/v1/sops/reviews         | SOPs due or overdue for review                                     |

## Data Model

`sops` (organization_id, title, category, body_markdown, version, status (draft/active/archived), review_interval_days, last_reviewed_at, next_review_at). `sop_control_mappings` (sop_id, framework, control_id, evidence_ref). `sop_acknowledgments` (sop_id, user_id, acknowledged_at). `sop_versions` (sop_id, version, body_markdown, created_by, created_at).

## Access Control

- Admin: full CRUD, version management, view acknowledgments
- Client: read active SOPs, acknowledge their own reading
- requireAuth + requireOrgAccess on all endpoints
- Audit logging on create, update, delete, version creation, and acknowledgment
