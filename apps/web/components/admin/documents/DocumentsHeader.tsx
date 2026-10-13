export default function DocumentsHeader({
  totalCount,
  selectedCount,
  privateCount,
  internalCount,
  onCreate,
  onRefresh,
}: {
  totalCount: number;
  selectedCount: number;
  privateCount: number;
  internalCount: number;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="cyber-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
            Documents
          </h1>
          <p className="mt-3 text-slate-300">
            2.2.3.3b consolidates the working 2.2.3.3 layout with mounted bulk folder reassignment
            and safe bulk metadata actions.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-cyber-card-deep/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
            <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Total</span>
            <span className="mt-1 block font-semibold text-slate-50">{totalCount}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-cyber-card-deep/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
            <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">
              Selected
            </span>
            <span className="mt-1 block font-semibold text-slate-50">{selectedCount}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-cyber-card-deep/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
            <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">
              Private
            </span>
            <span className="mt-1 block font-semibold text-slate-50">{privateCount}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-cyber-card-deep/80 px-4 py-3 text-sm text-slate-400 shadow-[0_10px_40px_rgba(2,6,23,0.22)]">
            <span className="block text-xs uppercase tracking-[0.12em] text-slate-400">
              Internal
            </span>
            <span className="mt-1 block font-semibold text-slate-50">{internalCount}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="cyber-button shadow-[0_0_20px_rgba(5,150,105,0.18)]"
          onClick={onCreate}
        >
          New Document
        </button>
        <button type="button" className="cyber-button-secondary" onClick={onRefresh}>
          Refresh View
        </button>
      </div>
    </section>
  );
}
