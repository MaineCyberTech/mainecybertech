# 02 Public Store UI - Engaging Category Catalog

Build the `/store` landing page.

## Page sections

- Hero with plain-English positioning: productized IT, cybersecurity, web, network, and continuity services for Maine small businesses.
- Category navigation cards for all 12 categories with counts.
- Featured Quick Wins section.
- Popular Bundles section.
- Monthly IT Plans section.
- Emergency Support section with responsible urgency copy.
- Website & SEO, Microsoft 365, and Wi-Fi/Networking highlights.
- Need Help Choosing panel.
- Footer CTA matching current marketing style.

## UX requirements

- Search/filter controls must not clutter mobile.
- Product cards must have category badge, name, summary, price range, and the one required CTA.
- Use current marketing components if possible.
- No dark patterns or fake urgency.

## Current page style alignment

Before writing code, inspect and reuse current Maine Cyber Tech patterns instead of creating a separate storefront style.

Use these repo anchors:

- `apps/web/app/(public)/layout.tsx`
- `apps/web/app/(public)/page.tsx`
- `apps/web/app/(public)/services/[slug]/page.tsx`
- `apps/web/app/(public)/contact/page.tsx`
- `apps/web/components/marketing/MarketingHeader.tsx`
- `apps/web/components/marketing/ServiceCard.tsx`
- `apps/web/components/marketing/ContactForm.tsx`
- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `apps/web/app/(admin)/admin/layout.tsx`
- `apps/web/components/admin/*`
- `packages/ui/src/components/Button.tsx`
- `packages/ui/src/components/Input.tsx`
- `packages/ui/src/tokens/*`

Match the existing typography scale, spacing rhythm, cards, rounded corners, shadows, background treatments, CTA language, nav behavior, focus states, and responsive breakpoints. If a reusable component exists, extend it rather than duplicating styles.

## Mobile-first and engagement requirements

- Build for mobile first, then scale up to tablet and desktop.
- Public store, detail pages, intake flows, admin dashboard, product tables, editors, and audit screens must work well on phones.
- Use responsive grids: 1 column on phones, 2 on tablets, 3-4 on desktop when appropriate.
- Product cards must support long names and summaries without overflow.
- Tables must collapse into cards or use accessible responsive overflow on mobile.
- Forms must have labels, help text, large touch targets, error text, success states, and safe non-secret warnings.
- Add engaging content areas: category summaries, best-for blocks, what-you-get blocks, recommended next services, compare bundles, and help-me-choose panels.
- Include empty states, loading states, error states, and no-results states.

## One required button / CTA

Add exactly one clear primary button/CTA for this prompt's main implementation surface.

Suggested button label: **Find the Right Service**

Button rules:

- Use the current project Button component/style if available.
- Must be keyboard accessible and testable by role/name.
- Must have clear copy and a clear action/destination.
- Must not request or submit passwords, API keys, MFA codes, private keys, seed phrases, recovery codes, payment card data, or regulated records.
- If async, include loading/disabled behavior.

## Verification requirements

- Run catalog validation.
- Verify all 12 categories are represented.
- Verify product slugs are unique and routable.
- Verify public pages do not expose internal fulfillment procedures.
- Verify admin routes are permission-protected.
- Verify mobile layouts at 375px, 768px, 1024px, and desktop widths.
- Verify accessible headings, links, forms, labels, and button names.
- Verify `pnpm lint`, `pnpm typecheck`, tests, and relevant Playwright checks, or document exact failures and fixes.
