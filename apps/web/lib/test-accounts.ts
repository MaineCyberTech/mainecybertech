/**
 * Client-safe check for whether the test-accounts page is available.
 *
 * Dev-only convenience: enabled only when the explicit env flag is set, the
 * build is not production, and the host is localhost. Do not enable this on a
 * public deployment; the one-click sign-in bypasses MFA and the normal login
 * flow.
 *
 * The optional hostname argument makes the host rule testable without
 * replacing window.location (jsdom 30 makes it non-configurable).
 */
export function isTestAccountsEnabled(hostname?: string): boolean {
  if (process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED !== "true") return false;
  if (process.env.NODE_ENV === "production") return false;

  const host = hostname ?? (typeof window === "undefined" ? "" : window.location.hostname);
  return isDevHost(host);
}

function isDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}
