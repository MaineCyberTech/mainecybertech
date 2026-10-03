export default function PortalServicesPage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">Services</p>
        <h1 className="text-3xl font-bold tracking-tight">Requested Services</h1>
        <p className="text-muted-foreground mt-2">
          View requested services, quote status, proposals, project progress, documents, tasks, and
          recommended next services.
        </p>
      </div>
      <button className="rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white">
        View Services
      </button>
    </main>
  );
}
