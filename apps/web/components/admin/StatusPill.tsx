export type StatusTone =
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "sky"
  | "purple"
  | "indigo"
  | "teal"
  | "cyan"
  | "orange"
  | "slate"
  | "gray";

const TONE_CLASSES: Record<StatusTone, string> = {
  emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  red: "border-red-500/25 bg-red-500/10 text-red-300",
  blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  purple: "border-purple-500/25 bg-purple-500/10 text-purple-300",
  indigo: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
  teal: "border-teal-500/25 bg-teal-500/10 text-teal-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  orange: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  slate: "border-white/10 bg-white/5 text-slate-300",
  gray: "border-slate-500/25 bg-slate-500/10 text-slate-300",
};

const STATUS_TONES: Record<string, StatusTone> = {
  active: "emerald",
  approved: "emerald",
  sent: "emerald",
  completed: "emerald",
  verified: "emerald",
  closed: "emerald",
  published: "emerald",
  analyzed: "emerald",
  up: "emerald",
  healthy: "emerald",
  operational: "emerald",
  live: "emerald",
  submitted: "emerald",
  implemented: "emerald",
  compliant: "emerald",
  ready: "emerald",
  mitigated: "emerald",
  handoff_complete: "emerald",
  monitored: "emerald",
  pending: "amber",
  in_progress: "amber",
  draft: "amber",
  warning: "amber",
  degraded: "amber",
  paused: "amber",
  expiring_soon: "amber",
  reviewing: "amber",
  partial_outage: "amber",
  investigating: "amber",
  needed: "amber",
  needs_review: "amber",
  attention: "amber",
  accepted: "amber",
  reviewed: "amber",
  resolved: "blue",
  blue: "blue",
  maintenance: "blue",
  discovery: "blue",
  monitoring: "blue",
  scheduled: "blue",
  requested: "blue",
  collected: "blue",
  staged: "blue",
  planned: "blue",
  new: "blue",
  contacted: "blue",
  converted: "sky",
  rejected: "red",
  open: "red",
  cancelled: "red",
  error: "red",
  down: "red",
  unhealthy: "red",
  outage: "red",
  security_baseline: "red",
  major_outage: "red",
  identified: "red",
  overdue: "red",
  m365_setup: "purple",
  access_collection: "indigo",
  network_baseline: "teal",
  documentation: "cyan",
  support_handoff: "orange",
  expired: "slate",
  wont_fix: "slate",
  inactive: "slate",
  hidden: "slate",
  archived: "slate",
  not_started: "slate",
  on_hold: "gray",
};

export function StatusPill({
  status,
  label,
  tone,
}: {
  status: string;
  label?: string;
  tone?: StatusTone;
}) {
  const key = status.toLowerCase();
  const resolvedTone =
    tone ?? STATUS_TONES[key] ?? STATUS_TONES[key.replace(/\s+/g, "_")] ?? "slate";
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${TONE_CLASSES[resolvedTone]}`}
    >
      {label ?? status}
    </span>
  );
}
