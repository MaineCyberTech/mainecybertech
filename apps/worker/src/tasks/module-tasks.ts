import { logger } from "../logger";
import { env } from "../env";
import { sendEmail } from "../email";
import { getSupabaseAdmin } from "../services/supabase";
import type { TablesInsert } from "@mct/sdk/database.types";
import { assertSafeUrl } from "../lib/ssrf-guard";
import type { TaskHandler, TaskResult } from "../task-registry";
import tls from "node:tls";

type Row = Record<string, unknown>;

/**
 * Read the TLS peer certificate for an https URL and return its expiry.
 * Returns null for non-https URLs, connection failures, or bad certs.
 */
async function fetchSslExpiry(
  url: string,
): Promise<{ expires: string; daysRemaining: number } | null> {
  let host: string;
  let port = 443;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    host = u.hostname;
    if (u.port) port = Number(u.port);
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    const socket = tls.connect({ host, port, servername: host, timeout: 8000 }, () => {
      try {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.valid_to) {
          socket.destroy();
          resolve(null);
          return;
        }
        const expires = new Date(cert.valid_to);
        if (Number.isNaN(expires.getTime())) {
          socket.destroy();
          resolve(null);
          return;
        }
        const daysRemaining = Math.floor((expires.getTime() - Date.now()) / 86_400_000);
        socket.destroy();
        resolve({ expires: expires.toISOString(), daysRemaining });
      } catch {
        socket.destroy();
        resolve(null);
      }
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(null);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Deterministic on-page audit: a 0-100 heuristic over signals the worker can
 * read itself (no headless Chrome). Not a Lighthouse score.
 */
export function auditPage(
  html: string,
  responseTimeMs: number,
): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 0;

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  if (title) score += 15;
  else issues.push("missing <title>");
  if (title.length >= 10 && title.length <= 60) score += 10;
  else if (title) issues.push("title length outside 10-60 chars");

  const metaDescription = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
  if (metaDescription) score += 15;
  else issues.push("missing meta description");

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) score += 10;
  else issues.push("missing viewport meta");

  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 1) score += 15;
  else issues.push(h1Count === 0 ? "missing <h1>" : "multiple <h1> elements");

  const imgTags = html.match(/<img[\s>][^>]*>/gi) ?? [];
  if (imgTags.length === 0) {
    score += 15;
  } else {
    const withAlt = imgTags.filter((t) => /\salt=["'][^"']+["']/i.test(t)).length;
    const ratio = withAlt / imgTags.length;
    score += Math.round(15 * ratio);
    if (ratio < 1) issues.push(`${imgTags.length - withAlt} image(s) missing alt text`);
  }

  if (responseTimeMs > 0 && responseTimeMs <= 1500) score += 10;
  else if (responseTimeMs > 1500) issues.push("slow response (>1.5s)");

  if (html.length <= 200_000) score += 10;
  else issues.push("large HTML payload");

  return { score: Math.max(0, Math.min(100, score)), issues };
}

