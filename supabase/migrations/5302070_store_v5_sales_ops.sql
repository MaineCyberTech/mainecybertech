-- V5 store sales ops scaffold migration.
-- Adapted from prompts/mct-full-webstore-product-catalog-pack/repo_patch/supabase/migrations/5302070_store_v5_sales_ops.sql
-- Note: store_analytics_events table from the original scaffold is intentionally omitted —
-- superseded by 5302106_store_analytics.sql (which has the schema the API uses).

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

alter table store_leads enable row level security;
alter table store_proposal_drafts enable row level security;

create policy "Service role full access to leads" on store_leads
  for all to service_role using (true) with check (true);

create policy "Service role full access to proposal drafts" on store_proposal_drafts
  for all to service_role using (true) with check (true);
