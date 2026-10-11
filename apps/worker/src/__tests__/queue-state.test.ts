import { getConsumerConnection, reportConsumerConnection } from "../queue-state";

describe("BullMQ consumer connection state (RES-P2-008)", () => {
  afterEach(() => {
    reportConsumerConnection(false);
  });

  it("starts disconnected", () => {
    expect(getConsumerConnection().connected).toBe(false);
  });

  it("reports connected after a ready event and clears any error", () => {
    reportConsumerConnection(false, "boom");

    reportConsumerConnection(true);

    expect(getConsumerConnection()).toEqual({ connected: true });
  });

  it("keeps the supplied reason while disconnected", () => {
    reportConsumerConnection(false, "Redis connection closed");

    expect(getConsumerConnection()).toEqual({
      connected: false,
      error: "Redis connection closed",
    });
  });
});
