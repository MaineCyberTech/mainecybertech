# Phase 6 - Automation and AI Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **MSP Automation Workflow Catalog**: Catalog, document, approve, and execute repeatable scripts/workflows with logs and rollback notes.
- **AI Ticket Intake Triage Assistant**: Transforms vague client requests into structured tickets with category, priority, missing information, and suggested first response.
- **License Optimizer Seat Reclaimer**: Tracks assigned vs used licenses, renewal costs, inactive users, unused seats, and reclaim recommendations.
- **PowerShell Script Builder Policy Guard**: Generates and reviews PowerShell scripts against internal safety rules, logging standards, rollback expectations, and approval gates.
- **AI Service Desk Copilot Console**: Operator-facing AI console that summarizes tickets, drafts replies, recommends next troubleshooting questions, and links related KB/runbook content while preserving human approval.
- **AI Knowledge Base Article Generator**: Converts resolved tickets, runbooks, and SOP notes into draft KB articles with review workflow and client/internal visibility controls.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
