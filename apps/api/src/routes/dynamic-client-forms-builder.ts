import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { responseCacheNoRenew } from "../middleware/cache";
import {
  listDynamicFormsQuerySchema,
  createDynamicFormSchema,
  updateDynamicFormSchema,
  publishDynamicFormSchema,
  submitDynamicFormSchema,
  exportDynamicFormsSchema,
} from "../validators/dynamic-client-forms-builder";
import {
  listDynamicForms,
  getDynamicForm,
  createDynamicForm,
  updateDynamicForm,
  deleteDynamicForm,
  publishDynamicForm,
  submitDynamicForm,
  listFormSubmissions,
  exportDynamicForms,
} from "../services/dynamic-client-forms-builder";

const router: Router = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

function getOrgId(req: Request): string {
  const orgId = (req as any).authOrgId ?? req.query.organization_id ?? req.body?.organizationId;
  return Array.isArray(orgId) ? orgId[0] : orgId;
}

function getParam(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

function getUserId(req: Request): string {
  return (req as any).authUserId;
}

router.get(
  "/",
  responseCacheNoRenew(30),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const parsed = listDynamicFormsQuerySchema.parse(req.query);
      const result = await listDynamicForms(orgId, {
        status: parsed.status,
        formType: parsed.formType,
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
    const parsed = exportDynamicFormsSchema.parse(req.query);
    const result = await exportDynamicForms(orgId, {
      status: parsed.status,
      formType: parsed.formType,
      format: (parsed.format ?? "csv") as "csv" | "json",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const id = getParam(req, "id");
    const result = await getDynamicForm(orgId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const parsed = createDynamicFormSchema.parse(req.body);
    const result = await createDynamicForm(orgId, userId, {
      title: parsed.title,
      description: parsed.description,
      formType: parsed.formType,
      fields: parsed.fields as any,
      settings: parsed.settings,
      closesAt: parsed.closesAt,
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
    const id = getParam(req, "id");
    const parsed = updateDynamicFormSchema.parse(req.body);
    const result = await updateDynamicForm(orgId, userId, id, {
      title: parsed.title,
      description: parsed.description,
      formType: parsed.formType,
      status: parsed.status,
      fields: parsed.fields as any,
      settings: parsed.settings,
      closesAt: parsed.closesAt,
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
    const id = getParam(req, "id");
    const result = await deleteDynamicForm(orgId, userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/publish", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const userId = getUserId(req);
    const id = getParam(req, "id");
    const parsed = publishDynamicFormSchema.parse(req.body ?? {});
    const result = await publishDynamicForm(orgId, userId, id, parsed.closesAt ?? null);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/submit", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const parsed = submitDynamicFormSchema.parse({ ...req.body, formId: getParam(req, "id") });
    const result = await submitDynamicForm(
      orgId,
      parsed.formId,
      parsed.respondentEmail ?? null,
      parsed.answers,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/submissions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const formId = getParam(req, "id");
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const result = await listFormSubmissions(orgId, formId, { page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
