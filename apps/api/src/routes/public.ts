import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { getEnv } from "../config/env";
import { logAuditEvent } from "../services/audit";
import { logger } from "../lib/logger";
import { httpClients } from "../lib/http-client";
import { isBotUserAgent, shouldSendVisitorAlert } from "../lib/bot-detection";

const router: ReturnType<typeof Router> = Router();

// AN-P2-005: HTTPS by default. The ip-api.com free tier is HTTP-only, so
// operators must opt in to a plaintext provider explicitly (or use a licensed
// HTTPS endpoint) via GEO_LOOKUP_URL.
const DEFAULT_GEO_LOOKUP_URL = "https://ip-api.com/json/";

async function lookupVisitorLocation(ipAddress: string): Promise<string> {
  try {
    const cleanIp = ipAddress.replace("::ffff:", "");
    const baseUrl = getEnv().GEO_LOOKUP_URL ?? DEFAULT_GEO_LOOKUP_URL;
    const geoRes = await httpClients.geo.get(
      `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${cleanIp}`,
    );
    const geoData: {
      status: string;
      city?: string | null;
      regionName?: string | null;
      country?: string | null;
    } = await geoRes.json();
    if (geoData.status === "success") {
      return `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
    }
  } catch {
    // Geo lookup failure is non-critical
  }
  return "Unknown";
}

const submitSchema = z.object({
  trackingId: z.string().uuid(),
  company: z.string().min(1).max(150),
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  phone: z.string().min(1).max(50),
  services: z.string().min(1).max(100),
  employees: z.string().min(1).max(50),
  urgency: z.string().min(1).max(50),
  message: z.string().min(1).max(5000),
  captchaToken: z.string().min(1).max(10000).optional(),
  // PRIV-P2-001: the form's consent checkbox is persisted server-side on the
  // interaction row instead of living only in the browser.
  consent: z.boolean().optional(),
});

async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const secret = getEnv().TURNSTILE_SECRET_KEY;
    // SEC-P2-002: fail closed. Production refuses to boot without a secret
    // (see assertProductionTurnstile), but guard direct/legacy callers rather
    // than treating an unconfigured secret as a verified token.
    if (!secret) return false;
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      // RES-P2-004: bound the call; the catch below fails closed on timeout.
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

router.get("/init", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const env = getEnv();
    const interactionId = crypto.randomUUID();
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const platform = (req.headers["sec-ch-ua-platform"] as string) || "Unknown";
    const referrer = req.headers["referer"] || "Direct";

    // Crawlers, preview bots, uptime monitors and scanners hit this public
    // endpoint constantly; do not treat them as human visitors.
    const isBot = isBotUserAgent(userAgent);

    // PRIV-P2-001 / AN-P2-005: default-deny. The interaction row is created so
    // the contact forms have a tracking ID, but IP/user-agent/geolocation are
    // only captured — and the third-party geo lookup only called — after the
    // visitor has explicitly opted in. The web app appends `consent=granted`
    // once a stored choice exists.
    const consentGranted = req.query.consent === "granted";
    const location = consentGranted && !isBot ? await lookupVisitorLocation(ipAddress) : "Unknown";

    const { error } = await supabase.from("public_interactions").insert({
      id: interactionId,
      ip_address: consentGranted ? ipAddress : null,
      location,
      user_agent: consentGranted ? userAgent : null,
      platform,
      referrer,
      is_bot: isBot,
      consent_at: consentGranted ? new Date().toISOString() : null,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    // AN-P2-005: the visitor alert is a third-party call, so it is part of the
    // consent gate — nothing leaves the server for a visitor who has not opted
    // in. The alert never contains the IP address.
    if (
      env.PUBLIC_TRAFFIC_WEBHOOK_URL &&
      consentGranted &&
      !isBot &&
      shouldSendVisitorAlert(ipAddress)
    ) {
      const visitorCard = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              type: "AdaptiveCard",
              version: "1.4",
              body: [
                {
                  type: "TextBlock",
                  text: `👀 **New Website Visitor** 👀\n\n**Location:** ${location}\n**Platform:** ${platform.replace(/"/g, "")}\n**Referrer:** ${referrer}`,
                  wrap: true,
                },
              ],
            },
          },
        ],
      };

      httpClients.teams
        .post(env.PUBLIC_TRAFFIC_WEBHOOK_URL, visitorCard)
        .catch((err) => logger.error({ err }, "Failed to send traffic webhook"));
    } else if (!env.PUBLIC_TRAFFIC_WEBHOOK_URL) {
      logger.warn("PUBLIC_TRAFFIC_WEBHOOK_URL not set — skipping visitor webhook");
    }

    res.json(success({ trackingId: interactionId }));
  } catch (error) {
    next(error);
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    const parsed = submitSchema.parse(req.body);
    const env = getEnv();

    // SEC-P2-002: Turnstile is mandatory in production (env validation refuses
    // to boot without TURNSTILE_SECRET_KEY). When configured anywhere, a
    // verified token is required. Previously the check was skipped whenever the
    // token was absent, so an attacker could bypass it by omitting the field.
    if (env.TURNSTILE_SECRET_KEY || env.NODE_ENV === "production") {
      if (!parsed.captchaToken) {
        throw new AppError("CAPTCHA_REQUIRED", "CAPTCHA verification is required.", 400);
      }
      const valid = await verifyCaptcha(parsed.captchaToken);
      if (!valid) {
        throw new AppError("CAPTCHA_FAILED", "CAPTCHA verification failed. Please try again.", 400);
      }
    }

    const supabase = getSupabaseAdmin();

    const { data: record, error: fetchError } = await supabase
      .from("public_interactions")
      .select("*")
      .eq("id", parsed.trackingId)
      .single();

    if (fetchError || !record) {
      throw new AppError("NOT_FOUND", "Session expired. Please refresh the page.", 404);
    }

    // PRIV-P2-001 / AN-P2-005: the row is created before consent, so IP and
    // user-agent are captured here — at submit time — only when the visitor
    // has consented. The consent decision itself is persisted server-side.
    const consentGranted = parsed.consent === true;
    const submittedAt = new Date().toISOString();
    const effectiveIp =
      record.ip_address ?? (consentGranted ? req.ip || req.socket.remoteAddress || null : null);
    const effectiveUserAgent =
      record.user_agent ??
      (consentGranted ? (req.headers["user-agent"] as string) || null : null);
    const consentAt = consentGranted
      ? (record.consent_at ?? submittedAt)
      : (record.consent_at ?? null);

    const { error: updateError } = await supabase
      .from("public_interactions")
      .update({
        status: "submitted",
        company_name: parsed.company,
        client_name: parsed.name,
        client_email: parsed.email,
        client_phone: parsed.phone,
        services_requested: parsed.services,
        employees: parsed.employees,
        urgency: parsed.urgency,
        client_message: parsed.message,
        submitted_at: submittedAt,
        consent_at: consentAt,
        ip_address: effectiveIp,
        user_agent: effectiveUserAgent,
      })
      .eq("id", parsed.trackingId);

    if (updateError) throw new AppError("DB_ERROR", updateError.message, 500);

    if (env.PUBLIC_LEAD_WEBHOOK_URL) {
      const teamsMessage = `🚨 **NEW MSP LEAD: ${parsed.company}** 🚨\n\n**Service Interest:** ${parsed.services}\n**Urgency:** ${parsed.urgency}\n\n**Client Information**\n* **Contact:** ${parsed.name}\n* **Email:** ${parsed.email}\n* **Phone:** ${parsed.phone}\n* **Company:** ${parsed.company}\n* **Size:** ${parsed.employees} employees\n\n**Message:**\n${parsed.message}\n\n**Session Metadata**\n* **Location:** ${record.location}\n* **Platform:** ${record.platform ? record.platform.replace(/"/g, "") : "Unknown"}\n* **IP Address:** ${effectiveIp ?? "Unknown"}\n* **Referrer:** ${record.referrer}\n* **Tracking ID:** ${record.id}`;

      const leadCard = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              type: "AdaptiveCard",
              version: "1.4",
              body: [{ type: "TextBlock", text: teamsMessage, wrap: true }],
            },
          },
        ],
      };

      httpClients.teams
        .post(env.PUBLIC_LEAD_WEBHOOK_URL, leadCard)
        .catch((err) => logger.error({ err }, "Failed to send lead webhook"));
    } else {
      logger.warn("PUBLIC_LEAD_WEBHOOK_URL not set — skipping lead webhook");
    }

    if (env.JSM_DOMAIN && env.JSM_API_TOKEN) {
      const authHeader =
        "Basic " + Buffer.from(`${env.JSM_EMAIL}:${env.JSM_API_TOKEN}`).toString("base64");

      const ticketDescription = `*A new client request was submitted via the website.*

h3. Request Details
*Service Interest:* ${parsed.services}
*Message:* ${parsed.message}

h3. Client Information
*Company:* ${parsed.company}
*Contact:* ${parsed.name}
*Email:* ${parsed.email}
*Phone:* ${parsed.phone}
*Employees:* ${parsed.employees}
*Urgency:* ${parsed.urgency}

h3. Captured Session Metadata
|| Property || Value ||
| *IP Address* | ${effectiveIp ?? "Unknown"} |
| *Location* | ${record.location} |
| *Platform* | ${record.platform ? record.platform.replace(/"/g, "") : "Unknown"} |
| *Referrer* | ${record.referrer} |
| *Session ID* | ${record.id} |
| *User Agent* | ${effectiveUserAgent ?? "Unknown"} |`;

      httpClients.jsm
        .post(
          `https://${env.JSM_DOMAIN}/rest/servicedeskapi/request`,
          {
            serviceDeskId: env.JSM_SERVICEDESK_ID,
            requestTypeId: env.JSM_REQUEST_TYPE_ID,
            requestFieldValues: {
              summary: `Web Lead: ${parsed.company} - ${parsed.services}`,
              description: ticketDescription,
            },
          },
          {
            headers: {
              Authorization: authHeader,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        )
        .then(async (res) => {
          if (!res.ok) {
            logger.error(
              {
                status: res.status,
                body: await res.text().catch(() => "unreadable"),
              },
              "JSM ticket creation failed",
            );
          }
        })
        .catch((err) => logger.error({ err }, "Failed to reach JSM API"));
    } else {
      logger.warn("JSM_DOMAIN or JSM_API_TOKEN not set — skipping ticket creation");
    }

    await logAuditEvent({
      action: "public.lead.submit",
      entityType: "public_interaction",
      entityId: parsed.trackingId,
      metadata: {
        company: parsed.company,
        name: parsed.name,
        email: parsed.email,
        services: parsed.services,
      },
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

const MAX_CSP_REPORTS = 10;
const MAX_CSP_FIELD_LENGTH = 200;

const cspReportSchema = z
  .object({
    "document-uri": z.string().optional(),
    documentURL: z.string().optional(),
    "violated-directive": z.string().optional(),
    violatedDirective: z.string().optional(),
    "effective-directive": z.string().optional(),
    effectiveDirective: z.string().optional(),
    "blocked-uri": z.string().optional(),
    blockedURL: z.string().optional(),
    "source-file": z.string().optional(),
    sourceFile: z.string().optional(),
    "line-number": z.union([z.number(), z.string()]).optional(),
    lineNumber: z.union([z.number(), z.string()]).optional(),
    "script-sample": z.string().optional(),
    sample: z.string().optional(),
  })
  .passthrough();

function truncateCspField(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.length > MAX_CSP_FIELD_LENGTH ? value.slice(0, MAX_CSP_FIELD_LENGTH) : value;
}

/**
 * Reduce a browser CSP report to a small allow-list of fields. Everything else
 * (headers, cookies, arbitrary report extensions) is dropped before logging.
 */
function sanitizeCspReport(report: unknown): Record<string, string | number> | null {
  const parsed = cspReportSchema.safeParse(report);
  if (!parsed.success) return null;
  const raw = parsed.data;
  const sanitized: Record<string, string | number> = {};

  const documentUri = truncateCspField(raw["document-uri"] ?? raw.documentURL);
  if (documentUri) sanitized["document-uri"] = documentUri;

  const directive = truncateCspField(
    raw["effective-directive"] ??
      raw.effectiveDirective ??
      raw["violated-directive"] ??
      raw.violatedDirective,
  );
  if (directive) sanitized.directive = directive;

  const blockedUri = truncateCspField(raw["blocked-uri"] ?? raw.blockedURL);
  if (blockedUri) sanitized["blocked-uri"] = blockedUri;

  const sourceFile = truncateCspField(raw["source-file"] ?? raw.sourceFile);
  if (sourceFile) sanitized["source-file"] = sourceFile;

  const lineNumber = raw["line-number"] ?? raw.lineNumber;
  if (typeof lineNumber === "number" && Number.isFinite(lineNumber)) {
    sanitized["line-number"] = lineNumber;
  } else {
    const limited = truncateCspField(lineNumber);
    if (limited) sanitized["line-number"] = limited;
  }

  const sample = truncateCspField(raw["script-sample"] ?? raw.sample);
  if (sample) sanitized["script-sample"] = sample;

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

/**
 * Accept both wire formats: a legacy `{ "csp-report": {...} }` envelope or an
 * array of Reporting API `{ type, body }` entries. Capped so one request can
 * never flood the logs.
 */
function extractCspReports(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    const reports: unknown[] = [];
    for (const entry of body) {
      if (reports.length >= MAX_CSP_REPORTS) break;
      if (!entry || typeof entry !== "object") continue;
      const { type, body: reportBody } = entry as { type?: unknown; body?: unknown };
      if (typeof type === "string" && type !== "csp-violation") continue;
      reports.push(reportBody);
    }
    return reports;
  }
  if (body && typeof body === "object" && "csp-report" in body) {
    return [(body as { "csp-report"?: unknown })["csp-report"]];
  }
  return [];
}

/**
 * Browser CSP violation reports. Unauthenticated by design (the global limiter
 * still applies); reports are logged and never persisted. Responses are always
 * 204 because browsers ignore anything they cannot read.
 */
router.post("/csp-report", (req, res) => {
  try {
    for (const report of extractCspReports(req.body)) {
      const sanitized = sanitizeCspReport(report);
      if (sanitized) logger.warn({ csp: sanitized }, "csp.violation");
    }
  } catch (error) {
    // Reports are best-effort telemetry; a malformed payload must not fail the
    // request.
    logger.debug({ err: error }, "csp.report.parse_failed");
  }
  res.status(204).end();
});

export default router;
