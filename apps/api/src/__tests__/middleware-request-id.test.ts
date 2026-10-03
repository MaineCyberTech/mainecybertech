import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";

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

import { requestId, requestLogger } from "../middleware/request-id";

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
});
