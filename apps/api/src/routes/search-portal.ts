import { Router } from "express";
import { getScopedClient } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { rateLimitSearch } from "../middleware/rate-limit";
import { filterReadableDocuments } from "../lib/document-visibility";
import { sanitizeSearchTerm } from "../lib/search";
import { recordSearchQuery } from "../lib/metrics";

const router: ReturnType<typeof Router> = Router();

// SEARCH-P2-007: the portal typeahead calls this route on a 300 ms debounce;
// bound the burst with the shared search limiter before auth/database work.
router.use(rateLimitSearch);
router.use(requireAuth);

/** Page size for tickets/projects (unchanged) and documents after filtering. */
const RESULT_LIMIT = 5;
// SEARCH-P2-002: the service-role fallback bypasses RLS, so documents are
// filtered by the `can_read_document` visibility model AFTER the query. Fetch a
// bounded window and trim to RESULT_LIMIT once the readable subset is known.
const DOCUMENT_FETCH_LIMIT = 25;

router.get("/", async (req, res, next) => {
  try {
    const q = sanitizeSearchTerm(req.query.q);
    if (!q || q.length < 2) {
      res.json(success({ tickets: [], projects: [], documents: [] }));
      return;
    }

    const user = req.authUser!;
    const supabase = getScopedClient(req, "search-portal", "read");
    const searchTerm = `%${q}%`;
    // SEARCH-P2-006: same generated `search_vector` full-text branch as the
    // admin search (wfts = websearch_to_tsquery; never raises on user text).
    const ftsTerm = `search_vector.wfts(english).${q}`;

    const { data: memberships, error: mErr } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.userId)
      .eq("status", "approved");

    if (mErr) throw new AppError("DB_ERROR", mErr.message, 500);
    const orgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id);
    if (orgIds.length === 0) {
      res.json(success({ tickets: [], projects: [], documents: [] }));
      return;
    }

    const [
      { data: tickets, error: tErr },
      { data: projects, error: pErr },
      { data: documents, error: dErr },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, title, status, priority")
        .in("organization_id", orgIds)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},${ftsTerm}`)
        .limit(RESULT_LIMIT),
      supabase
        .from("projects")
        .select("id, name, status, priority")
        .in("organization_id", orgIds)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},${ftsTerm}`)
        .limit(RESULT_LIMIT),
      // SEARCH-P2-002: documents are part of the portal search contract (the
      // SDK's PortalSearchResult and the module docs promise them) and were
      // never queried. Apply the same visibility model as admin search
      // (SEARCH-P2-008) because the scoped client may be the service-role
      // fallback.
      supabase
        .from("documents")
        .select("id, name, mime_type, visibility, organization_id, uploaded_by")
        .in("organization_id", orgIds)
        .or(`name.ilike.${searchTerm},mime_type.ilike.${searchTerm},${ftsTerm}`)
        .limit(DOCUMENT_FETCH_LIMIT),
    ]);

    if (tErr) throw new AppError("DB_ERROR", tErr.message, 500);
    if (pErr) throw new AppError("DB_ERROR", pErr.message, 500);
    if (dErr) throw new AppError("DB_ERROR", dErr.message, 500);

    const readableDocuments = (
      await filterReadableDocuments(user.userId, documents ?? [], { orgIds })
    ).slice(0, RESULT_LIMIT);

    // SEARCH-P2-005: the portal surface is the highest-volume search path and
    // was the only one not incrementing the counter.
    recordSearchQuery();

    res.json(
      success({
        tickets: tickets ?? [],
        projects: projects ?? [],
        documents: readableDocuments,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
