import { track, getEventLog, clearEventLog } from "@/lib/catalog/analytics";
import { writeStoredConsent } from "@/lib/consent";

beforeEach(() => {
  clearEventLog();
});

describe("analytics service", () => {
  describe("track", () => {
    it("adds event to log", () => {
      track("store_view");
      const log = getEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].event).toBe("store_view");
    });

    it("accepts optional data payload", () => {
      track("product_cta_click", { productId: "mfa_setup_session" });
      const log = getEventLog();
      expect(log[0].event).toBe("product_cta_click");
      expect(log[0].productId).toBe("mfa_setup_session");
    });

    it("appends multiple events", () => {
      track("page_view");
      track("cta_click");
      track("form_submit");
      expect(getEventLog()).toHaveLength(3);
    });
  });

  describe("getEventLog", () => {
    it("returns copy of events array", () => {
      track("event_a");
      const log = getEventLog();
      expect(Array.isArray(log)).toBe(true);
      expect(log).toHaveLength(1);
      expect(log[0]).toHaveProperty("event");
    });

    it("does not mutate when original log is cleared", () => {
      track("event_a");
      const log = getEventLog();
      clearEventLog();
      expect(log).toHaveLength(1);
      expect(getEventLog()).toHaveLength(0);
    });
  });

  describe("clearEventLog", () => {
    it("clears all events", () => {
      track("store_view");
      track("quote_submit");
      expect(getEventLog()).toHaveLength(2);

      clearEventLog();
      expect(getEventLog()).toHaveLength(0);
    });
  });
});

describe("track transport [AN-P2-003]", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    // PRIV-P2-002: transport only runs for opted-in visitors.
    writeStoredConsent("granted");
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("sends nothing before analytics consent [PRIV-P2-002]", async () => {
    window.localStorage.clear();

    track("store_view");
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getEventLog().map((entry) => entry.event)).toContain("store_view");
  });

  it("posts the event with the double-submit CSRF header", async () => {
    document.cookie = "csrf_token=abc123; path=/";
    fetchMock.mockResolvedValue({ status: 200, ok: true });

    track("product_detail_view", { page: "/store/mfa" });
    await flush();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/analytics/track");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["X-CSRF-Token"]).toBe("abc123");
    expect(JSON.parse(String(init.body))).toMatchObject({
      event: "product_detail_view",
      page: "/store/mfa",
    });
  });

  it("bootstraps the CSRF cookie before the first post when none exists", async () => {
    fetchMock.mockResolvedValue({ status: 204, ok: true });

    track("store_view");
    await flush();

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toBe("/api/v1/analytics/csrf");
    expect(urls[1]).toBe("/api/v1/analytics/track");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("GET");
  });

  it("retries once after a 403 when the cookie was stale", async () => {
    document.cookie = "csrf_token=stale; path=/";
    fetchMock
      .mockResolvedValueOnce({ status: 403, ok: false })
      .mockResolvedValue({ status: 200, ok: true });

    track("quote_submit");
    await flush();

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls).toEqual([
      "/api/v1/analytics/track",
      "/api/v1/analytics/csrf",
      "/api/v1/analytics/track",
    ]);
  });

  it("never throws when the API is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(() => track("store_view")).not.toThrow();
    await flush();
  });
});
