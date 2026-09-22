-- Prompt 17 (ethical FOMO conversion UX): persist seasonal readiness campaigns
-- and their truthful, admin-enabled limited-capacity messaging.
--
-- Until now `seasonal-campaigns.json` was bundled into the web app and the admin
-- campaigns screen was non-persistent. Capacity fields exist so an admin can turn
-- on "N of M remaining" messaging; nothing is ever derived or invented in the UI.
begin;

create table if not exists public.store_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  audience text not null default '',
  headline text not null default '',
  body text not null default '',
  icon text not null default '',
  accent text not null default '',
  recommended_product_ids text[] not null default '{}',
  trust_badges text[] not null default '{}',
  promo_eligibility text[] not null default '{}',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  capacity_enabled boolean not null default false,
  capacity_total integer,
  capacity_remaining integer,
  capacity_label text not null default '',
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_campaigns_status_idx on public.store_campaigns (status);
create index if not exists store_campaigns_org_idx on public.store_campaigns (organization_id);

alter table public.store_campaigns enable row level security;

-- Public storefront reads active campaigns; tenant scope follows 5302408.
DROP POLICY IF EXISTS "store_campaigns_public_read" ON public.store_campaigns;
CREATE POLICY "store_campaigns_read" ON public.store_campaigns
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND (organization_id IS NULL OR public.is_org_member(organization_id)));

DROP POLICY IF EXISTS "store_campaigns_admin_write" ON public.store_campaigns;
CREATE POLICY "store_campaigns_write" ON public.store_campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

commit;
