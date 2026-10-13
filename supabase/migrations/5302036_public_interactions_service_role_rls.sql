-- Ensure service_role can insert into public_interactions (bypasses RLS)
drop policy if exists "public_interactions_insert_service_role" on public.public_interactions;
CREATE POLICY "public_interactions_insert_service_role" ON public.public_interactions
  FOR INSERT TO service_role WITH CHECK (true);
