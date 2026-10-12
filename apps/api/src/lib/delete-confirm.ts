import { z } from "zod";
import { AppError } from "../types";

export const deleteConfirmSchema = z.object({
  confirm: z.literal(true),
});

export function assertDeleteConfirmed(body: unknown): void {
  const result = deleteConfirmSchema.safeParse(body);
  if (!result.success) {
    throw new AppError(
      "CONFIRMATION_REQUIRED",
      "Destructive delete requires an explicit confirmation body: { confirm: true }",
      400,
    );
  }
}

/**
 * ADMIN-P2-002: organization delete is the highest-blast-radius destructive
 * action in the product (FK `on delete cascade` across the tenant schema), so a
 * bare `{ confirm: true }` is not enough. The caller must also echo the
 * organization's slug — the typed-name pattern already used by the web delete
 * dialogs (USE-P2-003 / PR #229). Recovery of a deleted organization is
 * operator-only (PITR or an S3 backup restore, see
 * `docs/ROLLBACK_PROCEDURES.md` §3), which is why the confirmation is typed.
 */
export const orgDeleteConfirmSchema = z.object({
  confirm: z.literal(true),
  slug: z.string().min(1),
});

export function assertOrgDeleteConfirmed(
  body: unknown,
  org: { name: string; slug: string },
): void {
  const result = orgDeleteConfirmSchema.safeParse(body);
  if (!result.success) {
    throw new AppError(
      "CONFIRMATION_REQUIRED",
      `Deleting an organization is permanent. Send { confirm: true, slug: "<slug>" } with the organization slug "${org.slug}" to confirm.`,
      400,
    );
  }

  if (result.data.slug.trim().toLowerCase() !== org.slug.trim().toLowerCase()) {
    throw new AppError(
      "CONFIRMATION_REQUIRED",
      `The typed slug does not match. Type "${org.slug}" to confirm permanent deletion of ${org.name}.`,
      400,
    );
  }
}
