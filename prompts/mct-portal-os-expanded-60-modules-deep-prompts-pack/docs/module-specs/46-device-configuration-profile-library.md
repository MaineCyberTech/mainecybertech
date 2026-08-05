# 46. Device Configuration Profile Library

## Category

endpoint-management

## Business impact

High

## Primary users

MSP admin, endpoint technician

## Purpose

Reusable configuration profiles for M365, Windows 11, baseline settings, browser settings, VPN notes, UniFi device standards, and deployment templates.

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

Primary table: `device_configuration_profile_library_records`

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

- `device_configuration_profile_library_events` for timeline/check history.
- `device_configuration_profile_library_attachments` for linked documents/evidence.
- `device_configuration_profile_library_settings` for organization-specific settings.
- `device_configuration_profile_library_comments` if collaboration is needed.

## API endpoints

```text
GET    /api/v1/device-configuration-profile-library?organizationId=...
GET    /api/v1/device-configuration-profile-library/:id
POST   /api/v1/device-configuration-profile-library
PATCH  /api/v1/device-configuration-profile-library/:id
DELETE /api/v1/device-configuration-profile-library/:id
POST   /api/v1/device-configuration-profile-library/:id/approve
POST   /api/v1/device-configuration-profile-library/:id/publish
GET    /api/v1/device-configuration-profile-library/export.csv
```

## Repo placement

- API route: `apps/api/src/routes/device-configuration-profile-library.ts`
- Validator: `apps/api/src/validators/device-configuration-profile-library.ts`
- Service: `apps/api/src/services/device-configuration-profile-library.ts`
- SDK: `packages/sdk/src/device-configuration-profile-library.ts`
- Portal page: `apps/web/app/(portal)/portal/device-configuration-profile-library/page.tsx`
- Detail page: `apps/web/app/(portal)/portal/device-configuration-profile-library/[id]/page.tsx`
- Portal components: `apps/web/components/portal/DeviceConfigurationProfileLibrary/`
- Worker task: `apps/worker/src/tasks/device-configuration-profile-library.ts`
- Migration: `supabase/migrations/<timestamp>_device_configuration_profile_library.sql`
- API tests: `apps/api/src/__tests__/device-configuration-profile-library.test.ts`
- E2E test: `apps/web/e2e/portal/device-configuration-profile-library.spec.ts`
- Feature doc: `docs/features/device-configuration-profile-library.md`
- Runbook: `docs/runbooks/device-configuration-profile-library.md`

## Permissions

- `device-configuration-profile-library.read`
- `device-configuration-profile-library.create`
- `device-configuration-profile-library.update`
- `device-configuration-profile-library.delete`
- `device-configuration-profile-library.export`
- `device-configuration-profile-library.approve`
- `device-configuration-profile-library.publish`
- `device-configuration-profile-library.admin`

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
