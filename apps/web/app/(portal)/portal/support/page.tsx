import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import SupportCenterClient from "@/components/portal/SupportCenterClient";

export const metadata = { title: "Support - Portal - Maine CyberTech" };

type TicketRecord = Record<string, any> & { id: string };

const PAGE_SIZE = 25;

export default async function PortalSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved membership found.");

  const currentUser = await api.users.me();
  if (!currentUser) redirect("/login");

  async function createTicketAction(formData: FormData) {
    "use server";
    try {
      const api = getApiClient();
      const membership = await getApprovedMembership();
      if (!membership?.organization_id)
        return { ok: false as const, error: "No approved membership found." };

      const subject = String(formData.get("subject") ?? "").trim();
      const priority = String(formData.get("priority") ?? "normal").trim();
      const category = String(formData.get("category") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      if (!subject || !description)
        return { ok: false as const, error: "Subject and description are required." };

      await api.tickets.create({
        organizationId: membership.organization_id,
        title: subject,
        description,
        priority,
        category: category || null,
        source: "portal",
      });

      revalidatePath("/portal/support");
      redirect("/portal/support");
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

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
        createTicketAction={createTicketAction}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        counts={{ open: openTotal, closed: closedTotal, all: allTotal }}
      />
    </div>
  );
}
