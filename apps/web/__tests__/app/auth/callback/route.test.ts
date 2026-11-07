import { jest } from "@jest/globals";

const mockCookieSet = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({ url, cookies: { set: mockCookieSet } })),
  },
}));

jest.mock("@/lib/env", () => ({
  getClientEnv: () => ({ NEXT_PUBLIC_API_URL: "https://api.example.test" }),
}));

import { GET } from "@/app/auth/callback/route";

const fetchMock = jest.fn();
const originalFetch = globalThis.fetch;

function callbackRequest(query: string, cookie?: string) {
  return new Request(`https://app.example.com/auth/callback${query}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("GET /auth/callback (SEC-P3-017)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("forwards only the PKCE verifier cookie to the API", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { accessToken: "session-jwt" } }),
    });

    await GET(
      callbackRequest(
        "?code=code-1",
        "mct_session=session-secret; sb-test-auth-token-code-verifier=verifier-123; csrf_token=csrf-secret",
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { body?: string }];
    expect(url).toBe("https://api.example.test/api/v1/auth/callback");

    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      auth_code: "code-1",
      cookies: "sb-test-auth-token-code-verifier=verifier-123",
    });
    expect(JSON.stringify(body)).not.toContain("mct_session");
    expect(JSON.stringify(body)).not.toContain("csrf_token");
    expect(JSON.stringify(body)).not.toContain("session-secret");
  });

  it("does not send a cookies field when no verifier cookie is present", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { accessToken: "session-jwt" } }),
    });

    await GET(callbackRequest("?code=code-1", "mct_session=session-secret"));

    const [, init] = fetchMock.mock.calls[0] as [string, { body?: string }];
    expect(JSON.parse(String(init.body))).toEqual({ auth_code: "code-1" });
  });
});
