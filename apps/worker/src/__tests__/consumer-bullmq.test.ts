import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { getConsumerConnection, reportConsumerConnection } from "../queue-state";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock("../task-registry", () => ({
  executeTask: jest.fn(),
}));
jest.mock("../env", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
    QUEUE_BACKEND: "bullmq",
    WORKER_CONCURRENCY: 2,
    WORKER_TIMEOUT: 30000,
  },
  resolveRedisUrl: (url: string) => url,
}));

// Capture the fake BullMQ Worker instances so tests can drive its events.
jest.mock("bullmq", () => {
  const registry: EventEmitter[] = [];
  (globalThis as unknown as { __fakeBullWorkers: EventEmitter[] }).__fakeBullWorkers = registry;
  class FakeWorker extends EventEmitter {
    close = jest.fn(async () => {});
    constructor(..._args: unknown[]) {
      super();
      registry.push(this);
    }
  }
  return { Worker: FakeWorker };
});

import { runBullMQWorker } from "../consumer-bullmq";

function fakeWorkers(): EventEmitter[] {
  return (globalThis as unknown as { __fakeBullWorkers: EventEmitter[] }).__fakeBullWorkers;
}

describe("BullMQ consumer connection tracking (RES-P2-008)", () => {
  beforeAll(() => {
    void runBullMQWorker();
  });

  beforeEach(() => {
    reportConsumerConnection(false);
  });

  it("starts disconnected until the connection is ready", () => {
    expect(fakeWorkers().length).toBeGreaterThan(0);
    expect(getConsumerConnection().connected).toBe(false);
  });

  it("reports connected after the ready event", () => {
    fakeWorkers()[0].emit("ready");

    expect(getConsumerConnection()).toEqual({ connected: true });
  });

  it("reports disconnected again after the connection closes", () => {
    fakeWorkers()[0].emit("ready");
    fakeWorkers()[0].emit("ioredis:close");

    expect(getConsumerConnection()).toEqual({
      connected: false,
      error: "Redis connection closed",
    });
  });

  it("surfaces the first connection error before ready", () => {
    fakeWorkers()[0].emit("error", new Error("connect ECONNREFUSED"));

    expect(getConsumerConnection()).toEqual({
      connected: false,
      error: "connect ECONNREFUSED",
    });
  });

  it("does not flip the state on a generic error after ready", () => {
    fakeWorkers()[0].emit("ready");
    fakeWorkers()[0].emit("error", new Error("script failed"));

    expect(getConsumerConnection()).toEqual({ connected: true });
  });
});
