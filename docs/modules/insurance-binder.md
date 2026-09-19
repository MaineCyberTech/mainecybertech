# Insurance Binder

**Category:** Compliance
**API Routes:** `apps/api/src/routes/insurance-binder.ts`
**SDK:** `packages/sdk/src/insurance-binder.ts`

## Overview

Insurance evidence management and coverage tracking tool for MSP clients. Organizations upload and manage proof of cyber insurance and other coverage lines across 8 standard coverage areas. A coverage completeness dashboard identifies gaps, expired policies, and upcoming renewals.

## Key Features

- Full CRUD management of insurance evidence documents and policy metadata
- Coverage report grouped by 8 standard coverage areas with completeness percentages
- 8 coverage areas tracked: General Liability, Professional Liability (E&O), Cyber Liability, Directors & Officers, Workers Compensation, Commercial Property, Umbrella/Excess, Crime/Fidelity
- Policy date tracking with effective date, expiration date, and renewal reminders
- Coverage amount tracking per policy with carrier name and policy number
- Document attachment support for certificate uploads (PDF, image)
- Gap analysis dashboard identifying missing or expiring coverage areas
- Status tracking per evidence record: active, expiring (within 30 days), expired, pending
- Coverage completeness calculated as percentage of 8 areas that have active evidence
- Search and filter by coverage area, carrier, or status
- Audit logging on all mutation endpoints
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                                     | Description                                                                                                    |
| ------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| GET    | /api/v1/insurance-binder                 | List insurance evidence records (paginated, filterable by coverage area, status)                               |
| GET    | /api/v1/insurance-binder/:id             | Get single evidence record with full policy details                                                            |
| POST   | /api/v1/insurance-binder                 | Create new insurance evidence entry with coverage details                                                      |
| PATCH  | /api/v1/insurance-binder/:id             | Update evidence record, policy details, or document                                                            |
| DELETE | /api/v1/insurance-binder/:id             | Remove evidence record                                                                                         |
| GET    | /api/v1/insurance-binder/coverage-report | Coverage summary grouped by 8 areas: coverage_name, has_active, policy_count, total_coverage, completeness_pct |

## Data Model

Key fields: `insurance_evidence` (organization_id, coverage_area, carrier_name, policy_number, coverage_amount, effective_date, expiration_date, document_url, notes, status, created_by) — RLS scoped to organization_id

## Access Control

- Admin: full CRUD and coverage report across all records in org
- Client: view insurance binder with coverage gaps highlighted (portal), upload evidence documents

## SDK

```typescript
sdk.insuranceBinder.list(filters?)         // List evidence records
sdk.insuranceBinder.get(id)                // Get single record
sdk.insuranceBinder.create(data)           // Create evidence entry
sdk.insuranceBinder.update(id, data)       // Update policy details
sdk.insuranceBinder.remove(id)             // Remove record
sdk.insuranceBinder.coverageReport()       // Coverage completeness report
```
