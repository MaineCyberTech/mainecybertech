-- MT-P0-001: make the store catalog tenant-scoped (nullable organization_id).
--
-- Existing shared catalog rows keep organization_id = NULL and remain visible to
-- all authenticated users (global storefront). Org-specific rows are scoped via
-- public.is_org_member(organization_id). No backfill required (NULL = global).
-- Writes stay service_role-only (admin CRUD), unchanged.

-- ===== store_categories =====
ALTER TABLE public.store_categories
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_store_categories_organization_id ON public.store_categories(organization_id);

DROP POLICY IF EXISTS "store_categories_public_read" ON public.store_categories;
CREATE POLICY "store_categories_read" ON public.store_categories
  FOR SELECT TO anon, authenticated
  USING (organization_id IS NULL OR public.is_org_member(organization_id));

-- ===== store_products =====
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_store_products_organization_id ON public.store_products(organization_id);

DROP POLICY IF EXISTS "store_products_public_read" ON public.store_products;
CREATE POLICY "store_products_read" ON public.store_products
  FOR SELECT TO anon, authenticated
  USING (display = true AND (organization_id IS NULL OR public.is_org_member(organization_id)));

-- ===== store_promotions =====
ALTER TABLE public.store_promotions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_store_promotions_organization_id ON public.store_promotions(organization_id);

-- "Anyone can view active promotions" (global, active-only) is replaced with a
-- tenant-aware variant: global (NULL-org) active promos stay public; org-specific
-- promos are scoped to members of that org.
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.store_promotions;
CREATE POLICY "store_promotions_read" ON public.store_promotions
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND (organization_id IS NULL OR public.is_org_member(organization_id)));

-- ===== store_quotes =====
ALTER TABLE public.store_quotes
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_store_quotes_organization_id ON public.store_quotes(organization_id);

-- Keep public anon quote submission and service_role admin access.
-- Add a member-scoped read: only org-specific quotes are visible to that org's
-- members (NULL-org leads remain service_role-only, never exposed to regular users).
CREATE POLICY "store_quotes_member_read" ON public.store_quotes
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));
