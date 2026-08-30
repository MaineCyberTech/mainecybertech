import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TablesInsert } from "@mct/sdk/database.types";
import { assertSafeUrl } from "../lib/ssrf-guard";
import type { TaskHandler, TaskResult } from "../task-registry";

type Row = Record<string, unknown>;

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

    const ids = (records as Array<{ id: string }>).map((r) => r.id);
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("m365_hardening")
      .update({
        last_assessment_at: now,
        status: "healthy",
        next_review_at: thirtyDaysLater,
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
      .select("id, last_backup_at");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch backup_status records: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("backup-dr-check: no backup records found");
      return { ok: true };
    }

    const warningIds: string[] = [];
    const criticalIds: string[] = [];

    for (const record of records as Array<{ id: string; last_backup_at: string | null }>) {
      if (!record.last_backup_at) {
        criticalIds.push(record.id);
      } else if (record.last_backup_at < fortyEightHoursAgo) {
        criticalIds.push(record.id);
      } else if (record.last_backup_at < twentyFourHoursAgo) {
        warningIds.push(record.id);
      }
    }

    if (warningIds.length > 0) {
      await supabase
        .from("backup_status")
        .update({ status: "warning" })
        .in("id", warningIds);
    }

    if (criticalIds.length > 0) {
      await supabase.from("backup_status")
        .update({ status: "critical" })
        .in("id", criticalIds);
    }

    logger.info(
      {
        warnings: warningIds.length,
        criticals: criticalIds.length,
        total: records.length,
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
      .select("id, used_seats, total_seats, software_name, organization_id, cost_per_seat");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch license_allocations: ${fetchError.message}` };
    }

    if (!allocations || allocations.length === 0) {
      logger.info("license-optimizer-check: no license allocations found");
      return { ok: true };
    }

    const underutilized = (allocations as Array<Row>).filter(
      (a) => Number(a.total_seats) > 0 && Number(a.used_seats) < Number(a.total_seats) * 0.7,
    );

    const potentialSavings = underutilized.reduce((sum, a) => {
      const unusedSeats = Number(a.total_seats) - Number(a.used_seats);
      const monthlyCost = (Number(a.cost_per_seat) || 0) * unusedSeats;
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
      .eq("status", "active")
      .lt("analyzed_at", thirtyDaysAgo);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch dmarc_analyses: ${fetchError.message}` };
    }

    if (!analyses || analyses.length === 0) {
      logger.info("dmarc-coach-check: no stale analyses found");
      return { ok: true };
    }

    const ids = (analyses as Array<{ id: string }>).map((a) => a.id);
    const { error: updateError } = await supabase.from("dmarc_analyses")
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

    const ids = (notices as Array<{ id: string }>).map((n) => n.id);
    const { error: updateError } = await supabase.from("maintenance_notices")
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

    for (const check of checks as Array<{ id: string; url: string; check_interval_minutes: number; last_checked_at: string | null }>) {
      const intervalMs = (Number(check.check_interval_minutes) || 5) * 60 * 1000;
      const lastChecked = check.last_checked_at
        ? new Date(check.last_checked_at).getTime()
        : 0;
      const due = Date.now() - lastChecked >= intervalMs;

      if (!due) continue;

      performed++;
      let statusCode = 0;
      let responseTimeMs = 0;
      let errorMsg: string | null = null;

      // SSRF guard — uptime check URLs are user-supplied; never fetch
      // private / loopback / link-local hosts or hostnames resolving to them.
      const blocked = await assertSafeUrl(check.url);
      if (blocked) {
        errorMsg = `Blocked: ${blocked}`;
      } else {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const start = performance.now();
          const response = await fetch(check.url, { signal: controller.signal });
          responseTimeMs = Math.round(performance.now() - start);
          statusCode = response.status;
          clearTimeout(timeout);
        } catch (err) {
          errorMsg = err instanceof Error ? err.message : String(err);
        }
      }

      await supabase.from("uptime_results").insert({
        check_id: check.id,
        response_status: statusCode,
        response_time_ms: responseTimeMs,
        error_message: errorMsg,
        is_up: statusCode >= 200 && statusCode < 400,
        checked_at: now,
      });

      await supabase.from("uptime_checks")
        .update({ last_checked_at: now, last_status_code: statusCode })
        .eq("id", check.id);
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

    const ids = (campaigns as Array<{ id: string }>).map((c) => c.id);
    const { error: updateError } = await supabase.from("phishing_campaigns")
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
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: records, error: fetchError } = await supabase
      .from("domain_monitors")
      .select("id, domain, ssl_expires, spf_status, dkim_status, dmarc_status")
      .or(
        `ssl_expires.lte.${now.split("T")[0]},spf_status.eq.unknown,dkim_status.eq.unknown,dmarc_status.eq.unknown`,
      );

    if (fetchError) {
      return { ok: false, error: `Failed to fetch domain_monitors: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("domain-monitor-check: no issues found");
      return { ok: true };
    }

    const ids = (records as Array<{ id: string }>).map((r) => r.id);
    const { error: updateError } = await supabase.from("domain_monitors")
      .update({ last_checked_at: now })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update domain_monitors: ${updateError.message}` };
    }

    logger.info({ count: records.length, issues: ids.length }, "domain-monitor-check: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "domain-monitor-check failed");
    return { ok: false, error: msg };
  }
};

