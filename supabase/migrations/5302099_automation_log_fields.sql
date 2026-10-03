alter table if exists public.automation_workflows add column if not exists last_run_at timestamptz;
alter table if exists public.automation_workflows add column if not exists last_result text;
alter table if exists public.kb_article_generations add column if not exists generated_body text;
alter table if exists public.kb_article_generations add column if not exists generated_at timestamptz;
alter table if exists public.kb_article_generations add column if not exists reviewed_by uuid;
alter table if exists public.identity_verifications add column if not exists verified_at timestamptz;
alter table if exists public.identity_verifications add column if not exists verified_by uuid;
alter table if exists public.identity_verifications add column if not exists notes text;