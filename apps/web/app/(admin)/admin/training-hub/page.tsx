import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import { StatusPill } from "@/components/admin/StatusPill";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Training Hub - Admin - Maine CyberTech" };

export default async function TrainingHubPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let items = [] as Array<{
    id: string;
    title: string;
    category: string;
    difficulty: string;
    estimated_minutes: number;
    status: string;
    created_at: string;
  }>;

  try {
    const r = (await api.trainingHub.courses.list({})) as any;
    items = r.items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Training Hub" }]} />
      }
      subnav={<AdminSubnav current="training-hub" />}
      title="Training Hub"
      description="Manage microlearning courses, lessons, and track client enrollment progress."
      actions={
        <Link href="/admin/training-hub/new" className="cyber-button">
          Create Course
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Courses</h2>
          <Link href="/admin/training-hub/new" className="cyber-button">
            Create Course
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/training-hub/${item.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.category} &bull; {item.difficulty} &bull; {item.estimated_minutes} min
                      &bull; {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={item.status} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🎓"
              title="No courses created yet"
              description="Build your first microlearning course with lessons, quizzes, and enrollment tracking."
              actionHref="/admin/training-hub/new"
              actionLabel="Create Course"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
