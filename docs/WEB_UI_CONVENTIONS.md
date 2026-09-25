# Web UI Conventions

Patterns the web app relies on. Prefer these over hand-rolled equivalents.

## Navigation

- **Catalogs are the source of truth:** `apps/web/lib/navigation/admin-nav.ts`
  (60 sections) and `portal-nav.ts` (70 sections). Every route directory must
  have an entry; `AdminSidebarContent` / `PortalSidebarContent` and the two
  subnav components read from them.
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
- Toasts are still ad-hoc (`onToast` / `pushToast` / `addToast`) — a shared
  provider is a known follow-up.
