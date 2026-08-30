import { Router } from "express";
import { getSupabaseAdmin } from "../../services/supabase";
import { logAuditEvent } from "../../services/audit";
import { AppError, success } from "../../types";
import { requirePermission } from "../../middleware/permissions";

export function registerDnsChangeRoutes(router: Router) {
  router.post(
    "/dns-changes/:id/approve",
    requirePermission("dns-changes", "manage"),
    async (req, res, next) => {
      try {
        const supabase = getSupabaseAdmin();
        const orgId = (req.query.organization_id ?? req.body?.organizationId) as
          | string
          | undefined;
        let fetchQuery = supabase.from("dns_change_requests").select("*").eq("id", req.params.id);
        if (orgId) fetchQuery = fetchQuery.eq("organization_id", orgId);
        const { data: existing, error: fetchError } = await fetchQuery.single();
        if (fetchError || !existing)
          throw new AppError("NOT_FOUND", "DNS change request not found", 404);
        if (existing.status !== "pending")
          throw new AppError("INVALID_STATE", "Only pending requests can be approved", 400);
        const { data, error } = await supabase
          .from("dns_change_requests")
          .update({
            status: "approved",
            approved_by: req.authUser!.userId,
          })
          .eq("id", req.params.id)
          .eq("organization_id", existing.organization_id)
          .select()
          .single();
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        if (!data)
          throw new AppError("INVALID_STATE", "Only pending requests can be approved", 400);
        await logAuditEvent({
          organizationId: data.organization_id,
          actorUserId: req.authUser!.userId,
          action: "dns_change.approved",
          entityType: "dns_change_request",
          entityId: data.id,
        });
        res.json(success(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/dns-changes/:id/reject",
    requirePermission("dns-changes", "manage"),
    async (req, res, next) => {
      try {
        const supabase = getSupabaseAdmin();
        const orgId = (req.query.organization_id ?? req.body?.organizationId) as
          | string
          | undefined;
        let fetchQuery = supabase.from("dns_change_requests").select("*").eq("id", req.params.id);
        if (orgId) fetchQuery = fetchQuery.eq("organization_id", orgId);
        const { data: existing, error: fetchError } = await fetchQuery.single();
        if (fetchError || !existing)
          throw new AppError("NOT_FOUND", "DNS change request not found", 404);
        if (existing.status !== "pending")
          throw new AppError("INVALID_STATE", "Only pending requests can be rejected", 400);
        const { data, error } = await supabase
          .from("dns_change_requests")
          .update({ status: "rejected" })
          .eq("id", req.params.id)
          .eq("organization_id", existing.organization_id)
          .select()
          .single();
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        if (!data)
          throw new AppError("INVALID_STATE", "Only pending requests can be rejected", 400);
        await logAuditEvent({
          organizationId: data.organization_id,
          actorUserId: req.authUser!.userId,
          action: "dns_change.rejected",
          entityType: "dns_change_request",
          entityId: data.id,
        });
        res.json(success(data));
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/dns-changes/:id/implement",
    requirePermission("dns-changes", "manage"),
    async (req, res, next) => {
      try {
        const supabase = getSupabaseAdmin();
        const orgId = (req.query.organization_id ?? req.body?.organizationId) as
          | string
          | undefined;
        let fetchQuery = supabase.from("dns_change_requests").select("*").eq("id", req.params.id);
        if (orgId) fetchQuery = fetchQuery.eq("organization_id", orgId);
        const { data: existing, error: fetchError } = await fetchQuery.single();
        if (fetchError || !existing)
          throw new AppError("NOT_FOUND", "DNS change request not found", 404);
        if (existing.status !== "approved")
          throw new AppError("INVALID_STATE", "Only approved requests can be implemented", 400);
        const { data, error } = await supabase
          .from("dns_change_requests")
          .update({
            status: "implemented",
            implemented_at: new Date().toISOString(),
          })
          .eq("id", req.params.id)
          .eq("organization_id", existing.organization_id)
          .select()
          .single();
        if (error) throw new AppError("DB_ERROR", error.message, 500);
        if (!data)
          throw new AppError("INVALID_STATE", "Only approved requests can be implemented", 400);
        await logAuditEvent({
          organizationId: data.organization_id,
          actorUserId: req.authUser!.userId,
          action: "dns_change.implemented",
          entityType: "dns_change_request",
          entityId: data.id,
        });
        res.json(success(data));
      } catch (err) {
        next(err);
      }
    },
  );
}
