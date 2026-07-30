import { logger } from "../logger";
import type { TaskResult } from "../task-registry";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000; // 1 minute
const BATCH_SIZE = 20;

export async function webhookRetry(
  payload: Record<string, unknown>,
): Promise<TaskResult> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const { env } = await import("../env");

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data: deliveries, error: fetchError } = await supabase
      .from("webhook_deliveries")
      .select("id, webhook_id, event, request_body, error, retry_count, next_retry_at, dead_letter")
      .eq("status", "failed")
      .eq("dead_letter", false)
      .lt("retry_count", MAX_RETRIES)
      .lte("next_retry_at", new Date().toISOString())
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

        const body = JSON.stringify(delivery.request_body);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (endpoint.secret) {
          const crypto = await import("crypto");
          const hmac = crypto
            .createHmac("sha256", endpoint.secret)
            .update(body)
            .digest("hex");
          headers["X-Webhook-Signature"] = `sha256=${hmac}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
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