# Runbooks

Operational runbooks for the 60 portal modules (one file per module). Each
runbook maps to a feature spec in [`../features/`](../features/README.md) and
covers operating the module day to day — triggers, inputs, outputs, failure
handling and escalation. The canonical example is
[client-onboarding-command-center.md](client-onboarding-command-center.md).

Platform incident/recovery runbooks live in
[../PLATFORM_FAILURE_RUNBOOKS.md](../PLATFORM_FAILURE_RUNBOOKS.md) and
[../INCIDENT_RESPONSE.md](../INCIDENT_RESPONSE.md).

| Runbook                                                                            | Module                                 |
| ---------------------------------------------------------------------------------- | -------------------------------------- |
| [ai-kb-article-generator.md](ai-kb-article-generator.md)                           | AI KB Article Generator                |
| [ai-policy-assistant.md](ai-policy-assistant.md)                                   | AI Policy Assistant                    |
| [ai-service-desk-copilot.md](ai-service-desk-copilot.md)                           | AI Service Desk Copilot                |
| [ai-ticket-triage.md](ai-ticket-triage.md)                                         | AI Ticket Triage                       |
| [approval-workflow-engine.md](approval-workflow-engine.md)                         | Approval Workflow Engine               |
| [backup-disaster-recovery.md](backup-disaster-recovery.md)                         | Backup Disaster Recovery               |
| [break-glass-register.md](break-glass-register.md)                                 | Break Glass Register                   |
| [camera-storage-calculator.md](camera-storage-calculator.md)                       | Camera Storage Calculator              |
| [change-advisory-mini-cab.md](change-advisory-mini-cab.md)                         | Change Advisory (Mini-CAB)             |
| [client-asset-warranty-tracker.md](client-asset-warranty-tracker.md)               | Client Asset Warranty Tracker          |
| [client-billing-service-catalog.md](client-billing-service-catalog.md)             | Client Billing Service Catalog         |
| [client-budget-roadmap.md](client-budget-roadmap.md)                               | Client Budget Roadmap                  |
| [client-knowledge-base.md](client-knowledge-base.md)                               | Client Knowledge Base                  |
| [client-onboarding-command-center.md](client-onboarding-command-center.md)         | Client Onboarding Command Center       |
| [client-project-tracker.md](client-project-tracker.md)                             | Client Project Tracker                 |
| [client-runbook-builder.md](client-runbook-builder.md)                             | Client Runbook Builder                 |
| [client-satisfaction-pulse.md](client-satisfaction-pulse.md)                       | Client Satisfaction Pulse              |
| [client-training-hub.md](client-training-hub.md)                                   | Client Training Hub                    |
| [compliance-readiness-lite.md](compliance-readiness-lite.md)                       | Compliance Readiness Lite              |
| [cyber-insurance-binder.md](cyber-insurance-binder.md)                             | Cyber Insurance Binder                 |
| [cyber-scoreboard.md](cyber-scoreboard.md)                                         | Cyber Scoreboard                       |
| [data-retention-policy-manager.md](data-retention-policy-manager.md)               | Data Retention Policy Manager          |
| [device-configuration-profiles.md](device-configuration-profiles.md)               | Device Configuration Profiles          |
| [dmarc-coach.md](dmarc-coach.md)                                                   | DMARC Coach                            |
| [dns-change-request-approvals.md](dns-change-request-approvals.md)                 | DNS Change Request Approvals           |
| [dns-domain-cloudflare-health-monitor.md](dns-domain-cloudflare-health-monitor.md) | DNS Domain Cloudflare Health Monitor   |
| [dynamic-client-forms-builder.md](dynamic-client-forms-builder.md)                 | Dynamic Client Forms Builder           |
| [endpoint-security-coverage.md](endpoint-security-coverage.md)                     | Endpoint Security Coverage             |
| [hardware-staging-checklist.md](hardware-staging-checklist.md)                     | Hardware Staging Checklist             |
| [helpdesk-identity-verification.md](helpdesk-identity-verification.md)             | Helpdesk Identity Verification         |
| [internal-msp-business-os.md](internal-msp-business-os.md)                         | Internal MSP Business OS               |
| [isp-phone-network-consolidation.md](isp-phone-network-consolidation.md)           | ISP / Phone Network Consolidation      |
| [license-optimizer.md](license-optimizer.md)                                       | License Optimizer                      |
| [m365-hardening.md](m365-hardening.md)                                             | M365 Hardening                         |
| [m365-offboarding-checklist.md](m365-offboarding-checklist.md)                     | M365 Offboarding Checklist             |
| [msp-automation-workflow-catalog.md](msp-automation-workflow-catalog.md)           | MSP Automation Workflow Catalog        |
| [msp-proposal-builder.md](msp-proposal-builder.md)                                 | MSP Proposal Builder                   |
| [msp-sop-library.md](msp-sop-library.md)                                           | MSP SOP Library                        |
| [multi-tenant-msp-client-portal.md](multi-tenant-msp-client-portal.md)             | Multi-Tenant MSP Client Portal         |
| [network-diagram-builder.md](network-diagram-builder.md)                           | Network Diagram Builder                |
| [network-port-map-tracker.md](network-port-map-tracker.md)                         | Network Port Map Tracker               |
| [open-findings-tracker.md](open-findings-tracker.md)                               | Open Findings Tracker                  |
| [patch-compliance-dashboard.md](patch-compliance-dashboard.md)                     | Patch Compliance Dashboard             |
| [phishing-simulation.md](phishing-simulation.md)                                   | Phishing Simulation                    |
| [powershell-script-builder.md](powershell-script-builder.md)                       | PowerShell Script Builder              |
| [procurement-quote-comparison.md](procurement-quote-comparison.md)                 | Procurement Quote Comparison           |
| [public-status-page.md](public-status-page.md)                                     | Public Status Page                     |
| [qbr-executive-report-generator.md](qbr-executive-report-generator.md)             | QBR Executive Report Generator         |
| [risk-acceptance-register.md](risk-acceptance-register.md)                         | Risk Acceptance Register               |
| [secure-file-request.md](secure-file-request.md)                                   | Secure File Request                    |
| [security-incident-response.md](security-incident-response.md)                     | Security Incident Response             |
| [sharepoint-teams-planner.md](sharepoint-teams-planner.md)                         | SharePoint & Teams Planner             |
| [sla-slo-tracker.md](sla-slo-tracker.md)                                           | SLA/SLO Tracker                        |
| [tabletop-exercise-planner.md](tabletop-exercise-planner.md)                       | Tabletop Exercise Planner              |
| [time-entry-worklog-summarizer.md](time-entry-worklog-summarizer.md)               | Time Entry Worklog Summarizer          |
| [unifi-site-survey-deployment-planner.md](unifi-site-survey-deployment-planner.md) | UniFi Site Survey & Deployment Planner |
| [vendor-contact-escalation.md](vendor-contact-escalation.md)                       | Vendor Contact Escalation              |
| [vendor-contract-renewal.md](vendor-contract-renewal.md)                           | Vendor Contract Renewal                |
| [vendor-saas-subscription-audit.md](vendor-saas-subscription-audit.md)             | Vendor SaaS Subscription Audit         |
| [website-uptime-monitor.md](website-uptime-monitor.md)                             | Website Uptime Monitor                 |
