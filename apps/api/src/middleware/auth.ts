import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "../services/supabase";
import { getEnv } from "../config/env";
import { AppError } from "../types";
import { logger } from "../lib/logger";
import { requiresSecondFactor } from "../lib/mfa";
import { authenticateApiKey, isApiKeyToken } from "./api-key";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        email: string;
      };
      /**
       * Populated by `requireAuth` when the request authenticated with an
       * `mct_*` API key instead of a session JWT (see middleware/api-key.ts).
       */
      apiKey?: {
        id: string;
        organizationId: string;
        permissions: string[];
        prefix: string;
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

    // API keys (`mct_*`) are machine credentials, not session JWTs. Resolve
    // them before the JWT/Supabase paths (both of which would 401 them) and pin
    // the request to the key's organization so downstream
    // requireOrgAccess/requirePermission still scope what the key may do.
    if (token && isApiKeyToken(token)) {
      const apiKey = await authenticateApiKey(token);
      req.authUser = { userId: apiKey.userId, email: "api-key" };
      req.apiKey = {
        id: apiKey.id,
        organizationId: apiKey.organizationId,
        permissions: apiKey.permissions,
        prefix: apiKey.prefix,
      };
      req.orgScope = {
        orgId: apiKey.organizationId,
        explicit: true,
        platformAdmin: false,
        impersonation: false,
      };
      req.orgId = apiKey.organizationId;
      // The org resolved by requireOrgAccess is read from the query string, so
      // inject the key's org and overwrite any caller-supplied org id.
      req.query = { ...req.query, organization_id: apiKey.organizationId };
      next();
      return;
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
          // Pin the algorithm to prevent algorithm-confusion attacks. On
          // mismatch this throws and falls through to the Supabase check, so
          // an asymmetric-signed project still authenticates via the fallback.
          const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as {
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
          if (await requiresSecondFactor(token, decoded.sub, req.originalUrl)) {
            throw new AppError(
              "MFA_REQUIRED",
              "Complete multi-factor authentication to continue",
              403,
            );
          }
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

    if (await requiresSecondFactor(token, data.user.id, req.originalUrl)) {
      throw new AppError("MFA_REQUIRED", "Complete multi-factor authentication to continue", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}
