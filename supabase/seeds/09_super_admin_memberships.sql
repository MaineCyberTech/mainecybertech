-- 09_super_admin_memberships.sql
-- Ensure every platform super admin has an approved super_admin membership in
-- every organization. The profile flag grants global access; the memberships
-- keep tenant-scoped UI and reporting consistent.

begin;

insert into public.memberships (
  organization_id,
  user_id,
  role_id,
  status,
  approved_by,
  approved_at,
  job_title,
  is_billing_contact,
  is_security_contact
)
select
  o.id,
  p.id,
  r.id,
  'approved'::public.membership_status,
  p.id,
  now(),
  'Global Super Admin',
  true,
  true
from public.organizations o
join public.profiles p on p.is_super_admin = true
join public.roles r on r.key = 'super_admin'
on conflict (organization_id, user_id) do update
set
  role_id = excluded.role_id,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at,
  job_title = excluded.job_title,
  is_billing_contact = excluded.is_billing_contact,
  is_security_contact = excluded.is_security_contact,
  updated_at = now();

commit;
