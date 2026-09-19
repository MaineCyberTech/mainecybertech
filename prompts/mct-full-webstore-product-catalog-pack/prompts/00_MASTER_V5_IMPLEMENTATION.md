# 00 Master V5 Analytics Automation Sales Ops Implementation

Implement the V5 operational layer for the Maine Cyber Tech web store. This includes analytics, lead scoring, recommendation engine V2, comparisons, package ladders, proposal generation, intake-to-project conversion, lifecycle workflow, content audits, SEO landing pages, FAQs, testimonials, case studies, email nurture, portal service hub, fulfillment checklists, profitability scoring, dependency engine, and lead magnet downloads.

## Implementation order

1. Add shared Typescript types and data loaders.
2. Add admin dashboards for analytics, leads, recommendations, proposals, operations, and content audits.
3. Add public/portal surfaces where needed.
4. Add optional API/database scaffolds.
5. Add tests and audits.

## Repository/style alignment

Inspect current Maine Cyber Tech public/admin/portal UI before coding. Match existing layout, typography, cards, buttons, rounded corners, spacing, colors, dark/light behavior, and responsive patterns.

## Mobile requirements

All admin and public/portal surfaces must work on mobile. Use cards, collapsible filters, readable tables, and large touch targets.

## Security and privacy

Do not collect secrets. Do not store sensitive free text in analytics. Do not publish testimonials/case studies without approval. Do not send nurture emails unless an opt-in/consent process is intentionally wired.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Build Sales Ops Engine**
