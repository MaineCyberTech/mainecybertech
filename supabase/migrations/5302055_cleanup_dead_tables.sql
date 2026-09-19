-- Cleanup 9 dead tables with no API/SDK/frontend usage
-- Keep webhook_dead_letters (active in 5302050)

drop table if exists public.appointments cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_threads cascade;
drop table if exists public.comments cascade;
drop table if exists public.contracts cascade;
drop table if exists public.contract_signers cascade;
drop table if exists public.document_permissions cascade;
drop table if exists public.onboarding_submissions cascade;
drop table if exists public.project_members cascade;

-- Add ON DELETE CASCADE to memberships.role_id FK
-- Allows role deletion without FK violation
alter table public.memberships
  drop constraint if exists memberships_role_id_fkey,
  add constraint memberships_role_id_fkey
    foreign key (role_id) references public.roles(id) on delete cascade;
