import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew } from "../middleware/cache";
import {
  listSatisfactionPulseQuerySchema,
  createSatisfactionPulseSchema,
  updateSatisfactionPulseSchema,
  respondSatisfactionPulseSchema,
  exportSatisfactionPulseSchema,
  templateSchema,
  updateTemplateSchema,
  scheduleSchema,
  updateScheduleSchema,
} from "../validators/satisfaction-pulse-widget";
import {
  listSatisfactionPulses,
  getSatisfactionPulse,
  createSatisfactionPulse,
  updateSatisfactionPulse,
  respondSatisfactionPulse,
  deleteSatisfactionPulse,
  exportSatisfactionPulses,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../services/satisfaction-pulse-widget";
import { logAuditEvent } from "../services/audit";

const router: Router = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

function getOrgId(req: Request): string {
  return req.query.organization_id as string;
}

function getUserId(req: Request): string {
  return req.authUser!.userId;
}

function getParam(req: Request, name: string): string {
  return firstRequired(req.params[name]);
}

function firstRequired<T>(val: T | T[] | undefined): T {
  const v = Array.isArray(val) ? val[0] : val;
  if (v === undefined) throw new Error("Required parameter missing");
  return v;
}

// Pulse endpoints
router.get(
  "/",
  responseCacheNoRenew(30),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const parsed = listSatisfactionPulseQuerySchema.parse(req.query);

      const result = await listSatisfactionPulses(orgId, parsed);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const parsed = exportSatisfactionPulseSchema.parse(req.query);

    const result = await exportSatisfactionPulses(orgId, parsed);

    if (parsed.format === "csv") {
      const items = (result as any).data ?? [];
      if (items.length === 0) {
        res.setHeader("Content-Type", "text/csv");
        return res.send(
          "id,organization_id,subject,source,rating,feedback,status,sent_at,responded_at,created_at\n",
        );
      }
      const headers = Object.keys(items[0]).join(",");
      const rows = items.map((item: any) =>
        Object.values(item)
          .map((v) => (v === null || v === undefined ? "" : String(v).replace(/"/g, '""')))
          .map((v) => (v.includes(",") || v.includes("\n") ? `"${v}"` : v))
          .join(","),
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="satisfaction-pulses-export.csv"');
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
      const orgId = getOrgId(req);
      const result = await getSatisfactionPulse(orgId, getParam(req, "id"));
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
    const parsed = createSatisfactionPulseSchema.parse(req.body);

    const result = await createSatisfactionPulse(orgId, userId, parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse.created",
      entityType: "satisfaction_pulse",
      entityId: result.data?.id,
      metadata: { subject: parsed.subject },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = updateSatisfactionPulseSchema.parse(req.body);

    const result = await updateSatisfactionPulse(orgId, userId, getParam(req, "id"), parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse.updated",
      entityType: "satisfaction_pulse",
      entityId: getParam(req, "id"),
      metadata: parsed,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/respond", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const parsed = respondSatisfactionPulseSchema.parse(req.body);

    const result = await respondSatisfactionPulse(
      orgId,
      getParam(req, "id"),
      parsed.rating,
      parsed.feedback,
    );

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: getUserId(req),
      action: "satisfaction_pulse.responded",
      entityType: "satisfaction_pulse",
      entityId: getParam(req, "id"),
      metadata: { rating: parsed.rating },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const result = await deleteSatisfactionPulse(orgId, userId, getParam(req, "id"));

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse.deleted",
      entityType: "satisfaction_pulse",
      entityId: getParam(req, "id"),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Template endpoints
router.get(
  "/templates",
  responseCacheNoRenew(60),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const result = await listTemplates(orgId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/templates/:id",
  responseCacheNoRenew(60),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const result = await getTemplate(orgId, getParam(req, "id"));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/templates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = templateSchema.parse(req.body);

    const result = await createTemplate(orgId, userId, parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_template.created",
      entityType: "satisfaction_pulse_template",
      entityId: result.data?.id,
      metadata: { name: parsed.name },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/templates/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = updateTemplateSchema.parse(req.body);

    const result = await updateTemplate(orgId, userId, getParam(req, "id"), parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_template.updated",
      entityType: "satisfaction_pulse_template",
      entityId: getParam(req, "id"),
      metadata: parsed,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/templates/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const result = await deleteTemplate(orgId, userId, getParam(req, "id"));

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_template.deleted",
      entityType: "satisfaction_pulse_template",
      entityId: getParam(req, "id"),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Schedule endpoints
router.get(
  "/schedules",
  responseCacheNoRenew(60),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const result = await listSchedules(orgId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post("/schedules", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = scheduleSchema.parse(req.body);

    const result = await createSchedule(orgId, userId, parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_schedule.created",
      entityType: "satisfaction_pulse_schedule",
      entityId: result.data?.id,
      metadata: { name: parsed.name, triggerType: parsed.triggerType },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/schedules/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = updateScheduleSchema.parse(req.body);

    const result = await updateSchedule(orgId, userId, getParam(req, "id"), parsed);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_schedule.updated",
      entityType: "satisfaction_pulse_schedule",
      entityId: getParam(req, "id"),
      metadata: parsed,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/schedules/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const result = await deleteSchedule(orgId, userId, getParam(req, "id"));

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: userId,
      action: "satisfaction_pulse_schedule.deleted",
      entityType: "satisfaction_pulse_schedule",
      entityId: getParam(req, "id"),
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
