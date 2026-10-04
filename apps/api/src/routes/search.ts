import crypto from "crypto";
import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireOrgAccess } from "../middleware/org-access";
import { logAuditEvent } from "../services/audit";
import { sanitizeSearchTerm } from "../lib/search";
import { isCrossTenantKey, roleKeyOf } from "../lib/roles";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth, requireAdmin, requireOrgAccess);

router.get("/", async (req, res, next) => {
  try {
    const q = sanitizeSearchTerm(req.query.q);
    if (!q || q.length < 2) {
      res.json(success({ users: [], organizations: [], tickets: [], projects: [], documents: [] }));
      return;
    }

    const supabase = getSupabaseAdmin();
    const searchTerm = `${q}%`;
    const wildcardTerm = `%${q}%`;

    // Resolve the caller's own approved memberships (with role keys) so we can
    // scope every entity to their tenants and decide whether they are a true
    // platform admin. A cross-tenant role (admin/super_admin) alone is NOT
    // enough to see every tenant from search: `admin` is a per-tenant role
    // here, and only a super_admin profile flag grants the all-tenant view
    // (audit SEARCH-P1-002). This mirrors organizations.ts / users.ts.
    const [{ data: memberships }, { data: callerProfile }] = await Promise.all([
      supabase
        .from("memberships")
        .select("organization_id, roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("status", "approved"),
      supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", req.authUser!.userId)
        .maybeSingle(),
    ]);

    const adminOrgIds = (memberships ?? [])
      .map((m) => m.organization_id as string)
      .filter(Boolean);

    // Cross-tenant reach requires BOTH a cross-tenant role key (the shared
    // helper) AND the super_admin profile flag. A plain tenant `admin` is
    // scoped to their own orgs exactly like every other entity below.
    // `.some`, NOT `.find`: the memberships query is unordered, so picking the
    // first role key made this depend on row order for multi-org users.
    const holdsCrossTenantRole = (memberships ?? []).some((m) =>
      isCrossTenantKey(roleKeyOf((m as { roles?: unknown }).roles)),
    );
    // `.maybeSingle()` yields an object on the real client but tests may stub
    // it as a one-element array; accept either shape.
    const callerIsSuperAdmin = Array.isArray(callerProfile)
      ? (callerProfile as Array<{ is_super_admin?: boolean }>).some(
          (p) => p?.is_super_admin === true,
        )
      : callerProfile?.is_super_admin === true;
    const canSeeAllTenants = callerIsSuperAdmin && holdsCrossTenantRole;

    // `requireOrgAccess` has already resolved the request's authoritative tenant
    // scope. Honor it rather than re-deriving: an explicitly requested
    // organization narrows the search (even for a cross-tenant super admin),
    // and the absence of a resolved org must never widen it (API-P2-001). The
    // all-tenants path is audited below.
    const requestedOrgId = req.orgScope?.explicit ? (req.orgScope.orgId ?? null) : null;
    const allTenants = canSeeAllTenants && requestedOrgId === null;
    const scopedOrgIds = requestedOrgId ? [requestedOrgId] : adminOrgIds;

    // Super admins get the PII columns; everyone else gets a reduced
    // projection (no email/phone) consistent with staff-PII endpoints.
    // Tenant admins can still identify staff by name/title.
    const userProjection = allTenants
      ? "id, full_name, email, phone, title"
      : "id, full_name, title";

    // Platform admins see users across all orgs; everyone else is limited to
    // approved members of their own orgs, and never falls back to "all" when
    // their org list is empty.
    const scopedUserIds = allTenants
      ? null
      : (
          await supabase
            .from("memberships")
            .select("user_id")
            .in("organization_id", scopedOrgIds.length > 0 ? scopedOrgIds : ["__none__"])
            .eq("status", "approved")
        ).data?.map((m) => m.user_id as string) ?? [];

    let userQuery = supabase
      .from("profiles")
      .select(userProjection)
      .or(`full_name.ilike.${searchTerm},email.ilike.${wildcardTerm}`)
      .limit(5);
    if (scopedUserIds) {
      userQuery = userQuery.in(
        "id",
        scopedUserIds.length > 0 ? scopedUserIds : ["__no_match__"],
      );
    }

    let ticketQuery = supabase
      .from("tickets")
      .select("id, title, status, priority, organization_id")
      .or(`title.ilike.${wildcardTerm},description.ilike.${wildcardTerm}`)
      .limit(5);
    if (!allTenants) {
      ticketQuery = ticketQuery.in(
        "organization_id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    let projectQuery = supabase
      .from("projects")
      .select("id, name, status, priority, organization_id")
      .or(`name.ilike.${wildcardTerm},description.ilike.${wildcardTerm}`)
      .limit(5);
    if (!allTenants) {
      projectQuery = projectQuery.in(
        "organization_id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    let documentQuery = supabase
      .from("documents")
      .select("id, name, mime_type, visibility, organization_id")
      .or(`name.ilike.${wildcardTerm},mime_type.ilike.${wildcardTerm}`)
      .limit(5);
    if (!allTenants) {
      documentQuery = documentQuery.in(
        "organization_id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    // Organizations are a tenant-owned entity just like tickets/projects.
    // Previously this query was never scoped, letting any admin enumerate
    // every tenant (SEARCH-P1-002). Scope it to the caller's orgs unless they
    // are a true platform admin.
    let organizationQuery = supabase
      .from("organizations")
      .select("id, name, slug, status")
      .or(`name.ilike.${searchTerm},slug.ilike.${searchTerm}`)
      .limit(5);
    if (!allTenants) {
      organizationQuery = organizationQuery.in(
        "id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    const [
      { data: users, error: uErr },
      { data: organizations, error: oErr },
      { data: tickets, error: tErr },
      { data: projects, error: pErr },
      { data: documents, error: dErr },
    ] = await Promise.all([
      userQuery,
      organizationQuery,
      ticketQuery,
      projectQuery,
      documentQuery,
    ]);

    if (uErr) throw new AppError("DB_ERROR", uErr.message, 500);
    if (oErr) throw new AppError("DB_ERROR", oErr.message, 500);
    if (tErr) throw new AppError("DB_ERROR", tErr.message, 500);
    if (pErr) throw new AppError("DB_ERROR", pErr.message, 500);
    if (dErr) throw new AppError("DB_ERROR", dErr.message, 500);

    // SEARCH-P2-001: never persist the raw search term. Operators may search
    // for customer emails/phones/keywords, and the audit redactor only matches
    // on key names, so a plaintext `query` would live in `audit_logs` for the
    // 365-day retention window. Store a truncated SHA-256 fingerprint plus the
    // length instead — enough to correlate repeated queries without retaining
    // the value.
    const queryHash = crypto.createHash("sha256").update(q).digest("hex").slice(0, 16);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "search.query",
      entityType: "search",
      metadata: {
        queryHash,
        queryLength: q.length,
        // Audited flag: a cross-tenant super admin searched without an explicit
        // organization (the only path allowed to span every tenant).
        allTenants,
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
