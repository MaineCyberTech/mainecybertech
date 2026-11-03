-- =========================================================
-- 5302465: revoke anonymous INSERT on store_quotes (PRIV-P2-010)
--
-- 5302434 granted `insert` to anon and 5302448 allowed an anonymous insert
-- whenever `organization_id is null`. The storefront now writes quotes through
-- POST /store/quotes (service role), which enforces consent, validation,
-- Turnstile and rate limits before persisting. Leaving the direct PostgREST
-- insert path open lets anyone with the publishable/anon key create quote PII
-- with consent_at = NULL, bypassing every application control.
--
-- Drop the anon policy and the grant. Authenticated tenant inserts keep their
-- own approved-membership policy from 5302448.
-- =========================================================

begin;

drop policy if exists "anon_insert_quotes" on public.store_quotes;
revoke insert on table public.store_quotes from anon;

commit;
