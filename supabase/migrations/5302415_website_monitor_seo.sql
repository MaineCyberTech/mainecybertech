-- Module 28: on-page audit signals for website monitors.
-- `lighthouse_score` needs a headless Chrome runner (not present in the
-- worker image); these columns hold the deterministic signals the worker can
-- collect itself: a heuristic SEO/quality score, the page size, and the
-- specific issues found.
alter table website_monitors
  add column if not exists seo_score integer,
  add column if not exists last_page_bytes integer,
  add column if not exists seo_issues jsonb not null default '[]'::jsonb;
