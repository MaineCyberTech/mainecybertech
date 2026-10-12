import { CircuitBreaker } from "../lib/circuit-breaker";

describe("CircuitBreaker", () => {
  it("starts in closed state", () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
    expect(cb.getState().state).toBe("closed");
    expect(cb.isAvailable()).toBe(true);
  });

  it("opens after failureThreshold failures", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
    const failingOp = () => Promise.reject(new Error("fail"));

    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("closed");
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
    expect(cb.isAvailable()).toBe(false);
  });

  it("rejects immediately when open", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 1000,
    });
    const failingOp = () => Promise.reject(new Error("fail"));
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
    await expect(cb.execute(failingOp)).rejects.toThrow("Circuit breaker is OPEN");
  });

  it("transitions to half-open after timeout", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 50,
    });
    const failingOp = () => Promise.reject(new Error("fail"));
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isAvailable()).toBe(true);
    expect(cb.getState().state).toBe("half-open");
  });

  it("closes after successThreshold successes in half-open", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 50,
    });
    const failingOp = () => Promise.reject(new Error("fail"));
    const successOp = () => Promise.resolve("ok");
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    await new Promise((r) => setTimeout(r, 60));
    await cb.execute(successOp);
    expect(cb.getState().state).toBe("half-open");
    await cb.execute(successOp);
    expect(cb.getState().state).toBe("closed");
  });

  it("re-opens on failure in half-open", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 50,
    });
    const failingOp = () => Promise.reject(new Error("fail"));
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isAvailable()).toBe(true);
    expect(cb.getState().state).toBe("half-open");
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
  });

  it("enforces timeout on slow operations", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 50,
    });
    const slowOp = () => new Promise<string>((r) => setTimeout(() => r("too late"), 100));
    await expect(cb.execute(slowOp)).rejects.toThrow("Circuit breaker timeout");
    expect(cb.getState().state).toBe("open");
  });

  // RES-P3-007: the deadline timer used to stay pending after the call settled
  // (one leaked timer per Supabase call) and the timed-out operation kept
  // running. These tests pin both halves of the fix.
  it("clears the deadline timer once the operation settles [RES-P3-007]", async () => {
    jest.useFakeTimers();
    try {
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 30_000,
      });
      await expect(cb.execute(() => Promise.resolve("ok"))).resolves.toBe("ok");
      expect(jest.getTimerCount()).toBe(0);

      await expect(cb.execute(() => Promise.reject(new Error("fail")))).rejects.toThrow("fail");
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("aborts the timed-out operation's signal [RES-P3-007]", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 20,
    });
    let observed: AbortSignal | undefined;
    const op = (signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        observed = signal;
        signal.addEventListener("abort", () => reject(new Error("aborted")));
      });

    await expect(cb.execute(op)).rejects.toThrow("Circuit breaker timeout");
    expect(observed?.aborted).toBe(true);
  });

  it("passes an unaborted signal to operations that settle in time [RES-P3-007]", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 1000,
    });
    let observed: AbortSignal | undefined;
    const result = await cb.execute((signal) => {
      observed = signal;
      return Promise.resolve("ok");
    });

    expect(result).toBe("ok");
    expect(observed?.aborted).toBe(false);
  });

  it("tracks stats correctly", () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
    });
    const stats = cb.getState();
    expect(stats).toHaveProperty("state");
    expect(stats).toHaveProperty("failures");
    expect(stats).toHaveProperty("successes");
    expect(stats).toHaveProperty("lastFailure");
    expect(stats).toHaveProperty("lastSuccess");
    expect(stats).toHaveProperty("nextAttempt");
  });

  it("resets to closed state", async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 2,
      timeout: 1000,
    });
    const failingOp = () => Promise.reject(new Error("fail"));
    await expect(cb.execute(failingOp)).rejects.toThrow("fail");
    expect(cb.getState().state).toBe("open");
    cb.reset();
    expect(cb.getState().state).toBe("closed");
    expect(cb.isAvailable()).toBe(true);
  });
});
