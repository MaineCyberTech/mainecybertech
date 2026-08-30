# 18 Visual Art Icon System

Implement a clean visual system for service categories and products.

## Requirements

- Use `data/visual-service-map.json` as source of truth.
- Use Lucide React icons for category and product cards when available.
- Add `StoreIconTile`, `CategoryVisualHeader`, and `ProductVisualBadge` components.
- Add optional hero image fields to category/product data.
- Add image provenance fields for stock/generated assets.
- Use `next/image` for raster assets.
- Add alt text and decorative flags.
- Avoid vendor logos unless authorized.
- Add admin visual selector under `/admin/store/visuals`.
- Add tests for icon rendering, alt text, missing icon fallback, and image metadata.

## Current style requirement

Match current Maine Cyber Tech public/admin styles. Inspect existing marketing and admin components before implementing.

## Mobile requirement

All promo, discount, visual, and admin screens must work on mobile. Product cards must not overflow. Promo badges must wrap cleanly.

## Required button / CTA

Add one primary button for this prompt and make it accessible by role/name.

## Safety requirement

Do not implement fake scarcity, fake countdowns, misleading discounts, or fear-based security manipulation. All urgency must be truthful and admin-auditable.

Suggested button label: **Explore Service Visuals**
