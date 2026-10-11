import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requireAdmin } from "../middleware/admin";
import { rateLimitAdminOps } from "../middleware/rate-limit";
import { assertCanAssignRole, resolveRoleKey } from "../lib/role-assignment";

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

router.post("/invite", rateLimitAdminOps, async (req, res, next) => {
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

    // SEC-P1-001: the bulk invite assigns the same role to every row — guard
    // it once up front (cross-tenant roles require a platform super admin).
    const bulkRoleKey = await resolveRoleKey(supabase, roleId);
    await assertCanAssignRole(supabase, req.authUser!.userId, bulkRoleKey);

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
    let createdAccounts = 0;

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

        let createdAccount = false;

        if (existingProfile) {
          userId = existingProfile.id;
        } else {
          // ADMIN-P2-004: bulk invite must never mint pre-confirmed accounts.
          // `inviteUserByEmail` creates the auth user unconfirmed and emails an
          // invite link; the account only becomes usable once the invitee
          // proves control of the mailbox and sets a password. The previous
          // `createUser({ email_confirm: true })` path skipped both steps and
          // handed every CSV row a silently usable account.
          const { data: inviteData, error: inviteError } =
            await supabase.auth.admin.inviteUserByEmail(email, {
              data: { full_name: fullName },
            });

          if (inviteError || !inviteData?.user) {
            results.push({
              email,
              status: "error",
              message: inviteError?.message || "Failed to invite user",
            });
            continue;
          }
          userId = inviteData.user.id;
          createdAccount = true;
          createdAccounts++;
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
          message: createdAccount
            ? "Invite email sent; account awaits email confirmation"
            : "Invited to organization",
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
        created: createdAccounts,
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
