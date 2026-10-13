const DEFAULT_POST_AUTH_PATH = "/portal/dashboard";

/**
 * Resolve the post-auth landing path for `/auth/callback`.
 *
 * The reset flow (USE-P1-001) points the emailed link at
 * `/auth/callback?next=/password-reset` so the PKCE code is exchanged and the
 * session cookie is set before the user lands on the reset form.
 *
 * SECURITY: `next` comes from the URL, so only same-origin relative paths are
 * honoured. Absolute URLs, protocol-relative values (`//evil.com`) and
 * backslash/whitespace variants that browsers may normalise into a
 * cross-origin navigation all fall back to the portal dashboard.
 */
export function resolvePostAuthRedirect(next: string | null | undefined): string {
  if (!next) return DEFAULT_POST_AUTH_PATH;

  const value = next.trim();
  if (!value.startsWith("/")) return DEFAULT_POST_AUTH_PATH;
  if (value.startsWith("//")) return DEFAULT_POST_AUTH_PATH;
  // Reject backslashes/control characters/whitespace anywhere in the path.
  if (/[\\\s]/.test(value)) return DEFAULT_POST_AUTH_PATH;

  return value;
}
