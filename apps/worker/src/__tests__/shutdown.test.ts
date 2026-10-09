import { jest } from "@jest/globals";

jest.mock("../logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

/**
 * shutdown.ts keeps module-level state (shuttingDown, in-flight set, watchdog),
 * so each test loads a fresh copy via jest.isolateModules.
 */
function loadShutdown(): typeof import("../shutdown") {
  let mod: typeof import("../shutdown") | undefined;
  jest.isolateModules(() => {
    mod = require("../shutdown") as typeof import("../shutdown");
  });
  if (!mod) throw new Error("failed to load shutdown module");
  return mod;
}

describe("worker shutdown", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    delete process.env.WORKER_SHUTDOWN_TIMEOUT_MS;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("drains in-flight tasks and settles", async () => {
    const mod = loadShutdown();
    const settled = jest.fn();
    mod.trackInFlight(
      Promise.resolve().then(() => {
        settled();
      }),
    );

    await expect(mod.drainInFlight()).resolves.toBeUndefined();
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it("resolves even when an in-flight task rejects", async () => {
    const mod = loadShutdown();
    mod.trackInFlight(Promise.reject(new Error("boom")));

    await expect(mod.drainInFlight()).resolves.toBeUndefined();
  });

  it("arms a force-exit watchdog when shutdown starts [RES-P3-001]", () => {
    const mod = loadShutdown();
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);

    mod.markShuttingDown();
    expect(mod.isShuttingDown()).toBe(true);

    // Nothing happens before the budget elapses...
    expect(() => jest.advanceTimersByTime(29_999)).not.toThrow();
    // ...then the hung drain is killed with a non-zero exit.
    expect(() => jest.advanceTimersByTime(1)).toThrow("exit:1");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("honors WORKER_SHUTDOWN_TIMEOUT_MS", () => {
    process.env.WORKER_SHUTDOWN_TIMEOUT_MS = "5000";
    const mod = loadShutdown();
    jest.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as never);

    mod.markShuttingDown();
    expect(() => jest.advanceTimersByTime(4_999)).not.toThrow();
    expect(() => jest.advanceTimersByTime(1)).toThrow("exit:1");
  });
});
