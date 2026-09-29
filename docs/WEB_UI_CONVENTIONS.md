# Web UI Conventions

Patterns the web app relies on. Prefer these over hand-rolled equivalents.

> Browse the components themselves (purpose, "use when", import paths) in
> [ui-kit.md](ui-kit.md).

## Navigation

- **Catalogs are the source of truth:** `apps/web/lib/navigation/admin-nav.ts`
  (94 entries across 6 groups) and `portal-nav.ts` (70 entries across 5 groups).
  Every route directory must have an entry; `AdminSidebarContent` /
  `PortalSidebarContent` and the two subnav components read from them.
- **Contextual subnav:** `AdminSubnav` / `PortalSubnav` render the sibling items
  of the current item's group as tabs. Pass the catalog `key`
  (`<AdminSubnav current="tickets" />`); an unknown key renders nothing.
- **Active state uses longest-prefix matching** in all four nav components, so a
  nested route (`/admin/store/products`) does not also mark its parent active.

## Route guarding

`apps/web/components/RouteGuard.tsx` maps a path prefix to a `module:action`
permission and renders a 403 panel. It picks the **longest** matching prefix.
Server components and the API enforce the same rules independently; the API is
the real boundary.

## Load-failure states

`apps/web/components/admin/DataErrorNote.tsx` is the standard "could not load"
banner. Server pages should:

```tsx
let loadFailed = false;
try {
  data = await api.foo.list(...);
} catch {
  loadFailed = true;
}
// ...
{loadFailed ? <DataErrorNote what="foo" /> : null}
```

Do **not** render an empty/zero state on failure — an outage must not look like
"no data". Detail pages should `notFound()` only on a real 404 and rethrow
everything else so the error boundary handles 5xx.

## Forms

- `apps/web/components/SubmitButton.tsx` reads `useFormStatus()` and disables
  itself while a server action is pending — use it inside `action={...}` forms.
- Announce async errors with `role="alert"` / `role="status"`; associate field
  errors with `aria-invalid` + `aria-describedby`.

## Modals & drawers

`apps/web/lib/use-focus-trap.ts` (`useFocusTrap(ref, open)`) traps Tab inside the
dialog and restores focus on close. Every `role="dialog"` should use it, plus an
`aria-labelledby`/`aria-label` and Escape-to-close.

`apps/web/components/admin/ConfirmDialog.tsx` is the standard confirmation
dialog (focus-trapped, Escape-to-close, labelled). Use it instead of
`window.confirm`; for submit buttons use `ConfirmIntentButton`, which opens the
dialog and re-submits the form with the button as submitter on confirm.

## Consistency

- Admin pages use `AdminPageShell` (breadcrumbs/subnav/title/actions); 35 detail
  pages use `ModuleDetailPage`/`RecordDetail`.
- Status badges use `components/admin/StatusPill` (`SeverityPill` for p0–p3
  severities). Extend its `STATUS_TONES` map for a status, or pass
  `tone`/`label` for context-specific colours and humanized text — do not add
  per-page badge helpers.
- Empty lists use `components/EmptyState` (page-level); nested section/sub-list
  fallbacks stay as short inline text.
- Formatting: `lib/format.ts` is the single source (`formatDate`,
  `formatDateShort`, `formatDateTime`, `formatDateUtc`, `formatDateTimeUtc`,
  `formatDateTimeMinutesUtc`, `formatTime`, `formatMonthDay`, `formatMonthDayYear`,
  `formatCurrency`) — no direct
  `toLocaleDateString`/`toLocaleString`/`Intl.NumberFormat` in pages.
- Toasts use `components/ui/ToastProvider` + `useToast().pushToast(tone, message, title?)`;
  do not add per-component toast state or renderers.
- The theme is dark-only; `ThemeProvider` is pinned (`defaultTheme="dark"`).

## Accessibility scanning

- **Default gate:** `apps/web/e2e/a11y.spec.ts` scans 19 core routes and fails
  on `critical`/`serious` axe violations (WCAG 2.0/2.1 A+AA tags).
- **Breadth triage:** run with `A11Y_FULL=1` (or the weekly/manual, non-blocking
  `a11y-breadth.yml`) to scan 68 routes with `wcag22aa` tags added. Fix findings
  there, then promote the route into `BASE_PAGES` once clean — do not widen the
  prod gate with known failures.
