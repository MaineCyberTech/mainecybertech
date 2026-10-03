# MSP SOP Library & Compliance Mapper

**Category:** Governance / Edu & Automation
**API Routes:** `apps/api/src/routes/governance.ts` (mounted at `/api/v1/governance`) + `apps/api/src/routes/edu-automation.ts` (mounted at `/api/v1/edu-automation`)
**SDK:** `packages/sdk/src/governance.ts` (`governance.sopLibrary`) + `packages/sdk/src/edu-automation.ts` (`eduAutomation.sop`)
**Table:** `sop_library` (migration `5302086_sop_library_compliance.sql`)

## Overview

Versioned SOP and procedure library mapped to compliance frameworks (NIST, ISO 27001, CIS, HIPAA-adjacent, PCI-adjacent, CMMC-readiness). Tracks review cycles, ownership, and framework control mappings, with compliance-map and framework-gap reporting.

## Key Features

- Versioned SOP records with category, status, review cycle, owner, tags, and document URL
- Framework mapping via `compliance_framework` + `framework_control_ids`
- `GET /sop-library/compliance-map` — SOP-to-framework control coverage
- `GET /sop-library/framework-gaps` — per-framework coverage gaps
- Accessible via both `/api/v1/governance/sop-library` and `/api/v1/edu-automation/sop` (same table)

## Endpoints

| Method | Path                                          | Description                       |
| ------ | --------------------------------------------- | --------------------------------- |
| GET    | /api/v1/governance/sop-library                | List SOPs (paginated, org-scoped) |
| GET    | /api/v1/governance/sop-library/:id            | Get single SOP                    |
| POST   | /api/v1/governance/sop-library                | Create SOP                        |
| PATCH  | /api/v1/governance/sop-library/:id            | Update SOP                        |
| DELETE | /api/v1/governance/sop-library/:id            | Delete SOP                        |
| GET    | /api/v1/governance/sop-library/compliance-map | SOP/framework coverage map        |
| GET    | /api/v1/governance/sop-library/framework-gaps | Per-framework gaps                |

## Data Model

`sop_library` (id, organization_id, title, description, sop_category, compliance_framework, framework_control_ids text[], status, review_cycle_days, last_reviewed_at, next_review_at, owner_user_id, document_url, tags text[], created_by, created_at, updated_at).

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `sop_library` org policies
- Admin pages at `apps/web/app/(admin)/admin/edu-automation/sop/`; portal read-only list at `apps/web/app/(portal)/portal/sop-library/`
