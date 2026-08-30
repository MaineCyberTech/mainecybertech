import crypto from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { enqueueTask } from "./task-producer";
import { logger } from "./logger";
import { checkIdempotencyKey, storeIdempotencyKey } from "./idempotency";
import { assertSafeWebhookUrl } from "./ssrf-guard";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 200;
const RETRY_FACTOR = 2;

type DeliveryResult = {
  status: number;
  body: string;
  error: string | null;
};

async function deliverWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
): Promise<DeliveryResult> {
  let lastStatus = 0;
  let lastBody = "";
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;
    try {
      await assertSafeWebhookUrl(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // 5xx responses are transient server errors and should be retried.
      if (res.status >= 500) {
        lastStatus = res.status;
        lastBody = await res.text().catch(() => "");
        lastError = `HTTP ${res.status}`;
      } else {
        // 2xx/3xx/4xx are terminal for this attempt (4xx won't succeed on retry).
        return {
          status: res.status,
          body: await res.text().catch(() => ""),
          error: null,
        };
      }
    } catch (e) {
      // Network errors / timeouts are transient and should be retried.
      lastError = e instanceof Error ? e.message : String(e);
      lastStatus = 0;
      lastBody = "";
    }

    if (attempt < MAX_ATTEMPTS) {
      const delay = RETRY_BASE_MS * Math.pow(RETRY_FACTOR, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return { status: lastStatus, body: lastBody, error: lastError ?? "unknown delivery error" };
}

async function enqueueDeadLetter(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  endpointId: string,
  event: string,
  lastError: string,
  attemptCount: number,
): Promise<void> {
  try {
    const { error: dlqError } = await supabase.from("webhook_dead_letters").insert({
      webhook_id: endpointId,
      event,
      request_body: { event, receivedAt: new Date().toISOString() },
      last_error: lastError,
      attempt_count: attemptCount,
      last_attempt_at: new Date().toISOString(),
    });
    if (dlqError) {
      logger.warn(
        { err: dlqError.message, endpointId, event },
        "Failed to enqueue webhook dead letter",
      );
    }
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err), endpointId, event },
      "Failed to enqueue webhook dead letter",
    );
  }
}

export async function dispatchWebhook(
  event: string,
  organizationId: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    // Route delivery through the worker queue when available (async delivery,
    // retries + DLQ via webhook-retry). Fall back to inline dispatch so
    // webhooks are never lost when the queue is unavailable.
    const enqueued = await enqueueTask("webhook-dispatcher", {
      event,
      organizationId,
      data,
    });
    if (enqueued) return;

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
      const idempotencyKey = `wh-out-${endpoint.id}-${event}-${crypto.createHash("sha256").update(body).digest("hex").slice(0, 16)}`;
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
      const receivedAt = new Date().toISOString();

      const result = await deliverWithRetry(endpoint.url, headers, body);
      const responseStatus = result.status;
      const error = result.error;

      const duration = Date.now() - start;

      // Persist only a truncated, PII-safe summary — never the raw outbound
      // payload or the inbound response body.
      await supabase.from("webhook_deliveries").insert({
        webhook_id: endpoint.id,
        event,
        status: error
          ? "failed"
          : responseStatus >= 200 && responseStatus < 300
            ? "success"
            : "failed",
        request_body: { event, receivedAt },
        response_status: responseStatus || null,
        response_body: null,
        error,
        duration_ms: duration,
        retry_count: MAX_ATTEMPTS,
        idempotency_key: idempotencyKey,
      });

      const failed = Boolean(error) || responseStatus >= 400;
      if (failed) {
        await enqueueDeadLetter(
          supabase,
          endpoint.id,
          event,
          error || `HTTP ${responseStatus}`,
          MAX_ATTEMPTS,
        );
      }

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
