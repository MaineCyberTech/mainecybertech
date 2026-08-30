import { getPortalServiceHubData } from "@/lib/catalog/loader";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import Link from "next/link";

export const metadata = { title: "Services - Portal - Maine CyberTech" };

const sectionIcons: Record<string, string> = {
  "Requested services": "📋",
  "Quote status": "💰",
  "Proposal status": "📄",
  "Approved services": "✅",
  "Project progress": "📊",
  Documents: "📁",
  "Tasks/checklists": "✓",
  Messages: "💬",
  "Recommended next services": "→",
};

const statusColors: Record<string, string> = {
  requested: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  reviewing: "bg-amber-600/10 text-amber-400 border-amber-600/20",
  proposal_ready: "bg-purple-600/10 text-purple-400 border-purple-600/20",
  approved: "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
  in_progress: "bg-cyan-600/10 text-cyan-400 border-cyan-600/20",
  completed: "bg-slate-600/10 text-slate-400 border-slate-600/20",
  closed: "bg-red-600/10 text-red-400 border-red-600/20",
};

export default function PortalServicesPage() {
  const hub = getPortalServiceHubData();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Services" }]}
      />
      <PortalSubnav current="services" />

      <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm">
        <h1 className="font-orbitron text-2xl font-bold uppercase tracking-wider text-slate-50">
          Service Hub
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Track your requested services, quotes, proposals, and project progress in one place.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hub.sections.map((section) => (
          <div
            key={section}
            className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">{sectionIcons[section] ?? "▸"}</span>
              <h2 className="font-orbitron text-sm font-bold uppercase tracking-wider text-slate-50">
                {section}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              {section === "Requested services" &&
                "Services you have requested that are waiting for review."}
              {section === "Quote status" &&
                "Current status of any outstanding quotes and estimates."}
              {section === "Proposal status" &&
                "Track proposals that have been sent for your review."}
              {section === "Approved services" &&
                "Services that have been approved and are scheduled for delivery."}
              {section === "Project progress" &&
                "View the progress of active projects and upcoming milestones."}
              {section === "Documents" &&
                "Access documents, reports, and deliverables from your services."}
              {section === "Tasks/checklists" &&
                "Action items and checklists associated with your services."}
              {section === "Messages" &&
                "Communicate with your service team about active engagements."}
              {section === "Recommended next services" &&
                "Personalized recommendations based on your current services."}
              {!section.startsWith("Requested") &&
                !section.startsWith("Quote") &&
                !section.startsWith("Proposal") &&
                !section.startsWith("Approved") &&
                section !== "Project progress" &&
                section !== "Documents" &&
                section !== "Tasks/checklists" &&
                section !== "Messages" &&
                section !== "Recommended next services" &&
                "Details and updates will appear here once services are active."}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm">
        <h2 className="font-orbitron mb-4 text-lg font-bold uppercase tracking-wider text-slate-50">
          Service Statuses
        </h2>
        <div className="flex flex-wrap gap-2">
          {hub.statuses.map((status) => (
            <span
              key={status}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                statusColors[status] ?? "border-slate-600/20 bg-slate-600/10 text-slate-400"
              }`}
            >
              {status.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 text-center backdrop-blur-sm">
        <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
          Request a New Service
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Browse our full catalog of services and request what you need.
        </p>
        <Link
          href="/store"
          className="font-orbitron mt-6 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
        >
          Browse Services
        </Link>
      </div>
    </div>
  );
}
