-- =========================================================
-- 5302457: CHECK constraints for status-like text columns (DATA-P3-004)
--
-- 88+ module tables store workflow/status vocabulary in free-text columns
-- while the app validates the values in Zod (or a closed set of transition
-- endpoints). Direct PostgREST writes (anon-key + JWT + RLS) could therefore
-- persist arbitrary strings and corrupt filters, reports and workflow state
-- with no DB-level guard.
--
-- This migration constrains the prioritised set: columns whose vocabulary is
-- enforced by the app's validators, by a closed transition state machine, or
-- by the in-repo seed/catalog data (workflow-routing statuses and the newest
-- module tables). Columns the app itself treats as free text (e.g.
-- status_components / status_incidents / maintenance_notices,
-- insurance_evidence, device_profiles, network_diagrams, onboarding
-- sub-statuses) are deliberately left for a later phase — a CHECK must not
-- invent a vocabulary the app does not enforce.
--
-- The constraints are added NOT VALID: PostgreSQL still enforces them for
-- every new INSERT/UPDATE, but adding them does not fail the migration when
-- legacy rows hold a value outside the vocabulary. After backfilling any such
-- rows an operator can `alter table ... validate constraint <name>` to make
-- the guarantee complete.
--
-- Idempotent: PostgreSQL has no `ADD CONSTRAINT IF NOT EXISTS`, so each
-- constraint is guarded by a pg_constraint lookup (repo convention, see
-- 5302103/5302113). Only applied when the table exists, so a partial history
-- cannot break the migration.
-- =========================================================

begin;

do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('assets',                   'assets_status_check',                   'status', array['active', 'in_use', 'retired', 'decommissioned', 'lost', 'repair', 'offline']),
      ('findings',                 'findings_status_check',                 'status', array['open', 'in_review', 'in_progress', 'resolved', 'verified', 'closed', 'wont_fix']),
      ('proposals',                'proposals_status_check',                'status', array['draft', 'sent', 'approved', 'rejected', 'expired']),
      ('domain_monitors',          'domain_monitors_status_check',          'status', array['active', 'paused', 'error']),
      ('cab_meetings',             'cab_meetings_status_check',             'status', array['scheduled', 'in_progress', 'completed', 'cancelled']),
      ('file_requests',            'file_requests_status_check',            'status', array['active', 'open', 'completed', 'expired', 'revoked']),
      ('qbr_reports',              'qbr_reports_status_check',              'status', array['draft', 'review', 'generated', 'approved', 'sent', 'published']),
      ('approval_requests',        'approval_requests_status_check',        'status', array['pending', 'approved', 'rejected', 'cancelled']),
      ('satisfaction_pulses',      'satisfaction_pulses_status_check',      'status', array['pending', 'sent', 'responded', 'expired', 'cancelled']),
      ('store_proposal_drafts',    'store_proposal_drafts_status_check',    'status', array['draft_internal', 'in_review', 'approved', 'sent', 'archived']),
      ('store_campaigns',          'store_campaigns_status_check',          'status', array['draft', 'active', 'paused', 'archived']),
      ('change_requests',          'change_requests_status_check',          'status', array['draft', 'pending', 'pending_review', 'approved', 'rejected', 'implemented', 'verified']),
      ('store_quote_requests',     'store_quote_requests_status_check',     'status', array['submitted', 'reviewed', 'converted', 'converted_to_project', 'closed']),
      ('store_leads',              'store_leads_status_check',              'status', array['new', 'qualified', 'needs_review', 'high_priority', 'waiting_on_customer', 'quoted', 'contacted', 'converted', 'lost', 'closed_lost']),
      ('phishing_campaigns',       'phishing_campaigns_status_check',       'status', array['draft', 'scheduled', 'active', 'in_progress', 'completed']),
      ('phishing_targets',         'phishing_targets_status_check',         'status', array['pending', 'sent']),
      ('training_enrollments',     'training_enrollments_status_check',     'status', array['enrolled', 'in_progress', 'completed']),
      ('risk_register',            'risk_register_status_check',            'status', array['identified', 'open', 'accepted', 'monitored', 'mitigated']),
      ('kb_article_generations',   'kb_article_generations_status_check',   'status', array['generated', 'draft', 'published', 'approved']),
      ('powershell_scripts',       'powershell_scripts_status_check',       'status', array['draft', 'active', 'pending_review', 'approved', 'rejected'])
    ) as t(tbl, con, col, vals)
  loop
    if exists (
         select 1 from information_schema.tables
         where table_schema = 'public' and table_name = rec.tbl
       )
       and not exists (
         select 1
         from pg_constraint c
         join pg_class r on r.oid = c.conrelid
         join pg_namespace n on n.oid = r.relnamespace
         where c.conname = rec.con and r.relname = rec.tbl and n.nspname = 'public'
       )
    then
      execute format(
        'alter table public.%I add constraint %I check (%I in (%s)) not valid',
        rec.tbl,
        rec.con,
        rec.col,
        (select string_agg(quote_literal(v), ', ' order by v) from unnest(rec.vals) as v)
      );
    end if;
  end loop;
end;
$$;

commit;
