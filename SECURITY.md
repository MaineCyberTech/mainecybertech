# SECURITY.md

## Reporting a security issue

If you discover a security issue in the Maine CyberTech Portal, do **not** open a public issue containing exploit details, credentials, or private tenant data.

Instead, email **security@mainecybertech.com** (or the repository owner / maintainer if that address is unavailable) with:

- a clear description of the issue
- reproduction steps if safe to share
- potential impact and affected components

Please give us a reasonable window to investigate and remediate before any public disclosure — we aim to acknowledge within 3 business days and to agree a disclosure timeline with you. Do not test against production data or other tenants; use the local stack (`supabase start` + seeds).

## Supported versions

Only the `main` branch (production) and `develop` (staging) are supported. Older tags receive no security fixes.

## Related runbooks

- [docs/SECRETS_ROTATION.md](docs/SECRETS_ROTATION.md)
- [docs/JWT_ROTATION.md](docs/JWT_ROTATION.md)
- [docs/RLS-rollout.md](docs/RLS-rollout.md)
- [docs/MFA.md](docs/MFA.md)

## Sensitive areas in this repository

Particular care should be taken when reviewing or changing:

- authentication flows (PKCE callback, `mct_session`, MFA/`aal2` enforcement)
- environment variables and secrets
- Supabase roles and keys
- row-level security (RLS) policies
- storage policies
- billing or contract-related data paths
- audit log or admin access behavior (platform-admin impersonation is logged)

## Safe handling expectations

- Never commit real `.env` or secret values.
- Never publish tenant or customer data in issues, PRs, or screenshots.
- Avoid posting raw production logs if they contain sensitive values.
- Treat migration and policy changes as security-sensitive changes.
- Prefer `redirect: "manual"` + the SSRF guard for any user-supplied URL; never disable the CSRF double-submit cookie's `httpOnly: false` (the SDK reads it).
