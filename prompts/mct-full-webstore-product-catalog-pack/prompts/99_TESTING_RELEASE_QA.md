# 99 V5 Testing Release QA

Add release-grade tests for the V5 pack.

## Required coverage

- Analytics events validate and avoid sensitive intake text.
- Lead scoring produces expected bands.
- Recommendation engine resolves all targets.
- Package ladders and comparison pages render safely.
- Proposal generator marks output as draft and requires human review.
- Intake-to-project conversion handles missing customer/org/project data safely.
- Product lifecycle warnings show in admin.
- Content quality auditor catches unsupported claims and missing exclusions.
- SEO landing pages validate slug/title/description/FAQ data.
- FAQ/testimonials/case studies require approval where needed.
- Email nurture remains disabled unless opt-in/consent is wired.
- Portal service hub is permission-protected.
- Fulfillment checklists do not expose internal content publicly.
- Profitability scoring does not display internal margin details publicly.
- Dependency engine warns or blocks as configured.
- Lead magnet downloads do not leak private docs.

## Repository/style alignment

Inspect current Maine Cyber Tech public/admin/portal UI before coding. Match existing layout, typography, cards, buttons, rounded corners, spacing, colors, dark/light behavior, and responsive patterns.

## Mobile requirements

All admin and public/portal surfaces must work on mobile. Use cards, collapsible filters, readable tables, and large touch targets.

## Security and privacy

Do not collect secrets. Do not store sensitive free text in analytics. Do not publish testimonials/case studies without approval. Do not send nurture emails unless an opt-in/consent process is intentionally wired.

## Required button / CTA

Each implementation must include one clear primary button and tests should locate it by role/name.

Suggested primary button: **Run V5 QA**
