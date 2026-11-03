# UI/UX, Design System, and Accessibility Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:29:24Z
- Auditor: subagent (independent re-audit; read-only)
- Area code: UX
- Output path: `docs/audits/mainecybertech/mainecybertech-20261103-0748-full-main-6b7aa1a/05_ui_ux_accessibility_audit.md`
- Scope limitations: static analysis and test inspection; no browser/axe run, no Storybook/Chromatic build, no visual diff.

## Scope

Re-verification of the 16 `UX` findings from `mainecybertech-20261014-0033-full-main-7dd0402` against `origin/main` @ `6b7aa1a`, plus a fresh pass over design tokens, CSS/Tailwind, reusable components, layouts/nav, forms/dialogs, icons/color/typography, focus/keyboard, ARIA, semantic HTML, responsive breakpoints and dark mode. The new portal modules (approvals, change requests, DNS changes, identity verification, insurance binder, offboarding, training, QBR, knowledge base, proposals decision, network-diagram canvas) were read for new patterns.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `packages/ui/src/**` | Design system | Tokens, Chip, Dialog, theme | Re-checked the shared primitives |
| `apps/web/app/**` + `apps/web/components/**` (557 tsx) | UI | Colour/heading/label scans | Fresh repository scan |
| `apps/web/e2e/a11y.spec.ts` | A11y gate | Route counts, interactive states, baseline | Re-read |
| `apps/web/e2e/a11y-baseline.json` | A11y debt | Baseline contents | Empty |
| `.github/branch-protection/main.json` | CI | Required contexts | 8 contexts, no a11y |
| `.storybook/preview.tsx`, `packages/ui/package.json` | Storybook | Story/a11y coverage | 14 stories, `a11y.test:error` |
| New portal pages | UI | New colour/heading patterns | `NetworkDiagramCanvas.tsx`, `CabMeetingsClient.tsx` |

## Verification Performed

| Check | Method | Result |
|---|---|---|
| Page titles | 330 `page.tsx` scanned for metadata/generateMetadata/`<title>` | 0 missing |
| Colour-token drift | Regex scan for 6-digit hex + `bg-[rgba(` | 8 files / 113 hex; 0 rgba cards |
| ARIA toggles | grep `aria-expanded`/`aria-haspopup` | Present / no haspopup |
| Dialog scroll | Scan fixed-overlay panels for max-h/overflow | 0 modal dialogs missing |
| Heading order | h1→h3-without-h2 scan | 6 real pages still skip |
| Storybook/a11y | Package scripts + preview config + spec | Present |
| Prior fixes | Targeted reads | 13 verified, 2 partial, 1 regressed |

## Executive Summary

The design-system direction is still right: a single dark theme, a shared `Dialog` with `max-h-[90vh]`, a shared `Chip` with an accessible remove button, page-specific titles on all 330 pages, `aria-expanded` on the bell/drawers and no `aria-haspopup` on link-list toggles. The a11y gate still runs 25 routes by default and 68 under `A11Y_FULL`, the interactive-state scans exist, and Storybook now covers 14 stories with per-story axe.

Two things moved backwards:

- **`UX-P3-005` regressed.** The exact hardcoded colour the earlier fix removed (`#0A1118`) came back in `CabMeetingsClient.tsx:225`, and the new `NetworkDiagramCanvas.tsx` hardcodes 13 hex values. The repository now has 8 files / 113 hex literals (was 6 files at 7dd0402).
- **Heading order is still broken on six pages** (new `UX-P3-012`): the dashboard, status, resources, store compare, portal projects and client-portal overview all go h1 → h3 with no h2.

`UX-P2-005` (design-system adoption) and `UX-P3-010` (a11y breadth not required) remain partially fixed.

