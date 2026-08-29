import { Router } from "express";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { responseCacheNoRenew } from "../middleware/cache";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

// Sensible default portal module set used when an org has no active (or
// trialing) subscription, or when module entitlements cannot be derived.
const DEFAULT_ENABLED_MODULES: string[] = [
  "dashboard",
  "support",
  "documents",
  "projects",
  "billing",
  "status",
  "notifications",
  "profile",
];

// Modules unlocked when an org has an active/trialing subscription.
const SUBSCRIPTION_ENABLED_MODULES: string[] = [
  ...DEFAULT_ENABLED_MODULES,
  "findings",
  "security-ops",
  "governance",
  "training-hub",
  "service-catalog",
  "qbr",
];

function deriveEnabledModules(subscriptionActive: boolean): string[] {
  return subscriptionActive ? SUBSCRIPTION_ENABLED_MODULES : DEFAULT_ENABLED_MODULES;
}

router.get("/bootstrap", responseCacheNoRenew(30), async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "client-portal", "read");
    const userId = req.authUser!.userId;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw new AppError("DB_ERROR", profileError.message, 500);

    const { data: memberships, error: membershipError } = await supabase
      .from("memberships")
      .select(
        "id, organization_id, role_id, status, organizations(id, name), roles(id, key, name)",
      )
      .eq("user_id", userId);
    if (membershipError) throw new AppError("DB_ERROR", membershipError.message, 500);

    const rows = memberships ?? [];
    const orgIds = rows.map((m) => m.organization_id);

    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("organization_id, status, plan_name, current_period_end")
      .in("organization_id", orgIds.length ? orgIds : ["__none__"]);
    if (subError) throw new AppError("DB_ERROR", subError.message, 500);

    const subByOrg = new Map<
      string,
      { status: string; planName: string | null; currentPeriodEnd: string | null }
    >();
    for (const s of subscriptions ?? []) {
      subByOrg.set(s.organization_id, {
        status: s.status,
        planName: s.plan_name ?? null,
        currentPeriodEnd: s.current_period_end ?? null,
      });
    }

    const membershipViews = rows.map((m) => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      const role = Array.isArray(m.roles) ? m.roles[0] : m.roles;
      const sub = subByOrg.get(m.organization_id) ?? null;
      const isActive = sub?.status === "active" || sub?.status === "trialing";
      return {
        organizationId: m.organization_id,
        organizationName: org?.name ?? null,
        roleKey: role?.key ?? null,
        roleName: role?.name ?? null,
        status: m.status,
        subscription: sub
          ? {
              status: sub.status,
              planName: sub.planName,
              currentPeriodEnd: sub.currentPeriodEnd,
            }
          : null,
        enabledModules: deriveEnabledModules(isActive),
      };
    });

    await logAuditEvent({
      actorUserId: userId,
      action: "client_portal.bootstrap",
      entityType: "client_portal",
    });

    res.json(
      success({
        profile: {
          fullName: profile?.full_name ?? null,
          email: profile?.email ?? null,
        },
        memberships: membershipViews,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
