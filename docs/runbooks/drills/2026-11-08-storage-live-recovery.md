# D5 live storage recovery drill — 2026-11-08

**Drill:** D5 (storage bucket recovery)
**Operator:** Kestrel Ops
**Target:** dev Supabase project `gigpuknitajakejmyxuk`, private
`storage-drill` bucket
**Backend:** Raven SeaweedFS S3 endpoint `http://192.168.222.120:8333`
**Runner:** `ci-runner` (org self-hosted `lab-docker`)

## Artifact

- Archive: `s3://mct-mainecybertech/storage-backups/supabase-storage-2026-11-08-055651.tar.gz.enc`
- Manifest: `object_count: 1`, buckets `documents avatars logos storage-drill`
- Object: `storage-drill/README.txt` (167 bytes)
- Original SHA-256: `6bfed737c6c4bebc118f2a21ef8269f160c0bf4b4da7767ac1c90ea690408c73`
- Original ETag: `fc71c8ca6f45bf7fcab3bb5765f1ec77`

## Procedure

1. Ran `scripts/restore-storage.sh --verify-only` against the archive; the
   manifest matched the extracted object count and the archive was non-empty.
2. Downloaded and hashed `storage-drill/README.txt`.
3. Deleted the object through the Supabase Storage API and confirmed the bucket
   listing was empty.
4. Ran `scripts/restore-storage.sh` with `STORAGE_BUCKETS=storage-drill` and
   `RESTORE_UPSERT=1` against the same archive.
5. Downloaded the restored object and compared the SHA-256 and MIME type.

## Result

**Passed.**

- Restore completed: `Storage Restore complete: 1 object(s)`.
- Restored size: 167 bytes.
- Restored SHA-256: `6bfed737c6c4bebc118f2a21ef8269f160c0bf4b4da7767ac1c90ea690408c73`
  (matches the original).
- Restored ETag: `fc71c8ca6f45bf7fcab3bb5765f1ec77` (matches the original).
- Restored `Content-Type: text/plain` (see follow-up).

## Follow-up

The first live restore exposed a fidelity gap: `upload_object` did not set a
`Content-Type`, so Supabase stored `application/x-www-form-urlencoded`. The
restore script now infers the MIME type with `file --mime-type -b` and falls
back to `application/octet-stream`; the final drill restored `text/plain`.
The archive itself still has no content-type sidecar, so the MIME type is
inferred rather than restored as exact metadata.

The seed remains in place so the weekly non-empty backup/restore test
continues to exercise a real object. Production storage recovery remains open
because the production portal is not deployed and prod backup secrets are not
provisioned.
