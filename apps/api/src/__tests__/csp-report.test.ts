import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import publicRouter from "../routes/public";
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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../lib/http-client", () => ({
  httpClients: {
    geo: { get: jest.fn() },
    teams: { post: jest.fn() },
    jsm: { post: jest.fn() },
  },
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { logger } from "../lib/logger";

const loggerWarn = logger.warn as unknown as jest.Mock;

// Mirror app.ts: the global JSON parser must accept CSP report content types.
const app = express();
app.use(
  express.json({
    type: ["application/json", "application/csp-report", "application/reports+json"],
  }),
);
app.use("/api/v1/public", publicRouter);
app.use(errorHandler);

function postCspReport(contentType: string, body: string) {
  return request(app).post("/api/v1/public/csp-report").set("Content-Type", contentType).send(body);
}

describe("POST /api/v1/public/csp-report", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a legacy application/csp-report envelope and logs the sanitized report", async () => {
    const res = await postCspReport(
      "application/csp-report",
      JSON.stringify({
        "csp-report": {
          "document-uri": "https://app.mainecybertech.com/portal",
          "violated-directive": "script-src-elem",
          "effective-directive": "script-src",
          "blocked-uri": "inline",
          "source-file": "https://app.mainecybertech.com/app.js",
          "line-number": 42,
          "script-sample": "alert(document.cookie)",
        },
      }),
    );

    expect(res.status).toBe(204);
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerWarn).toHaveBeenCalledWith(
      {
        csp: {
          "document-uri": "https://app.mainecybertech.com/portal",
          directive: "script-src",
          "blocked-uri": "inline",
          "source-file": "https://app.mainecybertech.com/app.js",
          "line-number": 42,
          "script-sample": "alert(document.cookie)",
        },
      },
      "csp.violation",
    );
  });

  it("accepts an application/reports+json array and logs one report per entry", async () => {
    const res = await postCspReport(
      "application/reports+json",
      JSON.stringify([
        {
          type: "csp-violation",
          body: {
            documentURL: "https://www.mainecybertech.com/",
            effectiveDirective: "img-src",
            blockedURL: "https://tracker.example/pixel.gif",
          },
        },
        {
          type: "csp-violation",
          body: { "document-uri": "https://www.mainecybertech.com/store" },
        },
      ]),
    );

    expect(res.status).toBe(204);
    expect(loggerWarn).toHaveBeenCalledTimes(2);
    expect(loggerWarn).toHaveBeenCalledWith(
      {
        csp: {
          "document-uri": "https://www.mainecybertech.com/",
          directive: "img-src",
          "blocked-uri": "https://tracker.example/pixel.gif",
        },
      },
      "csp.violation",
    );
  });

  it("returns 204 without logging for a malformed body", async () => {
    const res = await postCspReport(
      "application/csp-report",
      JSON.stringify({ unexpected: "shape" }),
    );

    expect(res.status).toBe(204);
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it("truncates long report fields to 200 characters", async () => {
    const res = await postCspReport(
      "application/csp-report",
      JSON.stringify({
        "csp-report": {
          "document-uri": "https://app.mainecybertech.com/",
          "script-sample": "x".repeat(500),
        },
      }),
    );

    expect(res.status).toBe(204);
    const [payload] = loggerWarn.mock.calls[0] as [{ csp: Record<string, string> }, unknown];
    expect(payload.csp["script-sample"]).toHaveLength(200);
  });

  it("caps a Reporting API batch at 10 reports", async () => {
    const batch = Array.from({ length: 25 }, (_, index) => ({
      type: "csp-violation",
      body: { "document-uri": `https://app.mainecybertech.com/${index}` },
    }));

    const res = await postCspReport("application/reports+json", JSON.stringify(batch));

    expect(res.status).toBe(204);
    expect(loggerWarn).toHaveBeenCalledTimes(10);
  });

  it("ignores Reporting API entries of other types", async () => {
    const res = await postCspReport(
      "application/reports+json",
      JSON.stringify([
        { type: "network-error", body: { "document-uri": "https://app.mainecybertech.com/" } },
      ]),
    );

    expect(res.status).toBe(204);
    expect(loggerWarn).not.toHaveBeenCalled();
  });

  it("serves unauthenticated requests", async () => {
    const res = await postCspReport(
      "application/csp-report",
      JSON.stringify({ "csp-report": { "document-uri": "https://app.mainecybertech.com/" } }),
    );

    expect(res.status).toBe(204);
    expect(loggerWarn).toHaveBeenCalledTimes(1);
  });
});
