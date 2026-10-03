-- =========================================================
-- Fix bootstrap_portal_access RPC: use default role_id instead of NULL
-- =========================================================
CREATE OR REPLACE FUNCTION public.bootstrap_portal_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_membership_count int;
  v_default_role_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;
  
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  
  INSERT INTO public.profiles (id, email)
  VALUES (v_user_id, COALESCE(v_email, ''))
  ON CONFLICT (id) DO NOTHING;
  
  SELECT count(*) INTO v_membership_count FROM public.memberships WHERE user_id = v_user_id;
  
  IF v_membership_count = 0 THEN
    SELECT id INTO v_default_role_id FROM public.roles WHERE key = 'client_user' LIMIT 1;
    INSERT INTO public.memberships (user_id, organization_id, role_id, status)
    SELECT v_user_id, id, v_default_role_id, 'pending'
    FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  END IF;
END;
$$;

-- =========================================================
-- Fix notifications RLS: prevent any user from injecting notifications for other users
-- =========================================================
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
CREATE POLICY "notifications_insert_system_or_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.roles r ON r.id = m.role_id
      WHERE m.user_id = auth.uid()
        AND m.organization_id = notifications.organization_id
        AND r.key IN ('super_admin', 'admin')
    )
  );

-- =========================================================
-- Fix logos storage: restrict uploads to super admins only
-- =========================================================
DROP POLICY IF EXISTS "logos_insert_public" ON storage.objects;
CREATE POLICY "logos_insert_admin_only"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

-- =========================================================
-- Fix memberships.role_id FK: SET NULL on role delete instead of blocking
-- =========================================================
ALTER TABLE public.memberships 
  DROP CONSTRAINT IF EXISTS memberships_role_id_fkey;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_role_id_fkey 
  FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

ALTER TABLE public.memberships 
  ALTER COLUMN role_id DROP NOT NULL;

-- =========================================================
-- Add missing indexes for query performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_ticket_comments_org_id ON public.ticket_comments(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author_id ON public.ticket_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notifications_org_user_read ON public.notifications(organization_id, user_id, read);
CREATE INDEX IF NOT EXISTS idx_sla_logs_ticket_id ON public.sla_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_tickets_org_created_by ON public.tickets(organization_id, created_by);
