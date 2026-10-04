import { assertProductionTurnstile } from "../config/env";

describe("env production Turnstile boot assertion [SEC-P2-002]", () => {
  it("accepts a configured secret in production", () => {
    expect(() =>
      assertProductionTurnstile({
        NODE_ENV: "production",
        TURNSTILE_SECRET_KEY: "test-turnstile-secret",
      }),
    ).not.toThrow();
  });

  it("throws at boot when production has no Turnstile secret", () => {
    expect(() =>
      assertProductionTurnstile({ NODE_ENV: "production", TURNSTILE_SECRET_KEY: undefined }),
    ).toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it("does not require the secret outside production", () => {
    expect(() =>
      assertProductionTurnstile({ NODE_ENV: "development", TURNSTILE_SECRET_KEY: undefined }),
    ).not.toThrow();
    expect(() =>
      assertProductionTurnstile({ NODE_ENV: "test", TURNSTILE_SECRET_KEY: undefined }),
    ).not.toThrow();
  });
});
