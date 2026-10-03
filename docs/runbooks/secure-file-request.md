# Secure File Request - Runbook

## Owner

MSP Operations / Client Services

## Normal Operation

### Daily

- Review `portal/file-requests` for requests near `expires_at` or upload limits
- Verify revoked requests are not accidentally re-shared

### Weekly

- Purge or close requests that have reached `max_files` and are no longer needed
- Confirm uploads landed in the `documents` storage bucket

### Monthly

- Audit storage usage from public uploads
- Review notify-on-upload delivery reliability with the requester

## Common Failures

### 1. Public Link Returns 410

**Symptoms**: Uploader gets "link no longer active"
**Causes**: Request revoked, expired, or `upload_count >= max_files`
**Resolution**:

1. Check status: `SELECT status, expires_at, upload_count, max_files FROM file_requests WHERE token = '<token>';`
2. Re-open by creating a new request and sharing the new link
3. Confirm `max_files` is not exhausted (increment happens on each upload)

### 2. File Rejected on Upload

**Symptoms**: Uploader gets a 400 "File type ... is not allowed"
**Causes**: Blocked extension (`.exe`, `.ps1`, etc.) or MIME not in `allowed_mime_types`
**Resolution**:

1. Verify `allowed_mime_types` on the request
2. Review `BLOCKED_EXTENSIONS` in `apps/api/src/routes/file-requests.ts`
3. Ask the sender to re-encode/archive (e.g., `.zip` of the file)

### 3. Upload "Unavailable" on Public Page

**Symptoms**: `/upload/[token]` shows an error banner
**Causes**: API unreachable from public host, or token invalid
**Resolution**:

1. Test `GET /api/v1/file-requests/public/<token>` directly
2. Confirm public API URL is configured (`NEXT_PUBLIC_API_URL`)
3. Check `file_requests` row for the token

### 4. No Notification After Upload

**Symptoms**: Requester never notified
**Causes**: `notify_on_upload` false, or notification delivery failed
**Resolution**:

1. Check `notify_on_upload` on the request
2. Verify a `notifications` row was created for `created_by`
3. Confirm in-app notification preferences allow "documents" module

## Verification Steps

### Health Check

```bash
curl -H "Authorization: Bearer $TOKEN" "https://api.mainecybertech.com/api/v1/file-requests?organization_id=$ORG_ID"
```

### Data Integrity

```sql
-- Expired but active
SELECT title, token FROM file_requests WHERE expires_at < now() AND status = 'active';

-- Orphaned tokens (upload_count higher than files uploaded)
SELECT token, upload_count FROM file_requests;
```

## Escalation

| Severity | Contact           | SLA   |
| -------- | ----------------- | ----- |
| P1       | Platform Engineer | 2 hrs |
| P2       | Backend Engineer  | 4 hrs |
| P3       | Frontend Engineer | 1 day |

## Rollback Notes

### Migration Rollback

```sql
DROP TABLE IF EXISTS file_requests;
```

### API Rollback

1. Revert `/api/v1/file-requests` registration in `apps/api/src/app.ts`
2. Revert `apps/api/src/routes/file-requests.ts`
3. Deploy previous API image

### Web Rollback

1. Revert `apps/web/app/(public)/upload/[token]/`
2. Revert `apps/web/app/(portal)/portal/file-requests/`
3. Deploy previous Web image

## Monitoring

- **Metric**: `file_requests_active` (gauge) - active unexpired requests
- **Metric**: `file_request_upload_count` (counter) - uploads per request
- **Alert**: > 10 requests expiring within 24 hours → P3
- **Alert**: Upload success rate < 95% → P2

## Related Documentation

- Feature spec: `docs/features/secure-file-request.md`
- Database schema: `supabase/migrations/5302064_file_requests.sql`
