# Web UI Kit

Browsable inventory of the shared web UI building blocks: what each one is for,
when to reach for it, and where to import it from. This is a reference catalog —
for the rules pages must follow, see
[WEB_UI_CONVENTIONS.md](WEB_UI_CONVENTIONS.md).

All paths are relative to the repo root; the `@/` alias maps to `apps/web/`.

## Contents

- [App-wide](#app-wide)
  - [ToastProvider / useToast](#toastprovider--usetoast)
  - [RouteAnnouncer](#routeannouncer)
- [Page shells & guards](#page-shells--guards)
  - [AdminPageShell](#adminpageshell)
  - [RouteGuard](#routeguard)
- [Navigation](#navigation)
  - [AdminSubnav / PortalSubnav](#adminsubnav--portalsubnav)
- [Status & feedback](#status--feedback)
  - [StatusPill](#statuspill)
  - [SeverityPill](#severitypill)
  - [EmptyState](#emptystate)
  - [DataErrorNote](#dataerrornote)
- [Detail pages](#detail-pages)
  - [ModuleDetailPage](#moduledetailpage)
  - [RecordDetail](#recorddetail)
- [Lists & pagination](#lists--pagination)
  - [AdminListPage](#adminlistpage)
  - [AdminListPageSearch](#adminlistpagesearch)
  - [AdminPagination](#adminpagination)
- [Dialogs & forms](#dialogs--forms)
  - [ConfirmDialog](#confirmdialog)
  - [ConfirmIntentButton](#confirmintentbutton)
  - [SubmitButton](#submitbutton)
  - [useFocusTrap](#usefocustrap)
- [Formatting](#formatting)
  - [lib/format.ts](#libformatt)
- [Shared primitives (`@mct/ui`)](#shared-primitives-mctui)

## App-wide

### ToastProvider / useToast

- **Purpose:** app-wide toast viewport + `useToast()` hook. Success/info/warning
  toasts announce on a polite live region, errors on an assertive one; each
  auto-dismisses after 5s and has an accessible dismiss button.
- **Use when:** a client component needs to confirm a mutation or surface a
  non-blocking error. Do not hand-roll toast state or render a second viewport.
- **Source:** `apps/web/components/ui/ToastProvider.tsx` (mounted once in
  `apps/web/app/layout.tsx`).
- **Import:** `import { useToast } from "@/components/ui/ToastProvider";`
- **API:** `const { pushToast } = useToast(); pushToast(tone, message, title?)`
  where `tone` is `"success" | "error" | "info" | "warning"`.

### RouteAnnouncer

- **Purpose:** announces the destination of a client-side navigation to
  assistive tech on a polite `aria-live` region; focus is never moved. It reads
  the destination page's `h1` (falling back to `document.title`).
- **Use when:** it is already mounted once in `apps/web/app/layout.tsx` — do not
  render it again.
- **Source:** `apps/web/components/RouteAnnouncer.tsx`
- **Import:** `import { RouteAnnouncer } from "@/components/RouteAnnouncer";`

## Page shells & guards

### AdminPageShell

- **Purpose:** the admin page scaffold — optional breadcrumbs and subnav, then
  the `h1` title, optional description and actions, then children.
- **Use when:** building an admin page by hand (most detail pages get it
  through `ModuleDetailPage`).
- **Source:** `apps/web/components/admin/AdminPageShell.tsx`
- **Import:** `import AdminPageShell from "@/components/admin/AdminPageShell";`
- **API:**
  `<AdminPageShell breadcrumbs={...} subnav={...} title="..." description="..." actions={...}>`

### RouteGuard

- **Purpose:** client-side prefix → permission guard. Matches the current
  pathname against a `Record<prefix, { module, action? }>` map (longest prefix
  wins) and renders a 403 panel when `module:action` is missing.
- **Use when:** guarding a route group. It is a UX/defense-in-depth layer — the
  server components and the API enforce the same rules independently.
- **Source:** `apps/web/components/RouteGuard.tsx` (mounted in the admin/portal
  layouts with `ADMIN_ROUTE_PERMISSIONS` / `PORTAL_ROUTE_PERMISSIONS`).
- **Import:** `import RouteGuard, { type GuardRule } from "@/components/RouteGuard";`
- **API:** `<RouteGuard rules={rules} homeHref="/admin">{children}</RouteGuard>`

## Navigation

### AdminSubnav / PortalSubnav

- **Purpose:** contextual sibling tabs for the current nav item's group
  (`adminGroupForKey` / `portalGroupForKey`). Renders nothing for an unknown
  key, while permissions are loading, or when fewer than two items are visible.
- **Use when:** a section page should link to its sibling routes. Pass the
  catalog `key`, not a path: `<AdminSubnav current="tickets" />`.
- **Source:** `apps/web/components/admin/AdminSubnav.tsx`,
  `apps/web/components/portal/PortalSubnav.tsx`
- **Import:** `import AdminSubnav from "@/components/admin/AdminSubnav";` or
  `import PortalSubnav from "@/components/portal/PortalSubnav";`

## Status & feedback

### StatusPill

- **Purpose:** the single status badge. Maps a status string to a colour via its
  `STATUS_TONES` map, with `tone` and `label` overrides for context-specific
  colours and humanized text.
- **Use when:** rendering any status/enum badge. Extend `STATUS_TONES` instead of
  adding a per-page badge helper.
- **Source:** `apps/web/components/admin/StatusPill.tsx` (also re-exported as the
  default of `apps/web/components/StatusPill.tsx`).
- **Import:** `import { StatusPill, type StatusTone } from "@/components/admin/StatusPill";`

### SeverityPill

- **Purpose:** compact p0–p3 severity badge (red/amber/blue/slate).
- **Use when:** rendering a finding/incident severity, not a general status.
- **Source:** `apps/web/components/admin/SeverityPill.tsx`
- **Import:** `import { SeverityPill } from "@/components/admin/SeverityPill";`

### EmptyState

- **Purpose:** page-level empty state with an icon (emoji key mapped to a Lucide
  icon), title, description and optional primary/secondary actions.
- **Use when:** a list or page has genuinely no data. Never render it when the
  load failed — render `DataErrorNote` instead. Nested section/sub-list
  fallbacks stay inline text.
- **Source:** `apps/web/components/EmptyState.tsx`
- **Import:** `import EmptyState from "@/components/EmptyState";`

### DataErrorNote

- **Purpose:** visible "could not load" banner so a failed fetch is not
  indistinguishable from an empty result. Renders with `role="status"`.
- **Use when:** a server component catches a list/detail load failure and would
  otherwise show zero counts or "No records".
- **Source:** `apps/web/components/admin/DataErrorNote.tsx`
- **Import:** `import DataErrorNote from "@/components/admin/DataErrorNote";`
- **API:** `<DataErrorNote what="tickets" detail={optionalHint} />`

## Detail pages

### ModuleDetailPage

- **Purpose:** shared server component for a record detail page: admin access
  guard, breadcrumbs, subnav, title resolution and a `RecordDetail` body.
  404s call `notFound()`; every other load error rethrows to the error
  boundary. Accepts optional `workflowActions` for state transitions.
- **Use when:** building `/admin/**/[id]` detail pages for a module registered
  in `lib/module-config`.
- **Source:** `apps/web/components/admin/ModuleDetailPage.tsx`
- **Import:** `import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";`

### RecordDetail

- **Purpose:** client-side view/edit/delete surface for one record, driven by a
  field config. Delete goes through `ConfirmDialog`; update/delete actions return
  `{ ok, error }`.
- **Use when:** a detail page needs inline editing without a bespoke form.
  Usually consumed through `ModuleDetailPage`.
- **Source:** `apps/web/components/admin/RecordDetail.tsx`
- **Import:** `import RecordDetail from "@/components/admin/RecordDetail";`

## Lists & pagination

### AdminListPage

- **Purpose:** generic admin list scaffold: breadcrumbs, subnav, title/actions,
  optional search slot, loading skeleton, empty state and row rendering.
- **Use when:** an admin list page would otherwise copy-paste the same header +
  empty/loading boilerplate.
- **Source:** `apps/web/components/admin/AdminListPage.tsx`
- **Import:** `import AdminListPage from "@/components/admin/AdminListPage";`

### AdminListPageSearch

- **Purpose:** search input (optionally debounced via `debounceMs`) used by
  `AdminListPage`'s `search` prop.
- **Use when:** the list filter is client-side; configure it via
  `AdminListPage`'s `search` prop rather than importing it directly.
- **Source:** `apps/web/components/admin/AdminListPageSearch.tsx`
- **Import:** `import AdminListPageSearch from "@/components/admin/AdminListPageSearch";`

### AdminPagination

- **Purpose:** server-rendered pagination (`Previous`/`Next` + a windowed page
  list with `aria-current`). Renders nothing for a single page or less.
- **Use when:** an admin list is backed by a paginated API endpoint
  (`{ items, total, page, limit }`); build each href with `buildHref(page)`.
- **Source:** `apps/web/components/admin/AdminPagination.tsx`
- **Import:** `import AdminPagination from "@/components/admin/AdminPagination";`

## Dialogs & forms

### ConfirmDialog

- **Purpose:** accessible confirmation dialog (focus-trapped, Escape-to-close,
  labelled). Replaces native `window.confirm`.
- **Use when:** an action needs explicit confirmation; use `danger` for
  destructive actions.
- **Source:** `apps/web/components/admin/ConfirmDialog.tsx`
- **Import:** `import ConfirmDialog from "@/components/admin/ConfirmDialog";`

### ConfirmIntentButton

- **Purpose:** submit button that opens `ConfirmDialog` first, then re-submits
  the form with itself as the submitter so its `name`/`value` intent reaches the
  server action.
- **Use when:** destructive form submissions (delete/archive) need confirmation.
- **Source:** `apps/web/components/admin/ConfirmIntentButton.tsx`
- **Import:** `import ConfirmIntentButton from "@/components/admin/ConfirmIntentButton";`

### SubmitButton

- **Purpose:** submit button for `action={serverAction}` forms that reads
  `useFormStatus()` to show a pending label and disable itself.
- **Use when:** any server-action form; avoids hand-rolled `useState` pending
  flags. Extra button props (name/value/aria) are forwarded.
- **Source:** `apps/web/components/SubmitButton.tsx`
- **Import:** `import SubmitButton from "@/components/SubmitButton";`

### useFocusTrap

- **Purpose:** traps Tab inside a container ref while `active` is true (WCAG
  2.4.3 / 2.1.2) and restores focus to the previously focused element on close.
- **Use when:** any `role="dialog"` should use it. `Dialog` (`@mct/ui`) and
  `ConfirmDialog` already wrap it; use it directly only for bespoke modals.
- **Source:** `apps/web/lib/use-focus-trap.ts`
- **Import:** `import { useFocusTrap } from "@/lib/use-focus-trap";`
- **API:** `useFocusTrap(ref, open)` — e.g. `useFocusTrap(dialogRef, isOpen)`.

## Formatting

### lib/format.ts

- **Purpose:** single source for date and money formatting —
  `formatDate`, `formatDateShort`, `formatDateTime`, `formatDateUtc`,
  `formatDateTimeUtc`, `formatDateTimeMinutesUtc`, `formatTime`,
  `formatMonthDay`, `formatMonthDayYear`,
  `formatCurrency(value, currency?)`.
- **Use when:** displaying any date or currency. No direct
  `toLocaleDateString` / `toLocaleString` / `Intl.NumberFormat` in pages.
- **Source:** `apps/web/lib/format.ts`
- **Import:** `import { formatDate, formatCurrency } from "@/lib/format";`

## Shared primitives (`@mct/ui`)

Styling primitives live in the workspace package `packages/ui` (import from
`@mct/ui`). The web app uses them for new self-contained components; the
existing `cyber-*` CSS utilities remain valid.

| Primitive                                                    | Purpose                                                                                           | Import                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `Button`                                                     | Themed button — `variant` (`primary`/`secondary`/`danger`/`ghost`), `size`, `loading`, `iconOnly` | `import { Button } from "@mct/ui";`          |
| `Input`, `Textarea`                                          | Themed form fields with forwarded refs and standard a11y wiring                                   | `import { Input, Textarea } from "@mct/ui";` |
| `Dialog`                                                     | Modal with overlay, focus trap, Escape-to-close and `useId()` labelling                           | `import { Dialog } from "@mct/ui";`          |
| `Badge`                                                      | Inline status chip — `variant` (`default`/`success`/`warning`/`danger`/`info`), `size`            | `import { Badge } from "@mct/ui";`           |
| `Avatar`                                                     | User/org avatar with fallback initials                                                            | `import { Avatar } from "@mct/ui";`          |
| `Skeleton` (`SkeletonText`, `SkeletonCard`, `SkeletonTable`) | Loading placeholders                                                                              | `import { Skeleton } from "@mct/ui";`        |

Also exported from `@mct/ui`: `SidebarGroup`/`SidebarItem`, `ThemeProvider`
(pinned dark in the web root layout), `cn()`, design tokens and the
`useTheme` hook.
