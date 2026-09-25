import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import { assertSafeUrl } from "../lib/ssrf-guard";
import type { TaskResult } from "../task-registry";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000; // 1 minute
const BATCH_SIZE = 20;

export async function webhookRetry(_payload: Record<string, unknown>): Promise<TaskResult> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: deliveries, error: fetchError } = await supabase
      .from("webhook_deliveries")
      .select("id, webhook_id, event, request_body, error, retry_count, next_retry_at, dead_letter")
      .eq("status", "failed")
      .eq("dead_letter", false)
      // Generic inbound-webhook logs have no endpoint to retry against.
      .not("webhook_id", "is", null)
      .lt("retry_count", MAX_RETRIES)
      // Legacy failed rows have next_retry_at = null; include them so they are
      // not stranded forever.
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order("next_retry_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error({ error: fetchError.message }, "Failed to fetch deliveries for retry");
      return { ok: false, error: fetchError.message };
    }

    if (!deliveries || deliveries.length === 0) {
      logger.info("No webhook deliveries to retry");
      return { ok: true };
    }

    logger.info({ count: deliveries.length }, "Retrying webhook deliveries");

    let retried = 0;
    let deadLettered = 0;

    for (const delivery of deliveries) {
      // Narrow webhook_id (the column is nullable for generic inbound logs).
      if (!delivery.webhook_id) continue;
      try {
        const { data: endpoint } = await supabase
          .from("webhook_endpoints")
          .select("id, url, secret, is_active")
          .eq("id", delivery.webhook_id)
          .single();

        if (!endpoint || !endpoint.is_active) {
          await supabase
            .from("webhook_deliveries")
            .update({ dead_letter: true, next_retry_at: null })
            .eq("id", delivery.id);
          deadLettered++;
          continue;
        }

        // The API's inline dispatch path stores a PII-safe summary
        // ({ event, receivedAt }) rather than the full payload. Replaying that
        // would send a delivery with no `data`, so dead-letter it instead.
        const stored = delivery.request_body as Record<string, unknown> | null;
        if (!stored || !("data" in stored)) {
          await supabase
            .from("webhook_deliveries")
            .update({ dead_letter: true, next_retry_at: null })
            .eq("id", delivery.id);
          deadLettered++;
          continue;
        }

        const body = JSON.stringify(delivery.request_body);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // SSRF guard — never retry a webhook URL pointing at private /
        // loopback / link-local hosts or hostnames resolving to them.
        const blocked = await assertSafeUrl(endpoint.url);
        if (blocked) {
          await supabase
            .from("webhook_deliveries")
            .update({ dead_letter: true, next_retry_at: null })
            .eq("id", delivery.id);

          await supabase.from("webhook_dead_letters").insert({
            webhook_id: delivery.webhook_id,
            event: delivery.event,
            request_body: delivery.request_body,
            last_error: `Blocked URL: ${blocked}`,
            attempt_count: (delivery.retry_count ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
          });

          deadLettered++;
          continue;
        }

        if (endpoint.secret) {
          const crypto = await import("crypto");
          const hmac = crypto.createHmac("sha256", endpoint.secret).update(body).digest("hex");
          headers["X-Webhook-Signature"] = `sha256=${hmac}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
          // The SSRF guard validated the initial URL only; do not follow a
          // redirect to an internal address.
          redirect: "manual",
        });
        clearTimeout(timeout);

        const newRetryCount = (delivery.retry_count ?? 0) + 1;

        if (res.ok) {
          await supabase
            .from("webhook_deliveries")
            .update({
              status: "success",
              response_status: res.status,
              retry_count: newRetryCount,
              next_retry_at: null,
            })
            .eq("id", delivery.id);

          await supabase
            .from("webhook_endpoints")
            .update({ last_success_at: new Date().toISOString(), last_error: null })
            .eq("id", delivery.webhook_id);

          retried++;
        } else {
          const nextRetry = new Date(
            Date.now() + BASE_DELAY_MS * Math.pow(2, newRetryCount - 1),
          ).toISOString();

          if (newRetryCount >= MAX_RETRIES) {
            await supabase
              .from("webhook_deliveries")
              .update({
                retry_count: newRetryCount,
                dead_letter: true,
                next_retry_at: null,
              })
              .eq("id", delivery.id);

            await supabase.from("webhook_dead_letters").insert({
              webhook_id: delivery.webhook_id,
              event: delivery.event,
              request_body: delivery.request_body,
              last_error: `HTTP ${res.status} after ${newRetryCount} attempts`,
              attempt_count: newRetryCount,
              last_attempt_at: new Date().toISOString(),
            });

            deadLettered++;
          } else {
            await supabase
              .from("webhook_deliveries")
              .update({
                retry_count: newRetryCount,
                next_retry_at: nextRetry,
                response_status: res.status,
              })
              .eq("id", delivery.id);
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error({ deliveryId: delivery.id, error: errMsg }, "Webhook retry attempt failed");

        const newRetryCount = (delivery.retry_count ?? 0) + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await supabase
            .from("webhook_deliveries")
            .update({ dead_letter: true, retry_count: newRetryCount, next_retry_at: null })
            .eq("id", delivery.id);

          await supabase.from("webhook_dead_letters").insert({
            webhook_id: delivery.webhook_id,
            event: delivery.event,
            request_body: delivery.request_body,
            last_error: errMsg,
            attempt_count: newRetryCount,
            last_attempt_at: new Date().toISOString(),
          });

          deadLettered++;
        } else {
          const nextRetry = new Date(
            Date.now() + BASE_DELAY_MS * Math.pow(2, newRetryCount - 1),
          ).toISOString();

          await supabase
            .from("webhook_deliveries")
            .update({ retry_count: newRetryCount, next_retry_at: nextRetry })
            .eq("id", delivery.id);
        }
      }
    }

    logger.info({ retried, deadLettered }, "Webhook retry batch complete");
    return { ok: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error({ error: errMsg }, "Webhook retry task failed");
    return { ok: false, error: errMsg };
  }
}
