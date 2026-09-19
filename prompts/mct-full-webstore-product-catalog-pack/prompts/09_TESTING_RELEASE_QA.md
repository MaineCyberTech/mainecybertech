# 09 Testing and Release QA

Add comprehensive tests for all conversion modules.

## Test areas

- Promotion validation and active/inactive display.
- Bundle value mode selection.
- Quiz recommendation paths.
- Seasonal campaign rendering.
- Visual asset alt/provenance rules.
- Trust badge placement.
- Quote builder add/remove/submit flow.
- Admin route protection.
- Mobile layouts.
- Accessibility.
- No-secret form safety.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Run Conversion QA**
