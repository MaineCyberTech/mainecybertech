import { z } from "zod";

/**
 * Partial update for a membership. `roleId` is optional so status-only
 * transitions (approve/reject from the admin queue) do not need to resend the
 * role — an empty string fails UUID validation (USE-P1-003). Omitted fields
 * are left untouched by the PATCH handler.
 */
export const updateMembershipSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(["pending", "approved", "rejected", "suspended"]),
  isBillingContact: z.boolean().optional(),
  isSecurityContact: z.boolean().optional(),
});
