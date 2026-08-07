import {
  scheduledScans,
  initialScanDelayMs,
  offsetsAreDistinct,
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
      ]),
    );
    expect(scheduledScans.length).toBe(15);
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
});
