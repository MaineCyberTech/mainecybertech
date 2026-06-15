"use client";

import { useTransition } from "react";
import { inlineUpdateAction } from "@/app/(admin)/admin/tickets/[ticketId]/actions";

const STATUSES = ["new", "open", "triaged", "pending", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const STATUS_COLORS: Record<string, string> = {
  resolved:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:ring-emerald-500/40",
  closed:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:ring-emerald-500/40",
  triaged:
    "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:ring-amber-500/40",
  pending:
    "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:ring-amber-500/40",
  open: "border-blue-500/25 bg-blue-500/10 text-blue-300 hover:ring-blue-500/40",
};

function pillClass(base: string, color: string) {
  return `inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none ${color || "border-white/10 bg-white/5 text-slate-300 hover:ring-white/20"} cursor-pointer ${base}`;
}

export function InlineStatusDropdown({
  ticketId,
  current,
}: {
  ticketId: string;
  current: string;
}) {
  const [_pending, startTransition] = useTransition();

  return (
    <select
      value={current}
      onChange={(e) => {
        const val = e.target.value;
        if (val !== current) {
          const fd = new FormData();
          fd.set("status", val);
          startTransition(() => inlineUpdateAction(ticketId, fd));
        }
      }}
      className={pillClass(
        "appearance-none text-center",
        STATUS_COLORS[current] ??
          "border-blue-500/25 bg-blue-500/10 text-blue-300 hover:ring-blue-500/40",
      )}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function InlinePriorityDropdown({
  ticketId,
  current,
}: {
  ticketId: string;
  current: string;
}) {
  const [_pending, startTransition] = useTransition();
  const color =
    current === "urgent"
      ? "border-red-500/25 bg-red-500/10 text-red-300 hover:ring-red-500/40"
      : current === "high"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300 hover:ring-amber-500/40"
        : "";

  return (
    <select
      value={current}
      onChange={(e) => {
        const val = e.target.value;
        if (val !== current) {
          const fd = new FormData();
          fd.set("priority", val);
          startTransition(() => inlineUpdateAction(ticketId, fd));
        }
      }}
      className={pillClass("appearance-none text-center", color)}
    >
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
