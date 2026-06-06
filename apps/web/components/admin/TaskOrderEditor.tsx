"use client";

import { useMemo, useState } from "react";

type TaskSummary = {
  id: string;
  title: string;
  status: string;
  ownerLabel?: string | null;
};

type TaskOrderEditorProps = {
  tasks: TaskSummary[];
};

export default function TaskOrderEditor({ tasks }: TaskOrderEditorProps) {
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);

  const orderValue = useMemo(() => JSON.stringify(items.map((item) => item.id)), [items]);

  function moveItem(activeId: string, overId: string) {
    if (activeId === overId) return;
    const fromIndex = items.findIndex((item) => item.id === activeId);
    const toIndex = items.findIndex((item) => item.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;
    const clone = [...items];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    setItems(clone);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="order" value={orderValue} />
      {items.length > 0 ? (
        items.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => setDragId(task.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragId) moveItem(dragId, task.id);
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
            className="flex cursor-move items-center justify-between rounded-lg border border-white/10 bg-[#0A1118]/60 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{task.title}</p>
              <p className="mt-1 truncate text-xs text-slate-400">
                {task.status}
                {task.ownerLabel ? ` • ${task.ownerLabel}` : ""}
              </p>
            </div>
            <span className="text-slate-500" aria-hidden="true">↕</span>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-sm text-slate-400">
          No tasks available to reorder.
        </div>
      )}
    </div>
  );
}
