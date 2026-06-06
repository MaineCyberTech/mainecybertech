import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth, requireAdmin);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

router.post("/invite", async (req, res, next) => {
  try {
    const { csv, organizationId, roleId } = req.body as {
      csv?: string;
      organizationId?: string;
      roleId?: string;
    };

    if (!csv || !organizationId || !roleId) {
      throw new AppError("VALIDATION", "csv, organizationId, and roleId are required", 400);
    }

    const supabase = getSupabaseAdmin();
    const lines = csv.split("\n").filter((l) => l.trim());
    const results: Array<{ email: string; status: string; message: string }> = [];

    for (const line of lines) {
      const cols = parseCSVLine(line);
      const email = cols[0]?.toLowerCase().trim();
      const fullName = cols[1]?.trim() || email?.split("@")[0] || "User";

      if (!email || !email.includes("@")) {
        results.push({ email: email || "?", status: "error", message: "Invalid email" });
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
          results.push({ email, status: "exists", message: "User exists" });
        } else {
          const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password: Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""),
            email_confirm: true,
            user_metadata: { full_name: fullName },
          });

          if (signUpError || !signUpData.user) {
            results.push({ email, status: "error", message: signUpError?.message || "Failed to create user" });
            continue;
          }
          userId = signUpData.user.id;
          results.push({ email, status: "created", message: "Account created" });
        }

        const { data: existingMembership } = await supabase
          .from("memberships")
          .select("id, status")
          .eq("organization_id", organizationId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingMembership) {
          results.push({ email, status: "skipped", message: `Already has membership (${existingMembership.status})` });
          continue;
        }

        await supabase.from("memberships").insert({
          organization_id: organizationId,
          user_id: userId,
          role_id: roleId,
          status: "pending",
          invited_by: req.authUser!.userId,
        });

        results.push({ email, status: "invited", message: "Invited to organization" });
      } catch (err: any) {
        results.push({ email, status: "error", message: err?.message || "Unknown error" });
      }
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.bulk_invite",
      entityType: "membership",
      metadata: {
        organizationId,
        roleId,
        total: lines.length,
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
