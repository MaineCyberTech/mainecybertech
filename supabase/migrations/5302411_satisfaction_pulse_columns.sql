-- Align the satisfaction-pulse tables with the service layer.
--
-- apps/api/src/services/satisfaction-pulse-widget.ts reads/writes columns
-- that 5302079 never created, so the affected inserts/updates threw at
-- runtime (PostgREST rejects unknown columns). Found by typing the Supabase
-- client (domain_monitors/tickets.subject class of bug).
--
--   satisfaction_pulses:            template_id, send_at, scheduled_for, created_by
--   satisfaction_pulse_templates:   subject, question, default_rating
begin;

alter table public.satisfaction_pulses
  add column if not exists template_id uuid references public.satisfaction_pulse_templates(id) on delete set null,
  add column if not exists send_at timestamptz,
  add column if not exists scheduled_for timestamptz,
  add column if not exists created_by uuid references auth.users(id);

alter table public.satisfaction_pulse_templates
  add column if not exists subject text,
  add column if not exists question text,
  add column if not exists default_rating integer not null default 5;

commit;