| Status | Count |
|---|---:|
| verified-fixed | 13 |
| partially-fixed | 2 (`UX-P2-005`, `UX-P3-010`) |
| regressed | 1 (`UX-P3-005`) |
| open (previous) | 0 |
| new | 1 (`UX-P3-012`) |

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Tokens | `packages/ui/src/tokens` | Colour source | Used inconsistently | Medium | 113 hex literals |
| Dialog | `packages/ui/src/components/Dialog.tsx` | Modal shell | Scrolls | — | max-h 90vh |
| Chip | `packages/ui/src/components/Chip.tsx` | Filter chip | 24×24 remove | — | Accessible name |
| Portal nav | `PortalSubnav.tsx` | Contextual tabs | 57/97 pages | Low | USE-P3-007 |
| A11y gate | `a11y.spec.ts` | WCAG gate | 25/68 default | Medium | Not required |
| Storybook | `.storybook/preview.tsx` | Component docs | 14 stories | Low | axe per story |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Design tokens | 4 | tokens module + docs | Hex literals return | UX-P3-005 |
| CSS/Tailwind/theme | 4 | dark-only provider | — | Keep |
| Reusable components | 3 | 14 Button imports vs 265 raw | No lint guard | UX-P2-005 |
| Layouts/nav | 4 | Shell + subnav | 40 pages omit subnav | USE-P3-007 |
| Forms/dialogs/toasts/tables/cards | 3 | Dialog/Chip fixed | No table standard | Add table primitive |
| Icons/color/typography/spacing | 3 | 8 files / 113 hex | New canvas hardcodes | Tokenize |
| Focus states | 4 | focus-visible rings | — | Keep |
| Keyboard nav | 4 | Escape/drawer handling | — | Keep |
| ARIA | 4 | role=alert/expanded | — | Keep |
| Semantic HTML | 3 | Heading skips on 6 pages | h1→h3 | UX-P3-012 |
| Responsive breakpoints | 4 | sm/md/lg grids | New flows modest | MOB-P3-007 |
| Dark mode | 4 | Single dark theme | — | Keep |

## Detailed Review

### Item: Colour tokens

- Evidence: `apps/web/components/cab/CabMeetingsClient.tsx:225` (`text-[#0A1118]`, introduced in 8f8642ab), `apps/web/components/portal/NetworkDiagramCanvas.tsx:9-20` (8 node colours + strokes/labels), `apps/web/app/(public)/test-accounts/page.tsx` (90 hex, dev page).
- What it does: bypasses `@mct/ui/tokens` / Tailwind theme colours.
- Missing controls: no lint rule or CI scan for hex literals in tsx.
- Risks: theme changes miss hardcoded values; contrast fixes diverge.

### Item: Heading outline

- Evidence: six pages listed in `UX-P3-012`.
- Impact: screen-reader outline skips a level; axe heading-order (best practice) would flag it.

### Item: Design-system adoption

- Evidence: 14 files import `@mct/ui` Button; 265 `cyber-button*` occurrences remain; no guard.
- Impact: UI drift returns (as the colour regression shows).

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| UX-001 | Design tokens | `tokens/index.ts` | Token set exists | Hex literals | P3 | UX-P3-005 |
| UX-002 | CSS/Tailwind/theme | `use-theme.tsx` | Fixed dark | — | — | Keep |
| UX-003 | Reusable components | 14 vs 265 | Shared primitives | Shallow adoption | P2 | UX-P2-005 |
| UX-004 | Layouts/nav | Shell | Responsive | Subnav gaps | P3 | USE-P3-007 |
| UX-005 | Dialogs/toasts/tables | Dialog/Chip | Scroll + a11y | No table primitive | P3 | Add table |
| UX-006 | Icons/colour/type | tokens | Tokens documented | Drift | P3 | UX-P3-005 |
| UX-007 | Focus states | focus-visible | Present | — | — | Keep |
| UX-008 | Keyboard nav | Escape handlers | Present | — | — | Keep |
| UX-009 | ARIA | role/aria-expanded | Present | — | — | Keep |
| UX-010 | Semantic HTML | headings | h1 on every page | 6 skips | P3 | UX-P3-012 |
| UX-011 | Responsive | grids | Present | New flows untested | P3 | MOB-P3-007 |
| UX-012 | Dark mode | provider | Fixed dark | — | — | Keep |

