-- Add change-request state-machine columns (submit/approve/verify transitions
-- in governance.ts write these; they did not exist so every transition 500'd
-- with "column does not exist").
alter table public.change_requests
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists verified_at timestamptz;

-- Compliance readiness scoring (POST /edu-automation/compliance/score persists
-- a score with these; they did not exist so the endpoint 500'd).
alter table public.compliance_readiness
  add column if not exists score numeric,
  add column if not exists total_questions integer,
  add column if not exists passed_questions integer;

-- Worker scan bookkeeping columns (module-tasks.ts writes these):
--   m365 hardening scan -> scan_status / next_scan_at / last_scanned_at
--   patch compliance / endpoint security checks -> last_checked_at
--   qbr scheduled generate -> generated_at
alter table public.m365_hardening
  add column if not exists scan_status text,
  add column if not exists next_scan_at timestamptz,
  add column if not exists last_scanned_at timestamptz;

alter table public.patch_compliance
  add column if not exists last_checked_at timestamptz;

alter table public.endpoint_security
  add column if not exists last_checked_at timestamptz;

alter table public.qbr_reports
  add column if not exists generated_at timestamptz;

create index if not exists idx_change_requests_status_org on public.change_requests(status, organization_id);
