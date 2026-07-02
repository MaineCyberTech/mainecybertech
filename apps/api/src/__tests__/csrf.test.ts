import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

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

import { csrfProtection } from "../middleware/csrf";

function createTestApp() {
  const app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  app.get("/test", (_req, res) => res.json({ ok: true }));
  app.post("/test", (_req, res) => res.json({ ok: true }));
  app.put("/test", (_req, res) => res.json({ ok: true }));
  app.delete("/test", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("CSRF protection", () => {
  it("sets csrf_token cookie on GET requests", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.startsWith("csrf_token="))).toBe(true);
  });

  it("accepts POST with valid CSRF token", async () => {
    const app = createTestApp();
    const getRes = await request(app).get("/test");
    const cookies = getRes.headers["set-cookie"];
    const csrfCookie = cookies.find((c: string) => c.startsWith("csrf_token="));
    const csrfToken = csrfCookie.split(";")[0].split("=")[1];

    const postRes = await request(app)
      .post("/test")
      .set("Cookie", csrfCookie)
      .set("X-CSRF-Token", csrfToken);
    expect(postRes.status).toBe(200);
  });

  it("rejects POST with missing CSRF token", async () => {
    const app = createTestApp();
    const getRes = await request(app).get("/test");
    const cookies = getRes.headers["set-cookie"];

    const postRes = await request(app).post("/test").set("Cookie", cookies);
    expect(postRes.status).toBe(403);
  });

  it("rejects POST with mismatched CSRF token", async () => {
    const app = createTestApp();
    const getRes = await request(app).get("/test");
    const cookies = getRes.headers["set-cookie"];

    const postRes = await request(app)
      .post("/test")
      .set("Cookie", cookies)
      .set("X-CSRF-Token", "invalid-token");
    expect(postRes.status).toBe(403);
  });

  it("skips CSRF check for requests with Authorization header", async () => {
    const app = createTestApp();
    const postRes = await request(app).post("/test").set("Authorization", "Bearer test-token");
    expect(postRes.status).toBe(200);
  });

  it("rejects DELETE with missing CSRF token", async () => {
    const app = createTestApp();
    const deleteRes = await request(app).delete("/test");
    expect(deleteRes.status).toBe(403);
  });

  it("passes through GET requests without modifying behavior", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
