import { Router } from "express";
import { z } from "zod";
import type { Database } from "@mct/sdk/database.types";
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

type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];

// PERF-P2-004: PostgREST `in` lists ride in the URL, so a 500-invite batch
// must not build a multi-KB request. 100 emails/ids per chunk stays well under
// the proxy header limits while cutting the per-invite round trips to one
// lookup and one insert per chunk.
const INVITE_CHUNK_SIZE = 100;

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

    type InviteResult = { email: string; status: string; message: string };

    // PERF-P2-004: results stay indexed by the caller's row order even though
    // the work below is batched; every slot is filled (invalid, duplicate,
    // skipped, invited or error) before the response is built.
    const results: Array<InviteResult | undefined> = new Array(entries.length);
    let createdAccounts = 0;

    // Split invalid rows out without any DB work, and collapse duplicate
    // addresses: the first occurrence owns the invite; a repeat is reported as
    // skipped (the previous sequential loop saw the membership the first
    // occurrence had just created).
    const pending: Array<{ index: number; email: string; fullName: string }> = [];
    const seenEmails = new Set<string>();
    entries.forEach((entry, index) => {
      if (!entry.email || !entry.email.includes("@")) {
        results[index] = { email: entry.email || "?", status: "error", message: "Invalid email" };
        return;
      }
      if (seenEmails.has(entry.email)) {
        results[index] = {
          email: entry.email,
          status: "skipped",
          message: "Duplicate email in request",
        };
        return;
      }
      seenEmails.add(entry.email);
      pending.push({ index, email: entry.email, fullName: entry.fullName });
    });

    const profileIdByEmail = new Map<string, string>();
    const membershipStatusByUser = new Map<string, string>();
    const userIdByEmail = new Map<string, string>();
    const createdEmails = new Set<string>();

    for (let i = 0; i < pending.length; i += INVITE_CHUNK_SIZE) {
      const batch = pending.slice(i, i + INVITE_CHUNK_SIZE);

      // One profile lookup per chunk instead of one query per invite. `email`
      // is citext, so matching is case-insensitive; key the map by lowercase.
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in(
          "email",
          batch.map((item) => item.email),
        );
      if (profileError) throw new AppError("DB_ERROR", profileError.message, 500);
      for (const profile of profiles ?? []) {
        if (profile.email) {
          profileIdByEmail.set(String(profile.email).toLowerCase(), profile.id);
        }
      }

      // ADMIN-P2-004: auth accounts are still created one at a time — the
      // invite endpoint is the only way to mint an unconfirmed account, and
      // per-user calls preserve the per-row error reporting.
      for (const item of batch) {
        const existingId = profileIdByEmail.get(item.email);
        if (existingId) {
          userIdByEmail.set(item.email, existingId);
          continue;
        }
        try {
          const { data: inviteData, error: inviteError } =
            await supabase.auth.admin.inviteUserByEmail(item.email, {
              data: { full_name: item.fullName },
            });
          if (inviteError || !inviteData?.user) {
            results[item.index] = {
              email: item.email,
              status: "error",
              message: inviteError?.message || "Failed to invite user",
            };
            continue;
          }
          userIdByEmail.set(item.email, inviteData.user.id);
          createdEmails.add(item.email);
          createdAccounts++;
        } catch (err: unknown) {
          results[item.index] = {
            email: item.email,
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }

      // One membership lookup per chunk covering every resolved user.
      const userIds = [
        ...new Set(
          batch
            .map((item) => userIdByEmail.get(item.email))
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      if (userIds.length > 0) {
        const { data: memberships, error: membershipError } = await supabase
          .from("memberships")
          .select("user_id, status")
          .eq("organization_id", organizationId)
          .in("user_id", userIds);
        if (membershipError) throw new AppError("DB_ERROR", membershipError.message, 500);
        for (const membership of memberships ?? []) {
          membershipStatusByUser.set(membership.user_id, membership.status);
        }
      }

      const toInvite = batch.filter((item) => {
        const userId = userIdByEmail.get(item.email);
        if (!userId) return false; // invite failed; already reported
        const existingStatus = membershipStatusByUser.get(userId);
        if (existingStatus) {
          results[item.index] = {
            email: item.email,
            status: "skipped",
            message: `Already has membership (${existingStatus})`,
          };
          return false;
        }
        return true;
      });

      // One multi-row insert per chunk instead of one insert per invite.
      if (toInvite.length > 0) {
        const { error: insertError } = await supabase.from("memberships").insert(
          toInvite.map(
            (item): MembershipInsert => ({
              organization_id: organizationId,
              user_id: userIdByEmail.get(item.email)!,
              role_id: roleId,
              status: "pending",
              invited_by: req.authUser!.userId,
            }),
          ),
        );
        for (const item of toInvite) {
          results[item.index] = insertError
            ? { email: item.email, status: "error", message: insertError.message }
            : {
                email: item.email,
                status: "invited",
                message: createdEmails.has(item.email)
                  ? "Invite email sent; account awaits email confirmation"
                  : "Invited to organization",
              };
        }
      }
    }

    const finalResults: InviteResult[] = results.map(
      (result, index) =>
        result ?? {
          email: entries[index].email || "?",
          status: "error",
          message: "Unknown error",
        },
    );

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "membership.bulk_invite",
      entityType: "membership",
      metadata: {
        organizationId,
        roleId,
        total: entries.length,
        invited: finalResults.filter((r) => r.status === "invited").length,
        created: createdAccounts,
        skipped: finalResults.filter((r) => r.status === "skipped").length,
        errors: finalResults.filter((r) => r.status === "error").length,
      },
    });

    res.json(success({ results: finalResults }));
  } catch (error) {
    next(error);
  }
});

export default router;
