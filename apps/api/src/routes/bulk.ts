import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth, requireOrgAccess, requireAdmin);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

router.post("/invite", async (req, res, next) => {
  try {
    const { invites, csv, organizationId, roleId } = z
      .object({
        organizationId: z.string().min(1, "Organization ID is required"),
        roleId: z.string().min(1, "Role ID is required"),
        csv: z.string().optional(),
        invites: z
          .array(z.object({ email: z.string().min(1), fullName: z.string().optional() }))
          .optional(),
      })
      .refine(
        (v) => Boolean(v.csv?.trim()) || Boolean(v.invites?.length),
        "CSV data or invites array is required",
      )
      .parse(req.body);

    const supabase = getSupabaseAdmin();

    type Entry = { email: string; fullName: string };
    const entries: Entry[] = [];
    if (csv && csv.trim()) {
      for (const line of csv.split("\n")) {
        const cols = parseCSVLine(line);
        const email = cols[0]?.toLowerCase().trim();
        // Keep invalid rows so the per-row error result is still reported.
        entries.push({ email, fullName: cols[1]?.trim() || email.split("@")[0] || "User" });
      }
    }
    if (invites?.length) {
      for (const inv of invites) {
        const email = inv.email.toLowerCase().trim();
        entries.push({ email, fullName: inv.fullName?.trim() || email.split("@")[0] || "User" });
      }
    }

    if (entries.length > 500) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION",
          message: "Maximum 500 invites per request",
          status: 400,
        },
      });
      return;
    }

    const results: Array<{ email: string; status: string; message: string }> = [];

    for (const entry of entries) {
      const email = entry.email;
      const fullName = entry.fullName;

      if (!email || !email.includes("@")) {
        results.push({
          email: email || "?",
          status: "error",
          message: "Invalid email",
        });
        continue;
      }

      try {
        let userId: string | null = null;

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          userId = existingProfile.id;
        } else {
          const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password: Array.from(
              { length: 16 },
              () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
            ).join(""),
            email_confirm: true,
            user_metadata: { full_name: fullName },
          });

          if (signUpError || !signUpData.user) {
            results.push({
              email,
              status: "error",
              message: signUpError?.message || "Failed to create user",
            });
            continue;
          }
          userId = signUpData.user.id;
        }

        const { data: existingMembership } = await supabase
          .from("memberships")
          .select("id, status")
          .eq("organization_id", organizationId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingMembership) {
          results.push({
            email,
            status: "skipped",
            message: `Already has membership (${existingMembership.status})`,
          });
          continue;
        }

        await supabase.from("memberships").insert({
          organization_id: organizationId,
          user_id: userId,
          role_id: roleId,
          status: "pending",
          invited_by: req.authUser!.userId,
        });

        // One result row per email: existing or newly-created users both end
        // up invited (pending membership). (Fixed double-push from prior code.)
        results.push({
          email,
          status: "invited",
          message: "Invited to organization",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          email,
          status: "error",
          message,
        });
      }
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.bulk_invite",
      entityType: "membership",
      metadata: {
        organizationId,
        roleId,
        total: entries.length,
        invited: results.filter((r) => r.status === "invited").length,
        created: results.filter((r) => r.status === "created").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    });

    res.json(success({ results }));
  } catch (error) {
    next(error);
  }
});

export default router;