## Findings

### Re-verification of previous findings

| ID | Sev | Previous status | Re-verified status | Evidence at 6b7aa1a |
|---|---|---|---|---|
| UX-P2-001 | P2 | verified-fixed | verified-fixed | `AdminTicketCenterClient.tsx:160-241` |
| UX-P2-002 | P2 | verified-fixed | verified-fixed | Fresh scan: 0 error states without live region |
| UX-P2-003 | P2 | verified-fixed | verified-fixed | `Dialog.tsx:116`; 0 scroll-less modals |
| UX-P2-004 | P2 | verified-fixed | verified-fixed | 330 pages, 0 without title source |
| UX-P2-005 | P2 | partially-fixed | partially-fixed | 14 files vs 265 raw `cyber-button*`; no guard |
| UX-P3-001 | P3 | verified-fixed | verified-fixed | `Chip.tsx:24-36` (24×24, aria-label) |
| UX-P3-002 | P3 | verified-fixed | verified-fixed | `use-theme.tsx:6-30`; no light branch |
| UX-P3-003 | P3 | verified-fixed | verified-fixed | 0 `aria-haspopup` |
| UX-P3-004 | P3 | verified-fixed | verified-fixed | `NotificationBell.tsx:285`; drawer shells |
| UX-P3-005 | P3 | verified-fixed | **regressed** | `CabMeetingsClient.tsx:225` reintroduced `#0A1118`; 8 files / 113 hex |
| UX-P3-006 | P3 | verified-fixed | verified-fixed | import/export headings are h2 |
| UX-P3-007 | P3 | verified-fixed | verified-fixed | `ScorecardsEvaluateClient.tsx:39,50` |
| UX-P3-008 | P3 | verified-fixed | verified-fixed | signup autocomplete at `:77,96,115` |
| UX-P3-009 | P3 | verified-fixed | verified-fixed | 14 stories; `a11y.test:error`; package scripts |
| UX-P3-010 | P3 | partially-fixed | partially-fixed | 25/68 default; not a required context; empty baseline |
| UX-P3-011 | P3 | verified-fixed | verified-fixed | interactive states `a11y.spec.ts:198-240` |

### Finding ID: UX-P3-005 — Color-token drift regressed: the removed `#0A1118` is back and the new network canvas hardcodes 13 colours

- Severity: P3
- Confidence: High
- Area: UX
- Evidence:
  - `apps/web/components/cab/CabMeetingsClient.tsx:225` (`text-[#0A1118]`, added in commit 8f8642ab)
  - `apps/web/components/portal/NetworkDiagramCanvas.tsx:9-20` (`NODE_COLORS`, `#64748b`, `#0f172a`, `#f1f5f9`, `#94a3b8`)
  - Scan at 6b7aa1a: 557 tsx files → 8 files / 113 six-digit hex literals; `#0a1118` count = 1; arbitrary `bg-[rgba(...)]` = 0
  - Previous closure claim (7dd0402): 6 files, `#0A1118` gone
- What is happening: the codebase re-introduced the exact anti-pattern the fix removed, in a newly edited component and a newly added component.
- Why it matters: theme/contrast changes no longer cover these surfaces; the "tokens are the source" convention is unenforced.
- User / business impact: visual inconsistency after token changes; harder dark-mode contrast tuning.
- Security / privacy / reliability impact: none.
- Recommended fix: replace the literals with `@mct/ui/tokens` / Tailwind theme utilities; add an ESLint `no-restricted-syntax` rule (or a `check-colour-tokens.mjs` guard) for `#[0-9A-Fa-f]{6}` in `apps/web/**/*.tsx` with a dev-page allowlist.
- Suggested validation: guard fails on a fixture containing a hex literal; guard passes on the cleaned tree.
- Owner suggestion: design-system owner / web UI lead
- Effort estimate: S
- Dependencies: none
- Status: regressed

