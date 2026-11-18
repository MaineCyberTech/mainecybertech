import { z } from "zod";
import { AppError } from "../types";

/**
 * Zod 4 keeps `.default()` when an object schema is made partial: a PATCH that
 * omits a defaulted field still receives the default and writes it. Zod 3
 * dropped top-level defaults under `.partial()`. Strip them first so update
 * schemas only contain fields the caller actually sent.
 */
type WithoutDefault<T> = T extends z.ZodDefault<infer I extends z.ZodType> ? I : T;

type PartialUpdateShape<T extends z.ZodRawShape> = {
  [K in keyof T]: z.ZodOptional<WithoutDefault<T[K]>>;
};

export function partialUpdateSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): z.ZodObject<PartialUpdateShape<T>> {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => {
      const typed = field as unknown as z.ZodTypeAny;
      const inner = (typed instanceof z.ZodDefault ? typed.unwrap() : typed) as z.ZodTypeAny;
      return [key, inner.optional()];
    }),
  ) as PartialUpdateShape<T>;
  return z.object(shape);
}

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
  return partialUpdateSchema(z.object(shape)).parse(body) as Record<string, unknown>;
}
