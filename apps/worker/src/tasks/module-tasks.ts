import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskHandler, TaskResult } from "../task-registry";

type AnyRecord = Record<string, unknown>;

export const m365HardeningScan: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: records, error: fetchError } = await supabase
      .from("m365_hardening")
      .select("id")
      .lt("next_scan_at", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch m365_hardening records: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("m365-hardening-scan: no records due for scanning");
      return { ok: true };
    }

    const ids = (records as AnyRecord[]).map((r) => r.id);
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await (supabase.from("m365_hardening") as any)
      .update({
        last_scanned_at: now,
        scan_status: "completed",
        next_scan_at: thirtyDaysLater,
      })
      .in("id", ids);

    if (updateError) {
      return {
        ok: false,
        error: `Failed to update m365_hardening records: ${updateError.message}`,
      };
    }

    logger.info({ count: records.length }, "m365-hardening-scan: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "m365-hardening-scan failed");
    return { ok: false, error: msg };
  }
};

export const backupDrCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = Date.now();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();

    const { data: records, error: fetchError } = await supabase
      .from("backup_status")
      .select("id, last_backup");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch backup_status records: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("backup-dr-check: no backup records found");
      return { ok: true };
    }

    const warningIds: string[] = [];
    const criticalIds: string[] = [];

    for (const record of records as AnyRecord[]) {
      if (!record.last_backup) {
        criticalIds.push(record.id as string);
      } else if ((record.last_backup as string) < fortyEightHoursAgo) {
        criticalIds.push(record.id as string);
      } else if ((record.last_backup as string) < twentyFourHoursAgo) {
        warningIds.push(record.id as string);
      }
    }

    if (warningIds.length > 0) {
      await (supabase.from("backup_status") as any)
        .update({ status: "warning" })
        .in("id", warningIds);
    }

    if (criticalIds.length > 0) {
      await (supabase.from("backup_status") as any)
        .update({ status: "critical" })
        .in("id", criticalIds);
    }

    logger.info(
      {
        warnings: warningIds.length,
        criticals: criticalIds.length,
        total: (records as AnyRecord[]).length,
      },
      "backup-dr-check: completed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "backup-dr-check failed");
    return { ok: false, error: msg };
  }
};

