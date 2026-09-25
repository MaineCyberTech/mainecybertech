import crypto from "crypto";
import { logger } from "../logger";
import { getSupabaseAdmin } from "../services/supabase";
import { assertSafeUrl } from "../lib/ssrf-guard";
import type { TaskHandler, TaskResult } from "../task-registry";
import type { Json } from "@mct/sdk/database.types";

type DispatchPayload = {
  event: string;
  organizationId: string;
  data: Record<string, Json>;
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
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
          // Do not follow redirects: the SSRF guard validated the initial URL
          // only, and a public host could 302 to an internal address.
          redirect: "manual",
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
