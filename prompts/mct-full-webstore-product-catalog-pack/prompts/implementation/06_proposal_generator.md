# 06 Quote-to-Proposal Generator

Implement Quote-to-Proposal Generator.

## Purpose

Generate internal quote review, client-facing proposal draft, scope, assumptions, exclusions, add-ons, and follow-up email.

## Required work

- Add typed data model and loader for this feature.
- Add validation helper and admin health warnings.
- Add admin route: `/admin/store/proposals`.
- Add public/portal route if applicable: `n/a`.
- Add mobile-friendly UI using current project style.
- Add unit tests and representative page/component tests.
- Add audit output or admin warnings for incomplete configuration.

## Data source

Use the matching file in `data/` and preserve safe public/internal separation.

## Repository/style alignment

Inspect current Maine Cyber Tech public/admin/portal UI before coding. Match existing layout, typography, cards, buttons, rounded corners, spacing, colors, dark/light behavior, and responsive patterns.

## Mobile requirements

All admin and public/portal surfaces must work on mobile. Use cards, collapsible filters, readable tables, and large touch targets.

## Security and privacy

Do not collect secrets. Do not store sensitive free text in analytics. Do not publish testimonials/case studies without approval. Do not send nurture emails unless an opt-in/consent process is intentionally wired.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Generate Proposal Draft**