/** Acquire an app-only Microsoft Graph token, or null when not configured. */
async function getGraphToken(): Promise<string | null> {
  const tenantId = env.M365_TENANT_ID;
  const clientId = env.M365_CLIENT_ID;
  const clientSecret = env.M365_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

async function graphGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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

    // Without Graph credentials there is nothing to scan; stamp the
    // assessment so the schedule keeps advancing.
    const token = await getGraphToken();
    if (!token) {
      logger.info(
        "m365-hardening-scan: Microsoft Graph not configured (M365_TENANT_ID/CLIENT_ID/CLIENT_SECRET); assessment only",
      );
      const { error: stampError } = await supabase
        .from("m365_hardening")
        .update({
          last_assessment_at: now,
          status: "healthy",
          next_review_at: thirtyDaysLater,
        })
        .in("id", ids);
      if (stampError) {
        return {
          ok: false,
          error: `Failed to update m365_hardening records: ${stampError.message}`,
        };
      }
      return { ok: true };
    }

    const [domains, users, guests, caPolicies, secDefaults] = await Promise.all([
      graphGet<{ value?: Array<{ name?: string; isVerified?: boolean; isDefault?: boolean }> }>(
        token,
        "/domains",
      ),
      graphGet<{ "@odata.count"?: number }>(token, "/users?$count=true&$top=1"),
      graphGet<{ "@odata.count"?: number }>(
        token,
        "/users?$filter=userType eq 'Guest'&$count=true&$top=1",
      ),
      graphGet<{ value?: unknown[] }>(token, "/identity/conditionalAccess/policies"),
      graphGet<{ isEnabled?: boolean }>(
        token,
        "/policies/identitySecurityDefaultsEnforcementPolicy",
      ),
    ]);

    const domainList = domains?.value ?? [];
    const verified = domainList.filter((d) => d.isVerified !== false && d.name);
    const tenantDomain = (verified.find((d) => d.isDefault) ?? verified[0])?.name ?? null;
    const caConfigured = (caPolicies?.value ?? []).length > 0;
    const securityDefaults = secDefaults?.isEnabled === true;
    const mfaEnforced = securityDefaults || caConfigured;

    const signals = [mfaEnforced, caConfigured, securityDefaults];
    const overallScore = Math.round((signals.filter(Boolean).length / signals.length) * 100);

    const { error: updateError } = await supabase
      .from("m365_hardening")
      .update({
        tenant_domain: tenantDomain,
        guest_count: guests?.["@odata.count"] ?? 0,
        conditional_access_configured: caConfigured,
        mfa_enforced: mfaEnforced,
        legacy_auth_blocked: securityDefaults,
        overall_score: overallScore,
        scan_status: "scanned",
        last_scanned_at: now,
        last_assessment_at: now,
        status: "healthy",
        next_scan_at: thirtyDaysLater,
        next_review_at: thirtyDaysLater,
      })
      .in("id", ids);

    if (updateError) {
      return {
        ok: false,
        error: `Failed to update m365_hardening records: ${updateError.message}`,
      };
    }

    logger.info(
      {
        count: ids.length,
        totalUsers: users?.["@odata.count"] ?? 0,
        guests: guests?.["@odata.count"] ?? 0,
        caConfigured,
        securityDefaults,
      },
      "m365-hardening-scan: completed",
    );
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
      await supabase.from("backup_status").update({ status: "warning" }).in("id", warningIds);
    }

    if (criticalIds.length > 0) {
      await supabase.from("backup_status").update({ status: "critical" }).in("id", criticalIds);
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

    // Notify org admins weekly about reclaimable seats.
    const savingsByOrg = new Map<string, { count: number; savings: number }>();
    for (const a of underutilized) {
      const orgId = String(a.organization_id ?? "");
      if (!orgId) continue;
      const entry = savingsByOrg.get(orgId) ?? { count: 0, savings: 0 };
      entry.count += 1;
      entry.savings +=
        (Number(a.cost_per_seat) || 0) * (Number(a.total_seats) - Number(a.used_seats));
      savingsByOrg.set(orgId, entry);
    }

    const adminsByOrg = await orgAdminIds(supabase, [...savingsByOrg.keys()]);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let notified = 0;
    for (const [orgId, entry] of savingsByOrg) {
      for (const userId of adminsByOrg.get(orgId) ?? []) {
        const { data: recent } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("module", "license-optimizer")
          .eq("module_id", orgId)
          .eq("action", "reclaimable-seats")
          .gte("created_at", weekAgo)
          .maybeSingle();
        if (recent) continue;

        await supabase.from("notifications").insert({
          user_id: userId,
          organization_id: orgId,
          title: "Reclaimable license seats",
          body: `${entry.count} license allocation(s) are under 70% used - about $${Math.round(entry.savings)}/month in unused seats.`,
          module: "license-optimizer",
          module_id: orgId,
          action: "reclaimable-seats",
        });
        notified++;
      }
    }

    logger.info(
      {
        underutilizedCount: underutilized.length,
        totalAllocations: allocations.length,
        potentialMonthlySavings: potentialSavings,
        notified,
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
    const { error: updateError } = await supabase
      .from("dmarc_analyses")
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
    const { error: updateError } = await supabase
      .from("maintenance_notices")
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

    for (const check of checks as Array<{
      id: string;
      url: string;
      check_interval_minutes: number;
      last_checked_at: string | null;
    }>) {
      const intervalMs = (Number(check.check_interval_minutes) || 5) * 60 * 1000;
      const lastChecked = check.last_checked_at ? new Date(check.last_checked_at).getTime() : 0;
      const due = Date.now() - lastChecked >= intervalMs;

      if (!due) continue;

      performed++;
      let statusCode = 0;
      let responseTimeMs = 0;
      let errorMsg: string | null = null;
      let ssl: { expires: string; daysRemaining: number } | null = null;

      // SSRF guard �?" uptime check URLs are user-supplied; never fetch
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
        ssl = await fetchSslExpiry(check.url);
      }

      await supabase.from("uptime_results").insert({
        check_id: check.id,
        response_status: statusCode,
        response_time_ms: responseTimeMs,
        error_message: errorMsg,
        is_up: statusCode >= 200 && statusCode < 400,
        checked_at: now,
        ssl_expiry_date: ssl?.expires ?? null,
        ssl_days_remaining: ssl?.daysRemaining ?? null,
      });

      await supabase
        .from("uptime_checks")
        .update({ last_checked_at: now, last_status_code: statusCode })
        .eq("id", check.id);
    }

    // Website monitors (availability + SSL snapshot for the
    // admin/portal "website monitors" views, which read this table).
    const { data: monitors } = await supabase
      .from("website_monitors")
      .select("id, url, check_interval_hours, last_checked_at");

    let monitorsChecked = 0;
    for (const mon of monitors ?? []) {
      const intervalMs = (Number(mon.check_interval_hours) || 24) * 60 * 60 * 1000;
      const lastChecked = mon.last_checked_at ? new Date(mon.last_checked_at).getTime() : 0;
      if (Date.now() - lastChecked < intervalMs) continue;

      const blocked = await assertSafeUrl(mon.url);
      let statusCode = 0;
      let responseTimeMs = 0;
      let ssl: { expires: string; daysRemaining: number } | null = null;
      let audit: { score: number; issues: string[] } | null = null;
      let pageBytes = 0;

      if (!blocked) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const start = performance.now();
          const response = await fetch(mon.url, { signal: controller.signal });
          responseTimeMs = Math.round(performance.now() - start);
          statusCode = response.status;
          if (statusCode >= 200 && statusCode < 400) {
            const html = await response.text();
            pageBytes = html.length;
            audit = auditPage(html, responseTimeMs);
          }
          clearTimeout(timeout);
        } catch {
          statusCode = 0;
        }
        ssl = await fetchSslExpiry(mon.url);
      }

      const up = statusCode >= 200 && statusCode < 400;
      await supabase
        .from("website_monitors")
        .update({
          last_status: up ? "up" : "down",
          last_response_ms: responseTimeMs,
          last_checked_at: now,
          next_check_at: new Date(Date.now() + intervalMs).toISOString(),
          ssl_valid: ssl ? ssl.daysRemaining >= 0 : false,
          ssl_expires: ssl?.expires ?? null,
          seo_score: audit?.score ?? null,
          last_page_bytes: pageBytes || null,
          seo_issues: (audit?.issues ?? []) as never,
        })
        .eq("id", mon.id);
      monitorsChecked++;
    }

    logger.info(
      { checksPerformed: performed, totalConfigured: checks.length, monitorsChecked },
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
      .select("id, campaign_name, organization_id, launched_at")
      .eq("status", "active");

    if (fetchError) {
      return { ok: false, error: `Failed to fetch phishing_campaigns: ${fetchError.message}` };
    }

    if (!campaigns || campaigns.length === 0) {
      logger.info("phishing-campaign-send: no active campaigns");
      return { ok: true };
    }

    // Send the simulation to pending targets of launched campaigns.
    let sent = 0;
    const toComplete: string[] = [];
    for (const campaign of campaigns as Array<{
      id: string;
      campaign_name: string;
      launched_at: string | null;
    }>) {
      if (!campaign.launched_at) continue;

      const { data: targets } = await supabase
        .from("phishing_targets")
        .select("id, email, name")
        .eq("campaign_id", campaign.id)
        .eq("status", "pending")
        .limit(200);

      for (const target of (targets ?? []) as Array<{
        id: string;
        email: string;
        name: string | null;
      }>) {
        const delivered = await sendEmail({
          to: target.email,
          subject: `Security awareness: ${campaign.campaign_name}`,
          text: `Hello ${target.name ?? "there"},\n\nThis is an internal security-awareness simulation run by your IT provider. No action is required.\n\nIf you receive a real message like this, verify the sender before clicking any links.`,
          html: `<p>Hello ${target.name ?? "there"},</p><p>This is an internal security-awareness simulation run by your IT provider. No action is required.</p><p>If you receive a real message like this, verify the sender before clicking any links.</p>`,
        });
        if (!delivered) continue;

        await supabase
          .from("phishing_targets")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", target.id);
        sent++;
      }

      if (campaign.launched_at < sevenDaysAgo) toComplete.push(campaign.id);
    }

    if (toComplete.length > 0) {
      const { error: updateError } = await supabase
        .from("phishing_campaigns")
        .update({ status: "completed" })
        .in("id", toComplete);
      if (updateError) {
        return { ok: false, error: `Failed to update phishing_campaigns: ${updateError.message}` };
      }
    }

    logger.info(
      { campaigns: campaigns.length, sent, completed: toComplete.length },
      "phishing-campaign-send: completed",
    );
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
      .select("id, domain, nameservers")
      .limit(200);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch domain_monitors: ${fetchError.message}` };
    }

    if (!records || records.length === 0) {
      logger.info("domain-monitor-check: no domains configured");
      return { ok: true };
    }

    let checked = 0;
    for (const record of records as Array<{
      id: string;
      domain: string;
      nameservers: unknown;
    }>) {
      const domain = String(record.domain || "").trim();
      if (!domain) continue;

      const result = await checkDomainDns(domain);
      const storedNs = Array.isArray(record.nameservers)
        ? (record.nameservers as string[]).map((n) => n.toLowerCase().replace(/\.$/, ""))
        : [];
      const resolvedNs = result.nameservers.map((n) => n.toLowerCase().replace(/\.$/, ""));
      const nameserverMismatch =
        storedNs.length > 0 &&
        resolvedNs.length > 0 &&
        !storedNs.every((n) => resolvedNs.includes(n));

      await supabase
        .from("domain_monitors")
        .update({
          spf_status: result.spf,
          dkim_status: result.dkim,
          dmarc_status: result.dmarc,
          dmarc_policy: result.dmarcPolicy,
          nameserver_mismatch: nameserverMismatch,
          ssl_valid: result.ssl ? result.ssl.daysRemaining >= 0 : false,
          ssl_expires: result.ssl?.expires ?? null,
          last_checked_at: now,
          next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", record.id);
      checked++;
    }

    logger.info({ count: records.length, checked }, "domain-monitor-check: completed");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "domain-monitor-check failed");
    return { ok: false, error: msg };
  }
};

/** Resolve DNS records through Cloudflare's DNS-over-HTTPS JSON API. */
async function resolveDns(name: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { Accept: "application/dns-json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { Answer?: Array<{ data: string }> };
    return (json.Answer ?? []).map((a) => String(a.data).replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "mail", "s1"];

/** Check SPF, DKIM, DMARC, nameservers and SSL for a domain. */
export async function checkDomainDns(
  domain: string,
  sslFn: (
    url: string,
  ) => Promise<{ expires: string; daysRemaining: number } | null> = fetchSslExpiry,
): Promise<{
  spf: string;
  dkim: string;
  dmarc: string;
  dmarcPolicy: string | null;
  nameservers: string[];
  ssl: { expires: string; daysRemaining: number } | null;
}> {
  const txt = await resolveDns(domain, "TXT");
  const spf = txt.some((t) => t.toLowerCase().startsWith("v=spf1")) ? "present" : "missing";

  const dmarcTxt = await resolveDns(`_dmarc.${domain}`, "TXT");
  const dmarcRecord = dmarcTxt.find((t) => t.toLowerCase().startsWith("v=dmarc1"));
  const dmarcPolicy = dmarcRecord?.match(/p=([a-z]+)/i)?.[1]?.toLowerCase() ?? null;

  let dkim = "missing";
  for (const selector of DKIM_SELECTORS) {
    const dkimTxt = await resolveDns(`${selector}._domainkey.${domain}`, "TXT");
    if (
      dkimTxt.some((t) => t.toLowerCase().includes("v=dkim1") || t.toLowerCase().includes("k=rsa"))
    ) {
      dkim = "present";
      break;
    }
  }

  const nameservers = await resolveDns(domain, "NS");
  const ssl = await sslFn(`https://${domain}`);

  return {
    spf,
    dkim,
    dmarc: dmarcRecord ? "present" : "missing",
    dmarcPolicy,
    nameservers,
    ssl,
  };
}

