import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import SupportCenterClient from "@/components/portal/SupportCenterClient";
import { createPortalTicket } from "./actions";

export const metadata = { title: "Support - Portal - Maine CyberTech" };

type TicketRecord = Record<string, any> & { id: string };

const PAGE_SIZE = 25;

export default async function PortalSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; create?: string }>;
}) {
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved membership found.");

  const currentUser = await api.users.me();
  if (!currentUser) redirect("/login");

  // USE-P2-002: paginate the list instead of silently stopping at the API's
  // 25-row default, and derive the stat cards from API totals (limit=1 count
  // queries) rather than the fetched page.
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp?.page ?? "1", 10) || 1);
  const organizationId = membership.organization_id;

  const [result, allCountResult, resolvedCountResult, closedCountResult] = await Promise.all([
    api.tickets.list({ organizationId, page, limit: PAGE_SIZE }),
    api.tickets.list({ organizationId, limit: 1 }),
    api.tickets.list({ organizationId, status: "resolved", limit: 1 }),
    api.tickets.list({ organizationId, status: "closed", limit: 1 }),
  ]);
  const tickets = result.items ?? [];
  const total = result.total ?? tickets.length;
  const allTotal = allCountResult.total ?? total;
  const closedTotal = (resolvedCountResult.total ?? 0) + (closedCountResult.total ?? 0);
  const openTotal = Math.max(0, allTotal - closedTotal);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Support" }]} />
      <PortalSubnav current="support" />
      <SupportCenterClient
        tickets={(tickets ?? []) as TicketRecord[]}
        createTicketAction={createPortalTicket}
        // USE-P3-001: the dashboard CTA deep-links with ?create=1 so the
        // create form opens directly instead of landing on a closed list.
        initialCreateOpen={sp?.create === "1"}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        counts={{ open: openTotal, closed: closedTotal, all: allTotal }}
      />
    </div>
  );
}
