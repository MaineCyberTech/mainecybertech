# Small Business AI Policy Assistant

**Category:** Edu & Automation
**API Routes:** `apps/api/src/routes/edu-automation.ts` (mounted at `/api/v1/edu-automation`)
**SDK:** `packages/sdk/src/edu-automation.ts` (`eduAutomation.aiPolicy`)
**Table:** `ai_policies` (migration `5302073_edu_automation.sql`)

## Overview

Records basic AI use policies for clients: approved tools lists, data handling rules, employee guidance, and approval metadata. Admins manage policy documents; the portal surfaces approved policies to clients.

## Key Features

- Policy records with title, content, approved tools, data handling rules, employee guidance
- Draft/approved status with `approved_by` / `approved_at`
- Admin CRUD; approved policies viewable by clients

## Endpoints

| Method | Path                                 | Description                           |
| ------ | ------------------------------------ | ------------------------------------- |
| GET    | /api/v1/edu-automation/ai-policy     | List policies (paginated, org-scoped) |
| GET    | /api/v1/edu-automation/ai-policy/:id | Get single policy                     |
| POST   | /api/v1/edu-automation/ai-policy     | Create policy                         |
| PATCH  | /api/v1/edu-automation/ai-policy/:id | Update policy                         |
| DELETE | /api/v1/edu-automation/ai-policy/:id | Delete policy                         |

## Data Model

`ai_policies` (id, organization_id, title, content, approved_tools text[], data_handling_rules, employee_guidance, status, approved_by, approved_at, created_by, created_at, updated_at).

## Access Control

- `requireAuth` + `requireOrgAccess` on all routes
- RLS via `ai_policies` org policies
- Admin pages at `apps/web/app/(admin)/admin/edu-automation/ai-policy/`
