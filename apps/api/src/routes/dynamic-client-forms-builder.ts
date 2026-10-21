import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { requirePermission } from "../middleware/permissions";
import { responseCacheNoRenew } from "../middleware/cache";
import {
  listDynamicFormsQuerySchema,
  createDynamicFormSchema,
  updateDynamicFormSchema,
  publishDynamicFormSchema,
  submitDynamicFormSchema,
  exportDynamicFormsSchema,
} from "../validators/dynamic-client-forms-builder";
import { assertDeleteConfirmed } from "../lib/delete-confirm";
import { sendExportResponse, type CsvColumn } from "../lib/csv";
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
  type DynamicForm,
} from "../services/dynamic-client-forms-builder";
import { getScopedClient } from "../services/supabase";

const router: Router = Router();

router.use(requireAuth);
router.use(requireOrgAccess);

/** API-P3-008: scalar columns of dynamic_client_forms, in export order. */
const exportColumns: CsvColumn[] = [
  { key: "id" },
  { key: "organization_id" },
  { key: "title" },
  { key: "form_type" },
  { key: "status" },
  { key: "published_at" },
  { key: "closes_at" },
  { key: "created_by" },
  { key: "created_at" },
  { key: "updated_at" },
];

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
      const parsed = listDynamicFormsQuerySchema.parse(req.query);
      const result = await listDynamicForms(
        orgId,
        {
          status: parsed.status,
          formType: parsed.formType,
          page: parsed.page ?? 1,
          limit: parsed.limit ?? 25,
        },
        getScopedClient(req, "dynamic-forms", "read"),
      );
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
    const result = await exportDynamicForms(
      orgId,
      {
        status: parsed.status,
        formType: parsed.formType,
        format: (parsed.format ?? "csv") as "csv" | "json",
      },
      getScopedClient(req, "dynamic-forms", "read"),
    );
    // API-P3-008: the route is documented (and named) as a CSV export but
    // answered with the JSON envelope. Send real CSV through the shared
    // export helper; ?format=json keeps the JSON option the OpenAPI schema
    // advertises.
    sendExportResponse(
      res,
      (result.data ?? []) as unknown as Record<string, unknown>[],
      exportColumns,
      "dynamic-forms",
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const id = getParam(req, "id");
    const result = await getDynamicForm(orgId, id, getScopedClient(req, "dynamic-forms", "read"));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requirePermission("dynamic-forms", "create"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const parsed = createDynamicFormSchema.parse(req.body);
      const result = await createDynamicForm(
        orgId,
        userId,
        {
          title: parsed.title,
          description: parsed.description,
          formType: parsed.formType,
          fields: parsed.fields as unknown as DynamicForm["fields"],
          settings: parsed.settings,
          closesAt: parsed.closesAt,
        },
        getScopedClient(req, "dynamic-forms", "write"),
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id",
  requirePermission("dynamic-forms", "edit"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const id = getParam(req, "id");
      const parsed = updateDynamicFormSchema.parse(req.body);
      const result = await updateDynamicForm(
        orgId,
        userId,
        id,
        {
          title: parsed.title,
          description: parsed.description,
          formType: parsed.formType,
          status: parsed.status,
          fields: parsed.fields as unknown as DynamicForm["fields"],
          settings: parsed.settings,
          closesAt: parsed.closesAt,
        },
        getScopedClient(req, "dynamic-forms", "write"),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  requirePermission("dynamic-forms", "delete"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      assertDeleteConfirmed(req.body);
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const id = getParam(req, "id");
      // Audit is written by deleteDynamicForm (entity_type: dynamic_form).
      const result = await deleteDynamicForm(
        orgId,
        userId,
        id,
        getScopedClient(req, "dynamic-forms", "write"),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/publish",
  requirePermission("dynamic-forms", "edit"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const id = getParam(req, "id");
      const parsed = publishDynamicFormSchema.parse(req.body ?? {});
      const result = await publishDynamicForm(
        orgId,
        userId,
        id,
        parsed.closesAt ?? null,
        getScopedClient(req, "dynamic-forms", "write"),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/submit",
  requirePermission("dynamic-forms", "edit"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = getOrgId(req);
      const parsed = submitDynamicFormSchema.parse({ ...req.body, formId: getParam(req, "id") });
      const result = await submitDynamicForm(
        orgId,
        parsed.formId,
        parsed.respondentEmail ?? null,
        parsed.answers,
        getScopedClient(req, "dynamic-forms", "write"),
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get("/:id/submissions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrgId(req);
    const formId = getParam(req, "id");
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 25;
    const result = await listFormSubmissions(
      orgId,
      formId,
      { page, limit },
      getScopedClient(req, "dynamic-forms", "read"),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
