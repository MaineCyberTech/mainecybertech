import { jest } from "@jest/globals";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { AppError, failure } from "../types";

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/test", requireIfMatch, (req: Request, res: Response) => {
    res.json({ version: (req as any).ifMatchVersion ?? null });
  });

  app.put("/test/:id", requireIfMatch, (req: Request, res: Response) => {
    const ifMatchVersion = (req as any).ifMatchVersion as number | undefined;
    const currentVersion = 3;

    try {
      checkVersionMatch(currentVersion, ifMatchVersion);
      res.json({ ok: true, version: currentVersion });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.status).json(failure(err.code, err.message, err.status));
      } else {
        res.status(500).json(failure("INTERNAL", "Internal server error", 500));
      }
    }
  });

  app.use((err: Error, _req: Request, res: Response, _next: any) => {
    if (err instanceof AppError) {
      res.status(err.status).json(failure(err.code, err.message, err.status));
    } else {
      res.status(500).json(failure("INTERNAL", "Internal server error", 500));
    }
  });

  return app;
}

describe("requireIfMatch middleware", () => {
  it("passes through when no If-Match header", async () => {
    const app = createApp();
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.body.version).toBeNull();
  });

  it("parses valid integer If-Match header", async () => {
    const app = createApp();
    const res = await request(app).get("/test").set("If-Match", "42");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(42);
  });

  it("rejects non-integer If-Match header with 412", async () => {
    const app = createApp();
    const res = await request(app).get("/test").set("If-Match", "not-a-number");

    expect(res.status).toBe(412);
  });

  it("accepts zero If-Match header (valid integer)", async () => {
    const app = createApp();
    const res = await request(app).get("/test").set("If-Match", "0");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(0);
  });

  it("accepts negative If-Match header (valid integer)", async () => {
    const app = createApp();
    const res = await request(app).get("/test").set("If-Match", "-1");

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(-1);
  });
});

describe("checkVersionMatch", () => {
  it("passes when no ifMatchVersion is provided", () => {
    expect(() => checkVersionMatch(5, undefined)).not.toThrow();
  });

  it("passes when versions match", () => {
    expect(() => checkVersionMatch(5, 5)).not.toThrow();
  });

  it("throws AppError when versions mismatch", () => {
    expect(() => checkVersionMatch(5, 3)).toThrow(AppError);
  });

  it("throws with VERSION_CONFLICT code and 409 status", () => {
    try {
      checkVersionMatch(5, 3);
      fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("VERSION_CONFLICT");
      expect((err as AppError).status).toBe(409);
      expect((err as AppError).message).toContain("5");
      expect((err as AppError).message).toContain("3");
    }
  });
});

describe("Integration: requireIfMatch + checkVersionMatch", () => {
  it("allows update when version matches", async () => {
    const app = createApp();
    const res = await request(app).put("/test/1").set("If-Match", "3");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("rejects update when version mismatches", async () => {
    const app = createApp();
    const res = await request(app).put("/test/1").set("If-Match", "2");

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("allows update when no If-Match header (skip locking)", async () => {
    const app = createApp();
    const res = await request(app).put("/test/1");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
