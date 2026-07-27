import { Router } from "express";
import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("training_courses")
      .insert({
        organization_id: req.body.organizationId,
        title: req.body.title,
        description: req.body.description ?? null,
        category: req.body.category ?? "security",
        difficulty: req.body.difficulty ?? "beginner",
        estimated_minutes: req.body.estimatedMinutes ?? 15,
        status: req.body.status ?? "draft",
        passing_score: req.body.passingScore ?? 80,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      organizationId: req.body.organizationId,
      actorUserId: req.authUser!.userId,
      action: "training.course.created",
      entityType: "training_course",
      entityId: data.id,
      metadata: { title: req.body.title },
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
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.difficulty !== undefined) updateData.difficulty = req.body.difficulty;
    if (req.body.estimatedMinutes !== undefined)
      updateData.estimated_minutes = req.body.estimatedMinutes;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.passingScore !== undefined) updateData.passing_score = req.body.passingScore;

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
    const supabase = getSupabaseAdmin();
    const userId = req.authUser!.userId;
    const progress = req.body.progress as number;
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
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("training_lessons")
      .insert({
        course_id: req.body.courseId,
        title: req.body.title,
        content: req.body.content ?? null,
        lesson_type: req.body.lessonType ?? "text",
        sort_order: req.body.sortOrder ?? 0,
      })
      .select()
      .single();
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "training.lesson.created",
      entityType: "training_lesson",
      entityId: data.id,
      metadata: { course_id: req.body.courseId, title: req.body.title },
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
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error || !data) throw new AppError("NOT_FOUND", "Lesson not found", 404);
    res.json(success(data));
  } catch (error) {
    next(error);
  }
});

router.patch("/lessons/:id", async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.lessonType !== undefined) updateData.lesson_type = req.body.lessonType;
    if (req.body.sortOrder !== undefined) updateData.sort_order = req.body.sortOrder;

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
