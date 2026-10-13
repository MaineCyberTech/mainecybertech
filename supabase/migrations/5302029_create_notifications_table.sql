create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  body text not null,
  module text not null,
  module_id text,
  action text not null,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications(user_id, read) where read = false;
create index notifications_created_idx on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_insert_all" on public.notifications;
create policy "notifications_insert_all"
  on public.notifications for insert
  with check (true);

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_self" on public.notifications;
create policy "notifications_delete_self"
  on public.notifications for delete
  using (user_id = auth.uid());
