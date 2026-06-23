DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'public_interactions' AND policyname = 'public_interactions_insert'
  ) THEN
    CREATE POLICY "public_interactions_insert" ON public.public_interactions
      FOR INSERT TO anon WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'public_interactions' AND policyname = 'public_interactions_insert_service_role'
  ) THEN
    CREATE POLICY "public_interactions_insert_service_role" ON public.public_interactions
      FOR INSERT TO service_role WITH CHECK (true);
  END IF;
END
$$;
