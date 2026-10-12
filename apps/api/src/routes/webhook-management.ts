import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { WEBHOOK_EVENTS } from "@mct/sdk/webhook-events";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { AppError, success } from "../types";
import { logger } from "../lib/logger";
import { encryptField, decryptSecretValue } from "../lib/field-encryption";
import { assertSafeWebhookUrl } from "../lib/ssrf-guard";
import { pinnedFetch } from "../lib/pinned-fetch";
import { assertResourceOrg, loadOwned } from "../lib/tenant";
import { assertDeleteConfirmed } from "../lib/delete-confirm";
import { queryInt, queryString } from "../lib/query";
import { enqueueTask } from "../lib/task-producer";
import { claimIdempotencyKey, deleteIdempotencyKey } from "../lib/idempotency";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

function maskSecret(secret: string | null | undefined): string | null {
  if (!secret) return null;
  if (secret.length <= 8) return "****";
  return secret.slice(0, 4) + "****" + secret.slice(-4);
}

/**
 * WH-P2-008 / ACM-P2-007: signing secrets are encrypted at rest (AES-256-GCM
 * `v1:` payloads via lib/field-encryption). Legacy plaintext values decrypt to
 * themselves, so endpoints created before encryption keep signing; new writes
 * are always encrypted. Returns null when no secret is set OR the stored value
 * cannot be decrypted (wrong/rotated key) — callers must fail closed rather
 * than sign with a corrupted value.
 */
function readSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const decrypted = decryptSecretValue(stored);
  if (!decrypted.ok) {
    logger.warn({ err: decrypted.error }, "Webhook signing secret could not be decrypted");
    return null;
  }
  return decrypted.value;
}

/** Advisory rotation deadline for outbound signing secrets (90-day cadence). */
const SECRET_ROTATION_DAYS = 90;

/**
 * WH-P3-001: deterministic idempotency key for a test ping, derived from the
 * endpoint and the exact payload (including its generated timestamp). The key
 * is stable for a given payload, so an exact replay claims the same key and is
 * deduplicated — a random key could never collide and never exercised the
 * claim/persist path.
 */
export function buildTestIdempotencyKey(webhookId: string, payload: unknown): string {
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
  return `test-${webhookId}-${digest}`;
}

function defaultSecretExpiry(from: Date): string {
  return new Date(from.getTime() + SECRET_ROTATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function maskWebhookData(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return null;
  if (data.secret) {
    data.secret = maskSecret(readSecret(data.secret as string));
  }
  return data;
}

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  secret: z.string().max(500).optional().nullable(),
  secretExpiresAt: z.string().datetime().optional().nullable(),
  // EVOL-P2-002: only catalogued events can be subscribed to. Previously any
  // string was accepted, so subscribers could select events nothing emits.
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "At least one event is required"),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000).optional(),
  secret: z.string().max(500).optional().nullable(),
  secretExpiresAt: z.string().datetime().optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requirePermission("webhooks", "view"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "webhook-management", "read");
    const orgId = req.query.organization_id as string | undefined;

    let query = supabase.from("webhook_endpoints").select("*");
    if (orgId) query = query.eq("organization_id", orgId);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    const masked = (data ?? []).map(maskWebhookData);
    res.json(success(masked));
  } catch (error) {
    next(error);
  }
});

// Dead-letter routes MUST stay above the `/:id` routes so "dead-letters" is
// never captured as a webhook endpoint id.

