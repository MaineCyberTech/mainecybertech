import { jest } from "@jest/globals";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { idempotencyMiddleware } from "../middleware/idempotency";

jest.mock("../lib/idempotency", () => ({
  claimIdempotencyKey: jest.fn(),
  checkIdempotencyKey: jest.fn(),
  storeIdempotencyKey: jest.fn(),
  deleteIdempotencyKey: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  claimIdempotencyKey,
  checkIdempotencyKey,
  storeIdempotencyKey,
  deleteIdempotencyKey,
} from "../lib/idempotency";

const claim = claimIdempotencyKey as jest.Mock;
const check = checkIdempotencyKey as jest.Mock;
const store = storeIdempotencyKey as jest.Mock;
const del = deleteIdempotencyKey as jest.Mock;

// Keys are scoped by caller (bearer token or IP) + method + route + header.
const scopedSuffix = (name: string) => new RegExp(`:POST:/test:${name}$`.replace(/[/]/g, "\\/"));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(idempotencyMiddleware);
  app.post("/test", (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe("idempotencyMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    claim.mockResolvedValue(true);
    check.mockResolvedValue(null);
    store.mockResolvedValue(undefined);
    del.mockResolvedValue(undefined);
  });

  it("passes through when no idempotency-key header", async () => {
    const res = await request(createApp()).post("/test").send({ data: "hello" });
    expect(res.status).toBe(200);
    expect(claim).not.toHaveBeenCalled();
  });

  it("claims a new key and stores the successful response", async () => {
    const res = await request(createApp())
      .post("/test")
      .set("idempotency-key", "unique-key-123")
      .send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(claim).toHaveBeenCalledWith(
      expect.stringMatching(scopedSuffix("unique-key-123")),
      "processing",
    );
    expect(store).toHaveBeenCalledTimes(1);
    const [storedKey, storedValue] = store.mock.calls[0] as [string, string];
    expect(storedKey).toMatch(scopedSuffix("unique-key-123"));
    expect(JSON.parse(storedValue)).toEqual({
      kind: "json",
      status: 200,
      body: { ok: true },
    });
  });

  it("replays the stored response for a completed duplicate", async () => {
    claim.mockResolvedValue(false);
    check.mockResolvedValue(
      JSON.stringify({ kind: "json", status: 201, body: { replayed: true } }),
    );

    const res = await request(createApp())
      .post("/test")
      .set("idempotency-key", "done-key")
      .send({ data: "hello" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ replayed: true });
    expect(res.headers["x-idempotent-replay"]).toBe("true");
    expect(res.headers["idempotency-key"]).toBe("done-key");
  });

  it("returns 409 when a duplicate is still in flight", async () => {
    claim.mockResolvedValue(false);
    check.mockResolvedValue("processing");

    const res = await request(createApp())
      .post("/test")
      .set("idempotency-key", "inflight-key")
      .send({ data: "hello" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already in progress/i);
    expect(res.headers["idempotency-key"]).toBe("inflight-key");
  });

  it("rejects idempotency-key longer than 256 chars", async () => {
    const res = await request(createApp())
      .post("/test")
      .set("idempotency-key", "a".repeat(257))
      .send({ data: "hello" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
    expect(claim).not.toHaveBeenCalled();
  });

  it("fails open when the claim throws", async () => {
    claim.mockRejectedValue(new Error("Redis down"));
    const res = await request(createApp())
      .post("/test")
      .set("idempotency-key", "error-key")
      .send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("releases the key (no store) on a non-2xx response", async () => {
    const app = express();
    app.use(express.json());
    app.use(idempotencyMiddleware);
    app.post("/fail", (_req: Request, res: Response) => {
      res.status(500).json({ error: "boom" });
    });

    const res = await request(app)
      .post("/fail")
      .set("idempotency-key", "fail-key")
      .send({ data: "hello" });

    expect(res.status).toBe(500);
    expect(store).not.toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith(expect.stringMatching(/:\/fail:fail-key$/));
  });

  it("scopes the key by caller so distinct auth tokens do not collide", async () => {
    claim.mockResolvedValue(true);
    await request(createApp())
      .post("/test")
      .set("idempotency-key", "same-key")
      .set("Authorization", "Bearer token-a")
      .send({});
    await request(createApp())
      .post("/test")
      .set("idempotency-key", "same-key")
      .set("Authorization", "Bearer token-b")
      .send({});

    const firstKey = claim.mock.calls[0]?.[0];
    const secondKey = claim.mock.calls[1]?.[0];
    expect(firstKey).not.toBe(secondKey);
    expect(String(firstKey)).toMatch(/:POST:\/test:same-key$/);
  });
});
