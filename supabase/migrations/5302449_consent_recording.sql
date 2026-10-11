-- =========================================================
-- 5302449: record consent server-side (version + timestamp)
--
-- PRIV-P2-002: consent was browser-only. public_interactions
-- already records consent_at (5302438); this adds the policy
-- version to it and extends the same record to the store quote
-- path (store_quotes + store_quote_requests), whose submissions
-- now require an explicit consent flag before any PII is stored.
-- NULL consent_at = no consent on record (default-deny).
-- =========================================================

begin;

alter table public.public_interactions
  add column if not exists consent_version text;

comment on column public.public_interactions.consent_version is
  'Privacy-policy version the visitor consented to; NULL = no consent on record.';

alter table public.store_quotes
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text;

comment on column public.store_quotes.consent_at is
  'When the submitter granted privacy-policy consent; NULL = no consent on record.';

comment on column public.store_quotes.consent_version is
  'Privacy-policy version the submitter consented to.';

alter table public.store_quote_requests
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text;

comment on column public.store_quote_requests.consent_at is
  'When the submitter granted privacy-policy consent; NULL = no consent on record.';

comment on column public.store_quote_requests.consent_version is
  'Privacy-policy version the submitter consented to.';

commit;
