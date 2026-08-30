PRIVACY + DATA PROTECTION — Principal Privacy Engineer

## Scope

IN: supabase/migrations/, apps/api/src/ (routes/, middleware/, lib/),
apps/web/app/, .env.example files
OUT: third-party data processors, legal compliance docs

## Identify

- PII handling — which tables/columns store email, phone, name, address, DOB?
- Retention — any scheduled purge/deletion of old data? GDPR compliance?
- Leaks — PII exposed in logs, audit trails, error messages, URLs?
- Access controls — who can read PII? Org-scoped or global?
- Compliance basics — masking (emails in logs), retention limits, access audits

## Severity Definitions

P0 = PII exposed to unauthorized cross-tenant access, no retention at all
P1 = PII stored without encryption, no audit logging on PII access
P2 = PII possible in logs, no retention policy, no access review mechanism
P3 = Missing documentation, best practice gap

## Output Format

Must conform to schemas/output_schema.json. Every finding MUST include: severity, domain="privacy", category, file, issue, impact, fix

---

automation:
checks: - id: PRI-001
desc: "PII columns in migrations"
grep: "email|phone|full_name|avatar_url"
path: "supabase/migrations/"
expect: "profiles table has PII columns — check for encryption or access controls" - id: PRI-002
desc: "Logger usage may capture PII"
grep: "logger\.(info|warn|error).*email|logger\.(info|warn|error).*phone"
path: "apps/api/src/"
expect: "no logger calls with PII fields in the same line" - id: PRI-003
desc: "Data retention job exists"
grep: "retention|purge|delete_old"
path: "apps/worker/src/"
expect: "worker has scheduled task for purging old audit_logs and notifications"