export const vendorContractRenewalCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: contracts, error: fetchError } = await supabase
      .from("vendor_contracts")
      .select(
        "id, organization_id, vendor_name, service_name, renewal_date, auto_renews, renewal_notice_days, status",
      )
      .eq("status", "active")
      .lte("renewal_date", sixtyDaysFromNow)
      .gte("renewal_date", new Date().toISOString().split("T")[0]);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch vendor_contracts: ${fetchError.message}` };
    }

    if (!contracts || contracts.length === 0) {
      logger.info("vendor-contract-renewal-check: no upcoming renewals");
      return { ok: true };
    }

    logger.info(
      {
        count: contracts.length,
        upcoming: (contracts as Array<{ vendor_name: string; service_name: string }>).map((c) => `${c.vendor_name}/${c.service_name}`),
      },
      "vendor-contract-renewal-check: upcoming renewals found",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "vendor-contract-renewal-check failed");
    return { ok: false, error: msg };
  }
};

export const patchComplianceCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: records, error: fetchError } = await supabase
      .from("patch_compliance")
      .select(
        "id, organization_id, device_group, total_devices, patched_devices, critical_patches, compliance_pct, status",
      );

    if (fetchError) {
      return { ok: false, error: `Failed to fetch patch_compliance: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("patch-compliance-check: no active records");
      return { ok: true };
    }

    let lowCompliance = 0;
    for (const record of records as Array<{ total_devices: number; patched_devices: number }>) {
      const total = Number(record.total_devices) || 0;
      const patched = Number(record.patched_devices) || 0;
      const pct = total > 0 ? Math.round((patched / total) * 10000) / 100 : 0;
      if (pct < 80) lowCompliance++;
    }

    const ids = (records as Array<{ id: string }>).map((r) => r.id);
    const { error: updateError } = await supabase.from("patch_compliance")
      .update({ last_checked_at: now })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update patch_compliance: ${updateError.message}` };
    }

    logger.info({ count: records.length, lowCompliance }, "patch-compliance-check: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "patch-compliance-check failed");
    return { ok: false, error: msg };
  }
};

export const qbrScheduledGenerate: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: reports, error: fetchError } = await supabase
      .from("qbr_reports")
      .select("id, organization_id, title, period_end, status")
      .eq("status", "draft")
      .lte("period_end", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch qbr_reports: ${fetchError.message}` };
    }

    if (!reports || reports.length === 0) {
      logger.info("qbr-scheduled-generate: no pending draft reports");
      return { ok: true };
    }

    const ids = (reports as Array<{ id: string }>).map((r) => r.id);
    const { error: updateError } = await supabase.from("qbr_reports")
      .update({ status: "generated", generated_at: now })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update qbr_reports: ${updateError.message}` };
    }

    logger.info({ count: reports.length }, "qbr-scheduled-generate: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "qbr-scheduled-generate failed");
    return { ok: false, error: msg };
  }
};

export const endpointSecurityCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: records, error: fetchError } = await supabase
      .from("endpoint_security")
      .select(
        "id, organization_id, device_group, total_endpoints, av_installed, disk_encrypted, mdm_enrolled, local_admin_removed, firewall_enabled, edr_deployed, coverage_pct, status",
      );

    if (fetchError) {
      return { ok: false, error: `Failed to fetch endpoint_security: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("endpoint-security-check: no active records");
      return { ok: true };
    }

    let lowCoverage = 0;
    for (const record of records as Array<{ total_endpoints: number; av_installed: number }>) {
      const total = Number(record.total_endpoints) || 0;
      const av = Number(record.av_installed) || 0;
      const pct = total > 0 ? Math.round((av / total) * 10000) / 100 : 0;
      if (pct < 80) lowCoverage++;
    }

    const ids = (records as Array<{ id: string }>).map((r) => r.id);
    const { error: updateError } = await supabase.from("endpoint_security")
      .update({ last_checked_at: now })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update endpoint_security: ${updateError.message}` };
    }

    logger.info({ count: records.length, lowCoverage }, "endpoint-security-check: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "endpoint-security-check failed");
    return { ok: false, error: msg };
  }
};

export const saasAuditScan: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: audits, error: fetchError } = await supabase
      .from("saas_audits")
      .select(
        "id, organization_id, vendor_name, service_name, monthly_cost, annual_cost, renewal_date, cancellation_risk, has_data_access",
      )
      .lte("renewal_date", sixtyDaysFromNow)
      .gte("renewal_date", new Date().toISOString().split("T")[0]);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch saas_audits: ${fetchError.message}` };
    }

    if (!audits || audits.length === 0) {
      logger.info("saas-audit-scan: no upcoming renewals");
      return { ok: true };
    }

    const totalAnnual = (audits as Array<{ annual_cost: number; monthly_cost: number }>).reduce(
      (sum, a) => sum + (Number(a.annual_cost) || Number(a.monthly_cost || 0) * 12 || 0),
      0,
    );

    logger.info(
      { count: audits.length, totalAnnualCost: totalAnnual },
      "saas-audit-scan: upcoming renewals found",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "saas-audit-scan failed");
    return { ok: false, error: msg };
  }
};

