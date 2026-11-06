/**
 * Client-safe check for whether the test-accounts page is available.
 *
 * Explicitly enabled via NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED=true, or
 * implicitly enabled on dev-like hosts (localhost / *.us dev domain).
 * Production (.com) requires the explicit env flag so it stays locked.
 *
 * The optional hostname argument makes the host rule testable without
 * replacing window.location (jsdom 30 makes it non-configurable).
 */
export function isTestAccountsEnabled(hostname?: string): boolean {
  if (process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED === "true") return true;

  const host = hostname ?? (typeof window === "undefined" ? "" : window.location.hostname);
  return isDevHost(host);
}

function isDevHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".us")) return true;
  return false;
}
