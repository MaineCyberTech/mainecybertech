-- =========================================================
-- 5302427: MFA recovery codes
--
-- Single-use, high-entropy fallback codes for a lost authenticator
-- device. Only scrypt hashes are stored (see
-- `apps/api/src/lib/mfa-recovery.ts`); spending a code marks it used,
-- deletes the user's other codes and unenrolls their verified TOTP
-- factors so they regain access and must re-enroll.
--
-- RLS is enabled with NO policies on purpose: this is a deny-all table.
-- The API is the only reader/writer and uses the service-role client, so
-- a user-scoped (RLS) client can never read code hashes.
-- =========================================================

begin;

create table if not exists public.mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  salt text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mfa_recovery_codes_user_idx on public.mfa_recovery_codes(user_id) where used_at is null;

alter table public.mfa_recovery_codes enable row level security; -- rls: deny-all

commit;
