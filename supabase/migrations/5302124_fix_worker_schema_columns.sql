-- Fix worker schema mismatches (P0 audit 2026-08-05):
--  1. uptime_checks needs last_checked_at / last_status_code (website-monitor-check worker)
--  2. dmarc_analyses needs a status column (dmarc-coach-check worker marks stale analyses)

-- uptime_checks
alter table public.uptime_checks
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_status_code integer;

-- dmarc_analyses
alter table public.dmarc_analyses
  add column if not exists status text not null default 'active';
