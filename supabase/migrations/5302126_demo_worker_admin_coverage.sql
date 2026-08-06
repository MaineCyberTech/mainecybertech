-- =========================================================
-- 5302126: Demo data for newly-added worker/admin coverage
--
-- Mirrors the additions in supabase/seeds/08_expanded_test_data.sql
-- that exercise features added on 2026-08-05:
--   1. approval-overdue-check worker + /admin/approval-requests page
--      -> one PENDING approval with due_at in the past
--   2. Risk assess (migration 5302125 columns risk_level /
--      assessed_at / accepting_controls) on a subset of risks
--   3. dmarc-coach-check worker (marks stale) -> one analysis with
--      analyzed_at > 30 days and status='active'
--
-- Runs AFTER 5302124/5302125 so dmarc_analyses.status exists.
--
-- SAFETY GUARD: skipped when the database already contains
-- production-like tenants (real domains, not *.example / *.local).
-- =========================================================

do $$
begin
  if exists (
    select 1 from public.organizations
    where primary_domain is not null
      and primary_domain not like '%.example'
      and primary_domain not like '%.local'
  ) then
    raise notice '5302126: production-like organization domains detected - skipping demo additions';
    return;
  end if;

  -- Populate risk assessment columns (migration 5302125) for a subset of risks
  update public.risk_register set
    risk_level = case when risk_score >= 15 then 'critical' when risk_score >= 10 then 'high' when risk_score >= 5 then 'medium' else 'low' end,
    assessed_at = now() - interval '30 days',
    accepting_controls = 'Reviewed by leadership at last QBR; compensating controls documented.'
  where id in ('65700000-0000-0000-0000-000000000001','65700000-0000-0000-0000-000000000003','65700000-0000-0000-0000-000000000005');

  -- Overdue approval (exercises approval-overdue-check worker + admin approval-requests page)
  insert into public.approval_requests (id, organization_id, request_type, request_subject, request_body, request_metadata, status, priority, requested_by, assigned_to, due_at, source_module, source_entity_type, source_entity_id) values
    ('57700000-0000-0000-0000-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'change', 'Firewall maintenance window (overdue)', 'Scheduled firewall maintenance window missed approval deadline.', jsonb_build_object('seeded', true), 'pending', 'high', 'f1000000-0000-4000-8000-000000000004'::uuid, 'd4000000-0000-4000-8000-000000000004'::uuid, now() - interval '2 days', 'governance', 'change_request', '64600000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;

  -- Stale DMARC analysis (exercises dmarc-coach-check worker marking stale)
  insert into public.dmarc_analyses (id, organization_id, domain, dmarc_record, spf_record, dkim_record, dmarc_policy, alignment_mode, pct, overall_grade, issues, recommendations, analyzed_at, status, created_by) values
    ('82710000-0000-0000-0000-000000000099'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'acme.example', 'v=DMARC1; p=none;', 'v=spf1 ~all', 'v=DKIM1; k=rsa; p=...', 'none', 'relaxed', 100, 'F', jsonb_build_array('No enforcement policy'), jsonb_build_array(jsonb_build_object('action', 'move_to_quarantine')), now() - interval '45 days', 'active', 'f1000000-0000-4000-8000-000000000004'::uuid)
  on conflict (id) do nothing;

end $$;
