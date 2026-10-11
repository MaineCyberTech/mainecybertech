import { getClientEnv } from "../../lib/env";

describe("web client env [SECRET-P3-002]", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("throws in production when NEXT_PUBLIC_API_URL is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(() => getClientEnv()).toThrow(/NEXT_PUBLIC_API_URL is required in production/);
  });

  it("falls back to localhost outside production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getClientEnv().NEXT_PUBLIC_API_URL).toBe("http://localhost:4000");
  });

  it("uses the configured API URL in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_API_URL = "https://api.mainecybertech.us";

    expect(getClientEnv().NEXT_PUBLIC_API_URL).toBe("https://api.mainecybertech.us");
  });
});
