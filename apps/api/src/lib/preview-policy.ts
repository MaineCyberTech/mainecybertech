/**
 * FILE-P3-008: which uploads may be served inline vs. as an attachment.
 *
 * Signed URLs for files that the portal never previews used to be minted
 * without a `download` option, so the storage origin served the object inline.
 * If content validation were bypassed or evaded, markup could render from the
 * storage origin. The API now asks Supabase Storage for
 * `Content-Disposition: attachment` for every type that is not on the preview
 * allowlist; the web preview only renders the types this list approves, and it
 * sandboxes its iframes as defense in depth.
 *
 * Mirrors the previewable branches in `apps/web/components/DocumentPreview.tsx`
 * (images except SVG, PDF, video, audio, text-ish). SVG and XML are explicitly
 * excluded — they are active content.
 */

const INLINE_MIME_PREFIXES = ["image/", "video/", "audio/", "text/"];
const INLINE_MIME_EXACT = ["application/pdf", "application/json"];
const INLINE_MIME_DENY = [
  "image/svg+xml",
  "application/xml",
  "text/xml",
  "text/html",
  "application/xhtml+xml",
];

const INLINE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "mp4",
  "webm",
  "ogg",
  "mp3",
  "wav",
  "flac",
  "txt",
  "csv",
  "json",
  "md",
  "log",
  "yaml",
  "yml",
]);

function extensionOf(fileName?: string | null): string {
  const dot = fileName?.lastIndexOf(".") ?? -1;
  if (!fileName || dot <= 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** True when the file may be rendered inline in the portal preview. */
export function shouldServeInline(
  mimeType?: string | null,
  fileName?: string | null,
): boolean {
  const mime = (mimeType ?? "").split(";")[0]!.trim().toLowerCase();
  if (mime) {
    if (INLINE_MIME_DENY.includes(mime)) return false;
    if (INLINE_MIME_EXACT.includes(mime)) return true;
    if (INLINE_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) return true;
    return false;
  }
  return INLINE_EXTENSIONS.has(extensionOf(fileName));
}

/**
 * Third argument for `storage.createSignedUrl`: `{ download: true }` forces
 * `Content-Disposition: attachment` for non-previewable types, `undefined`
 * keeps the Supabase default (inline) for previewable ones.
 */
export function signedUrlDisposition(
  mimeType?: string | null,
  fileName?: string | null,
): { download: true } | undefined {
  return shouldServeInline(mimeType, fileName) ? undefined : { download: true };
}
