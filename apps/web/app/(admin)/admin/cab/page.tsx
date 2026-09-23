import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import CabMeetingsClient from "@/components/cab/CabMeetingsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change Advisory Board - Admin - Maine CyberTech" };

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

type Props = { searchParams: Promise<{ organizationId?: string }> };

export default async function AdminCabPage({ searchParams }: Props) {
  await requireAdminAccess();
  let loadFailed = false;
  const api = getApiClient();
  const { organizationId } = await searchParams;

  let organizations: Array<{ id: string; name: string }> = [];
  try {
    const r = (await api.organizations.list({ limit: 100 })) as unknown as {
      items: Array<{ id: string; name: string }>;
    };
    organizations = r.items ?? [];
  } catch (error) {
    console.error("[admin/cab]", error);
    loadFailed = true;
  }

  const orgId = organizationId ?? organizations[0]?.id ?? null;

  let meetings: Meeting[] = [];
  let pendingChanges: ChangeRequest[] = [];
  if (orgId) {
    try {
      const r = await api.cab.list({ organizationId: orgId });
      meetings = r.items as unknown as Meeting[];
    } catch (error) {
      console.error("[admin/cab]", error);
      loadFailed = true;
    }
    try {
      const cr = await api.governance.changes.list({ organizationId: orgId, status: "pending" });
      pendingChanges = (cr.items as unknown as ChangeRequest[]).filter(
        (c) => String(c.status) === "pending",
      );
    } catch (error) {
      console.error("[admin/cab]", error);
      loadFailed = true;
    }
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Change Advisory Board" }]}
        />
      }
      subnav={<AdminSubnav current="cab" />}
      title="Change Advisory Board"
      description="Schedule CAB meetings, add pending change requests to the agenda, and record decisions."
      actions={null}
    >
      {loadFailed && <DataErrorNote what="admin data" />}
      {organizations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/admin/cab?organizationId=${org.id}`}
              className={
                org.id === orgId
                  ? "rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300"
                  : "rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-emerald-600/40"
              }
            >
              {org.name}
            </Link>
          ))}
        </div>
      )}

      {orgId ? (
        <CabMeetingsClient
          organizationId={orgId}
          meetings={meetings}
          pendingChanges={pendingChanges}
        />
      ) : (
        <p className="text-sm text-slate-400">No organizations available.</p>
      )}
    </AdminPageShell>
  );
}
