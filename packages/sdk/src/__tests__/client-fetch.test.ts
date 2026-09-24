import { jest } from "@jest/globals";
import { ApiClient, ApiError } from "../client";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob(["x"])),
    headers: new Headers(),
    redirected: false,
    statusText: String(status),
    type: "basic" as ResponseType,
    url: "",
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
  } as Response;
}

describe("ApiClient getBlob / postFormData", () => {
  let mockFetch: jest.Mock;
  const base = { baseUrl: "https://api.test.com", retries: { initialDelayMs: 1 } };

  beforeEach(() => {
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  it("retries getBlob on a retryable status then returns the blob", async () => {
    jest.useRealTimers();
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(503, {
          success: false,
          error: { code: "UNAVAILABLE", message: "down", status: 503 },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}));

    const client = new ApiClient(base);
    const blob = await client.getBlob("/api/v1/documents/1/file");

    expect(blob).toBeInstanceOf(Blob);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("parses the structured error envelope for a non-retryable getBlob failure", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(404, {
        success: false,
        error: { code: "NOT_FOUND", message: "missing", status: 404 },
      }),
    );

    const client = new ApiClient(base);
    await expect(client.getBlob("/api/v1/documents/9/file")).rejects.toMatchObject({
      name: "ApiError",
      code: "NOT_FOUND",
      status: 404,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("sends CSRF and X-Active-Org headers on postFormData when unauthenticated", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: "1" } }));

    const client = new ApiClient({
      ...base,
      getToken: async () => null,
      getCsrfToken: () => "csrf-token-123",
      getActiveOrgId: () => "org-42",
    });

    const fd = new FormData();
    fd.append("file", "data");
    await client.postFormData("/api/v1/documents/upload", fd);

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["X-CSRF-Token"]).toBe("csrf-token-123");
    expect(headers["X-Active-Org"]).toBe("org-42");
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("throws ApiError rather than a generic error for a JSON error body", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(500, { success: false, error: { code: "BOOM", message: "x", status: 500 } }),
    );
    const client = new ApiClient(base);
    await expect(client.postFormData("/api/v1/x", new FormData())).rejects.toBeInstanceOf(ApiError);
  });
});
