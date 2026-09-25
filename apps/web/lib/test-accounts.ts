/**
 * Client-safe check for whether the test-accounts page is available.
 *
 * Explicitly enabled via NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED=true, or
 * implicitly enabled on dev-like hosts (localhost / *.us dev domain).
 * Production (.com) requires the explicit env flag so it stays locked.
 */
export function isTestAccountsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED === "true") return true;

  if (typeof window === "undefined") return false;

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".us")) return true;

  return false;
}
