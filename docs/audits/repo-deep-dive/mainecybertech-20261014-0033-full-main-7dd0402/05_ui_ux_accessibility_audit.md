# 05_ui_ux_accessibility_audit — Prompt 05 - UI/UX, Design System, and Accessibility Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `05_ui_ux_accessibility_audit.md` (area UX, prompt)

## Verification Performed

Domain subagent produced 16 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| UX-P2-001 | P2 | Ticket-card bulk selection nests a checkbox and a status button inside a Link, so ticking a ticket also navigates |
| UX-P2-002 | P2 | Inline async action errors are not announced by assistive tech in ~44 components, contradicting the documented convention |
| UX-P2-003 | P2 | Several dialogs have no max-height or internal scroll, so tall forms are clipped on small viewports |
| UX-P2-004 | P2 | 89 of 319 pages have no page-specific title (79 dynamic detail pages + 10 static), so browser and AT titles are generic |
| UX-P2-005 | P2 | @mct/ui primitives are largely bypassed: 6 files import Button, 1 uses Input/Dialog/Badge, while the app hand-rolls 234 raw cyber-button* usages and four Chip copies |
| UX-P3-001 | P3 | Four Chip copies render a glyph-only '×' remove button with a sub-24px target size |
| UX-P3-002 | P3 | Theme is documented dark-only but ships dead light/system code paths (CSS variables, ThemeProvider, Storybook toolbar) |
| UX-P3-003 | P3 | Sidebar group toggles declare aria-haspopup='true' for a popup that is a link list, not a menu |
| UX-P3-004 | P3 | Notification bell and store drawer toggles omit aria-expanded |
| UX-P3-005 | P3 | Color-token drift: 66 files hardcode hex colors (80x #0A1118) and 45 arbitrary rgba card backgrounds instead of the design tokens |
| UX-P3-006 | P3 | Heading order skips a level on the store import/export page |
| UX-P3-007 | P3 | ScorecardsEvaluateClient renders the only programmatically unlabeled input in the app and an unannounced error |
| UX-P3-008 | P3 | Signup form inputs lack autocomplete attributes |
| UX-P3-009 | P3 | Storybook covers only the 7 @mct/ui primitives; packages/ui has no test/lint scripts and the a11y addon runs nowhere |
| UX-P3-010 | P3 | Full accessibility breadth scan (68 routes) is triage-only and not a required check |
| UX-P3-011 | P3 | The a11y gate scans only initial page loads; interactive states (dialogs, drawers, filters, bulk bars) and client-fetched content are untested |
