import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { responseCache } from "../middleware/cache";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/summary", responseCache(30), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const [
      { data: orgs, error: orgsError },
      { count: openTickets, error: ticketsError },
      { count: activeProjects, error: projectsError },
      { count: totalDocuments, error: docsError },
      { count: pendingApprovals, error: approvalsError },
      { count: totalUsers, error: usersError },
    ] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("resolved","closed","completed")'),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase
        .from("approval_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    if (orgsError) throw new AppError("DB_ERROR", orgsError.message, 500);
    if (ticketsError) throw new AppError("DB_ERROR", ticketsError.message, 500);
    if (projectsError) throw new AppError("DB_ERROR", projectsError.message, 500);
    if (docsError) throw new AppError("DB_ERROR", docsError.message, 500);
    if (approvalsError) throw new AppError("DB_ERROR", approvalsError.message, 500);
    if (usersError) throw new AppError("DB_ERROR", usersError.message, 500);

    const orgList = orgs ?? [];
    const approvedOrgs = orgList.filter((o: { status: string }) => o.status === "approved");
    const pendingOrgs = orgList.filter((o: { status: string }) => o.status === "pending");

    res.json(
      success({
        organizations: {
          total: orgList.length,
          approved: approvedOrgs.length,
          pending: pendingOrgs.length,
          recent: orgList
            .slice(0, 5)
            .map((o: { id: string; name: string; status: string; created_at: string }) => ({
              id: o.id,
              name: o.name,
              status: o.status,
              createdAt: o.created_at,
            })),
        },
        tickets: {
          open: openTickets ?? 0,
        },
        projects: {
          active: activeProjects ?? 0,
        },
        documents: {
          total: totalDocuments ?? 0,
        },
        approvals: {
          pending: pendingApprovals ?? 0,
        },
        users: {
          total: totalUsers ?? 0,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/approvals-overdue", responseCache(30), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error, count } = await supabase
      .from("approval_requests")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .lt("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(20);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success({ items: data ?? [], total: count ?? 0 }));
  } catch (error) {
    next(error);
  }
});

router.get("/recent-activity", responseCache(15), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.get("/org-health", responseCache(60), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, status");

    if (orgsError) throw new AppError("DB_ERROR", orgsError.message, 500);

    const approvedOrgIds = (orgs ?? [])
      .filter((o: { status: string }) => o.status === "approved")
      .map((o: { id: string }) => o.id);

    if (approvedOrgIds.length === 0) {
      return res.json(success([]));
    }

    const [{ data: ticketCounts, error: ticketErr }, { data: projectCounts, error: projectErr }] =
      await Promise.all([
        supabase.from("tickets").select("organization_id").in("organization_id", approvedOrgIds),
        supabase
          .from("projects")
          .select("organization_id, status")
          .in("organization_id", approvedOrgIds),
      ]);

    if (ticketErr) throw new AppError("DB_ERROR", ticketErr.message, 500);
    if (projectErr) throw new AppError("DB_ERROR", projectErr.message, 500);

    const ticketByOrg = new Map<string, number>();
    for (const t of ticketCounts ?? []) {
      const orgId = (t as { organization_id: string }).organization_id;
      ticketByOrg.set(orgId, (ticketByOrg.get(orgId) ?? 0) + 1);
    }

    const activeProjectByOrg = new Map<string, number>();
    for (const p of projectCounts ?? []) {
      const orgId = (p as { organization_id: string; status: string }).organization_id;
      if ((p as { status: string }).status === "active") {
        activeProjectByOrg.set(orgId, (activeProjectByOrg.get(orgId) ?? 0) + 1);
      }
    }

    const health = (orgs ?? [])
      .filter((o: { status: string }) => o.status === "approved")
      .map((o: { id: string; name: string }) => ({
        id: o.id,
        name: o.name,
        openTickets: ticketByOrg.get(o.id) ?? 0,
        activeProjects: activeProjectByOrg.get(o.id) ?? 0,
      }))
      .sort(
        (a: { openTickets: number }, b: { openTickets: number }) => b.openTickets - a.openTickets,
      );

    res.json(success(health));
  } catch (error) {
    next(error);
  }
});

export default router;