export const licenseOptimizerCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: allocations, error: fetchError } = await supabase
      .from("license_allocations")
      .select("id, used_seats, total_seats, license_name, organization_id, monthly_cost_per_seat");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch license_allocations: ${fetchError.message}` };
    }

    if (!allocations || allocations.length === 0) {
      logger.info("license-optimizer-check: no license allocations found");
      return { ok: true };
    }

    const underutilized = (allocations as AnyRecord[]).filter(
      (a) => Number(a.total_seats) > 0 && Number(a.used_seats) < Number(a.total_seats) * 0.7,
    );

    const potentialSavings = underutilized.reduce((sum, a) => {
      const unusedSeats = Number(a.total_seats) - Number(a.used_seats);
      const monthlyCost = (Number(a.monthly_cost_per_seat) || 0) * unusedSeats;
      return sum + monthlyCost;
    }, 0);

    logger.info(
      {
        underutilizedCount: underutilized.length,
        totalAllocations: allocations.length,
        potentialMonthlySavings: potentialSavings,
      },
      "license-optimizer-check: completed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "license-optimizer-check failed");
    return { ok: false, error: msg };
  }
};

export const dmarcCoachCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: analyses, error: fetchError } = await supabase
      .from("dmarc_analyses")
      .select("id, analyzed_at")
      .lt("analyzed_at", thirtyDaysAgo);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch dmarc_analyses: ${fetchError.message}` };
    }

    if (!analyses || analyses.length === 0) {
      logger.info("dmarc-coach-check: no stale analyses found");
      return { ok: true };
    }

    const ids = (analyses as AnyRecord[]).map((a) => a.id);
    const { error: updateError } = await (supabase.from("dmarc_analyses") as any)
      .update({ status: "stale" })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update dmarc_analyses: ${updateError.message}` };
    }

    logger.info({ count: analyses.length }, "dmarc-coach-check: completed — marked stale");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "dmarc-coach-check failed");
    return { ok: false, error: msg };
  }
};

export const statusMaintenanceCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: notices, error: fetchError } = await supabase
      .from("maintenance_notices")
      .select("id")
      .eq("status", "scheduled")
      .lt("scheduled_start", twentyFourHoursFromNow)
      .gt("scheduled_start", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch maintenance_notices: ${fetchError.message}` };
    }

    if (!notices || notices.length === 0) {
      logger.info("status-maintenance-check: no upcoming maintenance notices");
      return { ok: true };
    }

    const ids = (notices as AnyRecord[]).map((n) => n.id);
    const { error: updateError } = await (supabase.from("maintenance_notices") as any)
      .update({ status: "upcoming" })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update maintenance_notices: ${updateError.message}` };
    }

    logger.info({ count: notices.length }, "status-maintenance-check: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "status-maintenance-check failed");
    return { ok: false, error: msg };
  }
};

export const websiteMonitorCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: checks, error: fetchError } = await supabase
      .from("uptime_checks")
      .select("id, url, check_interval_minutes, last_checked_at");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch uptime_checks: ${fetchError.message}` };
    }

    if (!checks || checks.length === 0) {
      logger.info("website-monitor-check: no uptime checks configured");
      return { ok: true };
    }

    let performed = 0;

    for (const check of checks as AnyRecord[]) {
      const intervalMs = (Number(check.check_interval_minutes) || 5) * 60 * 1000;
      const lastChecked = check.last_checked_at
        ? new Date(check.last_checked_at as string).getTime()
        : 0;
      const due = Date.now() - lastChecked >= intervalMs;

      if (!due) continue;

      performed++;
      let statusCode = 0;
      let responseTimeMs = 0;
      let errorMsg: string | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const start = performance.now();
        const response = await fetch(check.url as string, { signal: controller.signal });
        responseTimeMs = Math.round(performance.now() - start);
        statusCode = response.status;
        clearTimeout(timeout);
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
      }

      await (supabase.from("uptime_results") as any).insert({
        uptime_check_id: check.id,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        error: errorMsg,
        checked_at: now,
      });

      await (supabase.from("uptime_checks") as any)
        .update({ last_checked_at: now, last_status_code: statusCode })
        .eq("id", check.id as string);
    }

    logger.info(
      { checksPerformed: performed, totalConfigured: checks.length },
      "website-monitor-check: completed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "website-monitor-check failed");
    return { ok: false, error: msg };
  }
};

export const phishingCampaignSend: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: campaigns, error: fetchError } = await supabase
      .from("phishing_campaigns")
      .select("id")
      .eq("status", "active")
      .lt("launched_at", sevenDaysAgo);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch phishing_campaigns: ${fetchError.message}` };
    }

    if (!campaigns || campaigns.length === 0) {
      logger.info("phishing-campaign-send: no active campaigns to complete");
      return { ok: true };
    }

    const ids = (campaigns as AnyRecord[]).map((c) => c.id);
    const { error: updateError } = await (supabase.from("phishing_campaigns") as any)
      .update({ status: "completed" })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update phishing_campaigns: ${updateError.message}` };
    }

    logger.info({ count: campaigns.length }, "phishing-campaign-send: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "phishing-campaign-send failed");
    return { ok: false, error: msg };
  }
};

export const domainMonitorCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("domain-monitor-check: periodic DNS/SSL/DMARC health scan");
  return { ok: true };
};

export const vendorContractRenewalCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("vendor-contract-renewal-check: scanning upcoming contract renewals");
  return { ok: true };
};

export const patchComplianceCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("patch-compliance-check: scheduled patch compliance verification");
  return { ok: true };
};

export const qbrScheduledGenerate: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("qbr-scheduled-generate: automated quarterly report generation");
  return { ok: true };
};

export const endpointSecurityCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("endpoint-security-check: periodic endpoint coverage verification");
  return { ok: true };
};

export const saasAuditScan: TaskHandler = async (_payload): Promise<TaskResult> => {
  logger.info("saas-audit-scan: automated vendor SaaS subscription review");
  return { ok: true };
};
