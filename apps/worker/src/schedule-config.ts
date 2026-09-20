/**
 * Scheduled module-scan configuration.
 *
 * Each scan runs on a staggered `offsetMin` so scans don't all fire on the
 * same tick after a worker restart. The worker uses the interval for the
 * recurring tick and the offset for the initial boot run.
 */
export const SCAN_INTERVAL_MS = 60 * 60 * 1000; // hourly
export const SCAN_INTERVAL_6H_MS = 6 * 60 * 60 * 1000; // every 6 hours
export const SCAN_INTERVAL_DAILY_MS = 24 * 60 * 60 * 1000; // daily

export interface ScheduledScan {
  name: string;
  intervalMs: number;
  offsetMin: number;
  /**
   * Skip the scan unless every one of these env vars is set. Integration
   * syncs (Jira/JSM/M365) are only meaningful once an operator has supplied
   * credentials; without this gate the handler runs daily and logs a
   * "not configured" failure.
   */
  requiresEnv?: string[];
  /** Payload passed to the task handler (e.g. a discriminant). */
  payload?: Record<string, unknown>;
}

export const scheduledScans: ScheduledScan[] = [
  { name: "domain-monitor-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 3 },
  { name: "website-monitor-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 8 },
  { name: "vendor-contract-renewal-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 13 },
  { name: "patch-compliance-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 18 },
  { name: "license-optimizer-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 23 },
  { name: "backup-dr-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 28 },
  { name: "phishing-campaign-send", intervalMs: SCAN_INTERVAL_MS, offsetMin: 33 },
  { name: "status-maintenance-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 38 },
  { name: "dmarc-coach-check", intervalMs: SCAN_INTERVAL_MS, offsetMin: 43 },
  { name: "m365-hardening-scan", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 48 },
  { name: "endpoint-security-check", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 53 },
  { name: "saas-audit-scan", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 58 },
  { name: "qbr-scheduled-generate", intervalMs: SCAN_INTERVAL_DAILY_MS, offsetMin: 63 },
  { name: "retention", intervalMs: SCAN_INTERVAL_DAILY_MS, offsetMin: 70 },
  { name: "orphan-cleanup", intervalMs: SCAN_INTERVAL_6H_MS, offsetMin: 76 },
  {
    name: "jira-sync",
    intervalMs: SCAN_INTERVAL_DAILY_MS,
    offsetMin: 80,
    requiresEnv: ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"],
  },
  {
    name: "jsm-sync",
    intervalMs: SCAN_INTERVAL_DAILY_MS,
    offsetMin: 85,
    requiresEnv: ["JSM_BASE_URL", "JSM_EMAIL", "JSM_API_TOKEN"],
  },
  {
    name: "m365-calendar-sync",
    intervalMs: SCAN_INTERVAL_DAILY_MS,
    offsetMin: 90,
    requiresEnv: ["M365_TENANT_ID", "M365_CLIENT_ID", "M365_CLIENT_SECRET"],
  },
  {
    name: "scheduled-notifications",
    intervalMs: SCAN_INTERVAL_DAILY_MS,
    offsetMin: 95,
    payload: { type: "task-due" },
  },
];

/** True when the scan has no env requirements, or all of them are configured. */
export function isScanConfigured(
  scan: ScheduledScan,
  envVars: Record<string, string | undefined>,
): boolean {
  if (!scan.requiresEnv?.length) return true;
  return scan.requiresEnv.every((key) => Boolean(envVars[key]));
}

/** Initial boot delay for a scan (ms). Honors the stagger offset. */
export function initialScanDelayMs(scan: ScheduledScan): number {
  return scan.offsetMin * 60 * 1000;
}

/** Verify all offsets are distinct so scans never collide on the same boot tick. */
export function offsetsAreDistinct(scans: ScheduledScan[] = scheduledScans): boolean {
  const offsets = scans.map((s) => s.offsetMin);
  return new Set(offsets).size === offsets.length;
}
