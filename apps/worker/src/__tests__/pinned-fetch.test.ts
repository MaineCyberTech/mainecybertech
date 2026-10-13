import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";

jest.mock("node:dns", () => ({
  promises: {
    lookup: jest.fn(),
  },
}));

jest.mock("node:https", () => ({
  request: jest.fn(),
}));

import dns from "node:dns";
import https from "node:https";
import { pinnedFetch, resolvePinnedAddress, MAX_RESPONSE_BYTES } from "../lib/pinned-fetch";

const dnsLookup = dns.promises.lookup as unknown as jest.Mock;
const httpsRequest = https.request as unknown as jest.Mock;

describe("worker pinnedFetch (SEC-P2-002)", () => {
  beforeEach(() => {
    dnsLookup.mockReset();
    httpsRequest.mockReset();
  });

  it("rejects a hostname that resolves to a private address", async () => {
    dnsLookup.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);

    await expect(pinnedFetch("https://evil-rebind.example/hook")).rejects.toThrow(
      /private or loopback/i,
    );
  });

  it("rejects a hostname that cannot be resolved", async () => {
    dnsLookup.mockRejectedValueOnce(new Error("ENOTFOUND"));

    await expect(pinnedFetch("https://nope.example/hook")).rejects.toThrow(
      /could not be resolved/i,
    );
  });

  it("rejects a private IP literal without a DNS lookup", async () => {
    await expect(pinnedFetch("http://127.0.0.1/status")).rejects.toThrow(/private or loopback/i);
    expect(dnsLookup).not.toHaveBeenCalled();
  });

  // SEC-P2-001 / CHAIN-P2-010 regression: the guard and the connection must
  // not resolve the name twice. Here the first answer is public (what the
  // guard sees) and any later answer is loopback (the rebinding attempt).
  it("pins the socket to the validated answer so a rebinding answer is never dialled", async () => {
    dnsLookup
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    httpsRequest.mockImplementation(
      (
        _url: string,
        options: { lookup: (hostname: string, opts: unknown, cb: jest.Mock) => void },
        cb: (res: EventEmitter & { statusCode: number }) => void,
      ) => {
        const res = new EventEmitter() as EventEmitter & { statusCode: number };
        res.statusCode = 200;
        process.nextTick(() => {
          res.emit("data", Buffer.from("ok"));
          res.emit("end");
        });
        cb(res);
        const req = new EventEmitter() as EventEmitter & { write: jest.Mock; end: jest.Mock };
        req.write = jest.fn();
        req.end = jest.fn();
        return req;
      },
    );

    const response = await pinnedFetch("https://rebind.example/status");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");

    // The name was resolved exactly once...
    expect(dnsLookup).toHaveBeenCalledTimes(1);

    // ...and the connection's lookup returns the address validated at guard
    // time, not the loopback answer a rebinding host would serve next.
    const options = httpsRequest.mock.calls[0][1] as {
      lookup: (hostname: string, opts: unknown, cb: jest.Mock) => void;
    };
    const callback = jest.fn();
    options.lookup("rebind.example", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });

  it("caps an oversized response body and stops reading [WH-P3-007]", async () => {
    dnsLookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);

    let responseStream: (EventEmitter & { destroy: jest.Mock }) | null = null;
    httpsRequest.mockImplementation(
      (
        _url: string,
        _options: unknown,
        cb: (res: EventEmitter & { statusCode: number }) => void,
      ) => {
        const res = new EventEmitter() as EventEmitter & {
          statusCode: number;
          destroy: jest.Mock;
        };
        res.statusCode = 200;
        res.destroy = jest.fn();
        responseStream = res;
        process.nextTick(() => {
          // One chunk larger than the cap: the reader must keep only the cap.
          res.emit("data", Buffer.alloc(MAX_RESPONSE_BYTES + 1024, 0x61));
        });
        cb(res);
        const req = new EventEmitter() as EventEmitter & { write: jest.Mock; end: jest.Mock };
        req.write = jest.fn();
        req.end = jest.fn();
        return req;
      },
    );

    const response = await pinnedFetch("https://big.example/status");
    expect(response.status).toBe(200);
    expect((await response.text()).length).toBe(MAX_RESPONSE_BYTES);
    expect(responseStream?.destroy).toHaveBeenCalled();
  });
});

describe("worker resolvePinnedAddress (SEC-P2-001)", () => {
  beforeEach(() => {
    dnsLookup.mockReset();
  });

  it("returns the first validated answer for a public hostname", async () => {
    dnsLookup.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);

    await expect(resolvePinnedAddress("https://example.com/health")).resolves.toEqual({
      address: "93.184.216.34",
      family: 4,
    });
  });

  it("rejects when any answer is private even if the first one is public", async () => {
    dnsLookup.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 },
      { address: "169.254.169.254", family: 4 },
    ]);

    await expect(resolvePinnedAddress("https://rebind.example/health")).rejects.toThrow(
      /private or loopback/i,
    );
  });
});
