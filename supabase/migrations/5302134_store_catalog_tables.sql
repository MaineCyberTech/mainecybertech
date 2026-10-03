-- P2-22/23: DB-backed store catalog.
--
-- Replaces the static JSON catalog (apps/api/src/data/products.json +
-- categories.json) with real tables so products/categories can be managed
-- (created/updated/deleted) rather than hard-coded. The API reads from these
-- tables (with a JSON fallback) and exposes admin CRUD endpoints.
--
-- Design: a small set of indexed scalar columns for filtering + a jsonb
-- `attributes` blob holding the rest of the catalog fields (bestFor,
-- whatIsIncluded, etc.) so the schema stays stable as the JSON shape evolves.

create table if not exists public.store_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  product_ids text[] not null default '{}',
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category_id text references public.store_categories(id) on delete set null,
  category text not null default '',
  type text not null default 'service',
  display boolean not null default true,
  status text not null default 'draft',
  price_range text not null default '',
  pricing_model text not null default '',
  purchase_mode text not null default '',
  summary text not null default '',
  marketing_headline text not null default '',
  marketing_copy text not null default '',
  tags text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_products_category on public.store_products (category_id);
create index if not exists idx_store_products_type on public.store_products (type);
create index if not exists idx_store_products_display on public.store_products (display);
create index if not exists idx_store_products_status on public.store_products (status);

-- RLS: public can read displayed/active products; only service_role (API
-- server, using admin auth) can write.
alter table public.store_categories enable row level security;
alter table public.store_products enable row level security;

create policy "store_categories_public_read" on public.store_categories
  for select to anon, authenticated
  using (true);

create policy "store_products_public_read" on public.store_products
  for select to anon, authenticated
  using (display = true);

create policy "store_categories_service_write" on public.store_categories
  for all to service_role
  using (true) with check (true);

create policy "store_products_service_write" on public.store_products
  for all to service_role
  using (true) with check (true);
