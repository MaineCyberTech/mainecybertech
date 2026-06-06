"use client";

import { useState } from "react";
import ProjectTimelineView from "./ProjectTimelineView";
import ProjectCalendarView from "./ProjectCalendarView";

type Task = {
  id: string;
  title: string;
  status: string;
  due_at?: string | null;
  owner_id?: string | null;
  project_id: string;
  details?: string | null;
  description?: string | null;
  approval_required?: boolean;
  approved_at?: string | null;
};

type Props = {
  projectId: string;
  currentUserId: string | null;
  organizationId: string;
  tasks: Task[];
  taskListHtml: React.ReactNode;
};

type ViewMode = "list" | "timeline" | "calendar";

export default function ProjectTasksWithViews({ projectId, tasks, taskListHtml }: Props) {
  const [view, setView] = useState<ViewMode>("list");

  const tasksWithProject = tasks.map((t) => ({ ...t, project_id: projectId }));

  return (
    <section className="cyber-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="cyber-heading text-lg">Tasks</h2>
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {(["list", "timeline", "calendar"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setView(mode)}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                view === mode ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"
              }`}>
              {mode === "list" ? "List" : mode === "timeline" ? "Timeline" : "Calendar"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {view === "list" ? (
          taskListHtml
        ) : view === "timeline" ? (
          <ProjectTimelineView tasks={tasksWithProject} basePath="/portal" projectId={projectId} />
        ) : (
          <ProjectCalendarView tasks={tasksWithProject} basePath="/portal" />
        )}
      </div>
    </section>
  );
}
