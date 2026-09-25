import {
  scheduledScans,
  initialScanDelayMs,
  offsetsAreDistinct,
  isScanConfigured,
  SCAN_INTERVAL_MS,
  SCAN_INTERVAL_6H_MS,
  SCAN_INTERVAL_DAILY_MS,
} from "../schedule-config";

describe("schedule-config", () => {
  it("lists all registered module scan tasks", () => {
    const names = scheduledScans.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "domain-monitor-check",
        "website-monitor-check",
        "vendor-contract-renewal-check",
        "patch-compliance-check",
        "license-optimizer-check",
        "backup-dr-check",
        "phishing-campaign-send",
        "status-maintenance-check",
        "dmarc-coach-check",
        "m365-hardening-scan",
        "endpoint-security-check",
        "saas-audit-scan",
        "qbr-scheduled-generate",
        "retention",
        "orphan-cleanup",
        "scheduled-notifications",
      ]),
    );
    expect(scheduledScans.length).toBe(17);
  });

  it("does not schedule the per-tenant integration syncs unattended", () => {
    const names = scheduledScans.map((s) => s.name);
    expect(names).not.toContain("jira-sync");
    expect(names).not.toContain("jsm-sync");
    expect(names).not.toContain("m365-calendar-sync");
  });

  it("honors the stagger offset in the initial boot delay", () => {
    const scan = scheduledScans[0];
    expect(initialScanDelayMs(scan)).toBe(scan.offsetMin * 60 * 1000);
    // offsetMin=3 => 180_000ms
    expect(initialScanDelayMs({ name: "x", intervalMs: SCAN_INTERVAL_MS, offsetMin: 3 })).toBe(
      180_000,
    );
  });

  it("uses distinct offsets so scans never collide on the same boot tick", () => {
    expect(offsetsAreDistinct()).toBe(true);
  });

  it("groups scans into hourly / 6h / daily intervals", () => {
    const hourly = scheduledScans.filter((s) => s.intervalMs === SCAN_INTERVAL_MS);
    const sixHourly = scheduledScans.filter((s) => s.intervalMs === SCAN_INTERVAL_6H_MS);
    const daily = scheduledScans.filter((s) => s.intervalMs === SCAN_INTERVAL_DAILY_MS);
    expect(hourly.length).toBeGreaterThan(0);
    expect(sixHourly.length).toBeGreaterThan(0);
    expect(daily.length).toBeGreaterThan(0);
  });

  it("schedules the task-due notification scan with its payload", () => {
    const scan = scheduledScans.find((s) => s.name === "scheduled-notifications");
    expect(scan?.payload).toEqual({ type: "task-due" });
  });

  describe("isScanConfigured", () => {
    it("treats a scan without env requirements as configured", () => {
      expect(isScanConfigured({ name: "x", intervalMs: 1, offsetMin: 0 }, {})).toBe(true);
    });

    it("skips a scan until every required env var is set", () => {
      const scan = { name: "x", intervalMs: 1, offsetMin: 0, requiresEnv: ["A", "B"] };
      expect(isScanConfigured(scan, {})).toBe(false);
      expect(isScanConfigured(scan, { A: "1" })).toBe(false);
      expect(isScanConfigured(scan, { A: "1", B: "2" })).toBe(true);
    });
  });
});
