import type { Request } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "./logger";
import { roleKeyOf } from "./roles";

/**
 * Client-portal visibility scoping.
 *
 * Several module tables carry a `visibility` column (`internal` vs
 * `client_visible`). Historically the API wrote that column but never read it,
 * so portal list/detail endpoints returned internal records to client roles.
 *
 * The client portal is characterised by client role keys, not by the absence of
 * a permission: MSP staff (admin, technician, dispatcher, …) must keep seeing
 * the full internal set. We therefore resolve the caller's role in the active
 * org once per request and apply a visibility predicate only for client roles.
 *
 * Legacy data uses `client` / `org` / `organization` (and sometimes `public`)
 * interchangeably with `client_visible`; accept them all so enabling the filter
 * does not blank out existing client-visible records.
 */
export const CLIENT_ROLE_KEYS = [
  "client_admin",
  "client_user",
  "client-viewer",
  "client-billing",
] as const;

export const CLIENT_VISIBLE_VALUES = [
  "client_visible",
  "client",
  "org",
  "organization",
  "public",
] as const;

const CLIENT_MEMBER_CACHE = Symbol("mct.clientMember");

type RequestWithCache = Request & {
  [CLIENT_MEMBER_CACHE]?: boolean;
};

function activeOrgId(req: Request): string | null {
  const query = req.query?.organization_id;
  if (typeof query === "string" && query.length > 0) return query;

  const bodyOrg = req.body?.organizationId;
  if (typeof bodyOrg === "string" && bodyOrg.length > 0) return bodyOrg;

  const header = req.headers?.["x-active-org"];
  if (typeof header === "string" && header.length > 0) return header;

  const cookieOrg = (req.cookies as Record<string, string> | undefined)?.["mct_active_org"];
  if (typeof cookieOrg === "string" && cookieOrg.length > 0) return cookieOrg;

  if (typeof req.orgId === "string" && req.orgId.length > 0) return req.orgId;

  return null;
}

/**
 * True when the authenticated caller has a client role in the active org.
 * Platform admins / MSP staff return false and therefore see everything.
 *
 * Results are memoised on the request object (the portal page makes several
 * data calls per render, but each HTTP request is independent).
 */
export async function isClientMember(req: Request): Promise<boolean> {
  const cached = (req as RequestWithCache)[CLIENT_MEMBER_CACHE];
  if (cached !== undefined) return cached;

  const userId = req.authUser?.userId;
  const orgId = activeOrgId(req);

  if (!userId || !orgId || req.apiKey) {
    (req as RequestWithCache)[CLIENT_MEMBER_CACHE] = false;
    return false;
  }

  let result = false;
  try {
    const { data } = await getSupabaseAdmin()
      .from("memberships")
      .select("roles!inner(key)")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .eq("status", "approved")
      .maybeSingle();

    const roleKey = roleKeyOf((data as { roles?: unknown } | null)?.roles);
    result = roleKey != null && (CLIENT_ROLE_KEYS as readonly string[]).includes(roleKey);
  } catch (err) {
    // A membership lookup failure must not 500 every portal read. Fail open to
    // the staff view (the caller is already authenticated and org-scoped) and
    // log it so the visibility regression is observable.
    logger.warn({ err, userId, orgId }, "client-visibility membership lookup failed");
    result = false;
  }

  (req as RequestWithCache)[CLIENT_MEMBER_CACHE] = result;
  return result;
}

/**
 * Apply the client-visible predicate to a Supabase query builder. The builder
 * type differs per table, so this intentionally accepts and returns a
 * structurally-compatible builder (callers keep their own inferred type).
 */
export async function applyClientVisibility<T>(
  query: T,
  req: Request,
  column = "visibility",
): Promise<{ query: T }> {
  if (!(await isClientMember(req))) return { query };
  return {
    query: (query as { in: (column: string, values: readonly string[]) => T }).in(
      column,
      CLIENT_VISIBLE_VALUES,
    ),
  };
}

/** Apply a published/active predicate for content that has a status column. */
export async function applyPublishedStatus<T>(
  query: T,
  req: Request,
  column = "status",
  allowed: readonly string[] = ["published", "active"],
): Promise<{ query: T }> {
  if (!(await isClientMember(req))) return { query };
  return {
    query: (query as { in: (column: string, values: readonly string[]) => T }).in(column, allowed),
  };
}

/** True when a row may be returned to the (possibly client) caller. */
export async function isClientVisible(
  req: Request,
  row: Record<string, unknown> | null | undefined,
  column = "visibility",
): Promise<boolean> {
  if (!row) return false;
  if (!(await isClientMember(req))) return true;
  return CLIENT_VISIBLE_VALUES.includes(
    String(row[column]) as (typeof CLIENT_VISIBLE_VALUES)[number],
  );
}

/** Apply an `is_published = true` predicate for boolean-published content. */
export async function applyClientPublished<T>(
  query: T,
  req: Request,
  column = "is_published",
): Promise<{ query: T }> {
  if (!(await isClientMember(req))) return { query };
  return {
    query: (query as { eq: (column: string, value: boolean) => T }).eq(column, true),
  };
}

/**
 * True when a content row is published/active for the (possibly client)
 * caller. Handles both boolean (`is_published`) and string (`status`) columns.
 */
export async function isPublishedForClient(
  req: Request,
  row: Record<string, unknown> | null | undefined,
  column = "status",
  allowed: readonly string[] = ["published", "active"],
): Promise<boolean> {
  if (!row) return false;
  if (!(await isClientMember(req))) return true;

  const value = row[column];
  if (typeof value === "boolean") return value;
  return allowed.includes(String(value));
}
