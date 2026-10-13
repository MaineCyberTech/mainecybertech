-- RLS-P2-006: store_quotes kept the pre-tenant-scoping blanket INSERT policy
-- "Anyone can insert quotes" (5302105: WITH CHECK (true), no TO clause). It
-- survived the 5302132 role-scoping and, after 5302408 added organization_id,
-- let any anon/authenticated writer tag a quote row with an arbitrary
-- organization_id — cross-tenant injection into a tenant's quote pipeline.
--
-- Replace it with tenant-safe inserts: anonymous storefront submissions stay
-- global leads (organization_id IS NULL); authenticated users may submit a
-- global lead or a quote for an organization they are an approved member of.
begin;

drop policy if exists "Anyone can insert quotes" on public.store_quotes;
drop policy if exists "anon_insert_quotes" on public.store_quotes;
create policy "anon_insert_quotes" on public.store_quotes
  for insert
  to anon
  with check (organization_id is null);

drop policy if exists "store_quotes_member_insert" on public.store_quotes;
create policy "store_quotes_member_insert" on public.store_quotes
  for insert
  to authenticated
  with check (organization_id is null or public.is_org_member(organization_id));

commit;
