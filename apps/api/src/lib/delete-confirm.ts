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
