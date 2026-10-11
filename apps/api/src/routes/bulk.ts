import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { success, AppError } from "../types";
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
<<<<<<< HEAD
    let createdAccounts = 0;
=======
    const validEntries: Array<{ index: number; email: string; fullName: string }> = [];
>>>>>>> e04d721e (perf: cache public storefront reads, memoize permission resolution, batch bulk invites, cap SSE streams)

    entries.forEach((entry, index) => {
      if (!entry.email || !entry.email.includes("@")) {
        results[index] = { email: entry.email || "?", status: "error", message: "Invalid email" };
        return;
      }
      validEntries.push({ index, email: entry.email, fullName: entry.fullName });
    });

    // PERF-P2-004: batch the profile and membership lookups into set queries
    // (and the new memberships into one insert) instead of 4 sequential
    // Supabase calls per invite. A duplicate address inside one batch is
    // reported as skipped — the old per-invite loop caught it via the
    // membership lookup after the first insert.
    const uniqueEntries = new Map<string, { index: number; email: string; fullName: string }>();
    for (const entry of validEntries) {
      if (uniqueEntries.has(entry.email)) {
        results[entry.index] = {
          email: entry.email,
          status: "skipped",
          message: "Duplicate email in request",
        };
        continue;
      }
      uniqueEntries.set(entry.email, entry);
    }

    // PostgREST `in` lists ride in the URL, so chunk large batches.
    const LOOKUP_CHUNK_SIZE = 200;

    const profileIdByEmail = new Map<string, string>();
    const emails = [...uniqueEntries.keys()];
    for (let i = 0; i < emails.length; i += LOOKUP_CHUNK_SIZE) {
      const chunk = emails.slice(i, i + LOOKUP_CHUNK_SIZE);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", chunk);
      if (profileError) throw new AppError("DB_ERROR", profileError.message, 500);
      for (const profile of profiles ?? []) {
        if (profile.email) profileIdByEmail.set(String(profile.email).toLowerCase(), profile.id);
      }
    }

    // Auth-account creation is the one call the admin API cannot batch; it is
    // kept sequential so a partial failure still reports per-row results.
    const userIdByEmail = new Map<string, string>();
    for (const entry of uniqueEntries.values()) {
      const existingId = profileIdByEmail.get(entry.email);
      if (existingId) {
        userIdByEmail.set(entry.email, existingId);
        continue;
      }

      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: entry.email,
          password: Array.from(
            { length: 16 },
            () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
          ).join(""),
          email_confirm: true,
          user_metadata: { full_name: entry.fullName },
        });

<<<<<<< HEAD
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
=======
        if (signUpError || !signUpData.user) {
          results[entry.index] = {
            email: entry.email,
            status: "error",
            message: signUpError?.message || "Failed to create user",
          };
>>>>>>> e04d721e (perf: cache public storefront reads, memoize permission resolution, batch bulk invites, cap SSE streams)
          continue;
        }
        userIdByEmail.set(entry.email, signUpData.user.id);
      } catch (err: unknown) {
        results[entry.index] = {
          email: entry.email,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    // One membership lookup per chunk covering every resolved user in the org.
    const membershipStatusByUser = new Map<string, string>();
    const userIds = [...new Set(userIdByEmail.values())];
    for (let i = 0; i < userIds.length; i += LOOKUP_CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + LOOKUP_CHUNK_SIZE);
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("user_id, status")
        .eq("organization_id", organizationId)
        .in("user_id", chunk);
      if (membershipError) throw new AppError("DB_ERROR", membershipError.message, 500);
      for (const membership of memberships ?? []) {
        membershipStatusByUser.set(membership.user_id, membership.status);
      }
    }

    const toInvite: Array<{
      entry: { index: number; email: string; fullName: string };
      userId: string;
    }> = [];
    for (const entry of uniqueEntries.values()) {
      const userId = userIdByEmail.get(entry.email);
      if (!userId) continue; // account creation failed; already reported
      const existingStatus = membershipStatusByUser.get(userId);
      if (existingStatus) {
        results[entry.index] = {
          email: entry.email,
          status: "skipped",
          message: `Already has membership (${existingStatus})`,
        };
        continue;
      }
      toInvite.push({ entry, userId });
    }

    // Single insert for every pending membership (one round-trip, not N).
    if (toInvite.length > 0) {
      const { error: insertError } = await supabase.from("memberships").insert(
        toInvite.map(({ userId }) => ({
          organization_id: organizationId,
          user_id: userId,
          role_id: roleId,
          status: "pending",
          invited_by: req.authUser!.userId,
<<<<<<< HEAD
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
=======
        })),
      );
      for (const { entry } of toInvite) {
        results[entry.index] = insertError
          ? { email: entry.email, status: "error", message: insertError.message }
          : { email: entry.email, status: "invited", message: "Invited to organization" };
>>>>>>> e04d721e (perf: cache public storefront reads, memoize permission resolution, batch bulk invites, cap SSE streams)
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
