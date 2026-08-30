export default function StoreAnalyticsAdminPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">
          Store Analytics
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Store Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track product views, quote activity, quiz completions, promotions, and conversion paths.
        </p>
      </div>
      <button className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white">
        View Analytics
      </button>
    </main>
  );
}
