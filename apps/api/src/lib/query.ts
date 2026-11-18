import type { Request } from "express";

/**
 * Helpers for normalizing Express query/route values.
 *
 * `req.query.X` is typed `string | string[] | ParsedQs | ParsedQs[] | undefined`.
 * Casting it (`req.query.X as string`) silences TypeScript but is a runtime lie:
 * `?organization_id=a&organization_id=b` yields an array, which can silently
 * change the behavior of a database filter. These helpers coerce to the shape
 * the caller actually expects.
 */

/** Coerce an Express query value to a single string (or undefined). */
export function queryString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((v): v is string => typeof v === "string");
    return first;
  }
  return undefined;
}

/** Coerce an Express query value to an integer, returning `fallback` on NaN/absent. */
export function queryInt(value: unknown, fallback: number): number;
export function queryInt(value: unknown, fallback?: number): number | undefined;
export function queryInt(value: unknown, fallback?: number): number | undefined {
  const raw = queryString(value);
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Coerce an Express query value to a string array (repeated params). */
export function queryStringArray(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

/**
 * Pin a query parameter on the request.
 *
 * Express 5 defines `req.query` as a prototype getter with no setter, so the
 * old `req.query = { ...req.query, key: value }` pattern throws a TypeError and
 * is surfaced as a 500. Define an own data property instead (the same approach
 * used for `req.ip`). `configurable: true` allows a later middleware to pin a
 * second parameter on the same request.
 */
export function pinQueryParam(req: Request, key: string, value: string): void {
  Object.defineProperty(req, "query", {
    value: { ...(req.query as Record<string, unknown>), [key]: value },
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
