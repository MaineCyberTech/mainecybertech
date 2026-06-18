import { jest } from "@jest/globals";

// Mock @sentry/node before any test imports trigger its module resolution
// This prevents the opentelemetry "AlwaysOn" import error from bundled deps
jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn(),
  startSpan: jest.fn(),
  getCurrentHub: jest.fn(),
  Hub: jest.fn(),
  Scope: jest.fn(),
}));
