# Small Business AI Policy Assistant

**Category:** Compliance
**API Routes:** `apps/api/src/routes/ai-policy.ts`
**SDK:** `packages/sdk/src/ai-policy.ts`

## Overview

Guided AI usage policy generator for small businesses adopting generative AI tools (ChatGPT, Copilot, Gemini, Claude, Midjourney). Provides compliance-aligned policy templates addressing data privacy, acceptable use, disclosure requirements, and employee training. Supports NIST AI RMF and EU AI Act awareness mappings.

## Key Features

- Policy template library — Acceptable Use, Data Privacy, Disclosure, Vendor Risk, Incident Response for AI
- Guided questionnaire — business size, AI tools used, data sensitivity level, industry → recommended policy clauses
- Policy generation — assemble clauses into a printable policy document with effective date and version
- AI tool inventory — track which AI tools employees use, department-by-department adoption
- Employee acknowledgment — policy acceptance workflow with digital signature capture
- Periodic review reminders — 90-day review cadence with automated notification to compliance owner
- Export — generated policy as PDF or DOCX

## Endpoints

| Method | Path                                       | Description                                  |
| ------ | ------------------------------------------ | -------------------------------------------- |
| GET    | /api/v1/ai-policy/templates                | List policy templates by domain              |
| POST   | /api/v1/ai-policy/generate                 | Generate policy from questionnaire responses |
| GET    | /api/v1/ai-policy/policies                 | List org policies (paginated by org/status)  |
| POST   | /api/v1/ai-policy/policies                 | Create policy from generated draft           |
| PATCH  | /api/v1/ai-policy/policies/:id             | Update policy version                        |
| POST   | /api/v1/ai-policy/policies/:id/publish     | Publish policy for acknowledgment            |
| POST   | /api/v1/ai-policy/policies/:id/acknowledge | Employee acknowledgment                      |
| GET    | /api/v1/ai-policy/tools                    | List AI tools tracked per org                |
| POST   | /api/v1/ai-policy/tools                    | Register AI tool usage                       |
| GET    | /api/v1/ai-policy/export/:id               | Export policy as PDF                         |

## Data Model

`ai_policy_templates` (domain, name, default_clauses JSON, risk_level). `ai_policies` (organization_id, title, domain, clauses JSON, status (draft/published/archived), version, effective_date, review_by_date, created_by, published_at). `ai_policy_acknowledgments` (policy_id, user_id, accepted_at, ip_address). `ai_tool_inventory` (organization_id, tool_name, tool_category, department, users_count, data_sensitivity, approved boolean, registered_by).

## Access Control

- Admin: manage templates, generate policies, publish, export
- Client: view policies, submit acknowledgments, register tools
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on policy create, publish, acknowledgment, and tool registration
