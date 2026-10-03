# Data Model and RLS Standards

## Standard module table shape

Most tenant-scoped module tables should include:

```sql
id uuid primary key default gen_random_uuid(),
organization_id uuid not null references public.organizations(id) on delete cascade,
title text,
name text,
status text not null default 'active',
visibility text not null default 'internal',
risk_level text,
source text,
metadata jsonb not null default '{}'::jsonb,
created_by uuid references auth.users(id),
updated_by uuid references auth.users(id),
approved_by uuid references auth.users(id),
approved_at timestamptz,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
last_checked_at timestamptz,
next_review_at timestamptz
```

## RLS rules

- Enable RLS on every organization-scoped table.
- Use existing membership and role helper patterns.
- Separate internal-only rows from client-visible rows with explicit visibility.
- Add RLS tests/verification queries after any sensitive schema change.
- Do not use public access unless the module is explicitly public, such as a public status page.

## Shared tables to consider

- `portal_module_settings`
- `approval_requests`
- `ai_draft_outputs`
- `scheduled_check_results`
- `risk_acceptances`
- `client_visibility_overrides`
- `module_comments`
- `module_attachments`
- `module_timeline_events`
