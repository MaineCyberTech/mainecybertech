## Hardening Prompt Pack Audit Results

### Global Risk Score: 50/100
### Status: BLOCKED - Do Not Deploy

| Severity | Count |
|----------|-------|
| P0 | 1 |
| P1 | 1 |
| P2 | 2 |
| P3 | 2 |
| **Total** | **6** |

### Domain Breakdown
- **data**: 2 findings
- **evolution**: 1 findings
- **privacy**: 2 findings
- **security**: 1 findings

### Key Findings
- **[PP0]** security: Missing tenant isolation (requireOrgAccess) (apps/api/src/routes/users.ts)
- **[PP2]** data: No Supabase RPC transactions used for multi-step operations (apps/api/src/routes/*.ts)
- **[PP2]** data: Tables defined in migrations but never queried in API code: IF, ai_draft_outputs, appointments, chat_messages, chat_threads, comments, contract_signers, contracts, document_permissions, if, onboarding_submissions, portal_module_settings, project_members, store_leads, store_proposal_drafts, store_quote_requests, store_visual_assets, webhook_dead_letters (supabase/migrations/*.sql)
- **[PP1]** privacy: Session cookie missing Secure/HttpOnly flags (apps/api/src/lib/auth.ts)
- **[PP3]** privacy: Possible PII logged via logger calls (apps/api/src/routes/*.ts)
- **[PP3]** evolution: Only 296/301 pages have metadata/title tags (apps/web/app/**/page.tsx)
