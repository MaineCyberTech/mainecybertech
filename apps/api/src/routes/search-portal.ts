import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
      res.json(success({ tickets: [], projects: [] }));
      return;
    }

    const user = req.authUser!;
    const supabase = getSupabaseAdmin();
    const searchTerm = `%${q}%`;

    const { data: memberships, error: mErr } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.userId)
      .eq("status", "approved");

    if (mErr) throw new AppError("DB_ERROR", mErr.message, 500);
    const orgIds = (memberships ?? []).map((m: any) => m.organization_id);
    if (orgIds.length === 0) {
      res.json(success({ tickets: [], projects: [] }));
      return;
    }

    const [
      { data: tickets, error: tErr },
      { data: projects, error: pErr },
    ] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, title, status, priority")
        .in("organization_id", orgIds)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from("projects")
        .select("id, name, status, priority")
        .in("organization_id", orgIds)
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
    ]);

    if (tErr) throw new AppError("DB_ERROR", tErr.message, 500);
    if (pErr) throw new AppError("DB_ERROR", pErr.message, 500);

    res.json(success({
      tickets: tickets ?? [],
      projects: projects ?? [],
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
