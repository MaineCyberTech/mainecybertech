# Organization Branding

> Per-organization branding with custom logo, colors, and domains.

## Database Schema

Branding columns on `organizations` table:

| Column | Type | Description |
|--------|------|-------------|
| `logo_url` | text | Public URL to org logo (stored in `logos` bucket) |
| `brand_color` | text | Primary brand color (hex, e.g. `#059669`) |
| `accent_color` | text | Accent color (hex, e.g. `#0D9488`) |
| `custom_domain` | citext | Custom portal domain (e.g. `portal.myclient.com`) |

## Storage Bucket: `logos`

A public Supabase storage bucket for organization logos.

| Property | Value |
|----------|-------|
| Bucket ID | `logos` |
| Public | `true` |
| File limit | 5MB (API enforces) |
| Allowed types | PNG, JPG, SVG |

### RLS Policies

- **Select**: Any authenticated user can read public logos
- **Insert**: Authenticated users can upload, scoped to `{userId}/` folder prefix

## API Endpoints

### Logos

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/organizations/:id/logo` | Upload org logo (multipart/form-data, field name `"logo"`) |

Returns `{ logoUrl: "..." }` — the public URL of the uploaded logo.

### Organization Update

| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/api/v1/organizations/:id` | Update branding fields |

Accepts in JSON body: `logoUrl`, `brandColor`, `accentColor`, `customDomain`.

## Portal Layout Integration

The portal layout (`app/(portal)/layout.tsx`) automatically applies org branding:

- **Header border** uses `brand_color` at 20% opacity
- **Brand text color** uses `brand_color` when no logo is set
- **Logo image** displayed inline in header when `logo_url` is set
- **Org name** replaces `Maine CyberTech` text when logo is present

No portal code changes needed per org — branding is fetched from the API on every request via the server component.

## Admin UI

**Route:** `/admin/organizations/:id` → "Branding" section

- **Logo upload**: File input (PNG/JPG/SVG), preview with 5MB limit
- **Brand Color**: Color picker + hex input
- **Accent Color**: Color picker + hex input
- **Custom Domain**: Text input
- **Color Preview**: Swatch showing selected colors
- **Save Button**: PATCH to API, shows success feedback

## SDK

**File:** `packages/sdk/src/organizations.ts`

```typescript
client.organizations.update(orgId, {
  logoUrl?: string | null,
  brandColor?: string | null,
  accentColor?: string | null,
  customDomain?: string | null,
})

client.organizations.uploadLogo(orgId, file: File | Blob)
// Returns { logoUrl: string }
```

## Migration

| Migration | Files | Description |
|-----------|-------|-------------|
| `5302031_org_branding.sql` | `organizations` table + `logos` bucket | Adds `logo_url`, `brand_color`, `accent_color`, `custom_domain` columns and public storage bucket |

## Limitations

- `custom_domain` is stored but not actively routed — the app still serves on the primary domain. Custom domain routing requires additional infrastructure (reverse proxy, DNS, TLS cert).
- Logo upload uses the Supabase admin service role key internally — the API handles the upload, not the client directly.
