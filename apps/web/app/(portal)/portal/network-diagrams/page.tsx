import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Network Diagrams - Portal - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type NetworkDiagramNode = { id?: string; label?: string; [k: string]: unknown };
type NetworkDiagramEdge = { from?: string; to?: string; label?: string; [k: string]: unknown };
type DiagramShape = { nodes?: NetworkDiagramNode[]; edges?: NetworkDiagramEdge[] };

type NetworkDiagram = {
  id: string;
  name: string;
  description: string | null;
  diagram: DiagramShape | Record<string, unknown>;
  created_at: string;
};

type NetworkDiagramsPageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

function nodesOf(d: NetworkDiagram): NetworkDiagramNode[] {
  const diagram = d.diagram as DiagramShape;
  return Array.isArray(diagram?.nodes) ? diagram.nodes : [];
}
function edgesOf(d: NetworkDiagram): NetworkDiagramEdge[] {
  const diagram = d.diagram as DiagramShape;
  return Array.isArray(diagram?.edges) ? diagram.edges : [];
}

export default async function PortalNetworkDiagramsPage({ searchParams }: NetworkDiagramsPageProps) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let diagrams: NetworkDiagram[] = [];
  let total = 0;

  try {
    const r = await api.networkDiagrams.list({ organizationId: orgId, page, limit });
    diagrams = (r.items as unknown as NetworkDiagram[]) ?? [];
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/portal/network-diagrams?page=${p}&limit=${limit}`;

  return (
    <div className="space-y-6" role="region" aria-label="Network Diagrams">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Network Diagrams" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Network Diagrams</h1>
      <p className="text-sm text-slate-400">
        {diagrams.length} network diagram{diagrams.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {diagrams.map((d) => {
          const nodes = nodesOf(d);
          const edges = edgesOf(d);
          return (
            <div
              key={d.id}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <Link
                href={`/portal/network-diagrams/${d.id}`}
                className="font-medium text-slate-50 transition hover:text-emerald-400"
              >
                {d.name}
              </Link>
              {d.description ? (
                <p className="mt-1 text-xs text-slate-400">{d.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-400">
                Nodes: {nodes.length} &bull; Edges: {edges.length}
              </p>
              {nodes.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-400">
                  {nodes.map((n, i) => (
                    <li key={n?.id ?? i}>{String(n?.label ?? n?.id ?? `node-${i}`)}</li>
                  ))}
                </ul>
              ) : null}
              {d.created_at ? (
                <p className="mt-1 text-xs text-slate-400">
                  Updated: {new Date(d.created_at).toISOString().slice(0, 10)}
                </p>
              ) : null}
            </div>
          );
        })}
        {diagrams.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No network diagrams available.</p>
        )}
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
