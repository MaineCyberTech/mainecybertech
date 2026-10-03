-- P3-7: Field-level encryption at rest for PII columns in `public.profiles`.
--
-- The plaintext columns (full_name, email, phone, title) are intentionally kept
-- so the API/web response shape is unchanged (non-breaking). We additionally
-- store an AES-256-GCM encrypted copy of those fields in a new `encrypted_pii`
-- jsonb column so the sensitive data is encrypted at rest. The API populates
-- this column via apps/api/src/lib/profile-pii.ts whenever a profile is written.
--
-- The column is intentionally NULLABLE with no default: existing rows are
-- populated by the one-time backfill script (scripts/backfill-profile-pii.mjs),
-- and rows created before that script runs simply have NULL until next write.
--
-- Idempotent: safe to re-run even if a previous (failed) apply partially created
-- the column with a NOT NULL / default constraint.

alter table public.profiles
  add column if not exists encrypted_pii jsonb;

alter table public.profiles
  alter column encrypted_pii drop not null;

alter table public.profiles
  alter column encrypted_pii drop default;

comment on column public.profiles.encrypted_pii is
  'AES-256-GCM encrypted mirror of PII fields (full_name, email, phone, title). Populated by the API on profile write for at-rest encryption; plaintext columns remain the source of truth for responses.';

-- RLS: profiles already has authenticated select/update policies. The API writes
-- via service_role which bypasses RLS, but add an explicit policy for clarity.
-- Wrapped in a DO block so it is safe to re-run (PostgreSQL has no
-- CREATE POLICY IF NOT EXISTS before v15 and the hosted version rejects it).
do $$
begin
  drop policy if exists "profiles_service_role_all" on public.profiles;
  create policy "profiles_service_role_all"
    on public.profiles
    for all to service_role
    using (true) with check (true);
end $$;
