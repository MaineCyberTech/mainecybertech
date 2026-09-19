# 16 Promo Discount Engine

Implement a promotion and discount system for the store.

## Requirements

- Add typed promo rule model based on `data/promo-rules.json`.
- Support bundle savings, starter credits, seasonal offers, included add-ons, new-client offers, and real capacity notices.
- Add price-adjacent promotion badges on product cards and product detail pages.
- Add bundle compare panels showing included products and value clearly.
- Add admin promotion manager under `/admin/store/promotions`.
- Add validation for misleading or incomplete promotions.
- Promotions must include eligibility, status, start/end when applicable, public badge text, and admin notes.
- Add tests for active/inactive promos, invalid promos, broken product IDs, and mobile display.

## Current style requirement

Match current Maine Cyber Tech public/admin styles. Inspect existing marketing and admin components before implementing.

## Mobile requirement

All promo, discount, visual, and admin screens must work on mobile. Product cards must not overflow. Promo badges must wrap cleanly.

## Required button / CTA

Add one primary button for this prompt and make it accessible by role/name.

## Safety requirement

Do not implement fake scarcity, fake countdowns, misleading discounts, or fear-based security manipulation. All urgency must be truthful and admin-auditable.

Suggested button label: **View Eligible Savings**