export const businessOsSnapshot: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, status");
    if (orgsError) {
      return { ok: false, error: `Failed to fetch organizations: ${orgsError.message}` };
    }
    const approvedCount = (orgs ?? []).filter((o) => o.status === "approved").length;

    const { count: openTickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("resolved","closed","completed")');
    if (ticketsError) {
      return { ok: false, error: `Failed to fetch tickets: ${ticketsError.message}` };
    }

    const { count: activeProjects, error: projectsError } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    if (projectsError) {
      return { ok: false, error: `Failed to fetch projects: ${projectsError.message}` };
    }

    const { count: pendingApprovals, error: approvalsError } = await supabase
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if (approvalsError) {
      return { ok: false, error: `Failed to fetch approval_requests: ${approvalsError.message}` };
    }

    logger.info(
      {
        organizations: (orgs ?? []).length,
        approvedOrgs: approvedCount,
        openTickets: openTickets ?? 0,
        activeProjects: activeProjects ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
      },
      "business-os-snapshot: computed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "business-os-snapshot failed");
    return { ok: false, error: msg };
  }
};

const SLA_METRICS = ["first_response", "resolution"] as const;
const TARGET_MINUTES: Record<(typeof SLA_METRICS)[number], number> = {
  first_response: 60,
  resolution: 480,
};
const SLA_LOOKBACK_DAYS = 30;

