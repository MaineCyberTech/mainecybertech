import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "File Requests - Admin - Maine CyberTech" };

export default async function FileRequestsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let requests: Array<{
    id: string;
    title: string;
    status: string;
    token: string;
    expires_at: string;
    upload_count: number;
    max_files: number;
    created_at: string;
  }> = [];

  try {
    const r = await api.fileRequests.list({});
    requests = r.items as typeof requests;
  } catch {
    /* graceful */
  }

  const active = requests.filter((r) => r.status === "active").length;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "File Requests" }]} />
      }
      subnav={<AdminSubnav current="file-requests" />}
      title="Secure File Request Portal"
      description="Create one-time upload links for clients to submit files securely."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{active} Active</div>
          <Link href="/admin/file-requests/new" className="cyber-button">
            New Request
          </Link>
        </div>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">File Requests</h2>
        <div className="mt-6 space-y-3">
          {requests.length > 0 ? (
            requests.map((r) => (
              <Link
                key={r.id}
                href={`/admin/file-requests/${r.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {r.upload_count}/{r.max_files} uploads &bull; Expires{" "}
                      {new Date(r.expires_at).toISOString().slice(0, 10)}
                      &bull; Token: {r.token.slice(0, 8)}…
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${r.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    {r.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="📁"
              title="No file requests"
              description="Create a secure upload link for a client to submit files."
              actionHref="/admin/file-requests/new"
              actionLabel="New Request"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
