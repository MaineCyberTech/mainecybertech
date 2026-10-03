# 08 Optional Database and API Wiring

Design optional persistence for the conversion modules if the portal is ready for database/API wiring.

## Suggested tables/entities

- store_promotions
- store_promotion_targets
- store_bundle_value_panels
- store_quiz_questions
- store_quiz_options
- store_quiz_recommendations
- store_campaigns
- store_visual_assets
- store_trust_badges
- store_quote_requests
- store_quote_request_items
- store_admin_audit_log or existing audit integration

## Requirements

- RLS/security model if using Supabase.
- Admin-only write routes.
- Public read routes only for active/published data.
- Server-side validation.
- Audit log for changes.

## Repository/style alignment

Inspect existing public and admin UI before coding. Match the current Maine Cyber Tech page style, spacing, typography, cards, rounded corners, colors, buttons, and responsive behavior.

## Mobile requirements

Everything must be usable on mobile. Use responsive cards, collapsible filters, accessible touch targets, and no horizontal overflow except intentional responsive tables.

## Safety requirements

Do not collect secrets. Do not use fake scarcity, fake countdowns, misleading discounts, or unsupported security/compliance guarantees.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Prepare Data Model**
