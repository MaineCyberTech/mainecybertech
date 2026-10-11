-- FILE-P2-008: members with `documents:create` could write objects straight to
-- the private `documents` bucket with a Supabase access token, bypassing the
-- API's upload validation (MIME allow-list, 2MB cap, byte sniffing).
--
-- The bucket is private, but "private" is a READ property: the authenticated
-- INSERT/UPDATE policies (5302026, tightened by 5302129) still let an approved
-- member with `documents:create` PUT arbitrary bytes — markup, oversized files,
-- any content — under their org's prefix. `validateUploadContent` only runs in
-- the API, so a direct-to-storage writer never sees it.
--
-- Fix: all object writes flow through the API, which validates content and
-- uploads as service_role. service_role bypasses RLS, so removing the
-- authenticated INSERT/UPDATE policies does not affect the API (documents
-- upload, file-request upload, worker orphan-cleanup, storage restore). The
-- SELECT/DELETE policies are unchanged; the org-prefix check
-- (`storage_path_org_id`) remains in those policies and in the API's
-- server-side path construction as defense in depth.
--
-- The bucket-level `file_size_limit` is a second, storage-API-enforced layer:
-- it constrains every writer, including service_role, and matches the API's
-- 25MiB multer ceiling for file-request uploads.
--
-- `allowed_mime_types` is deliberately NOT set here: the storage API applies it
-- to service-role writes too, and the restore path (scripts/restore-storage.sh)
-- re-uploads archived objects without their original Content-Type, so a MIME
-- allow-list would break disaster recovery until the restore preserves MIME
-- metadata. MIME validation stays in the API (validateUploadContent).

begin;

update storage.buckets
set file_size_limit = 26214400  -- 25 MiB, the API's maximum upload size
where id = 'documents';

-- No authenticated INSERT: object writes go through the API (service_role).
drop policy if exists documents_bucket_insert_aligned on storage.objects;

-- No authenticated UPDATE either: an overwrite would replace already-validated
-- bytes with unvalidated ones (the API never upserts a documents object).
drop policy if exists documents_bucket_update_aligned on storage.objects;

commit;
