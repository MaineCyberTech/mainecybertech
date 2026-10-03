# DMARC Coach

## Purpose

Analyze email-domain DNS security posture (DMARC, SPF, DKIM records), assign an overall grade, and recommend remediation steps so client domains enforce sender authentication and reduce spoofing/phishing risk.

Primary users: MSP security engineer, client admin

Business impact: High

Category: security

## Permissions

| Action          | Roles                         |
| --------------- | ----------------------------- |
| List analyses   | All authenticated org members |
| View analysis   | All authenticated org members |
| Run analysis    | All authenticated org members |
| Create analysis | All authenticated org members |
| Update analysis | All authenticated org members |
| Delete analysis | admin, super_admin            |

## Routes

### Portal Routes

| Route                     | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `GET /portal/dmarc-coach` | DNS security grade dashboard for client domains |

### Admin Routes

| Route                    | Description                              |
| ------------------------ | ---------------------------------------- |
| `GET /admin/dmarc-coach` | DMARC Coach page with `DmarcAnalyzeForm` |

### API Routes

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| GET    | `/api/v1/dmarc-coach`         | List analyses (paginated)        |
| GET    | `/api/v1/dmarc-coach/:id`     | Get a single analysis            |
| POST   | `/api/v1/dmarc-coach`         | Create an analysis               |
| PATCH  | `/api/v1/dmarc-coach/:id`     | Update an analysis               |
| DELETE | `/api/v1/dmarc-coach/:id`     | Delete an analysis               |
| POST   | `/api/v1/dmarc-coach/analyze` | Run heuristic analysis and grade |

## Data Model

### dmarc_analyses

| Column          | Type        | Constraints                      | Description                            |
| --------------- | ----------- | -------------------------------- | -------------------------------------- |
| id              | uuid        | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                         |
| domain          | text        | NOT NULL                         | Analyzed email domain                  |
| dmarc_record    | text        |                                  | Raw DMARC TXT record                   |
| spf_record      | text        |                                  | Raw SPF TXT record                     |
| dkim_record     | text        |                                  | Raw DKIM TXT record                    |
| dmarc_policy    | text        |                                  | Parsed policy (none/quarantine/reject) |
| alignment_mode  | text        |                                  | strict / relaxed                       |
| pct             | integer     |                                  | DMARC pct value                        |
| overall_grade   | text        |                                  | A+ / A / B / C / F grade               |
| issues          | jsonb       | default '[]'                     | Detected issues array                  |
| recommendations | jsonb       | default '[]'                     | Remediation steps array                |
| analyzed_at     | timestamptz | default now()                    | When analysis ran                      |
| created_by      | uuid        | FK → auth.users(id)              | Who ran the analysis                   |
| created_at      | timestamptz | default now()                    | Creation timestamp                     |

## Workflows

### Run Analysis

1. User submits domain plus optional DMARC/SPF/DKIM TXT records via `POST /analyze`
2. Heuristics check: DMARC presence, policy (`p=none` → no enforcement), `rua=` reporting, `pct=100`, SPF presence, DKIM presence
3. Grade is assigned: F (missing pieces) → C (all present) → B (+`p=quarantine`) → A (+`p=reject` + `pct=100`)
4. Issues and recommendations are stored with the row
5. Audits with `dmarc_analysis.analyzed`

### Client Review

- The portal lists analyses with domain, issue count, and grade badge (A/A+ green, B blue, C amber, else red)
- Recommendations guide moving from `p=none` → `p=quarantine` → `p=reject`

## Troubleshooting

| Issue                | Resolution                                                 |
| -------------------- | ---------------------------------------------------------- |
| Grade always F       | Records not provided or missing DMARC/SPF/DKIM             |
| Analysis returns 404 | Confirm `id` and `organization_id` match caller membership |
| List empty           | No analyses created for the organization yet               |
| Delete denied (403)  | Membership role must be `admin` or `super_admin`           |

## Release Checklist

- [ ] Migration `5302089_dmarc_coach.sql` applied
- [ ] API routes registered at `/api/v1/dmarc-coach` in `apps/api/src/app.ts`
- [ ] SDK module `dmarcCoach` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/dmarc-coach/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/dmarc-coach.spec.ts`
- [ ] Feature doc added to `docs/features/dmarc-coach.md`
- [ ] Runbook added to `docs/runbooks/dmarc-coach.md`
