alter table if exists public.phishing_campaigns add column if not exists target_count integer default 0;
alter table if exists public.phishing_campaigns add column if not exists click_count integer default 0;
alter table if exists public.phishing_campaigns add column if not exists reported_count integer default 0;
alter table if exists public.phishing_campaigns add column if not exists launched_at timestamptz;