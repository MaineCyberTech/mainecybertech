import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";
import { recordNotificationDelivery, recordNotificationSuppressed } from "./metrics";

/**
 * Worker-side notification preference enforcement + dedup (NOTIF-P1-001/002).
 *
 * Mirrors `apps/api/src/lib/notification-channels.ts` and the key-derivation in
 * `apps/api/src/lib/notify.ts`. The worker is a separate deployable and cannot
 * import API source, so the small resolver/key helpers are duplicated here.
 *
 * Fail-safe: if preferences cannot be read we log and default every channel to
 * ENABLED. A preferences outage must never silence reminders/emails; a false
 * send is preferable to dropping a user-visible notification.
 */

export type NotificationChannel = "email" | "in_app";

export interface ResolvedChannels {
  email: boolean;
  in_app: boolean;
}

const ENABLED_BY_DEFAULT: ResolvedChannels = { email: true, in_app: true };
const DELIVERABLE_CHANNELS: readonly NotificationChannel[] = ["email", "in_app"];

type PreferenceRow = { channel: string | null; enabled: boolean | null };

export async function resolveChannels(
  supabase: SupabaseClient,
  input: { userId: string; organizationId?: string | null; module: string },
): Promise<ResolvedChannels> {
  try {
    let query = supabase
      .from("notification_preferences")
      .select("channel, enabled")
      .eq("user_id", input.userId)
      .eq("module_key", input.module);

    if (input.organizationId) {
      query = query.eq("organization_id", input.organizationId);
    }

    const { data, error } = await query;
    if (error) {
      logger.warn(
        {
          userId: input.userId,
          organizationId: input.organizationId ?? null,
          module: input.module,
          error: error.message,
        },
        "Failed to read notification preferences — defaulting to enabled (fail-safe)",
      );
      return { ...ENABLED_BY_DEFAULT };
    }

    const resolved: ResolvedChannels = { ...ENABLED_BY_DEFAULT };
    for (const row of (data ?? []) as PreferenceRow[]) {
      const channel = row.channel as NotificationChannel | null;
      if (!channel || !DELIVERABLE_CHANNELS.includes(channel)) continue;
      if (row.enabled === false) resolved[channel] = false;
    }
    return resolved;
  } catch (error) {
    logger.warn(
      {
        userId: input.userId,
        organizationId: input.organizationId ?? null,
        module: input.module,
        error: error instanceof Error ? error.message : String(error),
      },
      "Unexpected error reading notification preferences — defaulting to enabled (fail-safe)",
    );
    return { ...ENABLED_BY_DEFAULT };
  }
}

/**
 * Deterministic dedup key matching the API scheme. The unique index is
 * `idx_notifications_key`; the admin endpoint and the API helper both write a
 * key here so retries/replays are deduped consistently.
 */
export function buildNotificationKey(opts: {
  userId: string;
  module: string;
  moduleId?: string | null;
  action: string;
  title: string;
  body: string;
}): string {
  const fingerprint = createHash("sha256")
    .update(`${opts.title}\n${opts.body}`)
    .digest("hex")
    .slice(0, 16);
  return `${opts.userId}-${opts.module}-${opts.moduleId ?? "none"}-${opts.action}-${fingerprint}`;
}

export interface InsertNotificationInput {
  userId: string;
  organizationId?: string | null;
  title: string;
  body: string;
  module: string;
  moduleId?: string | null;
  action: string;
  notificationKey?: string;
}

export interface InsertNotificationResult {
  inserted: boolean;
  deduped: boolean;
  suppressed: boolean;
}

/**
 * Preference-gated, deduped in-app insert. Returns a result so callers can
 * avoid sending email for a notification that was suppressed or deduped.
 */
export async function insertNotification(
  supabase: SupabaseClient,
  input: InsertNotificationInput,
  resolvedChannels?: ResolvedChannels,
): Promise<InsertNotificationResult> {
  const channels =
    resolvedChannels ??
    (await resolveChannels(supabase, {
      userId: input.userId,
      organizationId: input.organizationId,
      module: input.module,
    }));

  if (!channels.in_app) {
    recordNotificationSuppressed("in_app", input.module);
    logger.info(
      { userId: input.userId, module: input.module, action: input.action },
      "In-app notification suppressed by user preference",
    );
    return { inserted: false, deduped: false, suppressed: true };
  }

  const notificationKey =
    input.notificationKey ??
    buildNotificationKey({
      userId: input.userId,
      module: input.module,
      moduleId: input.moduleId,
      action: input.action,
      title: input.title,
      body: input.body,
    });

  try {
    const { data, error } = await supabase
      .from("notifications")
      .upsert(
        {
          user_id: input.userId,
          organization_id: input.organizationId ?? null,
          title: input.title,
          body: input.body,
          module: input.module,
          module_id: input.moduleId ?? null,
          action: input.action,
          notification_key: notificationKey,
        },
        { onConflict: "notification_key", ignoreDuplicates: true },
      )
      .select("id");

    if (error) {
      logger.warn(
        { error: error.message, userId: input.userId, title: input.title },
        "Failed to create in-app notification",
      );
      recordNotificationDelivery("in_app", "failed");
      return { inserted: false, deduped: false, suppressed: false };
    }

    const inserted = Array.isArray(data) && data.length > 0;
    recordNotificationDelivery("in_app", inserted ? "success" : "skipped");
    return { inserted, deduped: !inserted, suppressed: false };
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: input.userId,
        title: input.title,
        notificationKey,
      },
      "Failed to create in-app notification",
    );
    recordNotificationDelivery("in_app", "failed");
    return { inserted: false, deduped: false, suppressed: false };
  }
}
