import { resolvePostAuthRedirect } from "@/lib/auth/callback-redirect";

/**
 * USE-P1-001: the emailed reset link goes through
 * `/auth/callback?next=/password-reset`. `next` is attacker-controllable, so
 * only same-origin relative paths may be honoured.
 */
describe("resolvePostAuthRedirect", () => {
  it("defaults to the portal dashboard without a next param", () => {
    expect(resolvePostAuthRedirect(null)).toBe("/portal/dashboard");
    expect(resolvePostAuthRedirect(undefined)).toBe("/portal/dashboard");
    expect(resolvePostAuthRedirect("")).toBe("/portal/dashboard");
  });

  it("honours the reset landing path", () => {
    expect(resolvePostAuthRedirect("/password-reset")).toBe("/password-reset");
  });

  it("honours other same-origin relative paths", () => {
    expect(resolvePostAuthRedirect("/portal/documents?tab=shared")).toBe(
      "/portal/documents?tab=shared",
    );
  });

  it("rejects absolute and protocol-relative URLs (open redirect)", () => {
    for (const evil of [
      "https://evil.example.com",
      "http://evil.example.com/password-reset",
      "//evil.example.com",
      "\\\\evil.example.com",
      "/\\evil.example.com",
      "/\\/evil.example.com",
      "/ /evil.example.com",
    ]) {
      expect(resolvePostAuthRedirect(evil)).toBe("/portal/dashboard");
    }
  });

  it("rejects a non-path value", () => {
    expect(resolvePostAuthRedirect("password-reset")).toBe("/portal/dashboard");
  });

  it("trims surrounding whitespace before validating", () => {
    expect(resolvePostAuthRedirect("  /password-reset  ")).toBe("/password-reset");
  });
});
