import { Router, Request, Response, NextFunction } from "express";
import { getSupabaseAdmin, getScopedClient } from "../services/supabase";
import { loadOwned } from "../lib/tenant";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew } from "../middleware/cache";
import {
  listOnboardingQuerySchema,
  createOnboardingSchema,
  updateOnboardingSchema,
  completePhaseSchema,
  exportOnboardingSchema,
  updateChecklistItemSchema,
} from "../validators/client-onboarding-command-center";
import {
  listOnboardingRecords,
  getOnboardingRecord,
  createOnboardingRecord,
  updateOnboardingRecord,
  deleteOnboardingRecord,
  completePhase,
  getChecklistItems,
  updateChecklistItem,
  exportOnboardingRecords,
} from "../services/client-onboarding-command-center";

const router: Router = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

function getOrgId(req: Request): string {
  return req.query.organization_id as string;
}

function getParam(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

function getUserId(req: Request): string {
  return req.authUser!.userId;
}

router.get(
  "/",
  responseCacheNoRenew(30),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const parsed = listOnboardingQuerySchema.parse(req.query);

      const result = await listOnboardingRecords(orgId, {
        status: parsed.status,
        phase: parsed.phase,
        riskLevel: parsed.riskLevel,
        onboardingLeadId: parsed.onboardingLeadId,
        page: parsed.page ?? 1,
        limit: parsed.limit ?? 25,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/export.csv", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const parsed = exportOnboardingSchema.parse(req.query);

    const result = await exportOnboardingRecords(orgId, {
      status: parsed.status,
      phase: parsed.phase,
      riskLevel: parsed.riskLevel,
      format: (parsed.format ?? "csv") as "csv" | "json",
    });

    if (parsed.format === "csv") {
      const items = ((result.data as { items?: unknown[] }).items ??
        (result.data as unknown[]) ??
        []) as Record<string, unknown>[];
      if (items.length === 0) {
        res.setHeader("Content-Type", "text/csv");
        return res.send(
          "id,organization_id,client_name,client_domain,status,phase,risk_level,created_at\n",
        );
      }
      const headers = Object.keys(items[0]).join(",");
      const rows = items.map((item: Record<string, unknown>) =>
        Object.values(item)
          .map((v) => (v === null || v === undefined ? "" : String(v).replace(/"/g, '""')))
          .map((v) => (v.includes(",") || v.includes("\n") ? `"${v}"` : v))
          .join(","),
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="onboarding-export.csv"');
      return res.send([headers, ...rows].join("\n"));
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id",
  responseCacheNoRenew(30),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supabase = getSupabaseAdmin();
      const record = await loadOwned(
        req,
        supabase as any,
        "client_onboarding_command_center_records",
        getParam(req, "id"),
        "id, organization_id",
      );
      const result = await getOnboardingRecord(record.organization_id as string, getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = createOnboardingSchema.parse(req.body);

    const result = await createOnboardingRecord(orgId, userId, parsed);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getScopedClient(req, "client-onboarding-command-center", "write");
    const record = await loadOwned(
      req,
      supabase as any,
      "client_onboarding_command_center_records",
      getParam(req, "id"),
      "id, organization_id",
    );
    const userId = getUserId(req);
    const parsed = updateOnboardingSchema.parse(req.body);

    const result = await updateOnboardingRecord(record.organization_id as string, userId, getParam(req, "id"), parsed);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getScopedClient(req, "client-onboarding-command-center", "write");
    const record = await loadOwned(
      req,
      supabase as any,
      "client_onboarding_command_center_records",
      getParam(req, "id"),
      "id, organization_id",
    );
    const userId = getUserId(req);
    const result = await deleteOnboardingRecord(record.organization_id as string, userId, getParam(req, "id"));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete-phase", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const parsed = completePhaseSchema.parse({ ...req.body, organizationId: getOrgId(req) });

    // Load + verify ownership of the record before acting on it (fail-closed).
    const supabase = getScopedClient(req, "client-onboarding-command-center", "write");
    const record = await loadOwned(
      req,
      supabase as any,
      "client_onboarding_command_center_records",
      getParam(req, "id"),
      "id, organization_id, phase",
    );

    const result = await completePhase(
      record.organization_id as string,
      userId,
      getParam(req, "id"),
      record.phase as string,
      parsed.completedBy,
      parsed.notes,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id/checklist",
  responseCacheNoRenew(30),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const result = await getChecklistItems(orgId, getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.patch("/:id/checklist/:itemId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getScopedClient(req, "client-onboarding-command-center", "write");
    const item = await loadOwned(
      req,
      supabase as any,
      "client_onboarding_checklist_items",
      getParam(req, "itemId"),
      "id, organization_id",
    );
    const userId = getUserId(req);
    const parsed = updateChecklistItemSchema.parse(req.body);

    const result = await updateChecklistItem(item.organization_id as string, userId, getParam(req, "itemId"), parsed);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
