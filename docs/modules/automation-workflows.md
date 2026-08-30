# MSP Automation Workflow Catalog

**Category:** Automation
**API Routes:** `apps/api/src/routes/automation-workflow.ts`
**SDK:** `packages/sdk/src/automation-workflow.ts`

## Overview

Catalog of reusable automation workflows for common MSP operations — new client onboarding, offboarding, password resets, software deployment, patch scheduling, and report generation. Workflows define trigger conditions, step sequences, approval gates, and RMM script bindings.

## Key Features

- Workflow template CRUD with category tagging (onboarding/offboarding/patching/reporting/security)
- Step-based workflow builder — ordered steps with configurable actions, timeouts, and rollback steps
- Trigger configuration — schedule (cron), event-driven (ticket created), or manual execution
- Approval gates — designate required approvers at specific step checkpoints
- Execution history with per-step status, logs, and duration tracking
- RMM tool integration stubs for scripting bindings (ConnectWise, Ninja, Datto RMM)

## Endpoints

| Method | Path                                                | Description                                                   |
| ------ | --------------------------------------------------- | ------------------------------------------------------------- |
| GET    | /api/v1/automation-workflows                        | List workflows (paginated, filterable by org/category/status) |
| POST   | /api/v1/automation-workflows                        | Create workflow template                                      |
| GET    | /api/v1/automation-workflows/:id                    | Get workflow with steps and triggers                          |
| PATCH  | /api/v1/automation-workflows/:id                    | Update workflow                                               |
| DELETE | /api/v1/automation-workflows/:id                    | Delete workflow                                               |
| POST   | /api/v1/automation-workflows/:id/execute            | Trigger manual execution                                      |
| GET    | /api/v1/automation-workflows/:id/executions         | List execution history                                        |
| GET    | /api/v1/automation-workflows/:id/executions/:execId | Get execution detail with step logs                           |

## Data Model

`automation_workflows` (organization_id, name, category, description, status (draft/active/archived), trigger_type (manual/schedule/event), trigger_config JSON, created_by). `automation_workflow_steps` (workflow_id, step_order, action_type, config JSON, timeout_seconds, rollback_step_id, approval_required, approver_role). `automation_workflow_executions` (workflow_id, triggered_by, status (running/success/failed/aborted), started_at, completed_at, step_results JSON).

## Access Control

- Admin: full CRUD, manual execution trigger, view execution logs
- Client: read-only view of workflows assigned to their org
- requireOrgAccess on all endpoints; RLS via organization_id
- Audit logging on create, update, delete, and execution triggers
