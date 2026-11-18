import { isTestAccountsEnabled } from "@/lib/test-accounts";

describe("isTestAccountsEnabled", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("keeps the public .us domain locked", () => {
    expect(isTestAccountsEnabled("app.mainecybertech.us")).toBe(false);
    expect(isTestAccountsEnabled("APP.MAINECYBERTECH.US")).toBe(false);
  });

  it("keeps production .com locked", () => {
    expect(isTestAccountsEnabled("app.mainecybertech.com")).toBe(false);
    expect(isTestAccountsEnabled("mainecybertech.com")).toBe(false);
  });

  it("enables localhost only with the explicit dev flag", () => {
    expect(isTestAccountsEnabled("localhost")).toBe(false);
    process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED = "true";
    expect(isTestAccountsEnabled("localhost")).toBe(true);
    expect(isTestAccountsEnabled("127.0.0.1")).toBe(true);
  });

  it("does not enable a public host even with the dev flag", () => {
    process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED = "true";
    expect(isTestAccountsEnabled("app.mainecybertech.us")).toBe(false);
    expect(isTestAccountsEnabled("app.mainecybertech.com")).toBe(false);
    expect(isTestAccountsEnabled("example.org")).toBe(false);
  });

  it("does not enable a production build even with the dev flag", () => {
    process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED = "true";
    process.env.NODE_ENV = "production";
    expect(isTestAccountsEnabled("localhost")).toBe(false);
  });

  it("rejects empty and unrelated hosts", () => {
    expect(isTestAccountsEnabled("")).toBe(false);
    expect(isTestAccountsEnabled("example.org")).toBe(false);
  });
});
