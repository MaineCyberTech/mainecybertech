import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { logAuditEvent } from "../services/audit";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const q = ((req.query.q as string) || "").trim();
    if (!q || q.length < 2) {
      res.json(success({ users: [], organizations: [], tickets: [], projects: [], documents: [] }));
      return;
    }

    const supabase = getSupabaseAdmin();
    const searchTerm = `${q}%`;
    const wildcardTerm = `%${q}%`;

    // Scope search to the admin's organizations
    const { data: memberships } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", req.authUser!.userId)
      .eq("status", "approved");

    const adminOrgIds = memberships?.map((m) => m.organization_id) ?? [];

    const userQuery = supabase
      .from("profiles")
      .select("id, full_name, email, phone, title")
      .or(`full_name.ilike.${searchTerm},email.ilike.${wildcardTerm}`)
      .limit(5);

    // If admin has specific orgs, only show users in those orgs' profiles
    let userFinal;
    if (adminOrgIds.length > 0) {
      const { data: memberUserIds } = await supabase
        .from("memberships")
        .select("user_id")
        .in("organization_id", adminOrgIds);
      const ids = memberUserIds?.map((m) => m.user_id) ?? [];
      if (ids.length > 0) {
        userFinal = userQuery.in("id", ids);
      } else {
        userFinal = userQuery;
      }
    } else {
      userFinal = userQuery;
    }

    let ticketQuery = supabase
      .from("tickets")
      .select("id, title, status, priority, organization_id")
      .or(`title.ilike.${wildcardTerm},description.ilike.${wildcardTerm}`)
      .limit(5);
    if (adminOrgIds.length > 0) {
      ticketQuery = ticketQuery.in("organization_id", adminOrgIds);
    }

    let projectQuery = supabase
      .from("projects")
      .select("id, name, status, priority, organization_id")
      .or(`name.ilike.${wildcardTerm},description.ilike.${wildcardTerm}`)
      .limit(5);
    if (adminOrgIds.length > 0) {
      projectQuery = projectQuery.in("organization_id", adminOrgIds);
    }

    let documentQuery = supabase
      .from("documents")
      .select("id, name, mime_type, visibility, organization_id")
      .or(`name.ilike.${wildcardTerm},mime_type.ilike.${wildcardTerm}`)
      .limit(5);
    if (adminOrgIds.length > 0) {
      documentQuery = documentQuery.in("organization_id", adminOrgIds);
    }

    const [
      { data: users, error: uErr },
      { data: organizations, error: oErr },
      { data: tickets, error: tErr },
      { data: projects, error: pErr },
      { data: documents, error: dErr },
    ] = await Promise.all([
      userFinal,
      supabase
        .from("organizations")
        .select("id, name, slug, status")
        .or(`name.ilike.${searchTerm},slug.ilike.${searchTerm}`)
        .limit(5),
      ticketQuery,
      projectQuery,
      documentQuery,
    ]);

    if (uErr) throw new AppError("DB_ERROR", uErr.message, 500);
    if (oErr) throw new AppError("DB_ERROR", oErr.message, 500);
    if (tErr) throw new AppError("DB_ERROR", tErr.message, 500);
    if (pErr) throw new AppError("DB_ERROR", pErr.message, 500);
    if (dErr) throw new AppError("DB_ERROR", dErr.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "search.query",
      entityType: "search",
      metadata: {
        query: q,
        resultCounts: {
          users: users?.length ?? 0,
          organizations: organizations?.length ?? 0,
          tickets: tickets?.length ?? 0,
          projects: projects?.length ?? 0,
          documents: documents?.length ?? 0,
        },
      },
    });

    res.json(
      success({
        users: users ?? [],
        organizations: organizations ?? [],
        tickets: tickets ?? [],
        projects: projects ?? [],
        documents: documents ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
