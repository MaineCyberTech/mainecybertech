describe("summarizeBulkUpdate", () => {
  it("splits per-item successes and failures", async () => {
    const { summarizeBulkUpdate } = await import("@/lib/bulk-results");

    const summary = summarizeBulkUpdate(["a", "b", "c"], {
      results: [
        { id: "a", success: true },
        { id: "b", success: false, error: "Version conflict" },
        { id: "c", success: true },
      ],
      successful: 2,
      failed: 1,
    });

    expect(summary.succeeded).toEqual(["a", "c"]);
    expect(summary.failed).toEqual([{ id: "b", error: "Version conflict" }]);
  });

  it("reports requested ids missing from the response as failures", async () => {
    const { summarizeBulkUpdate } = await import("@/lib/bulk-results");

    const summary = summarizeBulkUpdate(["a", "b"], {
      results: [{ id: "a", success: true }],
      successful: 1,
      failed: 0,
    });

    expect(summary.succeeded).toEqual(["a"]);
    expect(summary.failed).toEqual([{ id: "b", error: "Not found or not accessible" }]);
  });

  it("fails closed when the response has no per-item results", async () => {
    const { summarizeBulkUpdate } = await import("@/lib/bulk-results");

    expect(() => summarizeBulkUpdate(["a"], { updated: 1 } as never)).toThrow(
      /per-item bulk results/i,
    );
    expect(() => summarizeBulkUpdate(["a"], undefined)).toThrow(/per-item bulk results/i);
  });
});
