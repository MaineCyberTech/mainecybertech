import { jest } from "@jest/globals";
import { fetchPublicInit } from "@/lib/public-init";
import { writeStoredConsent } from "@/lib/consent";

describe("fetchPublicInit [PRIV-P2-001 / AN-P2-005]", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("does not signal consent before the visitor opts in", async () => {
    fetchMock.mockResolvedValue({ json: async () => ({ data: { trackingId: "track-1" } }) });

    await expect(fetchPublicInit()).resolves.toBe("track-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("consent=granted");
  });

  it("forwards a stored grant so the API may collect consent-gated data", async () => {
    writeStoredConsent("granted");
    fetchMock.mockResolvedValue({ json: async () => ({ data: { trackingId: "track-2" } }) });

    await expect(fetchPublicInit()).resolves.toBe("track-2");
    expect(String(fetchMock.mock.calls[0][0])).toContain("?consent=granted");
  });

  it("does not signal consent after a denial", async () => {
    writeStoredConsent("denied");
    fetchMock.mockResolvedValue({ json: async () => ({ data: { trackingId: "track-3" } }) });

    await fetchPublicInit();
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("consent=granted");
  });

  it("returns null instead of throwing when the API is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(fetchPublicInit()).resolves.toBeNull();
  });
});
