import crypto from "crypto";
import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireOrgAccess } from "../middleware/org-access";
import { logAuditEvent } from "../services/audit";
import { filterReadableDocuments } from "../lib/document-visibility";
import { sanitizeSearchTerm } from "../lib/search";
import { queryInt } from "../lib/query";
import { isCrossTenantKey, roleKeyOf } from "../lib/roles";
import { recordSearchQuery } from "../lib/metrics";
import { rateLimitSearch } from "../middleware/rate-limit";

const router: ReturnType<typeof Router> = Router();

// SEARCH-P2-007: the admin typeahead hits this route on every debounced
// keystroke; bound the burst before the auth/database work.
router.use(rateLimitSearch);

// Order matters: requireOrgAccess must resolve the request's tenant scope
// (`req.orgScope` / `req.orgId`) before requireAdmin runs, so the org-pinned
// admin check applies and a plain tenant `admin` cannot widen scope with
// another tenant's `?organization_id` (SEARCH-P2-009). Same order as
// audit.ts / bulk.ts.
router.use(requireAuth, requireOrgAccess, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const q = sanitizeSearchTerm(req.query.q);
    // SEARCH-P2-004: page size is caller-tunable (default 5, hard cap 25).
    const limit = Math.min(25, Math.max(1, queryInt(req.query.limit, 5)));
    if (!q || q.length < 2) {
      // Same shape as a populated response (counts + limit) so the OpenAPI
      // contract and SDK types hold for empty queries too.
      res.json(
        success({
          users: [],
          organizations: [],
          tickets: [],
          projects: [],
          documents: [],
          counts: { users: 0, organizations: 0, tickets: 0, projects: 0, documents: 0 },
          limit,
        }),
      );
      return;
    }

    const supabase = getSupabaseAdmin();
    const searchTerm = `${q}%`;
    const wildcardTerm = `%${q}%`;
    // SEARCH-P2-006: tickets/projects/documents carry a stored generated
    // `search_vector` (GIN-indexed). OR a `wfts` (websearch_to_tsquery) branch
    // onto the ILIKE predicates: `wfts` never raises on arbitrary user text,
    // and the sanitizer already stripped the PostgREST `.or()` grammar
    // characters (`,()."%\*`), so the term cannot reshape the filter.
    const ftsTerm = `search_vector.wfts(english).${q}`;

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
      .select(userProjection, { count: "exact" })
      .or(`full_name.ilike.${searchTerm},email.ilike.${wildcardTerm}`)
      .limit(limit);
    if (scopedUserIds) {
      userQuery = userQuery.in(
        "id",
        scopedUserIds.length > 0 ? scopedUserIds : ["__no_match__"],
      );
    }

    let ticketQuery = supabase
      .from("tickets")
      .select("id, title, status, priority, organization_id", { count: "exact" })
      .or(`title.ilike.${wildcardTerm},description.ilike.${wildcardTerm},${ftsTerm}`)
      .limit(limit);
    if (!allTenants) {
      ticketQuery = ticketQuery.in(
        "organization_id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    let projectQuery = supabase
      .from("projects")
      .select("id, name, status, priority, organization_id", { count: "exact" })
      .or(`name.ilike.${wildcardTerm},description.ilike.${wildcardTerm},${ftsTerm}`)
      .limit(limit);
    if (!allTenants) {
      projectQuery = projectQuery.in(
        "organization_id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    // SEARCH-P2-008: the service-role client bypasses RLS, so the documents
    // query must be filtered by the `can_read_document` visibility model in
    // code. Unreadable rows are dropped after the query, so fetch a bounded
    // window (5x the page, capped) and trim to the caller's page size once the
    // readable subset is known.
    const documentFetchLimit = Math.min(100, limit * 5);

    let documentQuery = supabase
      .from("documents")
      .select("id, name, mime_type, visibility, organization_id, uploaded_by", {
        count: "exact",
      })
      .or(`name.ilike.${wildcardTerm},mime_type.ilike.${wildcardTerm},${ftsTerm}`)
      .limit(documentFetchLimit);
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
      .select("id, name, slug, status", { count: "exact" })
      .or(`name.ilike.${searchTerm},slug.ilike.${searchTerm}`)
      .limit(limit);
    if (!allTenants) {
      organizationQuery = organizationQuery.in(
        "id",
        scopedOrgIds.length > 0 ? scopedOrgIds : ["__no_match__"],
      );
    }

    const [
      { data: users, error: uErr, count: uCount },
      { data: organizations, error: oErr, count: oCount },
      { data: tickets, error: tErr, count: tCount },
      { data: projects, error: pErr, count: pCount },
      { data: documents, error: dErr, count: dCount },
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

    // SEARCH-P2-008: drop private/internal documents the caller may not read
    // (the service-role client bypasses RLS). Super admins short-circuit inside
    // the helper — `is_super_admin()` makes every document readable, so their
    // exact DB count stays meaningful; for everyone else the reported count is
    // the readable subset of the fetched window, never the unfiltered total.
    const readableDocuments = (
      await filterReadableDocuments(req.authUser!.userId, documents ?? [], {
        orgIds: allTenants ? undefined : scopedOrgIds,
        isSuperAdmin: callerIsSuperAdmin,
      })
    ).slice(0, limit);

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
          documents: readableDocuments.length,
        },
      },
    });

    recordSearchQuery();

    res.json(
      success({
        users: users ?? [],
        organizations: organizations ?? [],
        tickets: tickets ?? [],
        projects: projects ?? [],
        documents: readableDocuments,
        // SEARCH-P2-004: per-entity totals + the applied page size (additive).
        // SEARCH-P2-008: the documents total reflects only rows the caller may
        // read, so an admin cannot infer hidden private/internal documents.
        counts: {
          users: uCount ?? 0,
          organizations: oCount ?? 0,
          tickets: tCount ?? 0,
          projects: pCount ?? 0,
          documents: callerIsSuperAdmin
            ? (dCount ?? readableDocuments.length)
            : readableDocuments.length,
        },
        limit,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
