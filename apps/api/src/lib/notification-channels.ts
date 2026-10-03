import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mct/sdk/database.types";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "./logger";

/**
 * Notification preference enforcement (NOTIF-P1-001).
 *
 * `notification_preferences` stores one row per
 * `(organization_id, user_id, module_key, channel)` with an `enabled` flag.
 * Nothing on the send path consulted it before, so a user who switched a
 * channel off still received that channel. This module resolves which channels
 * are actually allowed for a given user/module/org.
 *
 * Channels without a stored row default to ENABLED — preferences are an
 * opt-out, not an allow-list. A channel for which no sender exists (e.g. `sms`)
 * is never returned as allowed.
 *
 * Fail-safe: if preferences cannot be read (DB error, unexpected shape), we
 * log and fall back to ENABLED for every real channel. Dropping a user-visible
 * notification is worse than a false send, so a preferences outage must never
 * silence the notification system.
 */

export type NotificationChannel = "email" | "in_app";

export interface ResolvedChannels {
  email: boolean;
  in_app: boolean;
}

export interface ResolveChannelsInput {
  userId: string;
  organizationId?: string | null;
  module: string;
  /** Inject a client (used by tests and the worker); defaults to service role. */
  supabase?: SupabaseClient<Database>;
}

const ENABLED_BY_DEFAULT: ResolvedChannels = { email: true, in_app: true };

/** Channels the product can actually deliver. `sms` exists in the schema/API
 * but has no sender, so it is intentionally excluded from enforcement. */
const DELIVERABLE_CHANNELS: readonly NotificationChannel[] = ["email", "in_app"];

type PreferenceRow = { channel: string | null; enabled: boolean | null };

/**
 * Read the enabled/disabled state for a user's preferences on one module.
 * Returns `{ email, in_app }`. Any preference row with `enabled = false`
 * suppresses only that channel.
 */
export async function resolveChannels(input: ResolveChannelsInput): Promise<ResolvedChannels> {
  const supabase = input.supabase ?? getSupabaseAdmin();

  try {
    let query = supabase
      .from("notification_preferences")
      .select("channel, enabled")
      .eq("user_id", input.userId)
      .eq("module_key", input.module);

    // Preferences are org-scoped. When we know the org, match it exactly;
    // otherwise fall back to any row for the user/module so a deliberate
    // opt-out is still honoured.
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
      // Default-on semantics: only an explicit `false` suppresses a channel.
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

/** True when at least one deliverable channel is still enabled. */
export function anyChannelEnabled(channels: ResolvedChannels): boolean {
  return channels.email || channels.in_app;
}
