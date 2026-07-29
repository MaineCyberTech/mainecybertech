-- V5 store sales ops scaffold migration.
-- Review and adapt to current schema, RLS, audit, and naming conventions before applying.

create table if not exists store_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  anonymous_id text,
  user_id uuid,
  session_id text,
  path text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists store_leads (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid,
  status text not null default 'new',
  lead_score int not null default 0,
  lead_band text not null default 'low',
  score_breakdown jsonb not null default '[]'::jsonb,
  assigned_owner uuid,
  follow_up_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists store_proposal_drafts (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid,
  status text not null default 'draft_internal',
  sections jsonb not null default '{}'::jsonb,
  generated_by uuid,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
