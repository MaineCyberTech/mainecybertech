# 13 Audit Case Study Generator

Audit Case Study Generator. Verify complete wiring, admin UI, permissions, mobile behavior, data validation, security/privacy guardrails, tests, and release readiness. Purpose: Turn completed work into publishable case study drafts with approval controls.

## Repository/style alignment

Inspect current Maine Cyber Tech public/admin/portal UI before coding. Match existing layout, typography, cards, buttons, rounded corners, spacing, colors, dark/light behavior, and responsive patterns.

## Mobile requirements

All admin and public/portal surfaces must work on mobile. Use cards, collapsible filters, readable tables, and large touch targets.

## Security and privacy

Do not collect secrets. Do not store sensitive free text in analytics. Do not publish testimonials/case studies without approval. Do not send nurture emails unless an opt-in/consent process is intentionally wired.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Audit Case Study Generator**

## Audit output

Return P0/P1/P2/P3 findings with file references, reproduction steps, recommended fix, and release impact.
