-- =========================================================
-- 5302122: mark_task_read RPC (bypasses RLS for read tracking)
--
-- The portal project detail page marks each task read on load via
-- POST /api/v1/projects/:id/tasks/:taskId/read. The route's direct
-- upsert into project_task_comment_reads hit "new row violates row-level
-- security policy" on datasets where no read row existed yet (seed-05
-- projects), crashing the page. This SECURITY DEFINER function runs as
-- its owner and bypasses RLS so first-time reads always succeed.
-- =========================================================

create or replace function public.mark_task_read(
  p_user_id uuid,
  p_task_id uuid,
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_task_comment_reads (user_id, task_id, organization_id, last_seen_at)
  values (p_user_id, p_task_id, p_organization_id, now())
  on conflict (user_id, task_id)
  do update set
    organization_id = excluded.organization_id,
    last_seen_at = excluded.last_seen_at;
end;
$$;

revoke all on function public.mark_task_read(uuid, uuid, uuid) from public, anon;
grant execute on function public.mark_task_read(uuid, uuid, uuid) to authenticated, service_role;
