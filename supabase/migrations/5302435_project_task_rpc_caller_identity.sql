-- RLS-P2-003: stop the project-task RPCs trusting a caller-supplied user id.
--
-- Background: 5302130 moved approve_project_task / add_project_task_comment from
-- `auth.uid()`-based gating to an explicit p_user_id, because the API calls them
-- with the SERVICE ROLE (auth.uid() is NULL there) and every call otherwise
-- failed. The membership check they do is real, but they are `security definer`
-- AND granted to `authenticated`, so a signed-in user can call the RPC DIRECTLY
-- through PostgREST and pass ANY user id that is an approved member of the target
-- org. Consequences:
--   * add_project_task_comment: forge a comment attributed to a colleague
--     (author_id = p_user_id) inside an org you belong to.
--   * approve_project_task: forge the `approved_by` attribution on a task.
--
-- Fix (the audit's recommendation): when the caller is an end user (auth.uid()
-- is not null), the supplied id MUST equal their own. The service-role path
-- (auth.uid() is null) is unchanged, so the API keeps working. This closes the
-- forgery without redesigning the call convention.
--
-- This does not change function signatures or grants, so it cannot break the
-- service-role callers.

begin;

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
  v_caller uuid := auth.uid();
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  -- A direct end-user call may only act as ITSELF. The service role has no
  -- auth.uid(), so this is a no-op for the API's own call path.
  if v_caller is not null and p_user_id is distinct from v_caller then
    raise exception 'Cannot act on behalf of another user';
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
  v_caller uuid := auth.uid();
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if v_caller is not null and p_user_id is distinct from v_caller then
    raise exception 'Cannot act on behalf of another user';
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

-- Grants are intentionally unchanged: the service role still needs EXECUTE, and
-- `authenticated` may still call these — it is now constrained to act as itself.
revoke all on function public.approve_project_task(uuid, uuid, uuid) from public, anon;
grant execute on function public.approve_project_task(uuid, uuid, uuid) to authenticated, service_role;
revoke all on function public.add_project_task_comment(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.add_project_task_comment(uuid, uuid, text, uuid) to authenticated, service_role;

commit;
