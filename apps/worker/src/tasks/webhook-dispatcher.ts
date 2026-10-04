import crypto from "crypto";
import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import { assertSafeUrl } from "../lib/ssrf-guard";
import { pinnedFetch } from "../lib/pinned-fetch";
import { claimIdempotencyKey, deleteIdempotencyKey } from "../lib/idempotency";
import type { TaskHandler, TaskResult } from "../task-registry";
import type { Json } from "@mct/sdk/database.types";

type DispatchPayload = {
  event: string;
  organizationId: string;
  data: Record<string, Json>;
  idempotencyKey?: string;
};

/**
 * Stable idempotency key for one logical outbound event. Mirrors the API's
 * buildOutboundIdempotencyKey so a job enqueued without an explicit key (or a
 * duplicate played straight into the worker) dedupes identically.
 */
function buildIdempotencyKey(
  event: string,
  organizationId: string,
  data: Record<string, Json>,
): string {
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify({ event, organizationId, data }))
    .digest("hex")
    .slice(0, 32);
  return `wh-out-${organizationId}-${event}-${digest}`;
}

export const webhookDispatcher: TaskHandler = async (payload): Promise<TaskResult> => {
  const { event, organizationId, data } = payload as DispatchPayload;
  const idempotencyBaseKey =
    (payload as DispatchPayload).idempotencyKey ??
    (event && organizationId ? buildIdempotencyKey(event, organizationId, data ?? {}) : undefined);

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
      // Per-endpoint atomic claim: the same logical event fanned out to
      // multiple endpoints each still gets delivered, but a duplicate job for
      // the same event+endpoint collapses to a single side effect even under
      // concurrency.
      const idempotencyKey = idempotencyBaseKey
        ? `${idempotencyBaseKey}:${endpoint.id}`
        : undefined;
      if (idempotencyKey) {
        const claimed = await claimIdempotencyKey(idempotencyKey, "processing");
        if (!claimed) {
          logger.info(
            { event, endpointId: endpoint.id },
            "webhook-dispatcher: duplicate event already claimed, skipping",
          );
          continue;
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
      };
      if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }

      if (endpoint.secret) {
        const hmac = crypto.createHmac("sha256", endpoint.secret).update(body).digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${hmac}`;
      }

      // SSRF guard — endpoint URLs are user-supplied; never dispatch to
      // private / loopback / link-local hosts or hostnames resolving to them.
      const blocked = await assertSafeUrl(endpoint.url);
      if (blocked) {
        failCount++;
        await supabase.from("webhook_deliveries").insert({
          webhook_id: endpoint.id,
          event,
          status: "failed",
          request_body: { event, data },
          error: `Blocked URL: ${blocked}`,
          // A blocked URL is a permanent failure: never retry, go straight to
          // the dead-letter set so the retry task ignores it.
          retry_count: 0,
          dead_letter: true,
          // Keep the claim: a permanently blocked URL should not be
          // re-processed if the same job is delivered twice.
          ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        });
        await supabase
          .from("webhook_endpoints")
          .update({
            last_failure_at: new Date().toISOString(),
            last_error: `Blocked URL: ${blocked}`,
          })
          .eq("id", endpoint.id);
        continue;
      }

      const start = Date.now();
      let responseStatus = 0;
      let responseBody = "";
      let error: string | null = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        // SEC-P2-002: pinnedFetch validates DNS and pins the connection to the
        // validated IP (closing the rebinding TOCTOU the guard-then-fetch left
        // open). Redirects are not followed, matching `redirect: "manual"`.
        const res = await pinnedFetch(endpoint.url, {
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
      const failed = Boolean(error) || !(responseStatus >= 200 && responseStatus < 300);

      await supabase.from("webhook_deliveries").insert({
        webhook_id: endpoint.id,
        event,
        status: failed ? "failed" : "success",
        request_body: { event, data },
        response_status: responseStatus || null,
        response_body: responseBody || null,
        error,
        duration_ms: duration,
        // The retry task selects rows where next_retry_at <= now; without a
        // value here failed deliveries are never retried or dead-lettered.
        retry_count: 0,
        next_retry_at: failed ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
      });

      if (error || responseStatus >= 400) {
        failCount++;
        // Release the claim on transient failure so the webhook-retry task
        // can re-attempt the same logical event. On success the claim stays
        // as the durable dedup marker.
        if (idempotencyKey) {
          await deleteIdempotencyKey(idempotencyKey);
        }
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
