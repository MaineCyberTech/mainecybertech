import { jest } from "@jest/globals";

jest.mock("node:dns", () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

import { pinnedFetch } from "../lib/pinned-fetch";

describe("worker pinnedFetch (SEC-P2-002)", () => {
  it("rejects a hostname that resolves to a private address", async () => {
    const dns = await import("node:dns");
    (dns.promises.lookup as unknown as jest.Mock).mockResolvedValueOnce([
      { address: "127.0.0.1", family: 4 },
    ]);

    await expect(pinnedFetch("https://evil-rebind.example/hook")).rejects.toThrow(
      /private or loopback/i,
    );
  });

  it("rejects a hostname that cannot be resolved", async () => {
    const dns = await import("node:dns");
    (dns.promises.lookup as unknown as jest.Mock).mockRejectedValueOnce(new Error("ENOTFOUND"));

    await expect(pinnedFetch("https://nope.example/hook")).rejects.toThrow(
      /could not be resolved/i,
    );
  });
});
