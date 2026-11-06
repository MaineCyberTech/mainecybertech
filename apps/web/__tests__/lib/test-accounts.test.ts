import { isTestAccountsEnabled } from "@/lib/test-accounts";

describe("isTestAccountsEnabled", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED;
  });

  it("enables localhost hosts", () => {
    expect(isTestAccountsEnabled("localhost")).toBe(true);
    expect(isTestAccountsEnabled("127.0.0.1")).toBe(true);
  });

  it("enables the dev .us domain case-insensitively", () => {
    expect(isTestAccountsEnabled("app.mainecybertech.us")).toBe(true);
    expect(isTestAccountsEnabled("APP.MAINECYBERTECH.US")).toBe(true);
  });

  it("keeps production .com locked without the env flag", () => {
    expect(isTestAccountsEnabled("app.mainecybertech.com")).toBe(false);
    expect(isTestAccountsEnabled("mainecybertech.com")).toBe(false);
  });

  it("allows production when the env flag is explicitly set", () => {
    process.env.NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED = "true";
    expect(isTestAccountsEnabled("app.mainecybertech.com")).toBe(true);
  });

  it("rejects empty and unrelated hosts", () => {
    expect(isTestAccountsEnabled("")).toBe(false);
    expect(isTestAccountsEnabled("example.org")).toBe(false);
  });
});
