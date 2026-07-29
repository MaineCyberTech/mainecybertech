import { z } from "zod";

export const updateMembershipSchema = z.object({
  roleId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "suspended"]),
  isBillingContact: z.boolean().default(false),
  isSecurityContact: z.boolean().default(false),
});
