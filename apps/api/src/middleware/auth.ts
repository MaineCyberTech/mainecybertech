import { type Request, type Response, type NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        email: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    let token: string | null = null;

    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      token = header.slice(7);
    }

    if (!token) {
      token = req.cookies?.mct_session ?? null;
    }

    if (!token) {
      throw new AppError(
        "UNAUTHORIZED",
        "Missing or invalid authorization header",
        401,
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired session", 401);
    }

    req.authUser = {
      userId: data.user.id,
      email: data.user.email ?? "unknown",
    };

    next();
  } catch (error) {
    next(error);
  }
}
