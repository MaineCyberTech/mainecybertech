import { jest } from "@jest/globals";

const mockCookieGet = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: mockCookieGet,
  }),
}));

const mockCreate = jest.fn();
jest.mock("@mct/sdk", () => ({
  MCTClient: {
    create: mockCreate,
  },
}));

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

describe("getApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterAll(() => {
    if (ORIGINAL_API_URL) {
      process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
    }
  });

  it("creates client with default baseUrl", () => {
    const { getApiClient } = require("@/lib/api");
    getApiClient();

    expect(mockCreate).toHaveBeenCalledWith({
      baseUrl: "http://localhost:4000",
      getToken: expect.any(Function),
    });
  });

  it("creates client with custom baseUrl when env is set", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    const { getApiClient } = require("@/lib/api");
    getApiClient();

    expect(mockCreate).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com",
      getToken: expect.any(Function),
    });
  });

  it("getToken returns token from cookie", async () => {
    mockCookieGet.mockReturnValue({ value: "session-token-123" });
    const { getApiClient } = require("@/lib/api");
    getApiClient();

    const { getToken } = mockCreate.mock.calls[0][0];
    const token = await getToken();

    expect(token).toBe("session-token-123");
    expect(mockCookieGet).toHaveBeenCalledWith("mct_session");
  });

  it("getToken returns null when no cookie", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const { getApiClient } = require("@/lib/api");
    getApiClient();

    const { getToken } = mockCreate.mock.calls[0][0];
    const token = await getToken();

    expect(token).toBeNull();
  });
});
