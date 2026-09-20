import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
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
      .select("id, organization_id, role_id, status, organizations(id, name), roles(id, key, name)")
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

    // Per-tenant module provisioning overrides the subscription-derived set.
    const { data: entitlements } = await supabase
      .from("client_portal_entitlements")
      .select("organization_id, module_key, enabled")
      .in("organization_id", orgIds.length ? orgIds : ["__none__"]);

    const entitlementsByOrg = new Map<string, string[]>();
    for (const e of entitlements ?? []) {
      if (!e.enabled) continue;
      const list = entitlementsByOrg.get(e.organization_id) ?? [];
      list.push(e.module_key);
      entitlementsByOrg.set(e.organization_id, list);
    }

    const membershipViews = rows.map((m) => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      const role = Array.isArray(m.roles) ? m.roles[0] : m.roles;
      const sub = subByOrg.get(m.organization_id) ?? null;
      const isActive = sub?.status === "active" || sub?.status === "trialing";
      const provisioned = entitlementsByOrg.get(m.organization_id);
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
        enabledModules: provisioned?.length ? provisioned : deriveEnabledModules(isActive),
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

// Admin: per-tenant module provisioning.
router.get("/entitlements", requireAdmin, async (req, res, next) => {
  try {
    const organizationId = req.query.organization_id as string;
    if (!organizationId) throw new AppError("VALIDATION", "organization_id required", 400);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("client_portal_entitlements")
      .select("module_key, enabled")
      .eq("organization_id", organizationId)
      .order("module_key");
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success({ items: data ?? [] }));
  } catch (err) {
    next(err);
  }
});

const entitlementsSchema = z.object({
  organizationId: z.string().uuid(),
  modules: z
    .array(z.object({ moduleKey: z.string().min(1).max(100), enabled: z.boolean() }))
    .min(1),
});

router.put("/entitlements", requireAdmin, async (req, res, next) => {
  try {
    const parsed = entitlementsSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const rows = parsed.modules.map((m) => ({
      organization_id: parsed.organizationId,
      module_key: m.moduleKey,
      enabled: m.enabled,
      updated_by: req.authUser!.userId,
    }));
    const { error } = await supabase
      .from("client_portal_entitlements")
      .upsert(rows as never, { onConflict: "organization_id,module_key" });
    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "client_portal.entitlements_updated",
      entityType: "client_portal_entitlements",
      entityId: parsed.organizationId,
      metadata: { count: rows.length },
    });

    res.json(success({ updated: rows.length }));
  } catch (err) {
    next(err);
  }
});

export default router;
