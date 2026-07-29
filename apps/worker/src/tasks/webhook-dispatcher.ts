import crypto from "crypto";
import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import type { TaskHandler, TaskResult } from "../task-registry";

type DispatchPayload = {
  event: string;
  organizationId: string;
  data: Record<string, unknown>;
};

export const webhookDispatcher: TaskHandler = async (payload): Promise<TaskResult> => {
  const { event, organizationId, data } = payload as DispatchPayload;

  if (!event || !organizationId) {
    return { ok: false, error: "event and organizationId are required" };
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: endpoints, error: fetchError } = await supabase
      .from("webhook_endpoints")
      .select("id, name, url, secret, events")
      .eq("is_active", true)
      .eq("organization_id", organizationId)
      .contains("events", [event]);

    if (fetchError) {
      return { ok: false, error: `Failed to fetch webhook endpoints: ${fetchError.message}` };
    }

    if (!endpoints || endpoints.length === 0) {
      logger.info({ event, organizationId }, "webhook-dispatcher: no matching endpoints");
      return { ok: true };
    }

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data });
    let successCount = 0;
    let failCount = 0;

    for (const endpoint of endpoints as Array<{
      id: string;
      name: string;
      url: string;
      secret: string | null;
      events: string[];
    }>) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
      };

      if (endpoint.secret) {
        const hmac = crypto.createHmac("sha256", endpoint.secret).update(body).digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${hmac}`;
      }

      const start = Date.now();
      let responseStatus = 0;
      let responseBody = "";
      let error: string | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        responseStatus = res.status;
        responseBody = await res.text().catch(() => "");
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }

      const duration = Date.now() - start;

      await supabase.from("webhook_deliveries").insert({
        webhook_id: endpoint.id,
        event,
        status: error
          ? "failed"
          : responseStatus >= 200 && responseStatus < 300
            ? "success"
            : "failed",
        request_body: { event, data },
        response_status: responseStatus || null,
        response_body: responseBody || null,
        error,
        duration_ms: duration,
      });

      if (error || responseStatus >= 400) {
        failCount++;
        await supabase
          .from("webhook_endpoints")
          .update({
            last_failure_at: new Date().toISOString(),
            last_error: error || `HTTP ${responseStatus}`,
          })
          .eq("id", endpoint.id);
      } else {
        successCount++;
        await supabase
          .from("webhook_endpoints")
          .update({ last_success_at: new Date().toISOString(), last_error: null })
          .eq("id", endpoint.id);
      }
    }

    logger.info(
      { event, organizationId, successCount, failCount },
      "webhook-dispatcher: completed",
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, event }, "webhook-dispatcher failed");
    return { ok: false, error: msg };
  }
};
