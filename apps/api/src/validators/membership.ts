import { z } from "zod";

export const updateMembershipSchema = z.object({
  roleId: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected"]),
  isBillingContact: z.boolean().default(false),
  isSecurityContact: z.boolean().default(false),
});
