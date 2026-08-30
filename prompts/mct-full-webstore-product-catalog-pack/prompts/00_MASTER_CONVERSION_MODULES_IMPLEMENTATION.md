# 00 Master Conversion Modules Implementation

Implement all seven conversion/admin modules for the Maine Cyber Tech web store.

## Modules

1. Promotion admin center.
2. Bundle savings calculator.
3. Service finder quiz.
4. Featured seasonal campaigns.
5. Visual asset admin.
6. Trust badges.
7. Cart / quote builder.

## Implementation order

1. Add shared TypeScript models and loaders for all new data files.
2. Add validation helpers for promotions, bundle value panels, quiz paths, campaigns, visual assets, trust badges, and quote requests.
3. Add public components for promo badges, bundle value panels, service finder quiz, campaign cards, trust badges, and quote builder.
4. Add admin pages for promotions, bundle value, service finder, campaigns, visuals, trust badges, and quote requests.
5. Add public/admin tests and audit prompts.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Build Store Growth Tools**
