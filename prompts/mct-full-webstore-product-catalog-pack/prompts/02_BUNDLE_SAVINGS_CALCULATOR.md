# 02 Bundle Savings Calculator

Build bundle value comparison logic and UI.

## Requirements

- Compare standalone products vs bundle when reliable.
- Show exact savings only when exact prices exist.
- Show range comparison when ranges are reliable.
- Show "included value" when price ranges vary.
- Include assumptions and disclaimer.
- Add admin editor for component products, mode, assumptions, and display copy.
- Add public bundle value panel on bundle product pages.

## Tests

- Exact mode calculates correctly.
- Included-value mode does not show fake savings.
- Missing component product is flagged.
- Mobile panel wraps cleanly.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Calculate Bundle Value**