export const vendorContractRenewalCheck: TaskHandler = async (_payload): Promise<TaskResult> => {
  try {
    const supabase = getSupabaseAdmin();
    const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: contracts, error: fetchError } = await supabase
      .from("vendor_contracts")
      .select(
        "id, organization_id, vendor_name, service_name, renewal_date, auto_renews, renewal_notice_days, status, owner_user_id",
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

    // Notify the contract owner once per renewal (idempotent per contract).
    let notified = 0;
    for (const contract of contracts as Array<{
      id: string;
      organization_id: string;
      vendor_name: string;
      service_name: string;
      renewal_date: string | null;
      owner_user_id: string | null;
    }>) {
      if (!contract.owner_user_id) continue;

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", contract.owner_user_id)
        .eq("module", "vendor-contracts")
        .eq("module_id", contract.id)
        .eq("action", "renewal-due")
        .maybeSingle();
      if (existing) continue;

      await supabase.from("notifications").insert({
        user_id: contract.owner_user_id,
        organization_id: contract.organization_id,
        title: "Vendor contract renewal due",
        body: `${contract.vendor_name} / ${contract.service_name} renews on ${contract.renewal_date ?? "an upcoming date"}.`,
        module: "vendor-contracts",
        module_id: contract.id,
        action: "renewal-due",
      });
      notified++;
    }

    logger.info(
      {
        count: contracts.length,
        notified,
        upcoming: (contracts as Array<{ vendor_name: string; service_name: string }>).map(
          (c) => `${c.vendor_name}/${c.service_name}`,
        ),
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
    const { error: updateError } = await supabase
      .from("patch_compliance")
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
      .select("id, organization_id, title, period_start, period_end, status")
      .eq("status", "draft")
      .lte("period_end", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch qbr_reports: ${fetchError.message}` };
    }

    if (!reports || reports.length === 0) {
      logger.info("qbr-scheduled-generate: no pending draft reports");
      return { ok: true };
    }

    // Build the same report_data the manual POST /qbr/generate produces, so a
    // scheduled report is actually populated rather than just flipped.
    let generated = 0;
    for (const report of reports as Array<{
      id: string;
      organization_id: string;
      period_start: string | null;
      period_end: string | null;
    }>) {
      const orgId = report.organization_id;
      const [
        { count: ticketCount },
        { count: openTicketCount },
        { data: projects },
        { data: findings },
        { data: assets },
        { data: domainMonitors },
      ] = await Promise.all([
        supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .not("status", "in", '("resolved","closed","completed","cancelled")'),
        supabase
          .from("projects")
          .select("id, name, status, priority")
          .eq("organization_id", orgId)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("findings")
          .select("id, title, severity, status")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("assets")
          .select("id, name, asset_type, status, warranty_expires")
          .eq("organization_id", orgId)
          .order("warranty_expires", { ascending: true })
          .limit(100),
        supabase
          .from("domain_monitors")
          .select("id, domain, ssl_valid, spf_status, dkim_status, dmarc_status")
          .eq("organization_id", orgId),
      ]);

      const assetList = assets ?? [];
      const ninetyDays = new Date(Date.now() + 90 * 86_400_000);
      const expiringWarranties = assetList.filter((a) => {
        const we = a.warranty_expires;
        return Boolean(we) && new Date(we as string) <= ninetyDays;
      });
      const monitoringAlerts = (domainMonitors ?? []).filter(
        (d) =>
          d.ssl_valid === false ||
          d.spf_status === "missing" ||
          d.dkim_status === "missing" ||
          d.dmarc_status === "missing",
      );

      const findingSummary = { p0: 0, p1: 0, p2: 0, p3: 0, open: 0, resolved: 0 };
      for (const f of findings ?? []) {
        const sev = f.severity as keyof typeof findingSummary;
        if (sev in findingSummary) findingSummary[sev]++;
        if (f.status === "open" || f.status === "in_progress") findingSummary.open++;
        if (f.status === "resolved" || f.status === "verified") findingSummary.resolved++;
      }

      const reportData = {
        generatedAt: now,
        period: { start: report.period_start, end: report.period_end },
        tickets: { total: ticketCount ?? 0, open: openTicketCount ?? 0 },
        projects: {
          total: (projects ?? []).length,
          active: (projects ?? []).filter((p) => p.status === "active").length,
          recent: (projects ?? []).slice(0, 5),
        },
        findings: findingSummary,
        assets: {
          total: assetList.length,
          expiringWarranties: expiringWarranties.length,
          expiringItems: expiringWarranties.slice(0, 10).map((a) => ({
            id: a.id,
            name: a.name,
            expires: a.warranty_expires,
          })),
        },
        securityPosture: {
          monitoredDomains: (domainMonitors ?? []).length,
          alertCount: monitoringAlerts.length,
          alerts: monitoringAlerts.slice(0, 10),
        },
      };

      await supabase
        .from("qbr_reports")
        .update({ status: "generated", generated_at: now, report_data: reportData } as never)
        .eq("id", report.id);
      generated++;
    }

    logger.info({ count: reports.length, generated }, "qbr-scheduled-generate: completed");
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
    const { error: updateError } = await supabase
      .from("endpoint_security")
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

/** Map each organisation to the user ids of its admin/owner members. */
async function orgAdminIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orgIds: string[],
): Promise<Map<string, string[]>> {
  const adminsByOrg = new Map<string, string[]>();
  if (orgIds.length === 0) return adminsByOrg;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, organization_id, status, roles(key)")
    .in("organization_id", orgIds);

  const ADMIN_ROLE_HINTS = ["admin", "owner"];
  for (const m of (memberships ?? []) as Array<{
    user_id: string;
    organization_id: string;
    status: string;
    roles: unknown;
  }>) {
    if (m.status !== "approved" && m.status !== "active") continue;
    const role = Array.isArray(m.roles) ? m.roles[0] : m.roles;
    const key = String((role as { key?: string } | null)?.key ?? "");
    if (!ADMIN_ROLE_HINTS.some((h) => key.includes(h))) continue;
    const list = adminsByOrg.get(m.organization_id) ?? [];
    list.push(m.user_id);
    adminsByOrg.set(m.organization_id, list);
  }
  return adminsByOrg;
}

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

    // Notify each organisation's admins once a week about renewals coming up.
    const orgIds = [
      ...new Set((audits as Array<{ organization_id: string }>).map((a) => a.organization_id)),
    ];
    const adminsByOrg = await orgAdminIds(supabase, orgIds);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let notified = 0;
    for (const orgId of orgIds) {
      const recipients = adminsByOrg.get(orgId) ?? [];
      if (recipients.length === 0) continue;

      const orgAudits = (audits as Array<{ organization_id: string; vendor_name: string }>).filter(
        (a) => a.organization_id === orgId,
      );

      for (const userId of recipients) {
        const { data: recent } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("module", "saas-audit")
          .eq("module_id", orgId)
          .eq("action", "renewals-due")
          .gte("created_at", weekAgo)
          .maybeSingle();
        if (recent) continue;

        await supabase.from("notifications").insert({
          user_id: userId,
          organization_id: orgId,
          title: "SaaS renewals due soon",
          body: `${orgAudits.length} SaaS subscription(s) renew within 60 days.`,
          module: "saas-audit",
          module_id: orgId,
          action: "renewals-due",
        });
        notified++;
      }
    }

    logger.info(
      { count: audits.length, totalAnnualCost: totalAnnual, notified },
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

    await supabase.from("business_os_snapshots").insert({
      captured_at: new Date().toISOString(),
      metrics: {
        organizations: (orgs ?? []).length,
        approvedOrgs: approvedCount,
        openTickets: openTickets ?? 0,
        activeProjects: activeProjects ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
      } as never,
    });

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

    for (const ticket of tickets as Array<{
      id: string;
      organization_id: string;
      created_at: string;
      updated_at: string;
      status: string;
    }>) {
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

    const scheduled = (
      workflows as Array<{ id: string; trigger_type: string; name: string }>
    ).filter((w) => w.trigger_type !== "manual");

    if (scheduled.length === 0) {
      logger.info("automation-run-check: no scheduled workflows due");
      return { ok: true };
    }

    const ids = scheduled.map((w) => w.id);
    const { error: updateError } = await supabase
      .from("automation_workflows")
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
      .select("id, organization_id, request_subject, due_at, status, assigned_to, requested_by")
      .eq("status", "pending")
      .lt("due_at", now);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch approval_requests: ${fetchError.message}` };
    }

    if (!approvals || approvals.length === 0) {
      logger.info("approval-overdue-check: no overdue approvals");
      return { ok: true };
    }

    // Notify the approver once per overdue approval (idempotent via an
    // existing notifications row for the same approval + action).
    let notified = 0;
    for (const approval of approvals as Array<{
      id: string;
      organization_id: string;
      request_subject: string;
      assigned_to: string | null;
      requested_by: string | null;
    }>) {
      const recipient = approval.assigned_to ?? approval.requested_by;
      if (!recipient) continue;

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", recipient)
        .eq("module", "approvals")
        .eq("module_id", approval.id)
        .eq("action", "overdue")
        .maybeSingle();
      if (existing) continue;

      await supabase.from("notifications").insert({
        user_id: recipient,
        organization_id: approval.organization_id,
        title: "Approval overdue",
        body: `"${approval.request_subject}" is past its due date.`,
        module: "approvals",
        module_id: approval.id,
        action: "overdue",
      });
      notified++;
    }

    logger.info(
      {
        count: approvals.length,
        notified,
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
