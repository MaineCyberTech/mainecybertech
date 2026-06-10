-- Ticket Comment Editing: add edited_at column and UPDATE/DELETE RLS policies

alter table public.ticket_comments
  add column edited_at timestamptz;

create policy ticket_comments_update_own on public.ticket_comments
  for update using (
    author_id = auth.uid()
    and (
      exists (
        select 1 from public.memberships m
          join public.roles r on r.id = m.role_id
          join public.role_permissions rp on rp.role_id = r.id
          join public.permissions p on p.id = rp.permission_id
          where m.organization_id = ticket_comments.organization_id
            and m.user_id = auth.uid()
            and m.status = 'approved'
            and p.key = 'tickets.comment'
      )
      or exists (
        select 1 from public.memberships m
          join public.roles r on r.id = m.role_id
          where m.organization_id = ticket_comments.organization_id
            and m.user_id = auth.uid()
            and m.status = 'approved'
            and r.key = 'super_admin'
      )
    )
  ) with check (author_id = auth.uid());

-- If using the raw `auth.uid()` approach for DELETE (admin soft-delete):
-- For now, we don't expose DELETE in the API, only PATCH (editing). 
-- Deleting comments is not part of this feature.
