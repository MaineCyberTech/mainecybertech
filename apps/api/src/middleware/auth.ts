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
      userJwt?: string;
      /**
       * Resolved tenant scope, populated by `requireOrgAccess` /
       * `requireOrgAccessByParam` (see middleware/org-access.ts). Handlers that
       * load tenant-scoped rows should verify ownership with
       * `assertResourceOrg` (lib/tenant.ts) rather than trusting the URL param.
       */
      orgScope?: {
        orgId: string | null;
        explicit: boolean;
        platformAdmin: boolean;
        impersonation: boolean;
      };
      /** Convenience alias for `orgScope.orgId` (may be null for platform admins without an explicit org). */
      orgId?: string | null;
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

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
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
      throw new AppError("UNAUTHORIZED", "Missing or invalid authorization header", 401);
    }

    req.userJwt = token;

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
      logger.warn("All JWT secrets failed verification, falling back to Supabase");
    }

    const supabase = getSupabaseAdmin();

    // Bound the fallback lookup — an unresponsive Supabase must not hang the
    // request (AbortSignal.timeout is supported on Node 20+).
    type GetUserResult = {
      data: { user: { id: string; email?: string } | null } | null;
      error: Error | null;
    };
    const getUserWithTimeout = (
      supabase.auth.getUser as unknown as (
        token: string,
        options: { signal: AbortSignal },
      ) => Promise<GetUserResult>
    ).bind(supabase.auth);
    const { data, error } = await getUserWithTimeout(token, {
      signal: AbortSignal.timeout(5000),
    }).catch((err: unknown) => {
      const isTimeout =
        (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) ||
        (typeof err === "object" &&
          err !== null &&
          ((err as { name?: unknown }).name === "TimeoutError" ||
            (err as { name?: unknown }).name === "AbortError"));
      if (isTimeout) {
        return { data: null, error: new Error("Session verification timed out") };
      }
      throw err;
    });
    if (error || !data?.user) {
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
