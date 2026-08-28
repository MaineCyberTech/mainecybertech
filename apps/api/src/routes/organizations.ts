import { Router } from "express";
import multer from "multer";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccessByParam } from "../middleware/org-access";
import { responseCacheNoRenew, invalidateCache } from "../middleware/cache";
import { requireIfMatch, checkVersionMatch } from "../middleware/optimistic-locking";
import { requireAdmin } from "../middleware/admin";
import { requirePermission } from "../middleware/permissions";
import { isPlatformAdminKey } from "../lib/roles";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createDomainSchema,
  updateDomainSchema,
  onboardSchema,
} from "../validators/organization";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- Public-bucket image upload hardening (FILE-P2-002 / FILE-P1-001) --------
// Logos land in the PUBLIC `logos` bucket and are served inline from a trusted
// origin. Previously this endpoint performed NO mimetype check and built the
// storage key from the uploaded filename's extension, so `x.svg` / `x.html` /
// `x.js` could be persisted and served from our own domain (stored XSS /
// phishing). The declared mimetype is now allowlisted and the extension that is
// actually written is DERIVED FROM THE VALIDATED MIMETYPE -- the user-supplied
// filename (and its extension) is never echoed into the public storage key.
const IMAGE_MIME_TO_EXTENSION: Record<string, string | undefined> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function resolveImageUpload(
  file: { originalname: string; mimetype: string },
  label: string,
): { extension: string; mimetype: string } {
  const mimetype = (file.mimetype || "").split(";")[0]!.trim().toLowerCase();
  const extension = IMAGE_MIME_TO_EXTENSION[mimetype];
  if (!extension) {
    throw new AppError("VALIDATION", `${label} must be a JPEG, PNG, WebP, or GIF image`, 400);
  }
  return { extension, mimetype };
}

const router: ReturnType<typeof Router> = Router();

router.use(requireAuth);

router.post("/onboard", requireAdmin, async (req, res, next) => {
  try {
    const parsed = onboardSchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: parsed.name,
        slug: parsed.slug,
        primary_domain: parsed.primaryDomain ?? null,
        support_plan: parsed.supportPlan ?? null,
      })
      .select()
      .single();

    if (orgError) throw new AppError("DB_ERROR", orgError.message, 500);

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("key", parsed.adminRoleKey)
      .maybeSingle();

    if (roleError) throw new AppError("DB_ERROR", roleError.message, 500);
    if (!role) throw new AppError("NOT_FOUND", `Role ${parsed.adminRoleKey} not found`, 404);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", parsed.adminEmail)
      .maybeSingle();

    let userId = existingProfile?.id ?? null;
    let invited = false;

    if (!userId) {
      const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        parsed.adminEmail,
        { data: { full_name: parsed.adminFullName ?? null } },
      );

      if (authError || !authUser?.user) {
        throw new AppError("AUTH_ERROR", authError?.message ?? "Failed to invite admin user", 400);
      }

      userId = authUser.user.id;
      invited = true;

      await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: parsed.adminEmail,
            full_name: parsed.adminFullName ?? null,
          },
          { onConflict: "id" },
        );
    }

    const { data: membership, error: memError } = await supabase
      .from("memberships")
      .insert({
        organization_id: org.id,
        user_id: userId,
        role_id: role.id,
        status: "approved",
      })
      .select()
      .single();

    if (memError) throw new AppError("DB_ERROR", memError.message, 500);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "organization.onboard",
      entityType: "organization",
      entityId: org.id,
      metadata: { name: parsed.name, adminEmail: parsed.adminEmail, invited },
    });

    invalidateCache(`/api/v1/organizations`);
    res.status(201).json(
      success({
        organization: org,
        adminUser: { id: userId, email: parsed.adminEmail },
        membership,
        invited,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/", responseCacheNoRenew(60), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", req.authUser!.userId)
      .single();

    let query = supabase.from("organizations").select("*", { count: "exact" });

    // Platform admins (super_admin profile OR admin/super_admin role in any
    // approved membership) see every tenant. Client-scoped users see only
    // their approved member orgs.
    let isPlatformAdmin = !!profile?.is_super_admin;

    if (!isPlatformAdmin) {
      const { data: memberRoles } = await supabase
        .from("memberships")
        .select("roles!inner(id, key)")
        .eq("user_id", req.authUser!.userId)
        .eq("status", "approved");

      isPlatformAdmin = (memberRoles ?? []).some((m: any) => isPlatformAdminKey(m.roles?.key));
    }

    if (!isPlatformAdmin) {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("organization_id")
        .eq("user_id", req.authUser!.userId)
        .eq("status", "approved");

      const orgIds = (memberships ?? []).map((m: { organization_id: string }) => m.organization_id).filter(Boolean);

      if (orgIds.length > 0) {
        query = query.in("id", orgIds);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    const statusFilter = req.query.status as string | undefined;
    if (statusFilter) query = query.eq("status", statusFilter);

    const idsFilter = req.query.ids as string | undefined;
    if (idsFilter) {
      const ids = idsFilter.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    }

    const hasPaging = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    if (hasPaging) query = query.range(offset, offset + limit - 1);

    const {
      data,
      error,
      count,
    } = await query.order("name");

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    if (hasPaging) {
      res.json(
        success({
          items: data ?? [],
          total: count ?? 0,
          page,
          limit,
        }),
      );
    } else {
      res.json(success(data ?? []));
    }
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

    if (error || !data) throw new AppError("NOT_FOUND", "Organization not found", 404);
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

    if (orgError || !org) throw new AppError("NOT_FOUND", "Organization not found", 404);

    const [{ data: domains, error: domError }, { data: memberships, error: memError }] =
      await Promise.all([
        supabase.from("organization_domains").select("*").eq("organization_id", req.params.id),
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
      ...new Set((memberships ?? []).map((m: { user_id: string }) => m.user_id)),
    ];
    const memberRoleIds = [
      ...new Set((memberships ?? []).map((m: { role_id: string }) => m.role_id)),
    ];

    const [{ data: profiles, error: profError }, { data: roles, error: rolesError }] =
      await Promise.all([
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

router.patch("/:id", requirePermission("organizations", "manage"), requireIfMatch, async (req, res, next) => {
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
    if (parsed.primaryDomain !== undefined) updateData.primary_domain = parsed.primaryDomain;
    if (parsed.supportPlan !== undefined) updateData.support_plan = parsed.supportPlan;
    if (parsed.logoUrl !== undefined) updateData.logo_url = parsed.logoUrl;
    if (parsed.brandColor !== undefined) updateData.brand_color = parsed.brandColor;
    if (parsed.accentColor !== undefined) updateData.accent_color = parsed.accentColor;
    if (parsed.customDomain !== undefined) updateData.custom_domain = parsed.customDomain;

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
      throw new AppError("VERSION_CONFLICT", "Organization was modified by another user", 409);

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

router.delete("/:id", requirePermission("organizations", "manage"), async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("organizations").delete().eq("id", req.params.id);

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

router.delete("/:id/domains/:domainId", requireAdmin, async (req, res, next) => {
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
});

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
      // Mimetype + filename extension are allowlisted, and the stored extension
      // comes from the validated mimetype (never from originalname).
      const { extension, mimetype } = resolveImageUpload(file, "Logo");
      const storagePath = `${req.authUser!.userId}/org-${req.params.id}-logo.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(storagePath, file.buffer, {
          contentType: mimetype,
          upsert: true,
        });

      if (uploadError) throw new AppError("STORAGE_ERROR", uploadError.message, 500);

      const { data: publicUrl } = supabase.storage.from("logos").getPublicUrl(storagePath);

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
