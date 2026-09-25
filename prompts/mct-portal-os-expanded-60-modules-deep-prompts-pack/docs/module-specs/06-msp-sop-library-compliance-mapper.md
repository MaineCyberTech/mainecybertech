# 6. MSP SOP Library Compliance Mapper

## Category

governance

## Business impact

High

## Primary users

MSP owner, compliance reviewer, technician

## Purpose

Versioned SOP and procedure library mapped to frameworks such as NIST, ISO 27001, CIS, HIPAA-adjacent, PCI-adjacent, and CMMC-readiness.

## Why this belongs in the Portal/OS

This module should be implemented inside the existing portal/OS because it benefits from the repo's current organization model, authenticated portal routes, API conventions, audit logging, SDK wrappers, Supabase migrations, and CI/E2E workflow. It should not be built as a standalone tool unless there is a later productization reason.

## Core workflows

1. **Intake / creation** — capture the key record with organization scope, owner, status, visibility, and metadata.
2. **Operational review** — allow technicians/admins to review status, add notes, attach evidence, and update next steps.
3. **Client visibility** — publish a safe client-facing view only when appropriate.
4. **Reporting/export** — export summary data for QBRs, proposals, runbooks, or internal review.
5. **Audit trail** — track who changed what and when.

## MVP features

- organization-scoped list and detail views
- create/edit forms with Zod-backed validation
- status, owner, visibility, and metadata fields
- comments/timeline where operationally useful
- CSV/JSON export where useful and permission-gated
- audit events for create/update/delete/export/approve/publish actions
- client-visible summary view only when explicitly published
- empty/loading/error states in the UI
- search, filter, and saved view support where useful

## Suggested advanced features

- Saved filters by organization, risk, status, owner, due date, and visibility.
- Dashboard cards for overdue, high-risk, recently updated, and pending approval items.
- Timeline events for status changes and key decisions.
- Attachment/document references for evidence or supporting files.
- Notification hooks for due dates, review reminders, and high-risk changes.
- Report section generator for QBR/proposal/client summary usage.
- AI draft assistant for summaries or recommendations where useful, with human review.

## Suggested data model

Primary table: `msp_sop_library_compliance_mapper_records`

Recommended columns:

```sql
id uuid primary key default gen_random_uuid(),
organization_id uuid not null references public.organizations(id) on delete cascade,
title text,
name text,
status text not null default 'active',
visibility text not null default 'internal',
risk_level text,
owner_user_id uuid,
source text,
metadata jsonb not null default '{}'::jsonb,
created_by uuid references auth.users(id),
updated_by uuid references auth.users(id),
approved_by uuid references auth.users(id),
approved_at timestamptz,
last_checked_at timestamptz,
next_review_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

Supporting tables to consider:

- `msp_sop_library_compliance_mapper_events` for timeline/check history.
- `msp_sop_library_compliance_mapper_attachments` for linked documents/evidence.
- `msp_sop_library_compliance_mapper_settings` for organization-specific settings.
- `msp_sop_library_compliance_mapper_comments` if collaboration is needed.

## API endpoints

```text
GET    /api/v1/msp-sop-library-compliance-mapper?organizationId=...
GET    /api/v1/msp-sop-library-compliance-mapper/:id
POST   /api/v1/msp-sop-library-compliance-mapper
PATCH  /api/v1/msp-sop-library-compliance-mapper/:id
DELETE /api/v1/msp-sop-library-compliance-mapper/:id
POST   /api/v1/msp-sop-library-compliance-mapper/:id/approve
POST   /api/v1/msp-sop-library-compliance-mapper/:id/publish
GET    /api/v1/msp-sop-library-compliance-mapper/export.csv
```

## Repo placement

- API route: `apps/api/src/routes/msp-sop-library-compliance-mapper.ts`
- Validator: `apps/api/src/validators/msp-sop-library-compliance-mapper.ts`
- Service: `apps/api/src/services/msp-sop-library-compliance-mapper.ts`
- SDK: `packages/sdk/src/msp-sop-library-compliance-mapper.ts`
- Portal page: `apps/web/app/(portal)/portal/msp-sop-library-compliance-mapper/page.tsx`
- Detail page: `apps/web/app/(portal)/portal/msp-sop-library-compliance-mapper/[id]/page.tsx`
- Portal components: `apps/web/components/portal/MspSopLibraryComplianceMapper/`
- Worker task: `apps/worker/src/tasks/msp-sop-library-compliance-mapper.ts`
- Migration: `supabase/migrations/<timestamp>_msp_sop_library_compliance_mapper.sql`
- API tests: `apps/api/src/__tests__/msp-sop-library-compliance-mapper.test.ts`
- E2E test: `apps/web/e2e/portal/msp-sop-library-compliance-mapper.spec.ts`
- Feature doc: `docs/features/msp-sop-library-compliance-mapper.md`
- Runbook: `docs/runbooks/msp-sop-library-compliance-mapper.md`

## Permissions

- `msp-sop-library-compliance-mapper.read`
- `msp-sop-library-compliance-mapper.create`
- `msp-sop-library-compliance-mapper.update`
- `msp-sop-library-compliance-mapper.delete`
- `msp-sop-library-compliance-mapper.export`
- `msp-sop-library-compliance-mapper.approve`
- `msp-sop-library-compliance-mapper.publish`
- `msp-sop-library-compliance-mapper.admin`

## AI assistance ideas

- Summarize notes into structured records.
- Draft client-friendly explanations.
- Suggest risk level and next actions for human review.
- Generate report snippets for QBR/proposals.
- Convert internal notes into sanitized client-visible language.

## Acceptance criteria

- No cross-organization data leakage in API or RLS.
- All mutations are audit logged.
- Validation errors are clear and test-covered.
- Portal UI has accessible labels and usable empty states.
- Client-visible data requires explicit visibility or published state.
- E2E smoke test validates the page loads and primary empty/list state renders.
- Feature documentation and runbook are included.
