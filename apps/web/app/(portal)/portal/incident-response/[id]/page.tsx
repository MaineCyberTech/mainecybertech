import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Incident - Portal - Maine CyberTech" };

type Props = { params: Promise<{ id: string }> };

type IncidentDetail = {
  id: string;
  incident_type: string;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  affected_systems: string | null;
  root_cause: string | null;
  lessons_learned: string | null;
  detected_at: string | null;
  contained_at: string | null;
  eradicated_at: string | null;
  recovered_at: string | null;
  closed_at: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch {
    return "—";
  }
}

const LIFECYCLE: Array<{ key: keyof IncidentDetail; label: string }> = [
  { key: "detected_at", label: "Detected" },
  { key: "contained_at", label: "Contained" },
  { key: "eradicated_at", label: "Eradicated" },
  { key: "recovered_at", label: "Recovered" },
  { key: "closed_at", label: "Closed" },
];

export default async function PortalIncidentDetailPage({ params }: Props) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const { id } = await params;
  const api = getApiClient();

  let incident: IncidentDetail | null = null;
  try {
    incident = (await api.securitySuite.incidents.get(id)) as unknown as IncidentDetail;
  } catch {
    incident = null;
  }

  if (!incident) notFound();

  return (
    <div className="space-y-6" role="region" aria-label="Incident">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Incident Response", href: "/portal/incident-response" },
          { label: incident.title },
        ]}
      />
      <PortalSubnav current="incident-response" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{incident.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {incident.incident_type} &bull; Severity: {incident.severity}
          </p>
        </div>
        <StatusPill status={incident.status} />
      </div>

      <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
          Response lifecycle
        </h2>
        <ol className="mt-3 space-y-2">
          {LIFECYCLE.map((step) => {
            const value = incident![step.key] as string | null;
            return (
              <li key={step.key} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    value ? "bg-emerald-500" : "bg-white/20"
                  }`}
                />
                <span className="w-28 text-slate-400">{step.label}</span>
                <span className={value ? "text-slate-200" : "text-slate-600"}>
                  {formatDate(value)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {incident.affected_systems ? (
          <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Affected systems</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
              {incident.affected_systems}
            </p>
          </section>
        ) : null}
        {incident.root_cause ? (
          <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Root cause</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{incident.root_cause}</p>
          </section>
        ) : null}
      </div>

      {incident.description ? (
        <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {incident.description}
          </p>
        </section>
      ) : null}

      {incident.lessons_learned ? (
        <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Lessons learned</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {incident.lessons_learned}
          </p>
        </section>
      ) : null}

      <Link
        href="/portal/incident-response"
        className="text-sm text-emerald-500 hover:text-emerald-400"
      >
        &larr; Back to incidents
      </Link>
    </div>
  );
}
