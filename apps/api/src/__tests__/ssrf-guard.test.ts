import { jest } from "@jest/globals";
import dns from "node:dns";
import {
  isPrivateIpAddress,
  isBlockedHostname,
  assertSafeWebhookUrlSync,
  assertSafeWebhookUrl,
} from "../lib/ssrf-guard";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

describe("isPrivateIpAddress", () => {
  it.each([
    ["127.0.0.1", true],
    ["127.8.8.8", true],
    ["10.0.0.1", true],
    ["10.255.255.255", true],
    ["172.16.0.1", true],
    ["172.20.10.2", true],
    ["172.31.255.255", true],
    ["172.32.0.1", false],
    ["192.168.1.1", true],
    ["169.254.169.254", true],
    ["100.64.0.1", true],
    ["100.127.255.255", true],
    ["100.128.0.1", false],
    ["0.0.0.0", true],
    ["192.0.0.1", true],
    ["224.0.0.1", true],
    ["240.0.0.1", true],
    ["255.255.255.255", true],
    ["198.51.100.4", true],
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["93.184.216.34", false],
    ["not-an-ip", false],
    ["999.1.1.1", false],
  ])("detects %s as private=%s", (ip, expected) => {
    expect(isPrivateIpAddress(ip)).toBe(expected);
  });

  it("detects IPv6 loopback and ULA", () => {
    expect(isPrivateIpAddress("::1")).toBe(true);
    expect(isPrivateIpAddress("::")).toBe(true);
    expect(isPrivateIpAddress("fd00::1")).toBe(true);
    expect(isPrivateIpAddress("fe80::1")).toBe(true);
    expect(isPrivateIpAddress("2001:4860:4860::8888")).toBe(false);
  });

  it("detects IPv4-mapped IPv6 loopback", () => {
    expect(isPrivateIpAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIpAddress("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIpAddress("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("isBlockedHostname", () => {
  it.each(["localhost", "LOCALHOST", "api.localhost", "foo.local", "foo.internal", "2130706433"])(
    "blocks %s",
    (host) => {
      expect(isBlockedHostname(host)).toBe(true);
    },
  );

  it.each(["example.com", "hooks.slack.com", "webhook.site", "api.github.com"])(
    "allows %s",
    (host) => {
      expect(isBlockedHostname(host)).toBe(false);
    },
  );
});

describe("assertSafeWebhookUrlSync", () => {
  it("rejects non-http(s) schemes", () => {
    expect(() => assertSafeWebhookUrlSync("redis://127.0.0.1:6379")).toThrow(/http or https/i);
    expect(() => assertSafeWebhookUrlSync("file:///etc/passwd")).toThrow(/http or https/i);
  });

  it("rejects malformed URLs", () => {
    expect(() => assertSafeWebhookUrlSync("not a url")).toThrow(/invalid webhook url/i);
  });

  it("rejects private / loopback / link-local IP literals", () => {
    expect(() => assertSafeWebhookUrlSync("http://127.0.0.1:3000/hook")).toThrow(/private|loopback/i);
    expect(() => assertSafeWebhookUrlSync("http://169.254.169.254/latest/meta-data")).toThrow(
      /private|loopback/i,
    );
    expect(() => assertSafeWebhookUrlSync("http://10.0.0.1/hook")).toThrow(/private|loopback/i);
    expect(() => assertSafeWebhookUrlSync("http://192.168.1.10/hook")).toThrow(/private|loopback/i);
    expect(() => assertSafeWebhookUrlSync("http://172.16.0.5/hook")).toThrow(/private|loopback/i);
  });

  it("rejects localhost hostnames", () => {
    expect(() => assertSafeWebhookUrlSync("http://localhost:4000/hook")).toThrow(/private|loopback/i);
    expect(() => assertSafeWebhookUrlSync("http://api.localhost/hook")).toThrow(/private|loopback/i);
  });

  it("allows public HTTPS URLs", () => {
    expect(() =>
      assertSafeWebhookUrlSync("https://hooks.slack.com/services/T000/B000/XXXX"),
    ).not.toThrow();
    expect(() => assertSafeWebhookUrlSync("http://webhook.site/abc-123")).not.toThrow();
  });
});

describe("assertSafeWebhookUrl (async DNS resolution)", () => {
  afterEach(() => jest.restoreAllMocks());

  it("rejects hostnames that resolve to private addresses", async () => {
    jest
      .spyOn(dns.promises, "lookup")
      .mockResolvedValue([{ address: "10.0.0.1", family: 4 }]);
    await expect(assertSafeWebhookUrl("http://webhook.internal.example.com/hook")).rejects.toThrow(
      /private or loopback/i,
    );
  });

  it("rejects unresolved hostnames", async () => {
    jest
      .spyOn(dns.promises, "lookup")
      .mockRejectedValue(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));
    await expect(assertSafeWebhookUrl("http://does-not-exist.example.com/hook")).rejects.toThrow(
      /could not be resolved/i,
    );
  });

  it("allows hostnames that resolve to public addresses", async () => {
    jest
      .spyOn(dns.promises, "lookup")
      .mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    await expect(
      assertSafeWebhookUrl("https://webhook.internal.example.com/hook"),
    ).resolves.toBeUndefined();
  });
});
