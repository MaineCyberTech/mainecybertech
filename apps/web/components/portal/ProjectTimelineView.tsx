"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string;
  due_at?: string | null;
  owner_id?: string | null;
  project_id: string;
};

type Project = {
  id: string;
  name: string;
};

type Props = {
  tasks: Task[];
  projects?: Project[];
  basePath?: string;
  projectId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-600",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  done: "Done",
};

const DAY_WIDTH = 24;
const ROW_HEIGHT = 32;

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function ProjectTimelineView({ tasks, projects, basePath = "/portal", projectId }: Props) {
  const [zoom, setZoom] = useState<"week" | "month" | "quarter">("month");

  const { startDate, endDate, dayCount, dayHeaders, taskRows } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (zoom === "week") {
      start = new Date(now); start.setDate(start.getDate() - start.getDay());
      end = new Date(start); end.setDate(end.getDate() + 6);
    } else if (zoom === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      end = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    }

    const days = daysBetween(start, end) + 1;

    const headers: { label: string; colSpan: number }[] = [];
    if (zoom === "month") {
      headers.push({ label: formatDate(start), colSpan: days });
    } else {
      let cursor = new Date(start);
      while (cursor <= end) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor); weekEnd.setDate(weekEnd.getDate() + 6);
        const weekDays = Math.min(daysBetween(cursor, end) + 1, 7);
        headers.push({ label: formatDateShort(weekStart), colSpan: weekDays });
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    const projectMap = new Map(projects?.map((p) => [p.id, p.name]) ?? []);

    const rows = tasks
      .filter((t) => t.due_at)
      .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))
      .map((task) => {
        const dueDate = new Date(task.due_at!);
        const dueDays = daysBetween(start, dueDate);
        const left = Math.max(0, dueDays) * DAY_WIDTH;
        const label = projectId ? task.title : `${projectMap.get(task.project_id) ?? "?"} / ${task.title}`;
        return { task, left, label, dueDate };
      })
      .filter((r) => r.dueDate >= start && r.dueDate <= end);

    return { startDate: start, endDate: end, dayCount: days, dayHeaders: headers, taskRows: rows };
  }, [tasks, projects, zoom, projectId]);

  const taskHref = (taskId: string) => `${basePath}/projects/${projectId ?? taskRows.find((r) => r.task.id === taskId)?.task.project_id ?? ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((z) => (
            <button key={z} onClick={() => setZoom(z)}
              className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                zoom === z ? "bg-emerald-600/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"
              }`}>
              {z}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{formatDate(startDate)} – {formatDateShort(endDate)} &middot; {taskRows.length} tasks</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex border-b border-white/10 pb-1 text-[10px] text-slate-500">
            <div className="w-48 shrink-0 px-2 font-semibold uppercase tracking-wider">Task</div>
            {dayHeaders.map((h, i) => (
              <div key={i} style={{ width: h.colSpan * DAY_WIDTH }} className="shrink-0 px-1 truncate">
                {h.label}
              </div>
            ))}
          </div>

          <div className="relative">
            {/* Day grid lines */}
            <div className="pointer-events-none absolute inset-0 flex" style={{ marginLeft: "12rem" }}>
              {Array.from({ length: dayCount }, (_, i) => (
                <div key={i} style={{ width: DAY_WIDTH }}
                  className={`shrink-0 border-r ${new Date(startDate.getTime() + i * 86400000).getDay() % 6 === 0 ? "border-white/10" : "border-white/[0.03]"}`} />
              ))}
            </div>

            {taskRows.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No tasks with due dates in this period.</div>
            ) : (
              taskRows.map((row) => (
                <Link key={row.task.id} href={taskHref(row.task.id)}
                  className="flex items-center border-b border-white/[0.03] py-1 transition hover:bg-white/[0.02]"
                  style={{ height: ROW_HEIGHT }}>
                  <div className="flex w-48 shrink-0 items-center gap-2 px-2 overflow-hidden">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[row.task.status] ?? "bg-slate-500"}`} />
                    <span className="truncate text-xs text-slate-300">{row.label}</span>
                  </div>
                  <div className="relative flex-1" style={{ height: ROW_HEIGHT }}>
                    <div className="absolute inset-y-0 flex items-center"
                      style={{ left: `${row.left}px` }}>
                      <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${STATUS_COLORS[row.task.status] ?? "bg-slate-500"}`}
                        style={{ minWidth: `${Math.max(DAY_WIDTH, Math.min(DAY_WIDTH * 3, dayCount * DAY_WIDTH - row.left))}px` }}>
                        <span className="truncate">{STATUS_LABELS[row.task.status] ?? row.task.status}</span>
                        <span className="opacity-70">{formatDate(row.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
