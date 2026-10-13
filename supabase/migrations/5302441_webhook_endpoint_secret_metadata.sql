-- WH-P2-008 / ACM-P2-007: rotation/expiry metadata for outbound webhook
-- signing secrets.
--
-- The secret value itself is encrypted at rest by the API
-- (apps/api/src/lib/field-encryption.ts, AES-256-GCM `v1:` payloads) and
-- decrypted by the worker before HMAC signing. Existing plaintext values stay
-- readable (decrypt is a pass-through for non-`v1:` payloads) and are
-- re-encrypted on the next write, so no backfill is required here.
--
-- `secret_expires_at` is advisory metadata: the API sets it to
-- rotated_at + 90 days on write unless the caller supplies `secretExpiresAt`.
-- It is surfaced to operators for rotation checks but is NOT enforced on
-- delivery, so a missed rotation cannot silently drop events.
alter table public.webhook_endpoints
  add column if not exists secret_rotated_at timestamptz,
  add column if not exists secret_expires_at timestamptz;

comment on column public.webhook_endpoints.secret is
  'Outbound HMAC signing secret. AES-256-GCM encrypted (v1: payload) when written by the API; legacy plaintext values are decrypted transparently and re-encrypted on the next write.';
comment on column public.webhook_endpoints.secret_rotated_at is
  'When the signing secret was last set/rotated. NULL for secrets written before this metadata existed (rotation age unknown).';
comment on column public.webhook_endpoints.secret_expires_at is
  'Advisory rotation deadline for the signing secret (NULL = none recorded). Not enforced on delivery; see docs/SECRETS_ROTATION.md.';
