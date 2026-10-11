import { rowStatus, rowStatusSuccess } from "./helpers";

export default function StatusPill({
  docId,
  busyId,
  successMap,
}: {
  docId: string;
  busyId: string | null;
  successMap: Record<string, string>;
}) {
  const status = rowStatus(busyId, successMap, docId);
  if (!status) return null;
  const success = rowStatusSuccess(busyId, successMap, docId);
  return (
    <span
      className={
        success
          ? "inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300"
          : "inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
      }
    >
      {status}
    </span>
  );
}
