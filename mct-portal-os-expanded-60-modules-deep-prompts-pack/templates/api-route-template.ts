import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success } from "../types";

const router = Router();
const createSchema = z.object({ organizationId: z.string().uuid(), name: z.string().min(1), metadata: z.record(z.unknown()).optional() });
router.use(requireAuth);
router.get("/", async (req, res, next) => { try { res.json(success([])); } catch (e) { next(e); } });
router.post("/", async (req, res, next) => { try { const parsed = createSchema.parse(req.body); res.status(201).json(success(parsed)); } catch (e) { next(e); } });
export default router;
