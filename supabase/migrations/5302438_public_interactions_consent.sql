-- =========================================================
-- 5302438: record analytics consent on public_interactions
--
-- PRIV-P2-001 / AN-P2-005: visitor tracking (IP, user-agent,
-- geolocation) is default-deny and only captured after the visitor
-- opts in via the consent banner. `consent_at` records when the
-- consent decision was persisted server-side; NULL means no consent
-- on record (including explicit denial, which is not stored).
-- =========================================================

begin;

alter table public.public_interactions
  add column if not exists consent_at timestamptz;

comment on column public.public_interactions.consent_at is
  'When the visitor granted analytics consent; NULL = no consent on record (default-deny).';

commit;
