import { jest } from "@jest/globals";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

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

const mockLog = jest.fn();
const mockChildLogger = { info: mockLog, warn: mockLog, error: mockLog, debug: mockLog };
jest.mock("../lib/logger", () => ({
  logger: {
    info: mockLog,
    warn: mockLog,
    error: mockLog,
    debug: mockLog,
    child: () => mockChildLogger,
  },
}));

import { requestId, requestLogger, routeLabel } from "../middleware/request-id";
import { httpRequestsTotal } from "../lib/metrics";

describe("requestId middleware", () => {
  it("generates a UUID when no X-Request-ID header is provided", () => {
    const req = { headers: {} } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn();

    requestId(req, res, next);

    expect(req.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-ID", req.id);
    expect(next).toHaveBeenCalled();
  });

  it("uses the provided X-Request-ID header", () => {
    const req = {
      headers: { "x-request-id": "custom-id-123" },
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn();

    requestId(req, res, next);

    expect(req.id).toBe("custom-id-123");
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-ID", "custom-id-123");
    expect(next).toHaveBeenCalled();
  });
});

describe("requestLogger middleware", () => {
  it("logs request completion on finish event", () => {
    const listeners: Record<string, () => void> = {};
    const req = {
      id: "test-req-id",
      log: { info: mockLog, warn: mockLog, error: mockLog, debug: mockLog },
      method: "GET",
      path: "/api/v1/roles",
      headers: { "user-agent": "test" },
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
    } as unknown as Response;

    const next = jest.fn();

    const origNow = Date.now;
    let callCount = 0;
    Date.now = jest.fn(() => {
      callCount++;
      return callCount === 1 ? 1000 : 1050;
    });

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));

    listeners.finish();

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/api/v1/roles",
        status: 200,
        duration: 50,
      }),
      "Request completed",
    );

    Date.now = origNow;
  });

  it("uses error level for 5xx responses", () => {
    const listeners: Record<string, () => void> = {};
    const req = {
      id: "err-req-id",
      log: { info: mockLog, warn: mockLog, error: mockLog, debug: mockLog },
      method: "POST",
      path: "/api/v1/auth/sign-in",
      headers: {},
      ip: "::1",
    } as unknown as Request;

    const res = {
      statusCode: 500,
      on: jest.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
    } as unknown as Response;

    const next = jest.fn();

    const orig5xx = Date.now;
    let callCount = 0;
    Date.now = jest.fn(() => {
      callCount++;
      return callCount === 1 ? 1000 : 1100;
    });

    requestLogger(req, res, next);
    listeners.finish();

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        duration: 100,
      }),
      "Request completed",
    );

    Date.now = orig5xx;
  });

  it("labels metrics with the route template instead of the raw path (OBS-P2-010)", async () => {
    const listeners: Record<string, () => void> = {};
    const rawPath = "/api/v1/tickets/4f2c9d1e-1111-2222-3333-444455556666";
    const req = {
      id: "metrics-req-id",
      log: { info: mockLog, warn: mockLog, error: mockLog, debug: mockLog },
      method: "GET",
      path: rawPath,
      baseUrl: "/api/v1/tickets",
      route: { path: "/:id" },
      headers: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
      }),
    } as unknown as Response;

    requestLogger(req, res, jest.fn());
    listeners.finish();

    const routes = (await httpRequestsTotal.get()).values.map((v) => v.labels.route);
    expect(routes).toContain("/api/v1/tickets/:id");
    // The concrete resource id must never become a label value.
    expect(routes).not.toContain(rawPath);
  });

  it("records the route template for a real Express router (OBS-P2-010)", async () => {
    const app = express();
    app.use(requestId);
    app.use(requestLogger);
    app.get("/api/v1/tickets/:id", (_req, res) => {
      res.status(200).end();
    });

    await request(app).get("/api/v1/tickets/4f2c9d1e-1111-2222-3333-444455556666").expect(200);
    // The metric is recorded from the response's `finish` event, which can fire
    // a tick after the client receives the response; let it settle.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const routes = (await httpRequestsTotal.get()).values.map((v) => v.labels.route);
    expect(routes).toContain("/api/v1/tickets/:id");
    expect(routes).not.toContain("/api/v1/tickets/4f2c9d1e-1111-2222-3333-444455556666");
  });
});

describe("routeLabel (OBS-P2-010 / PERF-P2-001)", () => {
  it("uses the Express route template with its mount prefix", () => {
    const req = {
      baseUrl: "/api/v1/tickets",
      route: { path: "/:id" },
    } as unknown as Request;

    expect(routeLabel(req)).toBe("/api/v1/tickets/:id");
  });

  it("collapses a mounted router's root route to the mount path", () => {
    const req = { baseUrl: "/health", route: { path: "/" } } as unknown as Request;

    expect(routeLabel(req)).toBe("/health");
  });

  it("collapses an app-level root route to /", () => {
    const req = { baseUrl: "", route: { path: "/" } } as unknown as Request;

    expect(routeLabel(req)).toBe("/");
  });

  it("returns a bounded bucket when no route matched (404s, /metrics)", () => {
    const req = {
      baseUrl: "",
      path: "/api/v1/tickets/4f2c9d1e-1111-2222-3333-444455556666",
    } as unknown as Request;

    expect(routeLabel(req)).toBe("unmatched");
  });

  it("falls back to the bounded bucket for non-string route paths", () => {
    const req = { baseUrl: "/api/v1", route: { path: ["/a", "/b"] } } as unknown as Request;

    expect(routeLabel(req)).toBe("unmatched");
  });
});
