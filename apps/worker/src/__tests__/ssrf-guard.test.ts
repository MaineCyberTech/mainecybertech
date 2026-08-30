import { isPrivateIpAddress, isBlockedHostname, assertSafeUrlSync, assertSafeUrl } from "../lib/ssrf-guard";

jest.mock("node:dns", () => ({
  promises: {
    lookup: jest.fn().mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]),
  },
}));

describe("worker ssrf-guard isPrivateIpAddress", () => {
  it.each([
    ["10.0.0.1", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["169.254.169.254", true],
    ["127.0.0.1", true],
    ["100.64.0.1", true],
    ["224.0.0.1", true],
    ["192.0.2.1", true],
    ["203.0.113.5", true],
    ["8.8.8.8", false],
    ["93.184.216.34", false],
    ["::1", true],
    ["fc00::1", true],
    ["fe80::1", true],
    ["2001:db8::1", true],
    ["2001:4860:4860::8888", false],
  ])("%s -> %s", (input, expected) => {
    expect(isPrivateIpAddress(input)).toBe(expected);
  });
});

describe("worker ssrf-guard isBlockedHostname", () => {
  it.each(["localhost", "LOCALHOST", "api.localhost", "foo.local", "foo.internal", "2130706433"])(
    "%s blocked",
    (host) => {
      expect(isBlockedHostname(host)).toBe(true);
    },
  );

  it("allows public hostnames", () => {
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("hooks.slack.com")).toBe(false);
  });
});

describe("worker ssrf-guard assertSafeUrlSync", () => {
  it("rejects non-http(s) schemes", () => {
    expect(assertSafeUrlSync("redis://127.0.0.1:6379")).toMatch(/http or https/i);
    expect(assertSafeUrlSync("file:///etc/passwd")).toMatch(/http or https/i);
  });

  it("rejects invalid URLs", () => {
    expect(assertSafeUrlSync("not a url")).toMatch(/invalid/i);
  });

  it("rejects private and loopback literals", () => {
    expect(assertSafeUrlSync("http://127.0.0.1:3000/hook")).toMatch(/private|loopback/i);
    expect(assertSafeUrlSync("http://169.254.169.254/latest/meta-data")).toMatch(/private|loopback/i);
    expect(assertSafeUrlSync("http://10.0.0.1/hook")).toMatch(/private|loopback/i);
    expect(assertSafeUrlSync("http://localhost:4000/hook")).toMatch(/private|loopback/i);
  });

  it("accepts public URLs", () => {
    expect(assertSafeUrlSync("https://example.com/status")).toBeNull();
    expect(assertSafeUrlSync("https://hooks.slack.com/services/T000/B000/XXXX")).toBeNull();
  });
});

describe("worker ssrf-guard assertSafeUrl (DNS)", () => {
  it("passes a hostname resolving to public addresses", async () => {
    expect(await assertSafeUrl("https://example.com/status")).toBeNull();
  });

  it("rejects a hostname resolving to a private address", async () => {
    const dns = await import("node:dns");
    (dns.promises.lookup as jest.Mock).mockResolvedValueOnce([
      { address: "127.0.0.1", family: 4 },
    ]);
    expect(await assertSafeUrl("https://evil-rebind.example/status")).toMatch(/private|loopback/i);
  });
});
