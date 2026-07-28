# Compliance Readiness Lite

**Category:** Compliance
**API Routes:** `apps/api/src/routes/compliance-readiness.ts`
**SDK:** `packages/sdk/src/compliance-readiness.ts`

## Overview

Lightweight compliance readiness assessment tool for CMMC 2.0, NIST 800-171, HIPAA, and PCI DSS. Provides control-level self-assessments, evidence collection, scoring dashboards, and gap analysis. Designed for MSPs with SMB clients who need a cost-effective compliance baseline.

## Key Features

- Framework selection per assessment — CMMC Level 1/2, NIST 800-171, HIPAA, PCI DSS SAQ
- Control-level self-assessment with status (implemented/partially-implemented/not-implemented/not-applicable)
- Evidence attachment per control (screenshots, policy docs, configuration exports)
- Scoring dashboard with overall percentage, domain breakdowns, and trend over time
- Gap analysis report — prioritized remediation roadmap sorted by control severity
- Assessment lifecycle — draft, in-progress, submitted, reviewed, closed
- Readiness score export (PDF summary with scorecard and key findings)

## Endpoints

| Method | Path                                                   | Description                                                      |
| ------ | ------------------------------------------------------ | ---------------------------------------------------------------- |
| GET    | /api/v1/compliance/assessments                         | List assessments (paginated, filterable by org/framework/status) |
| POST   | /api/v1/compliance/assessments                         | Create assessment                                                |
| GET    | /api/v1/compliance/assessments/:id                     | Get assessment with all control responses                        |
| PATCH  | /api/v1/compliance/assessments/:id                     | Update assessment metadata                                       |
| DELETE | /api/v1/compliance/assessments/:id                     | Delete assessment                                                |
| PUT    | /api/v1/compliance/assessments/:id/controls/:controlId | Submit control response with evidence                            |
| GET    | /api/v1/compliance/assessments/:id/dashboard           | Scoring dashboard per assessment                                 |
| GET    | /api/v1/compliance/assessments/:id/gap-analysis        | Prioritized gap report                                           |
| GET    | /api/v1/compliance/assessments/:id/export              | Export readiness report as PDF                                   |

## Data Model

`compliance_assessments` (organization_id, framework, version, status, overall_score, domain_scores JSON, started_by, started_at, submitted_at, reviewed_by, closed_at). `compliance_control_responses` (assessment_id, control_id, domain, status, evidence_paths text[], notes, assessed_by, assessed_at). Control definitions loaded from framework template seed data keyed by (framework, version).

## Access Control

- Admin: full CRUD, submit responses, review and close assessments
- Client: initiate and complete self-assessments for their org, view own scores
- requireAuth + requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on assessment create, control response, submission, review, and export
