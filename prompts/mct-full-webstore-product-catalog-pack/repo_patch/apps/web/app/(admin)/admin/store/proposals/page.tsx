export default function StoreProposalsAdminPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">
          Proposal Generator
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Quote-to-Proposal Drafts</h1>
        <p className="text-muted-foreground mt-2">
          Generate draft proposals from reviewed quote requests. Human review required before
          sending.
        </p>
      </div>
      <button className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white">
        Generate Proposal Draft
      </button>
    </main>
  );
}
