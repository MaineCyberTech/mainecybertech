import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { getEnv } from "../config/env";
import { logAuditEvent } from "../services/audit";

const router: ReturnType<typeof Router> = Router();

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
});

router.get("/init", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const interactionId = crypto.randomUUID();
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const platform = (req.headers["sec-ch-ua-platform"] as string) || "Unknown";
    const referrer = req.headers["referer"] || "Direct";

    let location = "Unknown";
    try {
      const cleanIp = ipAddress.replace("::ffff:", "");
      const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}`);
      const geoData: any = await geoRes.json();
      if (geoData.status === "success") {
        location = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
      }
    } catch {
      // Geo lookup failure is non-critical
    }

    const { error } = await supabase.from("public_interactions").insert({
      id: interactionId,
      ip_address: ipAddress,
      location,
      user_agent: userAgent,
      platform,
      referrer,
    });

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const env = getEnv();
    if (env.PUBLIC_TRAFFIC_WEBHOOK_URL) {
      const visitorCard = {
        type: "message",
        attachments: [{
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [{
              type: "TextBlock",
              text: `👀 **New Website Visitor** 👀\n\n**Location:** ${location}\n**Platform:** ${platform.replace(/"/g, "")}\n**Referrer:** ${referrer}`,
              wrap: true,
            }],
          },
        }],
      };

      fetch(env.PUBLIC_TRAFFIC_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitorCard),
      }).catch(() => {});
    }

    res.json(success({ trackingId: interactionId }));
  } catch (error) {
    next(error);
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    const parsed = submitSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: record, error: fetchError } = await supabase
      .from("public_interactions")
      .select("*")
      .eq("id", parsed.trackingId)
      .single();

    if (fetchError || !record) {
      throw new AppError("NOT_FOUND", "Session expired. Please refresh the page.", 404);
    }

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
        submitted_at: new Date().toISOString(),
      })
      .eq("id", parsed.trackingId);

    if (updateError) throw new AppError("DB_ERROR", updateError.message, 500);

    const env = getEnv();

    if (env.PUBLIC_LEAD_WEBHOOK_URL) {
      const teamsMessage = `🚨 **NEW MSP LEAD: ${parsed.company}** 🚨\n\n**Service Interest:** ${parsed.services}\n**Urgency:** ${parsed.urgency}\n\n**Client Information**\n* **Contact:** ${parsed.name}\n* **Email:** ${parsed.email}\n* **Phone:** ${parsed.phone}\n* **Company:** ${parsed.company}\n* **Size:** ${parsed.employees} employees\n\n**Message:**\n${parsed.message}\n\n**Session Metadata**\n* **Location:** ${record.location}\n* **Platform:** ${record.platform ? record.platform.replace(/"/g, "") : "Unknown"}\n* **IP Address:** ${record.ip_address}\n* **Referrer:** ${record.referrer}\n* **Tracking ID:** ${record.id}`;

      const leadCard = {
        type: "message",
        attachments: [{
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [{ type: "TextBlock", text: teamsMessage, wrap: true }],
          },
        }],
      };

      fetch(env.PUBLIC_LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadCard),
      }).catch(() => {});
    }

    if (env.JSM_DOMAIN && env.JSM_API_TOKEN) {
      const authHeader = "Basic " + Buffer.from(`${env.JSM_EMAIL}:${env.JSM_API_TOKEN}`).toString("base64");

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
| *IP Address* | ${record.ip_address} |
| *Location* | ${record.location} |
| *Platform* | ${record.platform ? record.platform.replace(/"/g, "") : "Unknown"} |
| *Referrer* | ${record.referrer} |
| *Session ID* | ${record.id} |
| *User Agent* | ${record.user_agent} |`;

      fetch(`https://${env.JSM_DOMAIN}/rest/servicedeskapi/request`, {
        method: "POST",
        headers: { Authorization: authHeader, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDeskId: env.JSM_SERVICEDESK_ID,
          requestTypeId: env.JSM_REQUEST_TYPE_ID,
          requestFieldValues: {
            summary: `Web Lead: ${parsed.company} - ${parsed.services}`,
            description: ticketDescription,
          },
        }),
      }).catch(() => {});
    }

    await logAuditEvent({
      action: "public.lead.submit",
      entityType: "public_interaction",
      entityId: parsed.trackingId,
      metadata: { company: parsed.company, name: parsed.name, email: parsed.email, services: parsed.services },
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
