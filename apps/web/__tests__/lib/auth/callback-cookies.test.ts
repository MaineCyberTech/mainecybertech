import { extractPkceVerifierCookies } from "@/lib/auth/callback-cookies";

/**
 * SEC-P3-017: the web /auth/callback route must only forward the Supabase PKCE
 * verifier cookie to the API, never the caller's session/CSRF cookies.
 */
describe("extractPkceVerifierCookies", () => {
  it("keeps only the PKCE verifier cookie", () => {
    const header =
      "mct_session=session-secret; csrf_token=csrf-secret; " +
      "sb-test-auth-token-code-verifier=verifier-123; mct_active_org=org-1";

    expect(extractPkceVerifierCookies(header)).toBe(
      "sb-test-auth-token-code-verifier=verifier-123",
    );
  });

  it("preserves multiple verifier cookies (e.g. project migration)", () => {
    const header =
      "sb-old-auth-token-code-verifier=old; mct_session=secret; " +
      "sb-new-auth-token-code-verifier=new";

    expect(extractPkceVerifierCookies(header)).toBe(
      "sb-old-auth-token-code-verifier=old; sb-new-auth-token-code-verifier=new",
    );
  });

  it("does not forward other Supabase cookies", () => {
    const header = "sb-test-auth-token=session-jwt; sb-test-auth-token-code-verifier=keep-me";

    expect(extractPkceVerifierCookies(header)).toBe("sb-test-auth-token-code-verifier=keep-me");
  });

  it("returns an empty string when the header or verifier is absent", () => {
    expect(extractPkceVerifierCookies(null)).toBe("");
    expect(extractPkceVerifierCookies(undefined)).toBe("");
    expect(extractPkceVerifierCookies("")).toBe("");
    expect(extractPkceVerifierCookies("mct_session=secret")).toBe("");
  });
});
