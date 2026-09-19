import { HttpClient } from "../lib/http-client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns response on first success", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 5000, maxRetries: 3, retryDelay: 1 });
    const res = await client.get("https://example.test/ok");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on 5xx and returns the final response", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { error: "unavailable" }))
      .mockResolvedValueOnce(jsonResponse(503, { error: "unavailable" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 5000, maxRetries: 3, retryDelay: 1 });
    const res = await client.get("https://example.test/retry5xx");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries on 429 rate limit", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { error: "rate limited" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 5000, maxRetries: 2, retryDelay: 1 });
    const res = await client.get("https://example.test/ratelimit");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 4xx client errors", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(400, { error: "bad request" }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 5000, maxRetries: 3, retryDelay: 1 });
    const res = await client.get("https://example.test/badreq");
    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on network error", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 5000, maxRetries: 2, retryDelay: 1 });
    const res = await client.get("https://example.test/network");
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on timeout without retrying aborts", async () => {
    const abortError = new Error("The user aborted a request");
    abortError.name = "AbortError";
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    (global as { fetch: unknown }).fetch = fetchMock;

    const client = new HttpClient({ timeout: 1, maxRetries: 2, retryDelay: 1 });
    await expect(client.get("https://example.test/timeout")).rejects.toThrow(/timeout/i);
    // AbortError is not retried - only the first call happens before the throw
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
