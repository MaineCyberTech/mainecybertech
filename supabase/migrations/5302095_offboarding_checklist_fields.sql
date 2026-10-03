alter table if exists public.offboarding_checklists add column if not exists completed_steps text[] default '{}';
alter table if exists public.offboarding_checklists add column if not exists submitted_at timestamptz;
alter table if exists public.offboarding_checklists add column if not exists completed_at timestamptz;