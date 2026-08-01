-- Store conversion modules scaffold migration.
-- Adapted from prompts/mct-full-webstore-product-catalog-pack/repo_patch/supabase/migrations/5302060_store_conversion_modules.sql
-- Note: store_promotions table from the original scaffold is intentionally omitted —
-- superseded by 5302104_store_promotions.sql (which has the schema the API uses).

create table if not exists store_quote_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'submitted',
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  selected_promo_ids text[] not null default '{}',
  recommended_bundle_ids text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists store_visual_assets (
  id uuid primary key default gen_random_uuid(),
  linked_entity_type text not null,
  linked_entity_id text not null,
  asset_type text not null,
  icon_name text,
  accent_color text,
  image_url text,
  alt_text text,
  decorative boolean not null default false,
  provenance text,
  license_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table store_quote_requests enable row level security;
alter table store_visual_assets enable row level security;

create policy "Service role full access to quote requests" on store_quote_requests
  for all to service_role using (true) with check (true);

create policy "Service role full access to visual assets" on store_visual_assets
  for all to service_role using (true) with check (true);
