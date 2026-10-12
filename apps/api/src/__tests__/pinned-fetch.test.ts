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
import { pinnedFetch, MAX_RESPONSE_BYTES } from "../lib/pinned-fetch";

const dnsLookup = dns.promises.lookup as unknown as jest.Mock;
const httpsRequest = https.request as unknown as jest.Mock;

function mockHttpsResponse(
  emit: (res: EventEmitter & { statusCode: number; destroy: jest.Mock }) => void,
): () => EventEmitter & { statusCode: number; destroy: jest.Mock } {
  let captured!: EventEmitter & { statusCode: number; destroy: jest.Mock };
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
      captured = res;
      process.nextTick(() => emit(res));
      cb(res);
      const req = new EventEmitter() as EventEmitter & { write: jest.Mock; end: jest.Mock };
      req.write = jest.fn();
      req.end = jest.fn();
      return req;
    },
  );
  return () => captured;
}

describe("api pinnedFetch", () => {
  beforeEach(() => {
    dnsLookup.mockReset();
    httpsRequest.mockReset();
  });

  it("returns the response text for a normal body", async () => {
    dnsLookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    mockHttpsResponse((res) => {
      res.emit("data", Buffer.from("ok"));
      res.emit("end");
    });

    const response = await pinnedFetch("https://example.com/status");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });

  it("caps an oversized response body and stops reading [WH-P3-007]", async () => {
    dnsLookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    const stream = mockHttpsResponse((res) => {
      // One chunk larger than the cap: only the cap may be buffered.
      res.emit("data", Buffer.alloc(MAX_RESPONSE_BYTES + 1024, 0x61));
    });

    const response = await pinnedFetch("https://big.example/status");

    expect(response.status).toBe(200);
    expect((await response.text()).length).toBe(MAX_RESPONSE_BYTES);
    expect(stream().destroy).toHaveBeenCalled();
  });
});
