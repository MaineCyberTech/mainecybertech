# UI/UX, Design System, and Accessibility Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14
- Auditor: subagent (independent re-audit; read-only)
- Area code: UX
- Output path: `docs/audits/mainecybertech/mainecybertech-20261014-0033-full-main-7dd0402/05_ui_ux_accessibility_audit.md`
- Scope limitations: static/attribute-level scans plus test inspection; no browser run and no axe execution in this audit (the repo's own gates were read, not re-run).

## Scope

Re-verification of the 16 `UX` findings from `mainecybertech-20261011-0426-full-main-8d299b8` against `origin/main` @ `7dd0402`: design tokens, components, dialogs, page titles, ARIA, focus/keyboard, Storybook, a11y gates and color-token drift.

## Executive Summary

The accessibility and design-system remediation held. 14 of 16 findings are **verified-fixed**: the nested-interactive ticket card is gone, ~44 unannounced inline errors now use live regions (only the four error boundaries lack one), every dialog has a scroll-safe panel, all 319 pages carry titles, the four Chip copies were consolidated into a 24px-target `@mct/ui` component, the dead light/system theme paths were deleted, ARIA mismatches were corrected, color-token drift dropped from 66 files to 6 (rgba card backgrounds to 0), Storybook now covers app primitives with per-story axe, and the a11y gate scans interactive states.

Two items remain **partially-fixed**:
- `UX-P2-005` — primitive adoption is still shallow: 12 files import `@mct/ui` Button while 236 raw `cyber-button*` usages remain; the docs now state the convention but no lint guard enforces it.
- `UX-P3-010` — the 68-route breadth scan now fails on new violations, but it is still not a required branch-protection context and the default gate covers 25 of 68 routes.

No regressions were found.

| Status | Count |
|---|---:|
| verified-fixed | 14 |
| partially-fixed | 2 (`UX-P2-005`, `UX-P3-010`) |
| regressed | 0 |
| open (previous) | 0 |
| new | 0 |

## Verification Results

| ID | Sev | Re-verified status | Evidence at 7dd0402 |
|---|---|---|---|
| UX-P2-001 | P2 | verified-fixed | card is a `div`; checkbox outside the anchor; only the subject is a link (`AdminTicketCenterClient.tsx:160-241`) |
| UX-P2-002 | P2 | verified-fixed | scan of 541 tsx files: only `error.tsx`/`global-error.tsx` lack a live region; all cited call sites use `role="alert"` |
| UX-P2-003 | P2 | verified-fixed | shared Dialog `max-h-[90vh] overflow-y-auto` (`Dialog.tsx:116`); 0 scroll-less dialogs in a repo scan; dialog scroll asserted in `mobile.spec.ts` |
| UX-P2-004 | P2 | verified-fixed | 319 pages scanned; 6 without `metadata` all render `<title>`; detail routes use `generateMetadata` |
| UX-P2-005 | P2 | partially-fixed | Chip consolidated + docs convention (`WEB_UI_CONVENTIONS.md:90-91`), but 236 raw `cyber-button*` usages vs 12 `@mct/ui` Button imports; no lint guard |
| UX-P3-001 | P3 | verified-fixed | shared `Chip` with 24x24 remove button + `Remove <label>` (`packages/ui/src/components/Chip.tsx:24-36`) |
| UX-P3-002 | P3 | verified-fixed | fixed-dark `useTheme`; light CSS block and Storybook toolbar removed; docs match |
| UX-P3-003 | P3 | verified-fixed | no `aria-haspopup` in either sidebar |
| UX-P3-004 | P3 | verified-fixed | `aria-expanded` on bell (`NotificationBell.tsx:285`) and both drawers |
| UX-P3-005 | P3 | verified-fixed | hex files 66→6, `#0A1118` 80→0, arbitrary rgba card backgrounds 45→0 |
| UX-P3-006 | P3 | verified-fixed | section headings are `<h2>` (`ImportExportClient.tsx:168-259`) |
| UX-P3-007 | P3 | verified-fixed | `aria-label` + `role="alert"` (`ScorecardsEvaluateClient.tsx:39,50`) |
| UX-P3-008 | P3 | verified-fixed | `autoComplete` name/email/new-password (`signup/page.tsx:77,96,115`) |
| UX-P3-009 | P3 | verified-fixed | `packages/ui` scripts + smoke test; 8+ stories incl. app primitives; `a11y.test:"error"` in `.storybook/preview.tsx` |
| UX-P3-010 | P3 | partially-fixed | breadth run fails on new violations (baseline mechanism, `a11y.spec.ts:135-165`); still not a required check; base 25/68 |
| UX-P3-011 | P3 | verified-fixed | interactive scans for bulk bar, filter chip, drawer, dialog (`a11y.spec.ts:198-240`) |

## Recommendations

- **This month (UX-P2-005):** either migrate the highest-traffic modules to `@mct/ui` primitives or add an ESLint `no-restricted-syntax` rule (e.g. reject new `cyber-button*` class literals in `apps/web`) so drift cannot resume; document the migration order.
- **This month (UX-P3-010):** ratchet 5–10 clean routes per week from `FULL_PAGES` into `BASE_PAGES` and have the coordinator promote `a11y-breadth.yml` (or the base gate) to a required check once the Storybook/Chromatic debt is cleared.
- **Later:** add a visual regression baseline for the shared primitives (`Chip`, `ConfirmDialog`, `EmptyState`, `StatusPill`) now that stories exist; keep the color-token scan in the guard suite.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does the Chromatic/Storybook build pass after the webpack 5.101.2 pin? | Determines whether the per-story axe assertions actually run in CI | A green Chromatic run at this commit |
| Which modules are in scope for the `@mct/ui` migration? | Without a target list the convention will keep eroding | Design-system owner decision |
