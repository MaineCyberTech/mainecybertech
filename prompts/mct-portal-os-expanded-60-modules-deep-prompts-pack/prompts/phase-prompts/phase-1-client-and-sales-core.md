# Phase 1 - Client and Sales Core Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **Multi-Tenant MSP Client Portal**: Foundation portal for tickets, approvals, reports, documents, contacts, assets, roadmaps, service health, and client self-service.
- **Client Onboarding Command Center**: Repeatable workspace for client discovery, M365 setup, access collection, network baseline, documentation, security baseline, and support handoff.
- **MSP Proposal Builder Pricing Engine**: Proposal templates, phases, options, assumptions, pricing scenarios, PDF-ready export, and cover email generation.
- **Client Project Tracker**: Client-visible project board with phases, milestones, dependencies, files, approvals, status updates, and change requests.
- **Secure File Request Portal**: One-time or scoped file request links for clients to upload bills, floor plans, exports, logs, photos, and evidence securely.
- **Client Satisfaction Pulse Widget**: Quick CSAT/NPS-style pulse surveys tied to tickets, projects, QBRs, onboarding milestones, and follow-ups.
- **Dynamic Client Forms Builder**: No-code form builder for client intake forms, onboarding questionnaires, site surveys, access requests, incident reports, and approval forms.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
