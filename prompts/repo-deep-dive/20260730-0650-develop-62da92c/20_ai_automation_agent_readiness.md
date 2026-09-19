# AI, Automation, and Agent Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: C:\temp\mainecybertech-portal
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30 06:50 UTC
- Auditor: principal-level repo advisor
- Area code: AI
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/20_ai_automation_agent_readiness.md
- Scope limitations: Static analysis. No runtime verification of OpenAI/Supabase MCP invocation. No actual AI model evaluation. No comparison with other AI-agent frameworks.

## Scope

Audited API-enabled automation, webhooks (inbound/outbound), webhook delivery logs, idempotency keys, retry logic, SDK for automation use, worker task queue (BullMQ/SQS), existing AI modules, AI endpoints, MCP server compatibility, tool definitions, API discoverability (OpenAPI), structured outputs (Zod schemas for agent consumption), rate limits for AI usage, agent auth patterns, LLM-friendly API design, webhook security (signatures), and existing AI tool modules.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/src/routes/webhooks.ts` | Source | Webhook management CRUD | Create, update, delete, test webhook endpoints |
| `apps/api/src/routes/public.ts` | Source | Public webhooks (Teams, JSM) | Outbound webhook calls |
| `apps/worker/src/task-registry.ts` | Source | Worker task definitions | 8+ registered tasks |
| `apps/worker/src/consumer-bullmq.ts` | Source | BullMQ consumer | Queue-based job processing |
| `apps/worker/src/consumer-sqs.ts` | Source | SQS consumer | Alternative queue backend |
| `packages/sdk/src/webhook-endpoints.ts` | Source | SDK webhook module | Typed webhook API |
| `packages/sdk/src/bulk.ts` | Source | SDK bulk operations | invite() for CSV import |
| `apps/api/src/middleware/idempotency.ts` | Source | Idempotency middleware | Redis-backed dedup |
| `apps/api/src/routes/ai-tools/` | Source | AI tools routes | CRUD for AI tools |
| `apps/api/src/routes/security-suite/` | Source | Security suite routes | 4 sub-routes |
| `apps/api/src/routes/security-operations/` | Source | Security ops routes | 4 sub-routes |
| `apps/api/src/routes/edu-automation/` | Source | Education automation | 11 sub-routes |
| `apps/web/app/(admin)/admin/ai-tools/` | Source | AI tools admin pages | CRUD UI |
| `apps/worker/src/email.ts` | Source | Email notification worker | Automated email sending |
| `docs/API_ENDPOINT_INVENTORY.md` | Doc | All API endpoints | 86+ endpoints |
| `apps/api/src/middleware/rateLimit.ts` | Source | Rate limiting | Per-route rate limits |
| `packages/sdk/src/index.ts` | Source | SDK exports | ApiClient, typed methods |
| `packages/sdk/src/search.ts` | Source | SDK search module | Admin + portal search |

## Executive Summary

**Strong automation foundations (score ~4/5).** The platform has mature automation capabilities: webhook management CRUD, webhook delivery logs with retry, idempotency enforcement (Redis-backed), worker task queue (BullMQ/SQS with health checks and graceful shutdown), outbound webhook calls (Teams, JSM, Jira, M365), and typed SDK modules for automation use.

**Key gaps:**
1. **No MCP server** — no Model Context Protocol endpoint for AI agent integration
2. **No OpenAPI/Swagger endpoint** — no `/api/openapi.json` for automated tool discovery
3. **No AI agent authentication pattern** — no API-key-based auth for AI agents (only session-cookie-based)
4. **No structured tool definitions** — no tool.json or function-calling definitions
5. **No rate limit for AI/automation usage** — AI tools use same rate limits as human users

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|---------------|------|-------|
| Webhook CRUD | `routes/webhooks.ts` | Webhook endpoint mgmt | ✅ Complete | Low | Full CRUD + test |
| Webhook deliveries | `routes/webhooks.ts` | Delivery tracking | ✅ Complete | Low | Logs each delivery |
| Idempotency | `middleware/idempotency.ts` | Dedup webhooks | ✅ Complete | Low | Redis-backed |
| Worker queue | `worker/src/` | Background jobs | ✅ Complete | Low | BullMQ + SQS |
| Outbound webhooks | `routes/public.ts` | Teams, JSM, Jira | ✅ Complete | Low | env-gated |
| AI tools module | `routes/ai-tools/` | AI tools CRUD | ✅ Complete | Low | Admin UI exists |
| Search API | `sdk/src/search.ts` | Search endpoints | ✅ Complete | Low | Admin + portal |
| Bulk operations | `sdk/src/bulk.ts` | Batch operations | ✅ Complete | Low | CSV invite |
| MCP server | — | AI agent protocol | ❌ Missing | Medium | No endpoint |
| OpenAPI spec | — | API discovery | ❌ Missing | Medium | No swagger.json |
| API key auth | — | Agent auth | ❌ Missing | Medium | Session-only |
| Tool definitions | — | Function calling | ❌ Missing | Medium | No tool.json |
| Agent rate limits | — | AI usage limits | ❌ Missing | Low | Same as human |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|------:|----------|-----|-------------------|
| API-enabled automation | 5 | Webhook CRUD, outbound, worker queue, search, bulk | None | — |
| Webhooks (inbound) | 5 | Webhook endpoint mgmt, delivery logs, retries | None | — |
| Webhook idempotency | 5 | Redis-backed dedup with deterministic keys | None | — |
| Worker task queue | 5 | BullMQ + SQS, graceful shutdown, health checks | None | — |
| SDK for automation | 5 | Typed API client, all modules covered | None | — |
| AI tool endpoints | 4 | AI tools CRUD + admin UI | No agent access pattern | Add API-key auth |
| MCP server | 0 | Not present | Complete absence | Create MCP endpoint |
| OpenAPI spec | 0 | Not present | Complete absence | Generate OpenAPI |
| API discoverability | 1 | `docs/API_ENDPOINT_INVENTORY.md` | No machine-readable spec | Add OpenAPI |
| Agent auth patterns | 1 | Session cookie only | No API key for agents | Add ApiKey auth |
| Tool definitions | 0 | Not present | Complete absence | Add tool definitions |
| Rate limits for AI | 1 | Global rate limits | No AI-specific limits | Add AI rate limit tier |

## Detailed Review

### Item: MCP Server

- **Evidence:** No MCP server file or endpoint found in any app
- **What is happening:** AI agents cannot discover or interact with the platform using the Model Context Protocol (MCP), an emerging standard for AI-agent-platform integration
- **Risks:** Medium — as AI agents become more common, lacking MCP integration limits the platform's reach
- **Recommended fix:** Create `apps/api/src/routes/mcp.ts` implementing MCP protocol with tool definitions for core operations (create ticket, search documents, list projects, etc.)

### Item: OpenAPI Spec

- **Evidence:** No `/api/openapi.json` or `/api/swagger.json` endpoint
- **What is happening:** AI agents and external tools cannot automatically discover available API endpoints, request schemas, or response types
- **Risks:** Medium — LLMs work best with machine-readable API specs; without them, AI integration requires manual configuration
- **Recommended fix:** Generate OpenAPI 3.0 spec from Zod schemas (using `@asteasolutions/zod-to-openapi`) and expose at `/api/openapi.json`

### Item: Agent Authentication

- **Evidence:** Auth pattern is session-cookie-based only (`mct_session` JWT cookie)
- **What is happening:** AI agents cannot authenticate programmatically without a browser-based login flow
- **Risks:** Medium — agents need API-key-based or token-based auth for server-to-server integration
- **Recommended fix:** Add API key authentication (see FINDINGS in API keys module already exists)

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| AI-001 | Trigger automation via API | Webhook CRUD + SDK | Full webhook mgmt | None | — | — |
| AI-002 | Schedule background job | Worker BullMQ | Queue-based tasks | None | — | — |
| AI-003 | AI agent discovers APIs | — | No OpenAPI spec | Complete absence | P2 | Add OpenAPI endpoint |
| AI-004 | AI agent authenticates | Auth middleware | Session cookie only | No API key auth | P2 | Add API key auth |
| AI-005 | Agent calls platform tools | — | No MCP endpoint | Complete absence | P2 | Add MCP server |
| AI-006 | Dedup webhook events | Idempotency middleware | Redis dedup | None | — | — |
| AI-007 | Search across entities | SDK search | Full-text search | None | — | — |

## Findings

### Finding ID: AI-P2-001 - No OpenAPI/Swagger endpoint for AI agent discovery

- Severity: P2
- Confidence: High
- Area: API discoverability
- Evidence: No OpenAPI endpoint in API routes
- What is happening: AI agents and tools cannot automatically discover the API surface
- Why it matters: LLMs consume OpenAPI specs to understand API capabilities; manual configuration is error-prone
- User / business impact: Slower AI integration, higher barrier for agent-based automation
- Recommended fix: Generate OpenAPI 3.0 spec from Zod schemas; expose at `/api/openapi.json`
- Effort estimate: Medium (3-5 days)
- Status: Open

### Finding ID: AI-P2-002 - No MCP server for AI agent protocol

- Severity: P2
- Confidence: Medium
- Area: MCP
- Evidence: No MCP endpoint in any app
- What is happening: AI agents cannot interact with the platform using the Model Context Protocol
- Why it matters: MCP is becoming the standard for agent-platform integration; absence limits future-proofing
- Recommended fix: Implement MCP server at `/mcp` with tool definitions for core operations
- Effort estimate: Medium (5 days)
- Status: Open

### Finding ID: AI-P2-003 - No API key authentication for programmatic access

- Severity: P2
- Confidence: High
- Area: Agent auth
- Evidence: Auth is session-cookie-only; no API key middleware exists
- What is happening: AI agents and automated tools cannot authenticate without browser sessions
- Why it matters: API keys are the standard for server-to-server auth; sessions are for humans
- Note: API Keys module exists in routes + admin UI but is marked "not started" in AGENTS.md
- Recommended fix: Implement API key auth middleware; finish API Keys CRUD; add key-based auth header support
- Effort estimate: Medium (3-5 days)
- Status: Open

### Finding ID: AI-P3-001 - No AI-specific rate limits

- Severity: P3
- Confidence: Medium
- Area: Rate limiting
- Evidence: Rate limiter applies same limits to all routes
- What is happening: AI/automation traffic competes with human users for the same rate limit budget
- Recommended fix: Add separate rate limit tier for API-key-authenticated requests
- Effort estimate: Small (1 day)
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|-----------|
| AI integration barrier | P2 | Medium | Medium | No OpenAPI, no MCP, no API keys | Add all three |
| Agent auth gap | P2 | Medium | Medium | Session-only auth | Add API key auth |
| Rate limit exhaustion | P3 | Low | Medium | Same limits for all | Add AI-specific tier |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

1. Generate OpenAPI 3.0 spec from Zod schemas (AI-P2-001)
2. Finish API Keys module CRUD and auth middleware (AI-P2-003)

### This Month

1. Implement MCP server endpoint with core tool definitions (AI-P2-002)
2. Add AI-specific rate limit tier (AI-P3-001)

### Later / Platform Evolution

1. Add tool definitions for all 60 modules
2. Add MCP tool discovery endpoint
3. Create AI agent playground/dashboard in admin

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|-----------|
| Generate OpenAPI spec | AI agent discovery | `apps/api/src/lib/openapi.ts` | Access /api/openapi.json |
| Finish API Keys CRUD | Programmatic auth | `apps/api/src/routes/api-keys.ts` | Create key → use in header |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|-----------|
| OpenAPI spec | P2 | Backend engineer | 5 days | None |
| API key auth | P2 | Backend engineer | 3 days | Migration |
| MCP server | P2 | Full-stack | 5 days | OpenAPI spec |
| AI rate limits | P3 | Backend engineer | 1 day | API key auth |

## Suggested Tests

- **API:** Access `/api/openapi.json` → verify valid OpenAPI 3.0 spec
- **API:** Create API key → call endpoint with `Authorization: Bearer <key>` → verify auth works
- **Integration:** MCP server responds to `list_tools` → returns tool definitions

## Suggested Documentation Updates

- Create `docs/AI_AGENT_INTEGRATION.md` documenting MCP, OpenAPI, API keys
- Update `docs/API_ENDPOINT_INVENTORY.md` with OpenAPI URL
- Update `docs/API_VERSIONING.md` with OpenAPI versioning

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Which AI agents need to integrate? | Prioritization | Product roadmap |
| Should MCP use Bearer auth or dedicated keys? | Security design | Industry standards |

## Appendix

### Potential MCP Tool Definitions

| Tool name | Description | API endpoint |
|-----------|-------------|-------------|
| create_ticket | Create a support ticket | POST /api/v1/tickets |
| search_documents | Search documents across org | GET /api/v1/documents |
| list_projects | List active projects | GET /api/v1/projects |
| get_user_profile | Get current user profile | GET /api/v1/users/me |
| search_global | Global search across entities | GET /api/v1/search/admin |

### AI Module Inventory

| Module | API | Admin UI | Status |
|--------|-----|----------|--------|
| AI Tools | `routes/ai-tools/` | Admin pages | ✅ Complete |
| Security Suite | `routes/security-suite/` | Admin pages | ✅ Complete |
| Security Operations | `routes/security-operations/` | Admin pages | ✅ Complete |
| Education Automation | `routes/edu-automation/` | Admin pages | ✅ Complete |
| API Keys | `routes/api-keys/` | Admin pages (not started) | Basement |
