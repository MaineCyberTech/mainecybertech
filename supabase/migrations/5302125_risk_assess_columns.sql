-- Add risk assessment columns to risk_register (fixes /risks/:id/assess which
-- writes risk_level / accepting_controls / assessed_at that don't exist yet)
alter table public.risk_register
  add column if not exists risk_level text,
  add column if not exists accepting_controls text,
  add column if not exists assessed_at timestamptz;