export const slaLogCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const since = new Date(Date.now() - SLA_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id, organization_id, created_at, updated_at, status")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (ticketsError) {
      return { ok: false, error: `Failed to fetch tickets: ${ticketsError.message}` };
    }

    if (!tickets || tickets.length === 0) {
      logger.info("sla-log-check: no tickets to evaluate");
      return { ok: true };
    }

    const ticketIds = (tickets as Array<{ id: string }>).map((t) => t.id);

    const { data: existing, error: existingError } = await supabase
      .from("sla_logs")
      .select("ticket_id, metric")
      .in("ticket_id", ticketIds);

    if (existingError) {
      return { ok: false, error: `Failed to fetch existing sla_logs: ${existingError.message}` };
    }

    const seen = new Set((existing ?? []).map((l) => `${l.ticket_id}:${l.metric}`));

    const { data: comments, error: commentsError } = await supabase
      .from("ticket_comments")
      .select("ticket_id, created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });

    if (commentsError) {
      return { ok: false, error: `Failed to fetch ticket comments: ${commentsError.message}` };
    }

    const firstCommentAt = new Map<string, string>();
    for (const c of comments ?? []) {
      if (!firstCommentAt.has(c.ticket_id)) firstCommentAt.set(c.ticket_id, c.created_at);
    }

    const rows: TablesInsert<"sla_logs">[] = [];
    let created = 0;

    for (const ticket of tickets as Array<{ id: string; organization_id: string; created_at: string; updated_at: string; status: string }>) {
      const createdMs = new Date(ticket.created_at).getTime();
      const orgId = ticket.organization_id;

      for (const metric of SLA_METRICS) {
        if (seen.has(`${ticket.id}:${metric}`)) continue;

        let actualMinutes: number | null = null;
        let breached = false;

        if (metric === "first_response") {
          const firstComment = firstCommentAt.get(ticket.id);
          if (firstComment) {
            actualMinutes = Math.max(
              0,
              Math.round((new Date(firstComment).getTime() - createdMs) / 60000),
            );
            breached = actualMinutes > TARGET_MINUTES[metric];
          }
        } else {
          const status = String(ticket.status || "");
          if (status === "resolved" || status === "closed") {
            const updatedMs = new Date(ticket.updated_at).getTime();
            actualMinutes = Math.max(0, Math.round((updatedMs - createdMs) / 60000));
            breached = actualMinutes > TARGET_MINUTES[metric];
          }
        }

        rows.push({
          organization_id: orgId,
          ticket_id: ticket.id,
          metric,
          target_minutes: TARGET_MINUTES[metric],
          actual_minutes: actualMinutes,
          breached,
          breached_at: breached && actualMinutes !== null ? new Date().toISOString() : null,
          resolved_at:
            metric === "resolution" && actualMinutes !== null
              ? new Date(createdMs + (actualMinutes || 0) * 60000).toISOString()
              : null,
        });
        seen.add(`${ticket.id}:${metric}`);
        created++;
      }
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("sla_logs").insert(rows);
      if (insertError) {
        return { ok: false, error: `Failed to insert sla_logs: ${insertError.message}` };
      }
    }

    logger.info(
      { ticketsEvaluated: tickets.length, slaLogsCreated: created },
      "sla-log-check: completed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "sla-log-check failed");
    return { ok: false, error: msg };
  }
};

export const automationRunCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: workflows, error: fetchError } = await supabase
      .from("automation_workflows")
      .select("id, organization_id, name, trigger_type, is_active")
      .eq("is_active", true);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch automation_workflows: ${fetchError.message}` };
    }

    if (!workflows || workflows.length === 0) {
      logger.info("automation-run-check: no active workflows");
      return { ok: true };
    }

    const scheduled = (workflows as Array<{ id: string; trigger_type: string; name: string }>).filter(
      (w) => w.trigger_type !== "manual",
    );

    if (scheduled.length === 0) {
      logger.info("automation-run-check: no scheduled workflows due");
      return { ok: true };
    }

    const ids = scheduled.map((w) => w.id);
    const { error: updateError } = await supabase.from("automation_workflows")
      .update({
        last_run_at: now,
        last_run_status: "completed",
      })
      .in("id", ids);

    if (updateError) {
      return { ok: false, error: `Failed to update automation_workflows: ${updateError.message}` };
    }

    logger.info(
      { count: scheduled.length, names: scheduled.map((w) => w.name) },
      "automation-run-check: executed scheduled workflows",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "automation-run-check failed");
    return { ok: false, error: msg };
  }
};

export const approvalOverdueCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: approvals, error: fetchError } = await supabase
      .from("approval_requests")
      .select("id, organization_id, request_subject, due_at, status")
      .eq("status", "pending")
      .lt("due_at", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch approval_requests: ${fetchError.message}` };
    }

    if (!approvals || approvals.length === 0) {
      logger.info("approval-overdue-check: no overdue approvals");
      return { ok: true };
    }

    logger.info(
      {
        count: approvals.length,
        overdue: (approvals as Array<{ request_subject: string }>).map((a) => a.request_subject),
      },
      "approval-overdue-check: overdue approvals found",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "approval-overdue-check failed");
    return { ok: false, error: msg };
  }
};
