# 01 Promotion Admin Center

Build the promotion admin center.

## Admin features

- Create/edit promos.
- Assign products/categories/bundles.
- Set badge text and detail text.
- Set start/end dates.
- Set terms.
- Set active/paused/expired/archive status.
- Preview public badge display.
- Track audit log entries where existing audit patterns support it.

## Public features

- Show active promotion badge near product price.
- Show terms on detail page or expandable disclosure.
- Hide inactive/expired promos.
- Show consult-required labels for scoped services.

## Validation

- Active promo needs badge text and terms.
- Promotion needs at least one eligibility target.
- End date cannot precede start date.
- Exact savings cannot render for variable scoped services unless exact pricing is available.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Create Promotion**
