import { Router } from "express";
import multer from "multer";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccessByParam } from "../middleware/org-access";
import { responseCacheNoRenew, invalidateCache } from "../middleware/cache";
import {
  requireIfMatch,
  checkVersionMatch,
} from "../middleware/optimistic-locking";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
import { requireAdmin } from "../middleware/admin";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createDomainSchema,
  updateDomainSchema,
} from "../validators/organization";

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.get("/", responseCacheNoRenew(60), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase.from("organizations").select("*");

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const idsFilter = req.query.ids as string | undefined;
    if (idsFilter) {
      const ids = idsFilter.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    }

    const { data, error } = await query.order("name");

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireOrgAccessByParam, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      throw new AppError("NOT_FOUND", "Organization not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/detail", requireOrgAccessByParam, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (orgError || !org)
      throw new AppError("NOT_FOUND", "Organization not found", 404);

    const [
      { data: domains, error: domError },
      { data: memberships, error: memError },
    ] = await Promise.all([
      supabase
        .from("organization_domains")
        .select("*")
        .eq("organization_id", req.params.id),
      supabase
        .from("memberships")
        .select(
          "id, user_id, role_id, status, is_billing_contact, is_security_contact, created_at",
        )
        .eq("organization_id", req.params.id),
    ]);

    if (domError) throw new AppError("DB_ERROR", domError.message, 500);
    if (memError) throw new AppError("DB_ERROR", memError.message, 500);

    const memberUserIds = [
      ...new Set(
        (memberships ?? []).map((m: { user_id: string }) => m.user_id),
      ),
    ];
    const memberRoleIds = [
      ...new Set(
        (memberships ?? []).map((m: { role_id: string }) => m.role_id),
      ),
    ];

    const [
      { data: profiles, error: profError },
      { data: roles, error: rolesError },
    ] = await Promise.all([
      memberUserIds.length > 0
        ? supabase
            .from("profiles")
            .select(
              "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
            )
            .in("id", memberUserIds)
        : { data: [], error: null },
      memberRoleIds.length > 0
        ? supabase.from("roles").select("id, key, name").in("id", memberRoleIds)
        : { data: [], error: null },
    ]);

    if (profError) throw new AppError("DB_ERROR", profError.message, 500);
    if (rolesError) throw new AppError("DB_ERROR", rolesError.message, 500);

    res.json(
      success({
        organization: org,
        domains: domains ?? [],
        memberships: memberships ?? [],
        profiles: profiles ?? [],
        roles: roles ?? [],
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createOrganizationSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: parsed.name,
        slug: parsed.slug,
        primary_domain: parsed.primaryDomain ?? null,
        support_plan: parsed.supportPlan ?? null,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "organization.create",
      entityType: "organization",
      entityId: data.id,
      metadata: { name: parsed.name },
    });

    invalidateCache(`/api/v1/organizations`);
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAdmin, requireIfMatch, async (req, res, next) => {
  try {
    const parsed = updateOrganizationSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: current, error: fetchError } = await supabase
      .from("organizations")
      .select("version")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !current) {
      throw new AppError("NOT_FOUND", "Organization not found", 404);
    }

    checkVersionMatch(current.version, req.ifMatchVersion);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.slug !== undefined) updateData.slug = parsed.slug;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.primaryDomain !== undefined)
      updateData.primary_domain = parsed.primaryDomain;
    if (parsed.supportPlan !== undefined)
      updateData.support_plan = parsed.supportPlan;
    if (parsed.logoUrl !== undefined) updateData.logo_url = parsed.logoUrl;
    if (parsed.brandColor !== undefined)
      updateData.brand_color = parsed.brandColor;
    if (parsed.accentColor !== undefined)
      updateData.accent_color = parsed.accentColor;
    if (parsed.customDomain !== undefined)
      updateData.custom_domain = parsed.customDomain;

    updateData.version = current.version + 1;

    const { data, error } = await supabase
      .from("organizations")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("version", current.version)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data)
      throw new AppError(
        "VERSION_CONFLICT",
        "Organization was modified by another user",
        409,
      );

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "organization.update",
      entityType: "organization",
      entityId: data.id,
      metadata: parsed,
    });

    invalidateCache(`/api/v1/organizations`);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "organization.delete",
      entityType: "organization",
      entityId: String(req.params.id),
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/:id/domains", requireOrgAccessByParam, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("organization_domains")
      .select("*")
      .eq("organization_id", req.params.id);

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/domains", requireAdmin, async (req, res, next) => {
  try {
    const parsed = createDomainSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("organization_domains")
      .insert({
        organization_id: req.params.id,
        domain: parsed.domain,
        auto_approve: parsed.autoApprove,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "organization.domain.add",
      entityType: "organization_domain",
      entityId: data.id,
      metadata: { domain: parsed.domain },
    });

    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/domains/:domainId", requireAdmin, async (req, res, next) => {
  try {
    const parsed = updateDomainSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("organization_domains")
      .update({ auto_approve: parsed.autoApprove })
      .eq("id", req.params.domainId)
      .eq("organization_id", req.params.id)
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Domain not found", 404);

    await logAuditEvent({
      organizationId: String(req.params.id),
      actorUserId: req.authUser!.userId,
      action: "organization.domain.update",
      entityType: "organization_domain",
      entityId: String(req.params.domainId),
      metadata: { autoApprove: parsed.autoApprove },
    });

    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id/domains/:domainId",
  requireAdmin,
  async (req, res, next) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data: deleted, error } = await supabase
        .from("organization_domains")
        .delete()
        .eq("id", req.params.domainId)
        .eq("organization_id", req.params.id)
        .select()
        .single();

      if (error) throw new AppError("DB_ERROR", error.message, 500);

      await logAuditEvent({
        organizationId: String(req.params.id),
        actorUserId: req.authUser!.userId,
        action: "organization.domain.remove",
        entityType: "organization_domain",
        entityId: String(req.params.domainId),
        metadata: { domain: deleted?.domain ?? null },
      });

      invalidateCache(`/api/v1/organizations`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/logo",
  requireAuth,
  requireOrgAccessByParam,
  upload.single("logo"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new AppError("VALIDATION", "Logo file is required", 400);

      const supabase = getSupabaseAdmin();
      const ext = file.originalname.split(".").pop() ?? "png";
      const storagePath = `${req.authUser!.userId}/org-${req.params.id}-logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || undefined,
          upsert: true,
        });

      if (uploadError)
        throw new AppError("STORAGE_ERROR", uploadError.message, 500);

      const { data: publicUrl } = supabase.storage
        .from("logos")
        .getPublicUrl(storagePath);

      await supabase
        .from("organizations")
        .update({ logo_url: publicUrl.publicUrl })
        .eq("id", req.params.id);

      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "organization.branding",
        entityType: "organization",
        entityId: String(req.params.id),
        metadata: { logo: true },
      });

      res.json(success({ logoUrl: publicUrl.publicUrl }));
    } catch (error) {
      next(error);
    }
  },
);

export default router;
