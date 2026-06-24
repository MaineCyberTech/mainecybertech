import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "../services/supabase";
import { getEnv } from "../config/env";
import { AppError } from "../types";
import { logger } from "../lib/logger";

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

function getJwtSecrets(): string[] {
  const env = getEnv();
  if (!env.JWT_SECRET) return [];
  return env.JWT_SECRET.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

    const secrets = getJwtSecrets();
    if (secrets.length > 0) {
      for (const secret of secrets) {
        try {
          const decoded = jwt.verify(token, secret) as {
            sub: string;
            email?: string;
            exp?: number;
          };
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            throw new AppError("UNAUTHORIZED", "Token expired", 401);
          }
          req.authUser = {
            userId: decoded.sub,
            email: decoded.email ?? "unknown",
          };
          next();
          return;
        } catch (err) {
          if (err instanceof AppError) throw err;
          // Try next secret
        }
      }
      logger.warn(
        "All JWT secrets failed verification, falling back to Supabase",
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