### Finding ID: UX-P3-012 — Heading order still skips h1 → h3 on six pages

- Severity: P3
- Confidence: High
- Area: UX
- Evidence:
  - `apps/web/app/(portal)/portal/dashboard/page.tsx:137` (h1) → `:176,210,245,282` (h3, no h2)
  - `apps/web/app/(portal)/portal/status/page.tsx:36` (h1) → `:69` (h3)
  - `apps/web/app/(public)/resources/page.tsx:32` (h1) → `:58` (h3)
  - `apps/web/app/(public)/store/compare/page.tsx:33` (h1) → `:54` (h3)
  - `apps/web/app/(portal)/portal/projects/page.tsx:107` (h1) → `:122` (h3)
  - `apps/web/app/(portal)/portal/client-portal/page.tsx:42` (h1) → `:62` (h3)
- What is happening: section cards use h3 directly under the page h1; there is no h2 level.
- Why it matters: WCAG 1.3.1 / heading-order best practice; screen-reader users get a misleading outline.
- User / business impact: accessibility complaints; axe best-practice noise in the breadth scan if the rule is enabled.
- Security / privacy / reliability impact: none.
- Recommended fix: promote section headings to h2 (and nested card titles to h3); add a heading-order check to the a11y spec.
- Suggested validation: axe `heading-order` on the six routes; unit snapshot of heading levels.
- Owner suggestion: web UI engineer
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Token drift returns after each feature | P3 | High | Theme inconsistency | UX-P3-005 | Lint guard |
| Screen-reader outline misleading | P3 | High | A11y compliance | UX-P3-012 | Heading fix |
| Design-system adoption stalls | P2 | Medium | Long-term maintenance | UX-P2-005 | Lint + docs |
| A11y breadth never becomes required | P3 | Medium | Regression window | UX-P3-010 | Promote after green |

## Recommendations

### Immediate / Release Blocking

None.

### This Week

- Clean the two hex-literal sites and add the token guard (`UX-P3-005`).

### This Month

- Fix the six heading outlines (`UX-P3-012`).
- Push design-system adoption with a lint rule rather than manual review (`UX-P2-005`).

### Later / Platform Evolution

- Promote `a11y-breadth.yml` to a required check once two consecutive runs are green (`UX-P3-010`).
- Add a table primitive to `@mct/ui` so admin tables share semantics.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Tokenize `NODE_COLORS` | Removes 13 literals | `NetworkDiagramCanvas.tsx` | Token import |
| Fix six h3→h2 | Restores outline | six pages | axe heading-order |
| Add hex-literal lint | Prevents recurrence | eslint config | Fixture |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Token guard | P3 | Design system | S | none |
| Heading-order sweep | P3 | Web UI | S | none |
| `@mct/ui` adoption rule | P2 | Design system | M | eslint owner |
| Required a11y breadth | P3 | CI owner | S | admin branch protection |

## Suggested Tests

- Unit/static: hex-literal guard fixture pass/fail.
- A11y: enable `heading-order` in `a11y.spec.ts` for the six routes.
- Chromatic: snapshot the two new pages after tokenization.
- Regression: keep the existing interactive-state axe tests.

## Suggested Documentation Updates

- `docs/WEB_UI_CONVENTIONS.md`: add "no hex literals in tsx; use tokens" and "no skipped heading levels".
- `docs/ui-kit.md`: document the network-canvas colour mapping.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Should Chromatic become a required check? | It is the only per-story axe gate | Repo-admin decision |
| Is the dev test-accounts page allowed to keep 90 hex literals? | It would need an explicit allowlist | Product/security decision |

## Appendix

- Colour scan: 557 tsx, 8 files / 113 hex, 0 `bg-[rgba(`.
- Heading scan: 6 real h1→h3 pages; the "No Organization Access" h3 instances were excluded because they are alternate empty states.
- Storybook: 14 `*.stories.tsx`; `packages/ui/package.json` has lint/typecheck/test/test:coverage.
