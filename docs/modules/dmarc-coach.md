# DMARC Coach

**Category:** Security
**API Routes:** `apps/api/src/routes/dmarc-coach.ts`
**SDK:** `packages/sdk/src/dmarc-coach.ts`

## Overview

DMARC analysis and coaching tool that evaluates domain email authentication posture. Analyzes DMARC, SPF, and DKIM DNS records for configured domains, assigns an A-F letter grade based on configuration quality, and generates structured, actionable recommendations to improve email security and prevent spoofing.

## Key Features

- Full CRUD management of DMARC analysis records per domain
- Automated DNS analysis evaluating DMARC policy, SPF records, and DKIM configuration
- Letter grading system: A (full protection, strict policy), B (full records, relaxed policy), C (partial records), D (minimal config), F (missing authentication)
- Issue detection: missing DMARC record, SPF too permissive (+all), DKIM key too short, no subdomain policy, no aggregate reporting (rua), no forensic reporting (ruf), misaligned identifiers
- Structured recommendations per issue with remediation steps and priority levels
- Domain grouping with per-org view and last analysis date tracking
- Re-analysis on demand for any domain
- Analysis results stored as JSON for historical comparison
- Audit logging on all mutation endpoints
- RLS enforcement scoping all queries to organization_id

## Endpoints

| Method | Path                        | Description                                                                          |
| ------ | --------------------------- | ------------------------------------------------------------------------------------ |
| GET    | /api/v1/dmarc-coach         | List analyses (paginated, filterable by domain, grade, org)                          |
| GET    | /api/v1/dmarc-coach/:id     | Get single analysis with issues and recommendations                                  |
| POST   | /api/v1/dmarc-coach         | Create a new domain analysis record                                                  |
| PATCH  | /api/v1/dmarc-coach/:id     | Update analysis metadata or domain                                                   |
| DELETE | /api/v1/dmarc-coach/:id     | Remove analysis record                                                               |
| POST   | /api/v1/dmarc-coach/analyze | Run analysis: evaluate DMARC/SPF/DKIM, assign grade, generate issues/recommendations |

## Data Model

Key fields: `dmarc_analyses` (organization_id, domain, dmarc_record, spf_record, dkim_records, overall_grade, issues (jsonb), recommendations (jsonb), last_analyzed_at, created_by) — issues array contains type, description, severity; recommendations array contains action, priority, detail

## Access Control

- Admin: full CRUD and analysis across all org domains
- Client: view analyses for their organization; request re-analysis

## SDK

```typescript
sdk.dmarcCoach.list(filters?)    // List analyses
sdk.dmarcCoach.get(id)           // Get single analysis
sdk.dmarcCoach.create(data)      // Create analysis record
sdk.dmarcCoach.update(id, data)  // Update analysis
sdk.dmarcCoach.remove(id)        // Delete analysis
sdk.dmarcCoach.analyze(domain)   // Run DMARC/SPF/DKIM evaluation
```
