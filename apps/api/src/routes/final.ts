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
import { goneRoute } from "../lib/deprecated-route";

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

// FEAT-P2-005: hard-deprecated duplicate. `satisfaction_pulses` is canonically
// served by `/api/v1/satisfaction-pulse` (templates, schedules, respond/export
// included); the generic `/final/satisfaction` path now fails closed with 410
// instead of writing through a second validator.
router.use("/satisfaction", goneRoute("/api/v1/satisfaction-pulse"));

export default router;
