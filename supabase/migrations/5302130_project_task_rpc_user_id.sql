-- =========================================================
-- 5302130: project task RPCs take an explicit user id
--
-- approve_project_task / add_project_task_comment were SECURITY DEFINER
-- functions that gated on auth.uid(). The API calls them with the service
-- role (via supabase-js admin client), so auth.uid() is always NULL there
-- and every approve / portal-comment request raised 'Not authenticated'
-- (500 in production). The API already enforces authentication
-- (requireAuth) and tenant membership (requireOrgAccess), so the RPCs now
-- accept the acting user id explicitly and verify that user is an approved
-- member of the task's organization before acting. The old two-argument
-- signatures are dropped so there is a single, non-spoofable code path.
-- =========================================================

drop function if exists public.approve_project_task(uuid, uuid);
drop function if exists public.add_project_task_comment(uuid, uuid, text);

create or replace function public.approve_project_task(
  p_task_id uuid,
  p_organization_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.project_tasks%rowtype;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
      and m.status = 'approved'
  ) then
    raise exception 'Membership not approved';
  end if;

  select *
  into v_task
  from public.project_tasks t
  where t.id = p_task_id
    and t.organization_id = p_organization_id;

  if not found then
    raise exception 'Task not found';
  end if;

  if coalesce(v_task.approval_required, false) = false then
    raise exception 'Task does not require approval';
  end if;

  update public.project_tasks
  set approved_by = p_user_id,
      approved_at = now(),
      updated_at = now()
  where id = p_task_id;
end;
$$;

revoke all on function public.approve_project_task(uuid, uuid, uuid) from public, anon;
grant execute on function public.approve_project_task(uuid, uuid, uuid) to authenticated, service_role;

create or replace function public.add_project_task_comment(
  p_task_id uuid,
  p_organization_id uuid,
  p_body text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.project_tasks%rowtype;
  v_comment_id uuid;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Comment body is required';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = p_user_id
      and m.status = 'approved'
  ) then
    raise exception 'Membership not approved';
  end if;

  select *
  into v_task
  from public.project_tasks t
  where t.id = p_task_id
    and t.organization_id = p_organization_id;

  if not found then
    raise exception 'Task not found';
  end if;

  insert into public.project_task_comments (
    task_id,
    project_id,
    organization_id,
    author_id,
    body,
    is_internal
  )
  values (
    v_task.id,
    v_task.project_id,
    v_task.organization_id,
    p_user_id,
    p_body,
    false
  )
  returning id into v_comment_id;

  return v_comment_id;
end;
$$;

revoke all on function public.add_project_task_comment(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.add_project_task_comment(uuid, uuid, text, uuid) to authenticated, service_role;
