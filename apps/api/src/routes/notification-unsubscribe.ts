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
 * `{userId, organizationId, exp}` token (`apps/api/src/lib/unsubscribe-token.ts`),
 * so the endpoint needs no session — possession of the emailed link is the
 * capability. Unsubscribing writes a `module_key = 'all'` preference row,
 * which both the API and worker preference resolvers honour for every module,
 * while leaving in-app notifications intact.
 *
 * NOTIF-P2-012 (hardening):
 *  - The token now expires (90 days, see the token lib); legacy non-expiring
 *    tokens are rejected.
 *  - GET renders a confirmation page and performs NO write. Mail-security link
 *    scanners (Outlook SafeLinks, Proofpoint) prefetch GET URLs, so the old
 *    behaviour silently opted recipients out before they ever clicked.
 *  - POST performs the opt-out. It is the RFC 8058 one-click target advertised
 *    by the List-Unsubscribe/-Post headers, and it also backs the confirmation
 *    form's button. The token travels in the query string (the URL the header
 *    points at), so no form-body parser is required.
 *
 * Mounted BEFORE the authenticated notifications router so the token, not a
 * session, is the only credential required. The global CSRF gate skips this
 * path for the same reason (a mail client has no session cookie to echo).
 */

const router: ReturnType<typeof Router> = Router();

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}

function preferencesHref(): string {
  return `${getEnv().APP_BASE_URL}/portal/notifications/preferences`;
}

function pageShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; color: #374151;">
${body}
  </body>
</html>`;
}

function confirmationPage(token: string): string {
  const action = `?token=${encodeURIComponent(token)}`;
  return pageShell(
    "Confirm unsubscribe",
    `    <h1 style="color: #374151;">Unsubscribe from notification emails?</h1>
    <p>This stops notification emails for this organization. In-app notifications are unaffected.</p>
    <form method="post" action="${escapeHtml(action)}">
      <button type="submit" style="background: #059669; color: #fff; border: 0; border-radius: 6px; padding: 10px 16px; font-size: 15px; cursor: pointer;">Yes, unsubscribe me</button>
    </form>
    <p><a href="${escapeHtml(preferencesHref())}" style="color: #059669;">Manage notification preferences</a></p>`,
  );
}

function unsubscribedPage(): string {
  return pageShell(
    "Unsubscribed",
    `    <h1 style="color: #059669;">You are unsubscribed</h1>
    <p>You will no longer receive notification emails for this organization. In-app notifications are unaffected.</p>
    <p><a href="${escapeHtml(preferencesHref())}" style="color: #059669;">Manage notification preferences</a></p>`,
  );
}

/** The token rides the query string for both the link and the one-click POST. */
function readToken(req: { query: unknown; body?: unknown }): string {
  const query = req.query as Record<string, unknown> | undefined;
  if (query && typeof query.token === "string") return query.token;
  const body = req.body as Record<string, unknown> | undefined;
  if (body && typeof body.token === "string") return body.token;
  return "";
}

function verifyOrThrow(token: string) {
  const payload = verifyUnsubscribeToken(token, getEnv().SUPABASE_SERVICE_ROLE_KEY);
  if (!payload) {
    throw new AppError("VALIDATION", "Invalid or expired unsubscribe link", 400);
  }
  return payload;
}

// NOTIF-P2-012: GET is side-effect free — a prefetching scanner must not opt
// the recipient out. It renders the confirmation page instead.
router.get("/", rateLimitUnsubscribe, async (req, res, next) => {
  try {
    const token = readToken(req);
    verifyOrThrow(token);
    res.status(200).type("html").send(confirmationPage(token));
  } catch (error) {
    next(error);
  }
});

// NOTIF-P2-012: POST is the actual opt-out. Mail clients POST
// `List-Unsubscribe=One-Click` to this URL; the confirmation form posts here
// too. Both carry the signed token in the query string.
router.post("/", rateLimitUnsubscribe, async (req, res, next) => {
  try {
    const token = readToken(req);
    const payload = verifyOrThrow(token);

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

    res.status(200).type("html").send(unsubscribedPage());
  } catch (error) {
    next(error);
  }
});

export default router;
