import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { registerCrudRoutes } from "./final/crud";
import { registerSharepointRoutes } from "./final/sharepoint";
import { registerBackupRoutes } from "./final/backups";
import { registerBudgetRoutes } from "./final/budgets";
import { registerProcurementRoutes } from "./final/procurement";
import { registerDnsChangeRoutes } from "./final/dns-changes";
import { registerTimeEntryRoutes } from "./final/time-entries";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

registerSharepointRoutes(router);
registerBackupRoutes(router);
registerBudgetRoutes(router);
registerProcurementRoutes(router);
registerDnsChangeRoutes(router);
registerTimeEntryRoutes(router);
registerCrudRoutes(router);

export default router;
