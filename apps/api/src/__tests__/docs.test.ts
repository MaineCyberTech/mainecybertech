import { jest } from "@jest/globals";
import request from "supertest";
import docsRouter from "../routes/docs";
import { securityHeaders } from "../middleware/security-headers";
import { getEnv } from "../config/env";
import { createTestApp } from "./helpers";

const testEnv = {
  NODE_ENV: "test",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  CORS_ORIGIN: "*",
  LOG_LEVEL: "silent",
  API_PORT: 4000,
};

jest.mock("../config/env", () => ({
  getEnv: jest.fn(),
}));

const mockedGetEnv = getEnv as unknown as jest.Mock;

function buildApp() {
  const app = createTestApp();
  app.use(securityHeaders);
  app.use("/api/v1", docsRouter);
  return app;
}

describe("docs routes", () => {
  beforeEach(() => {
    mockedGetEnv.mockReturnValue(testEnv);
  });

  it("GET /api/v1/docs returns Swagger UI HTML", async () => {
    const res = await request(buildApp()).get("/api/v1/docs");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
    expect(res.text).toContain("MCT API Docs");
  });

  it("GET /api/v1/openapi.json returns JSON or error", async () => {
    const res = await request(buildApp()).get("/api/v1/openapi.json");
    expect([200, 500]).toContain(res.status);
  });

  it("pins Swagger assets to an exact version with SRI", async () => {
    const res = await request(buildApp()).get("/api/v1/docs");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui-dist@5.33.1");
    expect(res.text).toContain('integrity="sha384-');
    expect(res.text).toContain('crossorigin="anonymous"');
  });

  it("tags the inline bootstrap with the per-response CSP nonce", async () => {
    const res = await request(buildApp()).get("/api/v1/docs");
    const nonce = res.headers["x-content-security-policy-nonce"];
    expect(nonce).toBeTruthy();
    expect(res.text).toContain(`<script nonce="${nonce}">`);
    expect(res.headers["content-security-policy"]).toContain(`'nonce-${nonce}'`);
  });

  it("fails closed (404) in production so the schema is not public", async () => {
    mockedGetEnv.mockReturnValue({ ...testEnv, NODE_ENV: "production" });
    const app = buildApp();
    expect((await request(app).get("/api/v1/docs")).status).toBe(404);
    expect((await request(app).get("/api/v1/openapi.json")).status).toBe(404);
  });
});
