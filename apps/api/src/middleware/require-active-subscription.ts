import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";
import { getEnv } from "../config/env";

export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  // Evaluated per-request, not at module load (see requirePermission note).
  if (getEnv().NODE_ENV === "test") return next();

  try {
    if (!req.authUser) {
      throw new AppError("UNAUTHORIZED", "Authentication required", 401);
    }

    const supabase = getSupabaseAdmin();
    const orgId = req.query.organization_id as string | undefined;

    if (!orgId) {
      throw new AppError("VALIDATION", "Organization ID is required for subscription check", 400);
    }

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("organization_id", orgId)
      .in("status", ["active", "trialing"]);

    if (error) {
      throw new AppError("DB_ERROR", "Failed to check subscription status", 500);
    }

    if (subscriptions && subscriptions.length > 0) {
      next();
      return;
    }

    const { data: memberships } = await supabase
      .from("memberships")
      .select("id, roles!inner(id, key)")
      .eq("user_id", req.authUser.userId)
      .eq("status", "approved");

    const isAdmin =
      memberships?.some(
        (row) =>
          ["admin", "super_admin"].includes(
            (row.roles as unknown as { key: string }).key,
          ),
      ) ?? false;

    if (isAdmin) {
      next();
      return;
    }

    throw new AppError(
      "SUBSCRIPTION_REQUIRED",
      "An active subscription is required to access this resource",
      403,
    );
  } catch (error) {
    next(error);
  }
}
