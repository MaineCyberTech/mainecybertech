export default function AdminStoreDashboardPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">Store Admin</p>
        <h1 className="text-3xl font-bold tracking-tight">Catalog Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage products, categories, bundles, intake fields, and catalog health.
        </p>
      </div>
      <button className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white">
        Manage Catalog
      </button>
    </main>
  );
}
