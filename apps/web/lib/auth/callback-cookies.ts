/**
 * SEC-P3-017: `/auth/callback` posts to the API, which only needs the Supabase
 * PKCE verifier cookie (`sb-<ref>-auth-token-code-verifier`). Forwarding the
 * whole Cookie header leaked `mct_session`, `csrf_token` and `mct_active_org`
 * across the web -> API boundary (and into the request body) for no reason.
 *
 * Return only the verifier cookie pair(s), preserving their original encoded
 * values so the API can decode them exactly as before.
 */
export function extractPkceVerifierCookies(cookieHeader: string | null | undefined): string {
  if (!cookieHeader) return "";

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split("=", 1)[0]?.trim() ?? "";
      return name.startsWith("sb-") && name.endsWith("-auth-token-code-verifier");
    })
    .join("; ");
}
