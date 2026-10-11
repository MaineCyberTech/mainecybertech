import {
  CONSENT_STORAGE_KEY,
  hasAnalyticsConsent,
  readStoredConsent,
  writeStoredConsent,
} from "@/lib/consent";

describe("consent storage [PRIV-P2-001]", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to no consent when nothing is stored", () => {
    expect(readStoredConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("persists and reads a granted choice", () => {
    const stored = writeStoredConsent("granted");
    expect(stored.analytics).toBe("granted");
    expect(hasAnalyticsConsent()).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(CONSENT_STORAGE_KEY) ?? "")).toMatchObject({
      version: 1,
      analytics: "granted",
    });
  });

  it("persists and reads a denied choice", () => {
    writeStoredConsent("denied");
    expect(readStoredConsent()?.analytics).toBe("denied");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("treats malformed or stale payloads as no consent", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");
    expect(readStoredConsent()).toBeNull();

    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 999, analytics: "granted" }),
    );
    expect(readStoredConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
