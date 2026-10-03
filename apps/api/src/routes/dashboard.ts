import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCache } from "../middleware/cache";
import { applyOrgScope, resolveAdminTenantScope } from "../lib/admin-scope";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireOrgAccess);
router.use(requireAdmin);

router.get("/summary", responseCache(30), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    // Platform-wide counts are only visible to a genuine cross-tenant admin;
    // a single-org admin is scoped to their own tenant(s) (MT-P1-002).
    const scope = await resolveAdminTenantScope(req);

    const orgQuery = applyOrgScope(
      supabase.from("organizations").select("*", { count: "exact", head: true }),
      "id",
      scope,
    );
    const ticketQuery = applyOrgScope(
      supabase.from("tickets").select("*", { count: "exact", head: true }),
      "organization_id",
      scope,
    );
    const projectQuery = applyOrgScope(
      supabase.from("projects").select("*", { count: "exact", head: true }),
      "organization_id",
      scope,
    );
    const documentQuery = applyOrgScope(
      supabase.from("documents").select("*", { count: "exact", head: true }),
      "organization_id",
      scope,
    );
    const membershipQuery = applyOrgScope(
      supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      "organization_id",
      scope,
    );

    const [
      { count: managedServices, error: msError },
      { count: openTickets, error: otError },
      { count: activeProjects, error: apError },
      { count: totalDocuments, error: tdError },
      { count: pendingMemberships, error: pmError },
    ] = await Promise.all([
      orgQuery,
      ticketQuery,
      projectQuery,
      documentQuery,
      membershipQuery,
    ]);

    if (msError) throw new AppError("DB_ERROR", msError.message, 500);
    if (otError) throw new AppError("DB_ERROR", otError.message, 500);
    if (apError) throw new AppError("DB_ERROR", apError.message, 500);
    if (tdError) throw new AppError("DB_ERROR", tdError.message, 500);
    if (pmError) throw new AppError("DB_ERROR", pmError.message, 500);

    res.json(
      success({
        managedServices: managedServices ?? 0,
        openTickets: openTickets ?? 0,
        activeProjects: activeProjects ?? 0,
        totalDocuments: totalDocuments ?? 0,
        pendingMemberships: pendingMemberships ?? 0,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
