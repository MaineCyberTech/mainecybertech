-- =========================================================
-- 5302425: flag bot traffic on public_interactions
--
-- The public visitor webhook was alerting on every hit to
-- `/api/v1/public/init`, including crawlers, link-preview bots,
-- uptime monitors and scanners. Record whether a request looked
-- automated so the webhook can stay quiet and the data is filterable.
-- =========================================================

begin;

alter table public.public_interactions
  add column if not exists is_bot boolean not null default false;

create index if not exists idx_public_interactions_is_bot
  on public.public_interactions (is_bot, created_at desc);

commit;
