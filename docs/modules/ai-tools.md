# AI Tools

**Category:** Tools
**API Routes:** `apps/api/src/routes/ai.ts`
**SDK:** `packages/sdk/src/ai.ts`

## Overview
AI-powered tool management providing ticket triage analysis, automated ticket creation from triage drafts, and AI copilot features for ticket summarization and reply drafting.

## Key Features
- Ticket triage analysis with keyword-based category detection (hardware, software, network, email, access, security)
- Automatic priority suggestion (normal vs high/urgent)
- Subject line generation and missing info detection
- Triage draft listing with status tracking
- Convert triage drafts to full tickets with metadata preservation
- AI copilot ticket summarization with key points and suggested actions
- Reply draft generation with configurable tone (formal, friendly, technical, concise)

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/ai/triage/analyze | Analyze raw description, suggest category/priority/subject |
| POST | /api/v1/ai/triage/convert | Convert a triage draft into a ticket |
| GET | /api/v1/ai/triage | List triage drafts (paginated, filterable by org) |
| GET | /api/v1/ai/copilot/:ticketId/summarize | Summarize a ticket with key points and suggested action |
| POST | /api/v1/ai/copilot/:ticketId/reply-draft | Generate a reply draft with specified tone |

## Data Model
Key fields: `ticket_triage_drafts` (raw_description, suggested_category, suggested_priority, suggested_subject, missing_info, confidence_score, status, converted_ticket_id) — all have `organization_id`, `created_by`, `created_at`

## Access Control
- Admin: full access to all AI tools
- Client: triage analysis + copilot on own tickets (portal)
