import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { inputSanitizer } from "../middleware/security";
import { securityHeaders } from "../middleware/security-headers";
import { errorHandler } from "../middleware/error";

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
  app.use(express.json());
  app.use(securityHeaders);
  app.use(inputSanitizer);
  app.post("/test", (req, res) => res.json({ ok: true, body: req.body }));
  app.get("/test", (req, res) => res.json({ ok: true, query: req.query }));
  app.use(errorHandler);
  return app;
}

describe("securityHeaders", () => {
  it("sets security headers on responses", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(res.headers["strict-transport-security"]).toContain("max-age=63072000");
  });

  it("sets CSP header for API endpoints", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");

    expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers["content-security-policy"]).toContain("script-src 'self'");
  });
});

describe("inputSanitizer", () => {
  it("allows safe input", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("blocks XSS attempts in body", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ name: '<script>alert("xss")</script>' });

    expect(res.status).toBe(400);
  });

  it("blocks SQL injection attempts in body", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ search: "'; DROP TABLE users; --" });

    expect(res.status).toBe(400);
  });

  it("sanitizes HTML entities in safe strings", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ name: "O'Brien" });

    expect(res.status).toBe(200);
    expect(res.body.body.name).toContain("O");
  });

  it("blocks XSS in query parameters", async () => {
    const app = createTestApp();
    const res = await request(app)
      .get("/test?search=<script>alert(1)</script>");

    expect(res.status).toBe(400);
  });

  it("allows numeric input", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ count: 42, price: 99.99 });

    expect(res.status).toBe(200);
    expect(res.body.body.count).toBe(42);
  });

  it("handles nested objects", async () => {
    const app = createTestApp();
    const res = await request(app)
      .post("/test")
      .send({ user: { name: "Test", bio: "Hello world" } });

    expect(res.status).toBe(200);
  });
});
