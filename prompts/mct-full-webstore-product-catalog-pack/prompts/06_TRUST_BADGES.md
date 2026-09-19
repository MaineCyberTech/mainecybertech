# 06 Trust Badges

Implement trust badges across the store.

## Badges

- No-secret intake.
- Plain-English report.
- Local Maine support.
- Scoped deliverables.
- Upgrade path available.
- Consult required for sensitive work.

## Requirements

- Product card badges with max count.
- Product detail trust section.
- Intake form always includes No-secret intake.
- Sensitive services show Consult required.
- Admin placement/configuration scaffold.
- Validation for unknown badge IDs.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Show Trust Badges**
