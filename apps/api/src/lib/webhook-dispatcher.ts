import crypto from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "./logger";
import { checkIdempotencyKey, storeIdempotencyKey } from "./idempotency";

export async function dispatchWebhook(
  event: string,
  organizationId: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: endpoints, error: fetchError } = await supabase
      .from("webhook_endpoints")
      .select("id, name, url, secret, events")
      .eq("is_active", true)
      .eq("organization_id", organizationId)
      .contains("events", [event]);

    if (fetchError || !endpoints || endpoints.length === 0) return;

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data });

    for (const endpoint of endpoints as Array<{
      id: string;
      name: string;
      url: string;
      secret: string | null;
      events: string[];
    }>) {
      const idempotencyKey = `wh-out-${endpoint.id}-${event}-${Date.now()}`;
      const existing = await checkIdempotencyKey(idempotencyKey);
      if (existing) continue;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
        "Idempotency-Key": idempotencyKey,
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
        idempotency_key: idempotencyKey,
      });

      if (responseStatus >= 200 && responseStatus < 300) {
        await storeIdempotencyKey(idempotencyKey, "done");
      }

      if (error || responseStatus >= 400) {
        await supabase
          .from("webhook_endpoints")
          .update({
            last_failure_at: new Date().toISOString(),
            last_error: error || `HTTP ${responseStatus}`,
          })
          .eq("id", endpoint.id);
      } else {
        await supabase
          .from("webhook_endpoints")
          .update({
            last_success_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", endpoint.id);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, event }, "webhook dispatch failed");
  }
}
