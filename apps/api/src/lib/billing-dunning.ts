import { getSupabaseAdmin } from "../services/supabase";
import { notifyAndEmail } from "./notify";
import { ADMIN_BYPASS_KEYS } from "./permissions";
import { roleKeyOf } from "./roles";
import { logger } from "./logger";
import { recordBillingDunningNotification } from "./metrics";

/**
 * BILL-P2-004: failed-payment dunning.
 *
 * A failed Stripe payment previously updated the invoice mirror silently —
 * nobody was told, so a card that stopped working could go unnoticed until
 * the subscription was suspended. This module resolves the organization's
 * billing contacts and sends them the in-app + email notification through the
 * existing preference-aware notify path.
 */

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

/** Minimal shape of a Stripe invoice needed for the dunning notice. */
export interface FailedInvoice {
  id: string;
  number?: string | null;
  total?: number | null;
  currency?: string | null;
}

export interface BillingRecipient {
  userId: string;
  email?: string;
}

/**
 * Resolve the organization's billing contacts: approved members whose role
 * grants the `billing` module (client-billing, finance, client_admin, ...) or
 * whose role key is an admin bypass (`admin`/`super_admin`). Role membership
 * is the source of truth — a role that gains billing permissions starts
 * receiving dunning notices without touching this list.
 */
export async function resolveBillingRecipients(
  organizationId: string,
  supabase: SupabaseAdmin = getSupabaseAdmin(),
): Promise<BillingRecipient[]> {
  const [{ data: memberships, error: membershipError }, { data: billingRoles, error: roleError }] =
    await Promise.all([
      supabase
        .from("memberships")
        .select("user_id, role_id, roles!inner(key)")
        .eq("organization_id", organizationId)
        .eq("status", "approved"),
      supabase
        .from("role_permissions")
        .select("role_id, permissions!inner(module_key)")
        .eq("permissions.module_key", "billing"),
    ]);

  if (membershipError || roleError) {
    logger.warn(
      { organizationId, error: membershipError?.message ?? roleError?.message },
      "Failed to resolve billing contacts for dunning notification",
    );
    return [];
  }

  const billingRoleIds = new Set(
    ((billingRoles ?? []) as Array<{ role_id?: string | null }>).map((row) => row.role_id),
  );
  const rows = (memberships ?? []) as Array<{
    user_id?: string | null;
    role_id?: string | null;
    roles?: unknown;
  }>;

  const userIds = [
    ...new Set(
      rows
        .filter(
          (row) =>
            (row.role_id != null && billingRoleIds.has(row.role_id)) ||
            (ADMIN_BYPASS_KEYS as readonly string[]).includes(roleKeyOf(row.roles) ?? ""),
        )
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  if (userIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profileError) {
    logger.warn(
      { organizationId, error: profileError.message },
      "Failed to load billing contact profiles",
    );
    return [];
  }

  return (profiles ?? []).map((profile) => ({
    userId: profile.id,
    email: profile.email ?? undefined,
  }));
}

/**
 * Send the failed-payment notice to every billing contact of the org. Best
 * effort by design: the webhook mirror write already succeeded, and Stripe
 * retrying the event must not double-send, so a notification failure is
 * logged and metered rather than thrown.
 */
export async function notifyBillingPaymentFailure(opts: {
  organizationId: string;
  invoice: FailedInvoice;
  supabase?: SupabaseAdmin;
}): Promise<{ notified: number; recipients: number }> {
  const supabase = opts.supabase ?? getSupabaseAdmin();
  const { organizationId, invoice } = opts;

  try {
    const recipients = await resolveBillingRecipients(organizationId, supabase);
    if (recipients.length === 0) {
      recordBillingDunningNotification("no_recipients");
      logger.info(
        { organizationId, invoiceId: invoice.id },
        "No billing contacts to notify for failed payment",
      );
      return { notified: 0, recipients: 0 };
    }

    const amount =
      typeof invoice.total === "number"
        ? ` (${(invoice.total / 100).toFixed(2)} ${(invoice.currency ?? "usd").toUpperCase()})`
        : "";
    const label = invoice.number ? `Invoice ${invoice.number}` : `Invoice ${invoice.id}`;
    const title = "Payment failed";
    const body = `${label}${amount} could not be charged. Update the payment method in the billing portal to avoid service interruption.`;

    for (const recipient of recipients) {
      await notifyAndEmail({
        userId: recipient.userId,
        organizationId,
        title,
        body,
        module: "billing",
        moduleId: invoice.id,
        action: "payment_failed",
        email: recipient.email,
      });
    }

    recordBillingDunningNotification("notified");
    logger.info(
      { organizationId, invoiceId: invoice.id, notified: recipients.length },
      "Billing dunning notification sent",
    );
    return { notified: recipients.length, recipients: recipients.length };
  } catch (error) {
    recordBillingDunningNotification("error");
    logger.error(
      {
        organizationId,
        invoiceId: invoice.id,
        error: error instanceof Error ? error.message : String(error),
      },
      "Billing dunning notification failed",
    );
    return { notified: 0, recipients: 0 };
  }
}
