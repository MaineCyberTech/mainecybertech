"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

type Phase = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
};
type Milestone = { id: string; title: string; status: string; due_date: string | null };
type Dependency = {
  id: string;
  dependency_type: string;
  depends_on_task_id: string | null;
  blocked_by_project_id: string | null;
};

function fmt(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

export default function ProjectTrackerPanels({ projectId }: { projectId: string }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const api = getClientApi();
    try {
      const [p, m, d] = await Promise.all([
        api.projects.phases.list(projectId) as Promise<{ items: Phase[] }>,
        api.projects.milestones.list(projectId) as Promise<{ items: Milestone[] }>,
        api.projects.dependencies.list(projectId) as Promise<{ items: Dependency[] }>,
      ]);
      setPhases(p.items ?? []);
      setMilestones(m.items ?? []);
      setDependencies(d.items ?? []);
    } catch {
      setError("Failed to load project tracker data.");
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await load();
      } catch {
        setError("Action failed. Please try again.");
      }
    });
  };

  const [phaseName, setPhaseName] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");
  const [dependencyTask, setDependencyTask] = useState("");

  const addPhase = () =>
    run(async () => {
      await getClientApi().projects.phases.create({ projectId, name: phaseName.trim() });
      setPhaseName("");
    });

  const addMilestone = () =>
    run(async () => {
      await getClientApi().projects.milestones.create({
        projectId,
        title: milestoneTitle.trim(),
        dueDate: milestoneDue ? new Date(milestoneDue).toISOString() : null,
      });
      setMilestoneTitle("");
      setMilestoneDue("");
    });

  const addDependency = () =>
    run(async () => {
      await getClientApi().projects.dependencies.create({
        projectId,
        dependsOnTaskId: dependencyTask.trim(),
      });
      setDependencyTask("");
    });

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="cyber-panel" aria-label="Project Phases">
        <h2 className="cyber-heading text-lg">Phases</h2>
        <ul className="mt-4 space-y-2">
          {phases.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-sm"
            >
              <span className="text-slate-200">{p.name}</span>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                {fmt(p.start_date)} → {fmt(p.end_date)}
                <span className="rounded bg-white/5 px-1.5 py-0.5">{p.status}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => getClientApi().projects.phases.remove(p.id))}
                  className="text-red-400 underline hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
          {phases.length === 0 && <li className="text-sm text-slate-400">No phases yet.</li>}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            Phase name
            <input
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !phaseName.trim()}
            onClick={addPhase}
            className="cyber-button-secondary text-xs"
          >
            Add phase
          </button>
        </div>
      </section>

      <section className="cyber-panel" aria-label="Project Milestones">
        <h2 className="cyber-heading text-lg">Milestones</h2>
        <ul className="mt-4 space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-sm"
            >
              <span className="text-slate-200">{m.title}</span>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                Due {fmt(m.due_date)}
                <span className="rounded bg-white/5 px-1.5 py-0.5">{m.status}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => getClientApi().projects.milestones.remove(m.id))}
                  className="text-red-400 underline hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="text-sm text-slate-400">No milestones yet.</li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            Milestone
            <input
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label className="text-xs text-slate-400">
            Due date
            <input
              type="date"
              value={milestoneDue}
              onChange={(e) => setMilestoneDue(e.target.value)}
              className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !milestoneTitle.trim()}
            onClick={addMilestone}
            className="cyber-button-secondary text-xs"
          >
            Add milestone
          </button>
        </div>
      </section>

      <section className="cyber-panel" aria-label="Project Dependencies">
        <h2 className="cyber-heading text-lg">Dependencies</h2>
        <ul className="mt-4 space-y-2">
          {dependencies.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-sm"
            >
              <span className="text-slate-200">
                {d.dependency_type.replace(/_/g, " ")}
                {d.depends_on_task_id ? ` • task ${d.depends_on_task_id.slice(0, 8)}` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => run(() => getClientApi().projects.dependencies.remove(d.id))}
                className="text-red-400 underline hover:text-red-300 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
          {dependencies.length === 0 && (
            <li className="text-sm text-slate-400">No dependencies yet.</li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            Depends on task ID
            <input
              value={dependencyTask}
              onChange={(e) => setDependencyTask(e.target.value)}
              placeholder="Task UUID"
              className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !dependencyTask.trim()}
            onClick={addDependency}
            className="cyber-button-secondary text-xs"
          >
            Add dependency
          </button>
        </div>
      </section>
    </div>
  );
}
