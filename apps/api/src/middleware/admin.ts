import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.authUser) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("memberships")
      .select("roles!inner(id, key)")
      .eq("user_id", req.authUser.userId)
      .eq("status", "approved");

    if (error || !data || data.length === 0) {
      throw new AppError("FORBIDDEN", "Admin access required", 403);
    }

    const adminRole = data.find((row) =>
      ["admin", "super_admin"].includes(row.roles.key),
    );

    if (!adminRole) {
      throw new AppError("FORBIDDEN", "Admin access required", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}
