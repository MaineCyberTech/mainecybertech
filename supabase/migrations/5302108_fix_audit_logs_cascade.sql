-- Fix audit_logs FK to cascade on org deletion (was set null, creating orphans)
alter table public.audit_logs
  drop constraint if exists audit_logs_organization_id_fkey,
  add constraint audit_logs_organization_id_fkey
    foreign key (organization_id)
    references public.organizations(id)
    on delete cascade;
