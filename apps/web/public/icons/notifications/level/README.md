# Level notification icons

Light and dark notification assets for the Level.io integration, drawn to match
the MCT portal surfaces and the Level portal mark.

## Files

| File | Use |
| --- | --- |
| `level-notification-light.svg` | Light-theme badge; slate-50 surface (`#F8FAFC`) with slate border and dark outlines for contrast. |
| `level-notification-dark.svg` | Dark-theme badge; portal base (`#0A1118`) with the Level layered gradients. |
| `level-notification-light-192.png`, `level-notification-light-512.png` | Raster light badge for web push / ntfy large icons. |
| `level-notification-dark-192.png`, `level-notification-dark-512.png` | Raster dark badge for web push / ntfy large icons. |
| `level-notification-badge-dark.svg`, `level-notification-badge-dark-48.png`, `level-notification-badge-dark-96.png` | Monochrome white silhouette for dark notification backgrounds / Android small icon. |
| `level-notification-badge-light.svg`, `level-notification-badge-light-48.png`, `level-notification-badge-light-96.png` | Monochrome navy silhouette for light notification backgrounds. |

## Design

- The layered mark is redrawn from Level's public portal/favicon geometry; no
  vendor file is copied into the repo.
- Badge surfaces use the portal tokens: dark `#0A1118` with slate-800 border,
  light `#F8FAFC` with slate-300 border.
- The light badge adds a thin navy outline so the cyan top layer remains legible
  on a light surface.
- The monochrome badges use opacity steps (0.55 / 0.78 / 1.0) to preserve the
  three-layer depth in a single colour.

## Usage

- Web push / ntfy large icon: use the light or dark `-192.png` matching the
  active theme.
- Android status bar / small notification icon: use the monochrome
  `badge-dark-96.png` (white) or `badge-light-96.png` (navy). Both have
  transparent backgrounds.
- UI surfaces: use the SVGs so the badge stays sharp at any size.

Regenerate the PNGs from the SVGs with a renderer such as
`@resvg/resvg-js`; keep the SVG as the source of truth.
