/**
 * Visible "could not load" note for server-rendered pages.
 *
 * Server components that swallow a failed fetch render a misleading empty
 * state (0 counts, "No records"), which is indistinguishable from genuinely
 * having no data. Render this alongside the data when a primary load failed.
 */
export default function DataErrorNote({
  what = "data",
  detail,
}: {
  what?: string;
  detail?: string;
}) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200"
    >
      Could not load {what}. The figures below may be incomplete — refresh to retry.
      {detail ? <span className="mt-1 block text-xs text-amber-300/80">{detail}</span> : null}
    </div>
  );
}
