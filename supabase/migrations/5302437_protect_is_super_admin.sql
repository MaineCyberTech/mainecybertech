-- SEC-P1-001 / ACM-P1-002 / CHAIN-P1-005: the platform-admin flag must not be
-- user-writable.
--
-- The profiles RLS update policy (`profiles_update_self_or_super_admin`) lets a
-- user update their own row and does not restrict columns, so a signed-in user
-- could set `is_super_admin = true` through PostgREST with the anon key and
-- gain every platform-admin permission and all-tenant RLS branch.
--
-- A BEFORE UPDATE trigger closes this for API callers (JWT role `authenticated`
-- or `anon`) while leaving service-role writes (the API server, which performs
-- profile writes with the service-role key) and direct SQL (migrations,
-- operator scripts) unaffected.

create or replace function public.protect_profiles_is_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin is distinct from old.is_super_admin then
    if coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') in ('authenticated', 'anon') then
      raise exception 'is_super_admin is not user-writable'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_is_super_admin on public.profiles;
create trigger protect_profiles_is_super_admin
before update on public.profiles
for each row
execute function public.protect_profiles_is_super_admin();
