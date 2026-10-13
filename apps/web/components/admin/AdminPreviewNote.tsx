/**
 * Preview banner for admin pages backed by the bundled catalog JSON rather than
 * the database (FEAT-P3-002).
 *
 * These pages render read-only starter data and their primary actions are
 * disabled until the corresponding Store APIs land; without this note they
 * looked like first-class, fully wired admin features.
 */
export default function AdminPreviewNote({ what = "this page" }: { what?: string }) {
  return (
    <div
      role="status"
      className="mb-6 rounded-lg border border-sky-500/25 bg-sky-500/10 p-4 text-sm text-sky-200"
    >
      <span className="font-semibold uppercase tracking-widest text-sky-300">Preview</span> —{" "}
      {what} reads the bundled catalog data and is read-only. Management is not wired up yet, so
      the actions here stay disabled until the Store APIs land.
    </div>
  );
}
