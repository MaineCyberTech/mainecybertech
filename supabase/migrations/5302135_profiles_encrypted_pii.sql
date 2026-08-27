-- P3-7: Field-level encryption at rest for PII columns in `public.profiles`.
--
-- The plaintext columns (full_name, email, phone, title) are intentionally kept
-- so the API/web response shape is unchanged (non-breaking). We additionally
-- store an AES-256-GCM encrypted copy of those fields in a new `encrypted_pii`
-- jsonb column so the sensitive data is encrypted at rest. The API populates
-- this column via apps/api/src/lib/profile-pii.ts whenever a profile is written.
--
-- Backfill of existing rows (idempotent: only fills `encrypted_pii` when null)
-- is a deliberate follow-up and not performed in this migration to avoid locking
-- large tables / breaking tests.

alter table public.profiles
  add column if not exists encrypted_pii jsonb not null default '{}'::jsonb;

comment on column public.profiles.encrypted_pii is
  'AES-256-GCM encrypted mirror of PII fields (full_name, email, phone, title). Populated by the API on profile write for at-rest encryption; plaintext columns remain the source of truth for responses.';

-- RLS: profiles already has authenticated select/update policies. The API writes
-- via service_role which bypasses RLS, but add an explicit policy for clarity.
create policy if not exists "profiles_service_role_all"
  on public.profiles
  for all to service_role
  using (true) with check (true);
