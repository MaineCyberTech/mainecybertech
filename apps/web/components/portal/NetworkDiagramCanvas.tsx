type Node = { id?: string; label?: string; type?: string; [key: string]: unknown };
type Edge = { from?: string; to?: string; label?: string; [key: string]: unknown };

type Props = {
  nodes: Node[];
  edges: Edge[];
};

const NODE_COLORS: Record<string, string> = {
  switch: "#34d399",
  router: "#60a5fa",
  firewall: "#f87171",
  ap: "#a78bfa",
  server: "#fbbf24",
  camera: "#f472b6",
  internet: "#38bdf8",
  default: "#94a3b8",
};

const WIDTH = 900;
const NODE_W = 150;
const NODE_H = 54;

/**
 * Lightweight deterministic topology view. The stored diagram format only has
 * node ids/types and edges (no coordinates), so lay the nodes out on a grid and
 * draw straight connectors. This is intentionally read-only; the admin page
 * remains the editor.
 */
export default function NetworkDiagramCanvas({ nodes, edges }: Props) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-400">No nodes recorded for this diagram yet.</p>;
  }

  const columns = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(nodes.length))));
  const rows = Math.ceil(nodes.length / columns);
  const colGap = WIDTH / (columns + 1);
  const rowGap = 130;
  const height = Math.max(220, rows * rowGap + 60);

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions.set(String(node.id ?? index), {
      x: colGap * (column + 1),
      y: 70 + row * rowGap,
    });
  });

  const markerId = "network-diagram-arrow";

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={`Network diagram with ${nodes.length} nodes and ${edges.length} connections`}
        className="h-auto w-full min-w-[640px]"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const from = positions.get(String(edge.from ?? ""));
          const to = positions.get(String(edge.to ?? ""));
          if (!from || !to) return null;
          return (
            <g key={index}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#64748b"
                strokeWidth={1.5}
                markerEnd={`url(#${markerId})`}
              />
              {edge.label ? (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  fill="#94a3b8"
                  fontSize={11}
                  textAnchor="middle"
                >
                  {String(edge.label)}
                </text>
              ) : null}
            </g>
          );
        })}

        {nodes.map((node, index) => {
          const key = String(node.id ?? index);
          const position = positions.get(key);
          if (!position) return null;
          const color = NODE_COLORS[String(node.type ?? "default")] ?? NODE_COLORS.default;
          return (
            <g key={key}>
              <rect
                x={position.x - NODE_W / 2}
                y={position.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="#0f172a"
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={position.x}
                y={position.y - 4}
                fill="#f1f5f9"
                fontSize={12}
                fontWeight={600}
                textAnchor="middle"
              >
                {String(node.label ?? node.id ?? `node-${index + 1}`)}
              </text>
              <text
                x={position.x}
                y={position.y + 14}
                fill={color}
                fontSize={10}
                textAnchor="middle"
              >
                {String(node.type ?? "device")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
