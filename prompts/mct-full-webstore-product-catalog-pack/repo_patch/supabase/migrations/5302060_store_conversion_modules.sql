-- Store conversion modules scaffold migration.
-- Review and adapt to current schema, RLS, audit, and naming conventions before applying.

create table if not exists store_promotions (
  id text primary key,
  name text not null,
  type text not null,
  status text not null default 'draft',
  badge_text text not null,
  detail_text text,
  terms text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
