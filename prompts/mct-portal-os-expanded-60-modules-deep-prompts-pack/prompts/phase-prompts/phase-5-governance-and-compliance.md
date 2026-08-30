# Phase 5 - Governance and Compliance Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **MSP SOP Library Compliance Mapper**: Versioned SOP and procedure library mapped to frameworks such as NIST, ISO 27001, CIS, HIPAA-adjacent, PCI-adjacent, and CMMC-readiness.
- **Compliance Readiness Lite for Small Businesses**: Questionnaires, control checklists, evidence, risk register, policy library, and client-friendly readiness reports.
- **Cyber Insurance Evidence Binder**: Collects and organizes evidence commonly requested for cyber insurance questionnaires, renewals, and attestations.
- **Change Advisory Mini-CAB Tool**: Lightweight change request, risk, approval, implementation, verification, and rollback tracker for small MSP environments.
- **Small Business AI Policy Assistant**: Helps clients draft basic AI use policies, approved tools lists, data handling rules, and employee guidance.
- **Risk Acceptance Register**: Tracks known risks accepted by clients/internal stakeholders, acceptance owner, expiration, review cadence, compensating controls, and evidence.
- **Data Retention Policy Manager**: Records retention expectations, data categories, systems, retention periods, disposal notes, and policy review workflows.
- **Tabletop Exercise Planner**: Plans cybersecurity/business continuity tabletop exercises with scenarios, roles, injects, notes, action items, and after-action reports.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
