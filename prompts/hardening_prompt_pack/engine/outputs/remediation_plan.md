# Remediation Plan

| Severity | Domain | File | Issue | Fix | Effort |
|----------|--------|------|-------|-----|--------|
| P0 | security | apps/api/src/routes/users.ts | Missing tenant isolation (requireOrgAccess) | Add requireOrgAccess middleware to this router | large |
| P1 | privacy | apps/api/src/lib/auth.ts | Session cookie missing Secure/HttpOnly flags | Set cookie with httpOnly=true, secure=true, sameSite='lax' | large |
| P2 | data | apps/api/src/routes/*.ts | No Supabase RPC transactions used for multi-step operations | Wrap multi-step mutations in Supabase RPC transactions | medium |
| P2 | data | supabase/migrations/*.sql | Tables defined in migrations but never queried in API code: IF, ai_draft_outputs, appointments, chat_messages, chat_threads, comments, contract_signers, contracts, document_permissions, if, onboarding_submissions, portal_module_settings, project_members, webhook_dead_letters | Remove unused tables or add API queries | medium |
| P3 | evolution | apps/web/app/**/page.tsx | Only 221/242 pages have metadata/title tags | Add export const metadata with title to all pages | small |
| P3 | privacy | apps/api/src/routes/*.ts | Possible PII logged via logger calls | Add log sanitization wrapper to redact emails/tokens | small |
