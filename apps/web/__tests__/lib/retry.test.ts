import { withRetry } from "@/lib/retry";

describe("withRetry", () => {
  it("returns the resolved value without retrying on success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries a transient failure then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("boom"), { status: 500 }))
      .mockResolvedValue("recovered");
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows auth failures immediately without retrying", async () => {
    const err = Object.assign(new Error("unauthorized"), { status: 401 });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("also short-circuits on 403", async () => {
    const err = Object.assign(new Error("forbidden"), { status: 403 });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("short-circuits on any 4xx (e.g. 404) without retrying", async () => {
    const err = Object.assign(new Error("not found"), { status: 404 });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured attempts and throws the last error", async () => {
    const err = Object.assign(new Error("still down"), { status: 500 });
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
