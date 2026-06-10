-- =========================================================
-- bootstrap_portal_access
-- Ensures the current user has a profile record and at least
-- a pending membership after PKCE auth callback. Errors are
-- non-fatal (the callback continues even if this RPC fails).
-- =========================================================

create or replace function public.bootstrap_portal_access()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_membership_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return;
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.profiles (id, email)
  values (v_user_id, coalesce(v_email, ''))
  on conflict (id) do nothing;

  select count(*) into v_membership_count
  from public.memberships
  where user_id = v_user_id;

  if v_membership_count = 0 then
    insert into public.memberships (user_id, organization_id, role_id, status)
    select v_user_id, id, null, 'pending'
    from public.organizations
    order by created_at asc
    limit 1;
  end if;
end;
$$;
