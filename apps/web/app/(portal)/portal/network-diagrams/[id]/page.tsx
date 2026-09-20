import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import Breadcrumbs from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type Node = { id?: string; label?: string; type?: string; [k: string]: unknown };
type Edge = { from?: string; to?: string; label?: string; [k: string]: unknown };
type DiagramShape = { nodes?: Node[]; edges?: Edge[] };
type DiagramDetail = {
  id: string;
  name: string;
  description: string | null;
  diagram: DiagramShape | Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export default async function PortalNetworkDiagramDetailPage({ params }: Props) {
  const { id } = await params;
  const api = getApiClient();

  let diagram: DiagramDetail | null = null;

  try {
    diagram = (await withRetry(() => api.networkDiagrams.get(id))) as unknown as DiagramDetail;
  } catch {
    diagram = null;
  }

  if (!diagram) notFound();

  const shape = diagram.diagram as DiagramShape;
  const nodes = Array.isArray(shape?.nodes) ? shape.nodes : [];
  const edges = Array.isArray(shape?.edges) ? shape.edges : [];

  return (
    <div className="space-y-6" role="region" aria-label={diagram.name}>
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Network Diagrams", href: "/portal/network-diagrams" },
          { label: diagram.name },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{diagram.name}</h1>
        {diagram.description ? (
          <p className="mt-1 text-sm text-slate-400">{diagram.description}</p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">
          Updated: {new Date(diagram.updated_at ?? diagram.created_at).toISOString().slice(0, 10)}
        </p>
      </div>

      <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Nodes ({nodes.length})
        </h2>
        {nodes.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {nodes.map((n, i) => (
              <li
                key={n?.id ?? i}
                className="rounded border border-white/10 px-3 py-2 text-sm text-slate-200"
              >
                <span className="font-medium">{String(n?.label ?? n?.id ?? `node-${i}`)}</span>
                {n?.type ? (
                  <span className="ml-2 text-xs text-slate-400">{String(n.type)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No nodes recorded.</p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Connections ({edges.length})
        </h2>
        {edges.length ? (
          <ul className="mt-3 space-y-2">
            {edges.map((e, i) => (
              <li key={i} className="text-sm text-slate-200">
                {String(e?.from ?? "?")} &rarr; {String(e?.to ?? "?")}
                {e?.label ? (
                  <span className="ml-2 text-xs text-slate-400">{String(e.label)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No connections recorded.</p>
        )}
      </section>

      <Link
        href="/portal/network-diagrams"
        className="text-sm text-emerald-500 hover:text-emerald-400"
      >
        &larr; Back to Network Diagrams
      </Link>
    </div>
  );
}
