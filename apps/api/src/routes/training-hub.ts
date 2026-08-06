import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const createCourseSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().default("security"),
  difficulty: z.string().max(50).optional().default("beginner"),
  estimatedMinutes: z.number().int().min(1).max(100000).optional().default(15),
  status: z.string().max(50).optional().default("draft"),
  passingScore: z.number().int().min(0).max(100).optional().default(80),
});

const updateCourseSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
  estimatedMinutes: z.number().int().min(1).max(100000).optional(),
  status: z.string().max(50).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(255),
  content: z.string().max(50000).optional().nullable(),
  lessonType: z.string().max(50).optional().default("text"),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const updateLessonSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(50000).optional().nullable(),
  lessonType: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const progressSchema = z.object({
  progress: z.number().int().min(0).max(100),
});

// ── My Courses (before :id) ──────────────────────────────────────────

router.get("/my-courses", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.authUser!.userId;
    const { data, error } = await supabase
      .from("training_enrollments")
      .select("*, training_courses!inner(*)")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

// ── Courses CRUD ─────────────────────────────────────────────────────

router.get("/courses", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    const q = supabase
      .from("training_courses")
      .select("*", { count: "exact" })
      .eq("organization_id", req.query.organization_id as string);

    const { data, error, count } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/courses", async (req, res, next) => {
  try {
    const parsed = createCourseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("training_courses")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.title,
        description: parsed.description ?? null,
        category: parsed.category,
        difficulty: parsed.difficulty,
        estimated_minutes: parsed.estimatedMinutes,
        status: parsed.status,
        passing_score: parsed.passingScore,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "training.course.created",
      entityType: "training_course",
      entityId: data.id,
      metadata: { title: parsed.title },
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/courses/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("training_courses")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Course not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/courses/:id", async (req, res, next) => {
  try {
    const parsed = updateCourseSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.difficulty !== undefined) updateData.difficulty = parsed.difficulty;
    if (parsed.estimatedMinutes !== undefined)
      updateData.estimated_minutes = parsed.estimatedMinutes;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.passingScore !== undefined) updateData.passing_score = parsed.passingScore;

    const { data, error } = await supabase
      .from("training_courses")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Course not found", 404);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.course.updated",
      entityType: "training_course",
      entityId: data.id,
      metadata: updateData,
    });
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/courses/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("training_courses")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.course.deleted",
      entityType: "training_course",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ── Enrollment & Progress ────────────────────────────────────────────

router.post("/courses/:id/enroll", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const userId = req.authUser!.userId;
    const { data: course, error: courseError } = await supabase
      .from("training_courses")
      .select("id, organization_id")
      .eq("id", req.params.id)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (courseError || !course) throw new AppError("NOT_FOUND", "Course not found", 404);
    const { data, error } = await supabase
      .from("training_enrollments")
      .insert({
        course_id: req.params.id,
        user_id: userId,
        status: "enrolled",
        progress_percent: 0,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: userId,
      action: "training.enrollment.created",
      entityType: "training_enrollment",
      entityId: data.id,
      metadata: { course_id: req.params.id },
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.post("/courses/:id/progress", async (req, res, next) => {
  try {
    const parsed = progressSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const userId = req.authUser!.userId;
    const progress = parsed.progress;
    const { data, error } = await supabase
      .from("training_enrollments")
      .update({
        progress_percent: progress,
        status: progress >= 100 ? "completed" : "in_progress",
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      })
      .eq("course_id", req.params.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Enrollment not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

// ── Lessons CRUD ─────────────────────────────────────────────────────

router.get("/lessons", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: course, error: courseError } = await supabase
      .from("training_courses")
      .select("id")
      .eq("id", req.query.course_id as string)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (courseError || !course) throw new AppError("NOT_FOUND", "Course not found", 404);
    const { data, error } = await supabase
      .from("training_lessons")
      .select("*")
      .eq("course_id", req.query.course_id as string)
      .order("sort_order", { ascending: true });
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(success(data ?? []));
  } catch (error) {
    next(error);
  }
});

router.post("/lessons", async (req, res, next) => {
  try {
    const parsed = createLessonSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const { data: course, error: courseError } = await supabase
      .from("training_courses")
      .select("id")
      .eq("id", parsed.courseId)
      .eq("organization_id", req.query.organization_id as string)
      .single();
    if (courseError || !course) throw new AppError("NOT_FOUND", "Course not found", 404);
    const { data, error } = await supabase
      .from("training_lessons")
      .insert({
        course_id: parsed.courseId,
        title: parsed.title,
        content: parsed.content ?? null,
        lesson_type: parsed.lessonType,
        sort_order: parsed.sortOrder,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.lesson.created",
      entityType: "training_lesson",
      entityId: data.id,
      metadata: { course_id: parsed.courseId, title: parsed.title },
    });
    res.status(201).json(success(data));
  } catch (error) {
    next(error);
  }
});

router.get("/lessons/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("training_lessons")
      .select("*, training_courses!inner(organization_id)")
      .eq("id", req.params.id)
      .eq("training_courses.organization_id", req.query.organization_id as string)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Lesson not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/lessons/:id", async (req, res, next) => {
  try {
    const parsed = updateLessonSchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.content !== undefined) updateData.content = parsed.content;
    if (parsed.lessonType !== undefined) updateData.lesson_type = parsed.lessonType;
    if (parsed.sortOrder !== undefined) updateData.sort_order = parsed.sortOrder;

    const { data: scoped, error: scopeError } = await supabase
      .from("training_lessons")
      .select("id")
      .eq("id", req.params.id)
      .eq("training_courses.organization_id", req.query.organization_id as string)
      .single();
    if (scopeError || !scoped) throw new AppError("NOT_FOUND", "Lesson not found", 404);

    const { data, error } = await supabase
      .from("training_lessons")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    if (!data) throw new AppError("NOT_FOUND", "Lesson not found", 404);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.lesson.updated",
      entityType: "training_lesson",
      entityId: data.id,
      metadata: updateData,
    });
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.delete("/lessons/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: scoped, error: scopeError } = await supabase
      .from("training_lessons")
      .select("id")
      .eq("id", req.params.id)
      .eq("training_courses.organization_id", req.query.organization_id as string)
      .single();
    if (scopeError || !scoped) throw new AppError("NOT_FOUND", "Lesson not found", 404);
    const { error } = await supabase.from("training_lessons").delete().eq("id", req.params.id);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.lesson.deleted",
      entityType: "training_lesson",
      entityId: String(req.params.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
