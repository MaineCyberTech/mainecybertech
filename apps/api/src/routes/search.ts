import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
      res.json(success({ users: [], organizations: [], tickets: [], projects: [] }));
      return;
    }

    const supabase = getSupabaseAdmin();
    const searchTerm = `%${q}%`;

    const [
      { data: users, error: uErr },
      { data: organizations, error: oErr },
      { data: tickets, error: tErr },
      { data: projects, error: pErr },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, title")
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from("organizations")
        .select("id, name, slug, status")
        .or(`name.ilike.${searchTerm},slug.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from("tickets")
        .select("id, title, status, priority, organization_id")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from("projects")
        .select("id, name, status, priority, organization_id")
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
    ]);

    if (uErr) throw new AppError("DB_ERROR", uErr.message, 500);
    if (oErr) throw new AppError("DB_ERROR", oErr.message, 500);
    if (tErr) throw new AppError("DB_ERROR", tErr.message, 500);
    if (pErr) throw new AppError("DB_ERROR", pErr.message, 500);

    res.json(success({
      users: users ?? [],
      organizations: organizations ?? [],
      tickets: tickets ?? [],
      projects: projects ?? [],
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
