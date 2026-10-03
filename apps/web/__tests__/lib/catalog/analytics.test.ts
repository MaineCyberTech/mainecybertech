import { track, getEventLog, clearEventLog } from "@/lib/catalog/analytics";

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
