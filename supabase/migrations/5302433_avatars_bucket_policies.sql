-- FILE-P2-001: declare the `avatars` bucket and give it explicit policies.
--
-- The bucket was USED by code (apps/api/src/routes/profiles.ts uploads avatars
-- and calls getPublicUrl; apps/worker/src/tasks/orphan-cleanup.ts prunes it)
-- but was declared NOWHERE: no `insert into storage.buckets`, and no policy on
-- storage.objects mentioning it. That is a security hole in both directions:
--   * reads had no defined visibility (we rely on the bucket being public);
--   * writes had no owner constraint at all beyond the default.
-- Only `documents` (5302026) and `logos` (5302031) were declared.
--
-- Design:
--   * public = true, because avatar URLs are embedded in profile responses and
--     served via getPublicUrl (a private bucket would need signed URLs and the
--     stored avatar_url would break). Avatars are deliberately public, like
--     logos - this migration makes that explicit rather than implicit.
--   * Writes are owner-scoped: the object name is `<auth.uid()>/avatar.<ext>`
--     (see profiles.ts storagePath). A user may only insert/update/delete
--     objects under their own user id prefix. Reads are open to authenticated
--     users (and, because the bucket is public, to anonymous CDN reads).
--   * The worker's orphan-cleanup runs as service_role, which bypasses RLS, so
--     it can still remove objects (it derives the key from avatar_url).
--
-- Sizing/mime limits are enforced at the API layer (resolveImageUpload,
-- ALLOWED_MIME_TYPES + size cap in profiles.ts); the bucket stays permissive so
-- an API-side limit change does not require a migration. This is noted rather
-- than silently relied upon.

begin;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Read: any authenticated user may read avatars. The bucket is public, so this
-- policy mainly serves the user-scoped client path (getPublicUrl is direct, but
-- a signed/authenticated read should not 404).
drop policy if exists avatars_bucket_select on storage.objects;
create policy avatars_bucket_select
on storage.objects
for select
to authenticated
using (bucket_id = 'avatars');

-- Insert: only into your own `<uid>/` prefix.
drop policy if exists avatars_bucket_insert_own on storage.objects;
create policy avatars_bucket_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Update (upsert replaces an existing avatar): own prefix, both sides.
drop policy if exists avatars_bucket_update_own on storage.objects;
create policy avatars_bucket_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: own prefix only.
drop policy if exists avatars_bucket_delete_own on storage.objects;
create policy avatars_bucket_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
