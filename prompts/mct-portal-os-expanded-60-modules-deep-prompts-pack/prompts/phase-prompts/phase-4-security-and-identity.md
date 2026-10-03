# Phase 4 - Security and Identity Prompt

Implement the following modules as vertical slices using their corresponding build prompts.

## Modules

- **M365 Tenant Hardening Scanner**: Guided and eventually automated Microsoft 365 security baseline review with remediation tasks, evidence tracking, and recurring drift review.
- **Security Incident Response Runbook App**: Guided incident response workspaces for phishing, account compromise, malware, lost device, unauthorized access, and ransomware suspicion.
- **Backup Disaster Recovery Review Dashboard**: Track protected systems, last backup, failures, restore testing, RPO/RTO, retention, and backup risk.
- **Helpdesk Identity Verification Anti-Vishing Tool**: Verify requestors and technicians before privileged actions such as MFA reset, password reset, remote access, or vendor/billing changes.
- **Email Deliverability DMARC Coach**: Guided SPF/DKIM/DMARC checks, policy status, alignment notes, and client-friendly remediation recommendations.
- **M365 Offboarding Safety Checklist**: Guided offboarding with account disablement, mailbox handling, OneDrive transfer, license reclaim, access reviews, and evidence.
- **Patch Compliance Dashboard**: Tracks patch status, device groups, missing updates, maintenance windows, exception approvals, and reporting evidence.
- **Endpoint Security Coverage Map**: Maps clients/devices to endpoint protection, disk encryption, MDM enrollment, local admin status, firewall, and monitoring coverage.
- **Emergency Access Break Glass Register**: Tracks break-glass accounts, custody, review dates, emergency access procedures, testing, and evidence without storing raw secrets.

## Instructions

- Use `prompts/MASTER_AGENT_PROMPT.md` first.
- Use each module-specific build prompt.
- Keep changes reviewable.
- Add tests/docs/runbooks with code.
- Run the matching audit prompts before release.
