# 04 Safe Intake and Lead Capture

Create a reusable intake form renderer based on product `intakeFields`.

## Requirements

- Support text, email, tel, number, textarea, select, and URL fields.
- Render field labels, required indicators, help text, validation errors, and optional descriptions.
- Include hidden product ID, slug, category, and source route.
- Add a visible warning: do not paste passwords, MFA codes, API keys, recovery codes, seed phrases, private keys, payment card data, or regulated records.
- Integrate with existing contact/lead/ticket route if available; otherwise build a safe scaffold with TODOs.
- Add anti-spam/rate-limit notes or integration if current public contact flow supports it.
- Add success, error, loading, and empty states.

## Admin handoff

Submissions should be structured so they can later become tickets, leads, projects, or service requests.

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

Suggested button label: **Start Secure Intake**

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
