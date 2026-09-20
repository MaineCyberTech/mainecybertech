import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import CabMeetingsClient from "@/components/cab/CabMeetingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change Advisory Board - Portal - Maine CyberTech" };

type AgendaItem = {
  id: string;
  meeting_id: string;
  change_request_id: string;
  decision: string;
  notes: string | null;
};

type Meeting = {
  id: string;
  scheduled_at: string | null;
  status: string;
  notes: string | null;
  agenda?: AgendaItem[];
};

type ChangeRequest = { id: string; title?: string; name?: string; status?: string };

export default async function PortalCabPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let meetings: Meeting[] = [];
  let pendingChanges: ChangeRequest[] = [];
  try {
    const r = await api.cab.list({ organizationId: orgId });
    meetings = r.items as unknown as Meeting[];
  } catch (error) {
    console.error("[cab/page]", error);
  }
  try {
    const cr = await api.governance.changes.list({ organizationId: orgId, status: "pending" });
    pendingChanges = (cr.items as unknown as ChangeRequest[]).filter(
      (c) => String(c.status) === "pending",
    );
  } catch (error) {
    console.error("[cab/page]", error);
  }

  return (
    <div className="space-y-6" role="region" aria-label="Change Advisory Board">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Change Advisory Board" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Change Advisory Board</h1>
      <p className="text-sm text-slate-400">
        {meetings.length} CAB meeting{meetings.length !== 1 ? "s" : ""} scheduled for your
        organization.
      </p>

      <CabMeetingsClient
        organizationId={orgId}
        meetings={meetings}
        pendingChanges={pendingChanges}
      />

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
