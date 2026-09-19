import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import AdminPagination from "@/components/admin/AdminPagination";
import { createNetworkDiagram } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Network Diagrams - Field Services - Admin" };

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

export default async function NetworkDiagramsPage({ searchParams }: NetworkDiagramsPageProps) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let diagrams: NetworkDiagram[] = [];
  let total = 0;

  try {
    const r = await api.networkDiagrams.list({ page, limit });
    diagrams = (r.items as unknown as NetworkDiagram[]) ?? [];
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/admin/field-services/network-diagrams?page=${p}&limit=${limit}`;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Field Services", href: "/admin/field-services" },
            { label: "Network Diagrams" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Network Diagram"
      description="Topology planning with a structured node/edge diagram, notes, and metadata."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
          {
            key: "diagram",
            label: "Diagram JSON (optional)",
            type: "textarea",
            placeholder: '{"nodes":[],"edges":[]}',
          },
        ]}
        title="New Network Diagram"
        action={createNetworkDiagram}
      />
      <section className="cyber-panel mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Network Diagrams</h2>
        </div>
        <div className="mt-6 space-y-3">
          {diagrams.length > 0 ? (
            diagrams.map((d) => {
              const nodes = nodesOf(d);
              const edges = edgesOf(d);
              return (
                <div
                  key={d.id}
                  className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
                >
                  <Link
                    className="transition hover:text-emerald-400"
                    href={`/admin/field-services/network-diagrams/${d.id}`}
                  >
                    <p className="font-medium text-slate-50">{d.name}</p>
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
                        <li key={n?.id ?? i}>
                          {String(n?.label ?? n?.id ?? `node-${i}`)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon="🌐"
              title="No network diagrams"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />
    </AdminPageShell>
  );
}
