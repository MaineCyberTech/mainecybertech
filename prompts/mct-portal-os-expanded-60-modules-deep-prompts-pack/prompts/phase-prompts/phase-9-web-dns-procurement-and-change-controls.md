# Phase 9 - Web, DNS, Procurement, and Change Controls Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **Vendor SaaS Subscription Audit Portal**: Import bank/card exports, detect recurring SaaS/vendors, classify spend, and identify cancellation/security risks.
- **DNS Domain Cloudflare Health Monitor**: Domain, DNS, SSL, SPF, DKIM, DMARC, nameserver, and Cloudflare posture monitoring.
- **Procurement Quote Comparison Tool**: Compare hardware/software/vendor quotes, options, margins, warranty terms, deployment notes, and recommendation rationale.
- **SLA SLO Tracker**: Tracks service targets, response/resolution commitments, breach risk, client-specific SLAs, internal SLOs, and reporting outputs.
- **Website DNS Change Request Approvals**: Structured approval and implementation tracker for DNS, Cloudflare, website, SSL, redirect, and hosting changes.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
