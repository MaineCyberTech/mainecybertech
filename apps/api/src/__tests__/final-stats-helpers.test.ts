import {
  computeSharepointSummary,
  computeBackupStats,
  computeBackupRisk,
  computeBudgetAnalysis,
  computeProcurementCompare,
  computeTimeEntriesSummary,
} from "../routes/final/stats-helpers";

describe("final stats helpers", () => {
  it("computes sharepoint structure summary", () => {
    const items = [
      { status: "planned", external_sharing: "enabled" },
      { status: "active", external_sharing: "disabled" },
      { status: "active", external_sharing: "enabled" },
    ];
    expect(computeSharepointSummary(items)).toEqual({
      totalPlans: 3,
      plannedSites: 1,
      activeSites: 2,
      teamsWithExternalSharing: 2,
    });
  });

  it("computes backup stats", () => {
    const items = [
      { last_backup_status: "failed", restore_test_result: "ok", offsite_replicated: true, encryption_enabled: true },
      { last_backup_status: "success", restore_test_result: null, offsite_replicated: false, encryption_enabled: false },
    ];
    expect(computeBackupStats(items)).toEqual({
      total: 2,
      failed: 1,
      untested: 1,
      offsiteReplicated: 1,
      encrypted: 1,
    });
  });

  it("computes backup risk with empty list", () => {
    expect(computeBackupRisk([])).toEqual({
      total: 0,
      failed: 0,
      untested: 0,
      riskScore: 0,
      riskLevel: "low",
    });
  });

  it("computes backup risk levels", () => {
    const ok = [{ last_backup_status: "success", status: "success", restore_tested_at: "2026-01-01" }];
    expect(computeBackupRisk(ok).riskLevel).toBe("low");
    const bad = [
      { last_backup_status: "failed", status: "success", restore_tested_at: null },
      { last_backup_status: "success", status: "failed", restore_tested_at: null },
    ];
    const r = computeBackupRisk(bad);
    expect(r.failed).toBe(2);
    expect(r.untested).toBe(2);
    expect(r.riskScore).toBe(167);
    expect(r.riskLevel).toBe("high");
  });

  it("computes budget analysis", () => {
    const items = [
      { category: "hardware", estimated_cost: 100 },
      { category: "software", estimated_cost: 200 },
    ];
    const r = computeBudgetAnalysis(items);
    expect(r.totalProjected).toBe(300);
    expect(r.totalActual).toBe(300);
    expect(r.variance).toBe(0);
    expect(r.totalCategories).toBe(2);
    expect(r.categories[0]).toEqual({ category: "hardware", projected: 100, actual: null, variance: 0 });
  });

  it("computes budget analysis variance for zero projected", () => {
    expect(computeBudgetAnalysis([]).variance).toBe(0);
  });

  it("computes procurement compare", () => {
    const quotes = [
      { id: "q1", vendor_name: "A", quote_amount: 1000 },
      { id: "q2", vendor_name: "B", quote_amount: 1200 },
      { id: "q3", vendor_name: "C", quote_amount: 900 },
    ];
    const r = computeProcurementCompare(quotes);
    expect(r.lowestPrice).toBe(900);
    expect(r.highestPrice).toBe(1200);
    expect(r.averagePrice).toBe(1033.33);
    const q1 = r.quotes.find((q) => q.id === "q1");
    expect(q1.isLowest).toBe(false);
    expect(q1.savings).toBe(17);
    const q3 = r.quotes.find((q) => q.id === "q3");
    expect(q3.isLowest).toBe(true);
    expect(q3.savings).toBe(25);
  });

  it("computes procurement compare with empty list", () => {
    const r = computeProcurementCompare([]);
    expect(r.lowestPrice).toBe(0);
    expect(r.highestPrice).toBe(0);
    expect(r.averagePrice).toBe(0);
  });

  it("computes time entries summary", () => {
    const items = [
      { work_date: "2026-07-01", hours: 2, billable: true },
      { work_date: "2026-07-01", hours: 1, billable: false },
      { work_date: "2026-07-02", hours: 4, billable: true },
    ];
    const r = computeTimeEntriesSummary(items, 30);
    expect(r.periodDays).toBe(30);
    expect(r.totalEntries).toBe(3);
    expect(r.totalHours).toBe(7);
    expect(r.billableHours).toBe(6);
    expect(r.nonBillableHours).toBe(1);
    expect(r.byDate["2026-07-01"]).toEqual({ hours: 3, billable: 2, entries: 2 });
    expect(r.byDate["2026-07-02"]).toEqual({ hours: 4, billable: 4, entries: 1 });
  });
});
