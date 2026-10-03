import { z } from "zod";
import { AppError } from "../types";

/**
 * Parse an update body against a *partial* version of a resource's create
 * schema, so only declared fields can be written.
 *
 * Generic CRUD factories previously copied every key from `req.body` into the
 * UPDATE payload (snake-cased), which is a mass-assignment hole: a caller
 * could set `organization_id`, `id`, `created_by`, or any other column.
 * Deriving the whitelist from the create schema closes that without a
 * per-resource hand-written update schema.
 */
export function parsePartialUpdate(createSchema: unknown, body: unknown): Record<string, unknown> {
  const shape = (createSchema as { shape?: z.ZodRawShape } | null | undefined)?.shape;
  if (!shape) {
    throw new AppError("VALIDATION", "Update is not supported for this resource", 400);
  }
  return z.object(shape).partial().parse(body) as Record<string, unknown>;
}
