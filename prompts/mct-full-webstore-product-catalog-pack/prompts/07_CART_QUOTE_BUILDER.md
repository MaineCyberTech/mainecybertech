# 07 Cart / Quote Builder

Build a cart-like quote builder for service requests.

## Public features

- Add quick wins, bundles, monthly plans, and add-ons to quote.
- Recommend bundles based on selected quick wins.
- Show promo eligibility.
- Show consult-required warnings for sensitive services.
- Submit quote request.

## Admin features

- Quote request list.
- Quote request detail.
- Status: draft, submitted, reviewing, converted_to_project, closed.
- View selected products, intake answers, promo eligibility, and recommendations.
- Future handoff to ticket/project/client onboarding.

## Guardrails

- Quote is not final contract unless human-approved.
- No payment capture required.
- No secret collection.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Request Quote Review**
