import { jest } from "@jest/globals";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { idempotencyMiddleware } from "../middleware/idempotency";

jest.mock("../lib/idempotency", () => ({
  checkIdempotencyKey: jest.fn(),
  storeIdempotencyKey: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { checkIdempotencyKey, storeIdempotencyKey } from "../lib/idempotency";

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
    (checkIdempotencyKey as jest.Mock).mockResolvedValue(null);
    (storeIdempotencyKey as jest.Mock).mockResolvedValue(undefined);
  });

  it("passes through when no idempotency-key header", async () => {
    const app = createApp();
    const res = await request(app).post("/test").send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(checkIdempotencyKey).not.toHaveBeenCalled();
  });

  it("passes through when idempotency-key is new", async () => {
    (checkIdempotencyKey as jest.Mock).mockResolvedValue(null);
    const app = createApp();
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", "unique-key-123")
      .send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(checkIdempotencyKey).toHaveBeenCalledWith("unique-key-123");
    expect(storeIdempotencyKey).toHaveBeenCalled();
  });

  it("returns 409 when idempotency-key already exists", async () => {
    (checkIdempotencyKey as jest.Mock).mockResolvedValue("existing-result");
    const app = createApp();
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", "duplicate-key")
      .send({ data: "hello" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already processed/i);
    expect(res.body.existingId).toBe("existing-result");
  });

  it("rejects idempotency-key longer than 256 chars", async () => {
    const app = createApp();
    const longKey = "a".repeat(257);
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", longKey)
      .send({ data: "hello" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
    expect(checkIdempotencyKey).not.toHaveBeenCalled();
  });

  it("accepts idempotency-key exactly 256 chars", async () => {
    const app = createApp();
    const key256 = "a".repeat(256);
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", key256)
      .send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(checkIdempotencyKey).toHaveBeenCalledWith(key256);
  });

  it("continues processing when idempotency check fails", async () => {
    (checkIdempotencyKey as jest.Mock).mockRejectedValue(new Error("Redis down"));
    const app = createApp();
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", "error-key")
      .send({ data: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("does not store key on non-2xx response", async () => {
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
    expect(storeIdempotencyKey).not.toHaveBeenCalled();
  });

  it("sets idempotency-key response header on cache hit", async () => {
    (checkIdempotencyKey as jest.Mock).mockResolvedValue("cached-result");
    const app = createApp();
    const res = await request(app)
      .post("/test")
      .set("idempotency-key", "hit-key")
      .send({ data: "hello" });

    expect(res.headers["idempotency-key"]).toBe("hit-key");
  });
});
