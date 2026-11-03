import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { withRetry } from "@/lib/retry";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";
import { formatDate } from "@/lib/format";
import TrainingEnrollmentClient from "./TrainingEnrollmentClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Training Course (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  estimated_minutes: number | null;
  status: string;
  created_at: string;
};

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  lesson_type: string | null;
  sort_order: number | null;
};

type Enrollment = { course_id: string; progress_percent: number | null; status: string };

export default async function TrainingCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  let course: Course | null = null;
  let lessons: Lesson[] = [];
  let enrollment: Enrollment | null = null;

  try {
    course = (await withRetry(() => api.trainingHub.courses.get(id))) as unknown as Course;
    lessons = ((await api.trainingHub.lessons.list(id)) as unknown as Lesson[]) ?? [];
    const myCourses = (await api.trainingHub.myCourses()) as unknown as Enrollment[];
    enrollment =
      (Array.isArray(myCourses) ? myCourses : []).find((item) => item.course_id === id) ?? null;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Training", href: "/portal/training-hub" },
          { label: course.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {course.category ?? "General"} • {course.difficulty ?? "beginner"} •{" "}
            {course.estimated_minutes ?? 0} min
          </p>
        </div>
        <StatusPill status={course.status} />
      </div>

      {course.description ? (
        <section className="cyber-panel">
          <p className="text-sm leading-relaxed text-slate-300">{course.description}</p>
        </section>
      ) : null}

      <TrainingEnrollmentClient
        courseId={course.id}
        initialProgress={enrollment?.progress_percent ?? 0}
        enrolled={Boolean(enrollment)}
      />

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Lessons ({lessons.length})</h2>
        <div className="mt-4 space-y-3">
          {lessons.length > 0 ? (
            lessons.map((lesson, index) => (
              <details
                key={lesson.id}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
              >
                <summary className="cursor-pointer list-none">
                  <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-slate-50">{lesson.title}</span>
                  {lesson.lesson_type ? (
                    <span className="ml-2 text-xs text-slate-500">{lesson.lesson_type}</span>
                  ) : null}
                </summary>
                {lesson.content ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {lesson.content}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No lesson content published.</p>
                )}
              </details>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No lessons have been published for this course.
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Added {formatDate(course.created_at)}</span>
        <Link href="/portal/training-hub" className="cyber-button-secondary">
          Back to training
        </Link>
      </div>
    </div>
  );
}
