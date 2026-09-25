# Phase 2 - Operations Backbone Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **Client Asset Warranty Tracker**: Asset register with warranties, replacement planning, QR labels, maintenance notes, lifecycle scoring, and client visibility.
- **QBR Executive Report Generator**: Monthly/quarterly executive reports summarizing tickets, risks, assets, projects, security, backups, and recommendations.
- **Open Findings Audit Remediation Tracker**: P0/P1/P2/P3 finding lifecycle for repo, security, network, SOP, and client assessments.
- **Client Runbook Builder**: Creates client-specific support runbooks from SOP templates, asset data, contacts, vendors, escalation rules, and known issues.
- **Vendor Contract Renewal Calendar**: Tracks vendor contracts, client service renewals, domains, certificates, warranties, insurance, and agreement dates.
- **Client Budget Roadmap Planner**: Plans technology budgets by quarter/year across replacements, projects, licenses, security, and lifecycle needs.
- **Vendor Contact Escalation Directory**: Centralized vendor directory with contacts, support portals, account IDs, escalation paths, contract notes, and client-specific ownership.
- **Client Billing Service Catalog**: Defines recurring services, billable items, included/excluded scope, pricing tiers, bundled services, and client-specific subscriptions.
- **Time Entry Worklog Summarizer**: Summarizes technician worklogs into client-friendly updates, QBR value statements, billing narratives, and internal lessons learned.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
