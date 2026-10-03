# 05 Visual Asset Admin

Build visual asset admin and public visual system.

## Admin features

- Pick icon.
- Pick accent color.
- Pick hero image.
- Add alt text.
- Mark decorative assets.
- Track stock/generated/uploaded/internal provenance.
- Add license notes.

## Public features

- Icon tiles on product/category cards.
- Hero visuals where configured.
- Fallback icon when missing.
- Accessible alt/decorative behavior.

## Guardrails

- No unauthorized vendor logos.
- No stock images implying endorsement.
- Provenance required for stock/generated assets.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Choose Visual Asset**
