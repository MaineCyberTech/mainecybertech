"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  status: string;
  due_at?: string | null;
  project_id: string;
};

type Props = {
  tasks: Task[];
  basePath?: string;
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  in_review: "bg-amber-500",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProjectCalendarView({ tasks, basePath = "/portal" }: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { grid, taskMap } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();

    const grid: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) week.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      week.push(d);
      if (week.length === 7) { grid.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); grid.push(week); }

    const map = new Map<number, Task[]>();
    for (const task of tasks) {
      if (!task.due_at) continue;
      const d = new Date(task.due_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(task);
      }
    }

    return { grid, taskMap: map };
  }, [tasks, viewDate]);

  function prev() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }
  function next() { setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }
  function goToday() { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); }

  const isToday = (d: number) => {
    return today.getDate() === d && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="rounded p-1 text-slate-400 hover:text-slate-200">&larr;</button>
          <h3 className="text-lg font-semibold text-slate-200">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h3>
          <button onClick={next} className="rounded p-1 text-slate-400 hover:text-slate-200">&rarr;</button>
          <button onClick={goToday} className="cyber-button-secondary text-xs">Today</button>
        </div>
        <span className="text-xs text-slate-500">{tasks.length} tasks with dates this month</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-7 border-b border-white/10">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">{d}</div>
            ))}
          </div>

          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-white/[0.03]">
              {week.map((day, di) => (
                <div key={di} className={`min-h-[80px] border-r border-white/[0.03] px-1.5 py-1 ${
                  isToday(day ?? 0) ? "bg-emerald-500/5" : ""
                }`}>
                  {day ? (
                    <>
                      <div className={`mb-1 text-[11px] font-medium ${
                        isToday(day) ? "text-emerald-400" : "text-slate-500"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {(taskMap.get(day) ?? []).slice(0, 3).map((task) => (
                          <Link key={task.id} href={`${basePath}/projects/${task.project_id}`}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white transition hover:opacity-80 ${
                              STATUS_COLORS[task.status] ?? "bg-slate-500"
                            }`}>
                            <span className="truncate">{task.title}</span>
                          </Link>
                        ))}
                        {(taskMap.get(day) ?? []).length > 3 ? (
                          <div className="text-[10px] text-slate-500 px-1">
                            +{(taskMap.get(day) ?? []).length - 3} more
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
            {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        ))}
      </div>
    </div>
  );
}
