import { Router } from "express";
import { verifyUnsubscribeToken } from "../lib/unsubscribe-token";
import { getSupabaseAdmin } from "../services/supabase";
import { getEnv } from "../config/env";
import { rateLimitUnsubscribe } from "../middleware/rate-limit";
import { logger } from "../lib/logger";
import { AppError } from "../types";

/**
 * NOTIF-P3-005: public one-click unsubscribe endpoint.
 *
 * The link embedded in every notification email carries an HMAC-signed
 * `{userId, organizationId}` token (`apps/api/src/lib/unsubscribe-token.ts`),
 * so the endpoint needs no session — possession of the emailed link is the
 * capability. Unsubscribing writes a `module_key = 'all'` preference row,
 * which both the API and worker preference resolvers honour for every module,
 * while leaving in-app notifications intact.
 *
 * Mounted BEFORE the authenticated notifications router so the token, not a
 * session, is the only credential required.
 */

const router: ReturnType<typeof Router> = Router();

router.get("/", rateLimitUnsubscribe, async (req, res, next) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const payload = verifyUnsubscribeToken(token, getEnv().SUPABASE_SERVICE_ROLE_KEY);
    if (!payload) {
      throw new AppError("VALIDATION", "Invalid or expired unsubscribe link", 400);
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("notification_preferences").upsert(
      {
        organization_id: payload.organizationId,
        user_id: payload.userId,
        module_key: "all",
        channel: "email",
        enabled: false,
      },
      { onConflict: "organization_id,user_id,module_key,channel" },
    );
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    logger.info(
      { userId: payload.userId, organizationId: payload.organizationId },
      "Global email opt-out recorded via unsubscribe link",
    );

    const preferencesUrl = `${getEnv().APP_BASE_URL}/portal/notifications/preferences`;
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed</title>
  </head>
  <body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #374151;">
    <h1 style="color: #059669;">You are unsubscribed</h1>
    <p>You will no longer receive notification emails for this organization. In-app notifications are unaffected.</p>
    <p><a href="${preferencesUrl}" style="color: #059669;">Manage notification preferences</a></p>
  </body>
</html>`);
  } catch (error) {
    next(error);
  }
});

export default router;
