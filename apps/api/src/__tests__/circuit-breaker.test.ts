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
