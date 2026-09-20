export type LinkedRunbookData = {
  title: string;
  category?: string | null;
  version?: string | null;
  content?: string | null;
};

/**
 * Presentational view of the runbook linked to a record (e.g. an incident
 * response). Pages fetch the runbook and pass it in - keep this synchronous
 * so it renders under the repo's async-server-component test pattern.
 */
export default function LinkedRunbook({
  runbook,
  heading = "Response runbook",
}: {
  runbook?: LinkedRunbookData | null;
  heading?: string;
}) {
  if (!runbook) return null;

  return (
    <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">{heading}</h2>
      <p className="mt-2 text-sm text-slate-200">
        {runbook.title}
        {runbook.category ? ` • ${runbook.category}` : ""}
        {runbook.version ? ` • v${runbook.version}` : ""}
      </p>
      {runbook.content ? (
        <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
          {runbook.content}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No procedure content published.</p>
      )}
    </section>
  );
}
