-- Fix missing UPDATE policy on time_entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'te_org_u' AND tablename = 'time_entries') THEN
    CREATE POLICY "te_org_u" ON time_entries
      FOR UPDATE USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Fix missing DELETE policy on time_entries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'te_org_d' AND tablename = 'time_entries') THEN
    CREATE POLICY "te_org_d" ON time_entries
      FOR DELETE USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND role IN ('admin')));
  END IF;
END $$;

-- Fix missing DELETE policies on tables that have DELETE routes but no DELETE RLS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'backup_del' AND tablename = 'backup_status') THEN
    CREATE POLICY "backup_del" ON backup_status
      FOR DELETE USING (organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid() AND role IN ('admin')));
  END IF;
END $$;

-- Add UPDATE policy on document_versions (missing from bootstrap)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'dv_update' AND tablename = 'document_versions') THEN
    CREATE POLICY "dv_update" ON document_versions
      FOR UPDATE USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())));
  END IF;
END $$;
