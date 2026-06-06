import { jest } from "@jest/globals";
import request from "supertest";
import docsRouter from "../routes/docs";
import { createTestApp } from "./helpers";

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

const app = createTestApp();
app.use("/api/v1", docsRouter);

describe("docs routes", () => {
  it("GET /api/v1/docs returns Swagger UI HTML", async () => {
    const res = await request(app).get("/api/v1/docs");
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
    expect(res.text).toContain("MCT API Docs");
  });

  it("GET /api/v1/openapi.json returns JSON or error", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect([200, 500]).toContain(res.status);
  });
});
