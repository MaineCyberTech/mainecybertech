import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import { assertSafeUrl } from "../lib/ssrf-guard";
import { pinnedFetch } from "../lib/pinned-fetch";
import { recordWebhookDelivery, recordWebhookDeadLetter } from "../metrics";
import type { TaskResult } from "../task-registry";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 60_000; // 1 minute
const BATCH_SIZE = 20;
// WH-P2-012: how long a claimed row stays invisible to other retry runs. If
// the worker dies mid-attempt, the row becomes due again after the lease.
const RETRY_LEASE_MS = 5 * 60 * 1000;

/**
 * WH-P2-012: claim a due delivery before attempting it. The conditional
 * update only matches the exact row version the batch query selected (same
 * retry_count and next_retry_at), so two overlapping retry runs cannot both
 * send the same delivery. The new next_retry_at doubles as a lease: a crash
 * mid-attempt re-exposes the row after RETRY_LEASE_MS.
 */
async function claimDeliveryForRetry(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  delivery: { id: string; retry_count: number; next_retry_at: string | null },
  now: Date,
): Promise<boolean> {
  const leaseUntil = new Date(now.getTime() + RETRY_LEASE_MS).toISOString();
  const base = supabase
    .from("webhook_deliveries")
    .update({ next_retry_at: leaseUntil })
    .eq("id", delivery.id)
    .eq("retry_count", delivery.retry_count);

  // Exact-match the snapshot we selected (`is null` for legacy rows without a
  // next_retry_at): any concurrent claim changes the value and loses.
  const claim = delivery.next_retry_at
    ? base.eq("next_retry_at", delivery.next_retry_at)
    : base.is("next_retry_at", null);

  const { data, error } = await claim.select("id").maybeSingle();
  if (error) {
    logger.warn(
      { deliveryId: delivery.id, error: error.message },
      "Failed to claim webhook delivery for retry",
    );
    return false;
  }
  return Boolean(data);
}

export async function webhookRetry(_payload: Record<string, unknown>): Promise<TaskResult> {
  try {
    const supabase = getSupabaseAdmin();

    const { data: deliveries, error: fetchError } = await supabase
      .from("webhook_deliveries")
      .select(
        "id, webhook_id, event, request_body, error, retry_count, next_retry_at, dead_letter, idempotency_key",
      )
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

      // WH-P2-012: one atomic claim per row before any side effect. A
      // concurrent retry run that selected the same row loses the claim and
      // skips instead of double-sending.
      if (!(await claimDeliveryForRetry(supabase, delivery, new Date()))) {
        logger.debug(
          { deliveryId: delivery.id },
          "webhook-retry: delivery already claimed elsewhere, skipping",
        );
        continue;
      }

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
          // WH-P2-011: an admin retry deletes the original dead letter before
          // this task runs, so re-create it with the reason the replay was
          // refused — otherwise the delivery vanishes from the DLQ entirely.
          await supabase
            .from("webhook_deliveries")
            .update({ dead_letter: true, next_retry_at: null })
            .eq("id", delivery.id);

          await supabase.from("webhook_dead_letters").insert({
            webhook_id: delivery.webhook_id,
            event: delivery.event,
            request_body: delivery.request_body,
            last_error: "Not replayable: stored payload has no data field",
            attempt_count: (delivery.retry_count ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
          });

          recordWebhookDeadLetter(delivery.event);
          deadLettered++;
          continue;
        }

        const body = JSON.stringify(delivery.request_body);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        // Preserve the original dedup key so consumers can dedupe a retried
        // delivery against the first attempt.
        if (delivery.idempotency_key) {
          headers["Idempotency-Key"] = delivery.idempotency_key;
        }

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
        // SEC-P2-002: pinnedFetch validates DNS and pins the connection to the
        // validated IP (closing the guard-then-fetch rebinding TOCTOU).
        // Redirects are not followed, matching `redirect: "manual"`.
        const res = await pinnedFetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const newRetryCount = (delivery.retry_count ?? 0) + 1;

        if (res.status >= 200 && res.status < 300) {
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

          // WH-P2-003: a retry that succeeds is an outbound success.
          recordWebhookDelivery("success", delivery.event);
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

            recordWebhookDeadLetter(delivery.event);
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

          recordWebhookDeadLetter(delivery.event);
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
