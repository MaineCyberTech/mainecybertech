-- Ticket Comment Editing: add edited_at column and UPDATE/DELETE RLS policies

alter table public.ticket_comments
  add column edited_at timestamptz;

create policy ticket_comments_update_own on public.ticket_comments
  for update using (
    author_id = auth.uid()
    and (
      public.is_super_admin()
      or public.user_has_permission(organization_id, 'tickets', 'comment')
    )
  ) with check (author_id = auth.uid());

-- If using the raw `auth.uid()` approach for DELETE (admin soft-delete):
-- For now, we don't expose DELETE in the API, only PATCH (editing). 
-- Deleting comments is not part of this feature.
