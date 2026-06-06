# SECURITY.md

## Reporting a security issue

If you discover a security issue in the Maine CyberTech Portal, do **not** open a public issue containing exploit details, credentials, or private tenant data.

Instead:
- report the issue privately to the repository owner / maintainer
- include a clear description of the issue
- include reproduction steps if safe to share
- include potential impact and affected components

## Sensitive areas in this repository

Particular care should be taken when reviewing or changing:
- authentication flows
- environment variables and secrets
- Supabase roles and keys
- row-level security (RLS) policies
- storage policies
- billing or contract-related data paths
- audit log or admin access behavior

## Safe handling expectations

- Never commit real `.env` or secret values.
- Never publish tenant or customer data in issues, PRs, or screenshots.
- Avoid posting raw production logs if they contain sensitive values.
- Treat migration and policy changes as security-sensitive changes.
