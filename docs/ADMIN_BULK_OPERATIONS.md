# Admin Bulk Operations Runbook

Operating guide for the expensive/destructive admin bulk paths — bulk document
metadata/folder updates, bulk user invites, and organization onboarding. These
routes are rate-limited and gated so a single token cannot mass-mutate tenant
data or mint accounts without review.

## Rate limiting (ADMIN-P2-005)

`rateLimitAdminOps` in `apps/api/src/middleware/rate-limit.ts` caps the routes
below at **10 requests/minute per bearer token** (client IP when
unauthenticated; loopback is skipped for local development). It reuses the
existing `userRateLimitKeyGenerator` (SHA-256 of the token) so rotating forged
`sub` claims cannot mint fresh buckets.

| Route                                          | Why it is limited                     |
| ---------------------------------------------- | ------------------------------------- |
| `POST /api/v1/bulk/invite`                     | up to 500 auth accounts per call      |
| `POST /api/v1/documents/bulk/folder`           | mass folder reassignment              |
| `POST /api/v1/documents/bulk/metadata`         | mass metadata/visibility changes      |
| `POST /api/v1/tickets/bulk`                    | mass ticket state transitions         |
| `POST /api/v1/organizations/onboard`           | org + auth user + membership creation |
| `DELETE /api/v1/organizations/:id`             | cascading tenant delete               |
| `GET /api/v1/audit/export`                     | full-trail export (up to 10k rows)    |
| `GET /api/v1/audit/impersonation/export`       | cross-tenant impersonation trail      |

Exceeding the limit returns HTTP 429. The SDK retries 429s with backoff, so an
operator should surface the wait time instead of retrying in a tight loop.

## Bulk document updates — preview, then apply (ADMIN-P2-003)

`POST /documents/bulk/folder` and `POST /documents/bulk/metadata` accept:

- `dryRun: true` — resolves the documents the caller may touch and returns the
  per-row preview **without writing**:

  ```json
  {
    "dryRun": true,
    "requested": 12,
    "matched": 11,
    "skipped": 1,
    "rows": [
      {
        "id": "…",
        "before": { "visibility": "org" },
        "after": { "visibility": "public" },
        "changes": ["visibility"]
      }
    ]
  }
  ```

  `skipped` counts requested ids outside the caller's organization scope.
  Dry-run never calls the bulk RPC and never writes an audit event.

- `confirm: true` — required to apply a metadata update that includes
  `visibility` (elevated operation). Applying without it returns HTTP 400
  `CONFIRMATION_REQUIRED`. Folder/description-only applies do not require the
  flag.

Recommended operator flow: call with `dryRun: true`, review `rows[].changes`,
then re-send the same payload without `dryRun` (plus `confirm: true` when
visibility is included).

## Bulk invite — confirmation required (ADMIN-P2-004)

New addresses are created through `supabase.auth.admin.inviteUserByEmail`:
the auth account is **unconfirmed** until the invitee clicks the email link and
sets a password. There is no pre-confirmed/random-password path any more.
Memberships are always inserted as `pending`; approving them is a separate
step.

## Organization onboarding — first admin starts pending (ADMIN-P2-004)

`POST /organizations/onboard` still requires a platform super admin (the admin
role key is cross-tenant). The first admin membership is now created with
`status: "pending"` and the response includes `approvalRequired: true`. After
the invitee confirms their email, a platform super admin approves the
membership from the memberships admin queue before the admin can act for the
tenant.

## Related documents

- [API_RATE_LIMITING.md](API_RATE_LIMITING.md) — limiter configuration
- [ADMIN_FEATURES.md](ADMIN_FEATURES.md) — admin console features