router.get("/dead-letters", requirePermission("webhooks", "view"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "webhook-management", "read");
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 25)));
    const offset = (page - 1) * limit;
    const event = queryString(req.query.event);
    const webhookId = queryString(req.query.webhook_id) ?? queryString(req.query.webhookId);

    // `webhook_dead_letters` has no organization_id of its own: scope the list
    // through the endpoints owned by the caller's active org. `req.orgId` is
    // null only for org-agnostic platform admins (audited elsewhere).
    let orgWebhookIds: string[] | null = null;
    if (req.orgId) {
      const { data: orgEndpoints, error: orgError } = await supabase
        .from("webhook_endpoints")
        .select("id")
        .eq("organization_id", req.orgId);
      if (orgError) throw new AppError("DB_ERROR", orgError.message, 500);
      orgWebhookIds = (orgEndpoints ?? []).map((endpoint) => endpoint.id);
      if (orgWebhookIds.length === 0) {
        res.json(success({ items: [], total: 0, page, limit }));
        return;
      }
    }

    let query = supabase.from("webhook_dead_letters").select("*", { count: "exact" });
    if (orgWebhookIds) query = query.in("webhook_id", orgWebhookIds);
    if (webhookId) query = query.eq("webhook_id", webhookId);
    if (event) query = query.eq("event", event);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    const rows = data ?? [];
    const endpointIds = Array.from(new Set(rows.map((row) => row.webhook_id)));
    const endpointById = new Map<string, { id: string; name: string; url: string }>();
    if (endpointIds.length > 0) {
      const { data: endpoints, error: endpointError } = await supabase
        .from("webhook_endpoints")
        .select("id, name, url")
        .in("id", endpointIds);
      if (endpointError) throw new AppError("DB_ERROR", endpointError.message, 500);
      for (const endpoint of endpoints ?? []) {
        endpointById.set(endpoint.id, endpoint);
      }
    }

    const items = rows.map((row) => ({
      ...row,
      endpoint: endpointById.get(row.webhook_id) ?? null,
    }));

    res.json(success({ items, total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

/**
 * Load a dead-letter row plus its endpoint and verify tenant ownership.
 * Callers get a 404 for both "row missing" and "row in another org" so
 * existence is never leaked.
 */
async function loadDeadLetterOwned(
  req: Parameters<typeof getScopedClient>[0],
  supabase: ReturnType<typeof getScopedClient>,
  id: string,
) {
  const { data: deadLetter, error } = await supabase
    .from("webhook_dead_letters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new AppError("DB_ERROR", error.message, 500);
  if (!deadLetter) throw new AppError("NOT_FOUND", "Dead letter not found", 404);

  const { data: endpoint, error: endpointError } = await supabase
    .from("webhook_endpoints")
    .select("id, organization_id")
    .eq("id", deadLetter.webhook_id)
    .maybeSingle();
  if (endpointError) throw new AppError("DB_ERROR", endpointError.message, 500);
  if (!endpoint) throw new AppError("NOT_FOUND", "Dead letter not found", 404);

  // Explicit tenant check: the dead-letter table carries no org of its own.
  assertResourceOrg(req, endpoint.organization_id);

  return { deadLetter, endpoint };
}

router.post(
  "/dead-letters/:id/retry",
  requirePermission("webhooks", "manage"),
  async (req, res, next) => {
    try {
      const supabase = getScopedClient(req, "webhook-management", "write");
      const { deadLetter, endpoint } = await loadDeadLetterOwned(
        req,
        supabase,
        String(req.params.id),
      );

      // WH-P2-011: only a dead letter that still carries the full payload can
      // be truthfully retried. Inline-dispatched failures store a PII-safe
      // summary ({ event, receivedAt }) with no `data`; recreating a delivery
      // from it would no-op in `webhook-retry` (which dead-letters rows it
      // cannot replay) while this route had already deleted the dead letter.
      // Refuse and keep the row so the admin sees why.
      const storedBody = deadLetter.request_body as Record<string, unknown> | null;
      if (!storedBody || !("data" in storedBody)) {
        throw new AppError(
          "CONFLICT",
          "Dead letter has no stored payload to replay (inline dispatch kept only a summary); it cannot be retried.",
          409,
        );
      }

      // Replay through the path the worker actually consumes: the
      // `webhook-retry` task replays due rows from `webhook_deliveries`
      // (SSRF guard + HMAC signing + attempt counting). Recreate the delivery
      // as due-now, then nudge the task so it runs before the next 5-minute
      // sweep. The scheduled task will still pick it up if the queue is down.
      const { error: insertError } = await supabase.from("webhook_deliveries").insert({
        webhook_id: deadLetter.webhook_id,
        event: deadLetter.event,
        status: "failed",
        request_body: deadLetter.request_body,
        retry_count: 0,
        dead_letter: false,
        next_retry_at: new Date().toISOString(),
      });
      if (insertError) throw new AppError("DB_ERROR", insertError.message, 500);

      await enqueueTask("webhook-retry", {});

      const { data: deleted, error: deleteError } = await supabase
        .from("webhook_dead_letters")
        .delete()
        .eq("id", deadLetter.id)
        .select("id")
        .maybeSingle();
      if (deleteError) throw new AppError("DB_ERROR", deleteError.message, 500);
      if (!deleted) throw new AppError("NOT_FOUND", "Dead letter not found", 404);

      await logAuditEvent({
        organizationId: endpoint.organization_id,
        actorUserId: req.authUser!.userId,
        action: "webhook.dead_letter.retried",
        entityType: "webhook_dead_letter",
        entityId: deadLetter.id,
        metadata: { webhookId: deadLetter.webhook_id, event: deadLetter.event },
      });

      res.json(success({ ok: true }));
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/dead-letters/:id",
  requirePermission("webhooks", "manage"),
  async (req, res, next) => {
    try {
      assertDeleteConfirmed(req.body);
      const supabase = getScopedClient(req, "webhook-management", "write");
      const { deadLetter, endpoint } = await loadDeadLetterOwned(
        req,
        supabase,
        String(req.params.id),
      );

      const { data: deleted, error: deleteError } = await supabase
        .from("webhook_dead_letters")
        .delete()
        .eq("id", deadLetter.id)
        .select("id")
        .maybeSingle();
      if (deleteError) throw new AppError("DB_ERROR", deleteError.message, 500);
      if (!deleted) throw new AppError("NOT_FOUND", "Dead letter not found", 404);

      await logAuditEvent({
        organizationId: endpoint.organization_id,
        actorUserId: req.authUser!.userId,
        action: "webhook.dead_letter.dismissed",
        entityType: "webhook_dead_letter",
        entityId: deadLetter.id,
        metadata: { webhookId: deadLetter.webhook_id, event: deadLetter.event },
      });

      res.json(success({ ok: true }));
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:id", requirePermission("webhooks", "view"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "webhook-management", "read");
    await loadOwned(req, supabase as any, "webhook_endpoints", String(req.params.id));
    const orgId = req.query.organization_id as string | undefined;
    let query = supabase.from("webhook_endpoints").select("*").eq("id", String(req.params.id));
    if (orgId) query = query.eq("organization_id", orgId);
    const { data, error } = await query.single();
    if (error || !data) throw new AppError("NOT_FOUND", "Webhook not found", 404);
    res.json(success(maskWebhookData(data)));
  } catch (error) {
    next(error);
  }
});

router.post("/", requirePermission("webhooks", "manage"), async (req, res, next) => {
  try {
    const parsed = createSchema.parse(req.body);
    await assertSafeWebhookUrl(parsed.url);
    const supabase = getScopedClient(req, "webhook-management", "write");

    // WH-P2-008: encrypt the signing secret at rest and record rotation
    // metadata. `secretExpiresAt` is advisory (see docs/SECRETS_ROTATION.md);
    // it is surfaced to operators but does not gate delivery.
    const rotatedAt = parsed.secret ? new Date() : null;
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        organization_id: parsed.organizationId,
        name: parsed.name,
        url: parsed.url,
        secret: parsed.secret ? encryptField(parsed.secret) : null,
        secret_rotated_at: rotatedAt ? rotatedAt.toISOString() : null,
        secret_expires_at: rotatedAt
          ? (parsed.secretExpiresAt ?? defaultSecretExpiry(rotatedAt))
          : null,
        events: parsed.events,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "webhook.create",
      entityType: "webhook_endpoint",
      entityId: data.id,
      metadata: { name: parsed.name, url: parsed.url },
    });

    res.status(201).json(success(maskWebhookData(data)));
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  requirePermission("webhooks", "manage"),
  requireIfMatch,
  async (req, res, next) => {
    try {
      const parsed = updateSchema.parse(req.body);
      const supabase = getScopedClient(req, "webhook-management", "write");

      await loadOwned(req, supabase as any, "webhook_endpoints", String(req.params.id));

      if (parsed.url !== undefined) {
        await assertSafeWebhookUrl(parsed.url);
      }

      const { data: current, error: fetchError } = await supabase
        .from("webhook_endpoints")
        .select("version")
        .eq("id", String(req.params.id))
        .single();

      if (fetchError || !current) {
        throw new AppError("NOT_FOUND", "Webhook not found", 404);
      }

      checkVersionMatch(current.version, req.ifMatchVersion);

      const updateData: Record<string, unknown> = {};
      if (parsed.name !== undefined) updateData.name = parsed.name;
      if (parsed.url !== undefined) updateData.url = parsed.url;
      if (parsed.secret !== undefined) {
        if (parsed.secret) {
          // WH-P2-008: re-encrypt on rotation and reset the rotation metadata.
          const rotatedAt = new Date();
          updateData.secret = encryptField(parsed.secret);
          updateData.secret_rotated_at = rotatedAt.toISOString();
          updateData.secret_expires_at =
            parsed.secretExpiresAt ?? defaultSecretExpiry(rotatedAt);
        } else {
          updateData.secret = null;
          updateData.secret_rotated_at = null;
          updateData.secret_expires_at = null;
        }
      }
      if (parsed.events !== undefined) updateData.events = parsed.events;
      if (parsed.isActive !== undefined) updateData.is_active = parsed.isActive;

      updateData.version = current.version + 1;

      const { data, error } = await supabase
        .from("webhook_endpoints")
        .update(updateData as never)
        .eq("version", current.version as number)
        .eq("id", String(req.params.id))
        .select()
        .single();
      if (error) throw new AppError("DB_ERROR", error.message, 500);
      if (!data) throw new AppError("NOT_FOUND", "Webhook not found", 404);

      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "webhook.update",
        entityType: "webhook_endpoint",
        entityId: data.id,
        metadata: parsed,
      });

      res.json(success(maskWebhookData(data)));
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/:id", requirePermission("webhooks", "manage"), async (req, res, next) => {
  try {
    assertDeleteConfirmed(req.body);
    const supabase = getScopedClient(req, "webhook-management", "write");
    await loadOwned(req, supabase as any, "webhook_endpoints", String(req.params.id));
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .delete()
      .eq("id", String(req.params.id))
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Webhook not found", 404);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "webhook.delete",
      entityType: "webhook_endpoint",
      entityId: data.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/deliveries", requirePermission("webhooks", "view"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "webhook-management", "read");
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) {
      const { data: webhook } = await supabase
        .from("webhook_endpoints")
        .select("id")
        .eq("id", String(req.params.id))
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!webhook) throw new AppError("NOT_FOUND", "Webhook not found", 404);
    }
    const page = Math.max(1, queryInt(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, queryInt(req.query.limit, 20)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("webhook_deliveries")
      .select("*", { count: "exact" })
      .eq("webhook_id", String(req.params.id))
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [], total: count ?? 0, page, limit }));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/test", requirePermission("webhooks", "manage"), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "webhook-management", "write");
    await loadOwned(req, supabase as any, "webhook_endpoints", String(req.params.id));
    const { data: webhook, error: fetchError } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("id", String(req.params.id))
      .single();
    if (fetchError || !webhook) throw new AppError("NOT_FOUND", "Webhook not found", 404);

    const payload = {
      event: "ping",
      timestamp: new Date().toISOString(),
      data: { message: "Test from Maine CyberTech" },
    };
    // WH-P3-001: deterministic key (endpoint + exact payload) and a claim
    // before sending, mirroring the shared outbound dispatcher. An exact replay
    // of the same payload is deduplicated instead of delivered twice.
    const idempotencyKey = buildTestIdempotencyKey(webhook.id, payload);
    const claimed = await claimIdempotencyKey(idempotencyKey, "processing");
    if (!claimed) {
      res.json(success({ ok: true, deduplicated: true, idempotency_key: idempotencyKey }));
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const signingSecret = webhook.secret ? readSecret(webhook.secret) : null;
    if (webhook.secret && !signingSecret) {
      // Fail closed: a configured secret that cannot be decrypted must not be
      // reported as a successful unsigned test delivery.
      throw new AppError("CONFIG_ERROR", "Webhook signing secret could not be decrypted", 500);
    }
    if (signingSecret) {
      const hmac = crypto
        .createHmac("sha256", signingSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
      headers["X-Webhook-Signature"] = `sha256=${hmac}`;
    }

    const start = Date.now();
    let responseStatus = 0;
    let responseBody = "";
    let error: string | null = null;

    await assertSafeWebhookUrl(webhook.url);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      // SEC-003: pinnedFetch validates DNS and pins the connection to the
      // validated IP; redirects are not followed.
      const res = await pinnedFetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      responseStatus = res.status;
      responseBody = await res.text().catch(() => "");
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    const duration = Date.now() - start;

    // WH-P3-006: upsert on the idempotency key so a re-test after a released
    // claim updates the existing row instead of silently failing the unique
    // constraint and losing the successful attempt's record.
    const { error: insertError } = await supabase.from("webhook_deliveries").upsert(
      {
        webhook_id: webhook.id,
        event: "ping",
        status: error
          ? "failed"
          : responseStatus >= 200 && responseStatus < 300
            ? "success"
            : "failed",
        request_body: payload,
        response_status: responseStatus || null,
        response_body: responseBody || null,
        error,
        duration_ms: duration,
        idempotency_key: idempotencyKey,
      },
      { onConflict: "idempotency_key" },
    );
    if (insertError) {
      logger.warn(
        { err: insertError.message, webhookId: webhook.id },
        "Failed to record webhook test delivery",
      );
    }

    if (error || responseStatus >= 400) {
      // Release the claim so the same payload can be retried; on success the
      // claim stays as the dedup marker (mirrors the shared dispatcher).
      await deleteIdempotencyKey(idempotencyKey).catch(() => undefined);
      await supabase
        .from("webhook_endpoints")
        .update({
          last_failure_at: new Date().toISOString(),
          last_error: error || `HTTP ${responseStatus}`,
        })
        .eq("id", webhook.id);
      res.json(
        success({
          ok: false,
          status: responseStatus,
          error: error || `HTTP ${responseStatus}`,
          duration_ms: duration,
        }),
      );
    } else {
      await supabase
        .from("webhook_endpoints")
        .update({ last_success_at: new Date().toISOString(), last_error: null })
        .eq("id", webhook.id);
      res.json(success({ ok: true, status: responseStatus, duration_ms: duration }));
    }

    await logAuditEvent({
      organizationId: webhook.organization_id,
      actorUserId: req.authUser!.userId,
      action: "webhook.test",
      entityType: "webhook_endpoint",
      entityId: webhook.id,
      metadata: {
        url: webhook.url,
        ok: !error && responseStatus >= 200 && responseStatus < 300,
        duration_ms: duration,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
