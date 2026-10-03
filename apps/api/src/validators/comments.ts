import { z } from "zod";

/**
 * Shared schema for module comments (findings/assets/proposals/etc).
 *
 * `body` was previously read straight off `req.body` with no maximum length,
 * so a caller could store unbounded text; `isInternal` was likewise an
 * unvalidated client-supplied flag.
 */
export const moduleCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000),
  isInternal: z.boolean().optional(),
});
