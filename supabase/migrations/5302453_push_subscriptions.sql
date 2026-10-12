-- =========================================================
-- 5302453: Web Push subscriptions (NOTIF-P2-001)
--
-- The Web Push channel was entirely absent: no subscription storage, no
-- VAPID config, no service-worker push handler. This migration adds the
-- owner-scoped subscription store the API upserts into and the worker reads
-- when delivering a push.
--
-- Shape: one row per browser push subscription (an endpoint is globally
-- unique — the browser mints it, and a re-subscribe on the same browser must
-- update the row rather than duplicate it). `revoked_at` is a soft revoke:
-- the worker sets it when a push service answers 404/410, and the row is
-- kept so an operator can still see which devices were dropped.
--
-- RLS is scoped to the owner: a subscription is a per-user device
-- capability, not tenant data. The API/worker write with the service role
-- (RLS bypassed, as everywhere else today), but the policies are the
-- database backstop if this module is ever opted into the RLS client swap.
--
-- The `push` notification preference is persisted in the existing
-- `notification_preferences.channel` enum, so the value is appended here
-- (Postgres >= 12 allows ADD VALUE in a transaction as long as the new value
-- is not used in the same transaction; nothing below uses it).
-- =========================================================

begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (endpoint)
);

-- The worker's per-notification lookup is "active subscriptions for this
-- user", so index exactly that predicate.
create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions (user_id)
  where revoked_at is null;

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete
  to authenticated
  using (user_id = auth.uid());

alter type public.notification_channel add value if not exists 'push';

commit;
