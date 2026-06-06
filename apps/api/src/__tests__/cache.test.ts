import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { responseCache, invalidateCache } from "../middleware/cache";

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

function createTestApp() {
  const app = express();
  let callCount = 0;

  app.get("/test", responseCache(60), (req, res) => {
    callCount++;
    res.json({ count: callCount, timestamp: Date.now() });
  });

  app.post("/test", (req, res) => {
    res.json({ ok: true });
  });

  return { app, getCallCount: () => callCount };
}

describe("responseCache", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("caches GET responses", async () => {
    const { app } = createTestApp();

    const res1 = await request(app).get("/test");
    const res2 = await request(app).get("/test");

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.headers["x-cache"]).toBe("MISS");
    expect(res2.headers["x-cache"]).toBe("HIT");
    expect(res1.body.count).toBe(res2.body.count);
  });

  it("does not cache POST responses", async () => {
    const app = express();
    let callCount = 0;

    app.use(express.json());
    app.post("/test", responseCache(60), (req, res) => {
      callCount++;
      res.json({ count: callCount });
    });

    await request(app).post("/test").send({});
    await request(app).post("/test").send({});

    expect(callCount).toBe(2);
  });

  it("invalidates cache on pattern match", async () => {
    const { app, getCallCount } = createTestApp();

    await request(app).get("/test");
    expect(getCallCount()).toBe(1);

    invalidateCache("/test");

    await request(app).get("/test");
    expect(getCallCount()).toBe(2);
  });

  it("invalidates all cache when no pattern", async () => {
    const { app, getCallCount } = createTestApp();

    await request(app).get("/test");
    expect(getCallCount()).toBe(1);

    invalidateCache();

    await request(app).get("/test");
    expect(getCallCount()).toBe(2);
  });
});
