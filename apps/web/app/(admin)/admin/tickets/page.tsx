import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminTicketCenterClient from "@/components/admin/AdminTicketCenterClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tickets - Admin - Maine CyberTech" };

type TicketRecord = Record<string, any> & { id: string };
type OrganizationRecord = { id: string; name?: string | null };

export default async function AdminTicketsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  async function createTicketAction(formData: FormData) {
    "use server";
    try {
      await requireAdminAccess();
      const api = getApiClient();

      const organizationId = String(formData.get("organizationId") ?? "").trim();
      const subject = String(formData.get("subject") ?? "").trim();
      const priority = String(formData.get("priority") ?? "normal").trim();
      const category = String(formData.get("category") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      if (!organizationId || !subject || !description)
        return { ok: false as const, error: "Organization, title, and description are required." };

      await api.tickets.create({
        organizationId,
        title: subject,
        description,
        priority,
        category: category || null,
        source: "admin",
      });

      revalidatePath("/admin/tickets");
      revalidatePath("/admin");
      redirect("/admin/tickets");
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async function updateTicketStatusAction(ticketId: string, status: string) {
    "use server";
    try {
      await requireAdminAccess();
      const api = getApiClient();
      await api.tickets.update(ticketId, { status });
      revalidatePath("/admin/tickets");
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async function bulkUpdateTicketsAction(formData: FormData) {
    "use server";
    try {
      await requireAdminAccess();
      const api = getApiClient();

      const ids = formData.getAll("ids").map(String);
      const status = formData.get("status") as string | null;
      const priority = formData.get("priority") as string | null;

      if (ids.length === 0) return { ok: false as const, error: "No tickets selected" };
      if (!status && !priority) return { ok: false as const, error: "No updates provided" };

      const result = await api.tickets.bulkUpdate(ids, {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      });

      // The API pre-filters ids to the admin's tenant scope; "skipped" rows
      // were not updated and must not be reported as success (USE-P2-001).
      const skipped = result.skipped ?? 0;
      if (result.failed > 0 || skipped > 0) {
        const failedItems = result.results
          .filter((r) => !r.success)
          .map((r) => `${r.id}: ${r.error ?? "Unknown error"}`)
          .join("; ");
        const parts = [
          `Bulk update partially failed (${result.successful}/${ids.length} succeeded)`,
        ];
        if (failedItems) parts.push(failedItems);
        if (skipped > 0) parts.push(`${skipped} ticket(s) not found or not accessible`);
        return { ok: false as const, error: parts.join(": ") };
      }

      revalidatePath("/admin/tickets");
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // USE-P2-002: fetch the API maximum (100) up front, then load further pages
  // on demand from the client. Count queries (limit=1) drive the stat cards so
  // they reflect every ticket, not just the rows loaded so far.
  const loadMoreTicketsAction = async (page: number) => {
    "use server";
    try {
      await requireAdminAccess();
      const api = getApiClient();
      const result = await api.tickets.list({ page, limit: 100 });
      return {
        ok: true as const,
        items: (result.items ?? []) as TicketRecord[],
        total: result.total ?? 0,
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Failed to load more tickets.",
      };
    }
  };

  const [organizationsResult, ticketsResult, allCountResult, resolvedCountResult, closedCountResult] =
    await Promise.all([
      api.organizations.list({ limit: 100 }),
      api.tickets.list({ limit: 100 }),
      api.tickets.list({ limit: 1 }),
      api.tickets.list({ limit: 1, status: "resolved" }),
      api.tickets.list({ limit: 1, status: "closed" }),
    ]);
  const organizations = organizationsResult.items ?? [];
  const tickets = ticketsResult.items ?? [];
  const total = ticketsResult.total ?? tickets.length;
  const allCount = allCountResult.total ?? total;
  const closedCount = (resolvedCountResult.total ?? 0) + (closedCountResult.total ?? 0);
  const openCount = Math.max(0, allCount - closedCount);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tickets" }]} />
      <AdminSubnav current="tickets" />
      <AdminTicketCenterClient
        tickets={tickets as TicketRecord[]}
        organizations={organizations as OrganizationRecord[]}
        createTicketAction={createTicketAction}
        updateTicketStatusAction={updateTicketStatusAction}
        bulkUpdateTicketsAction={bulkUpdateTicketsAction}
        loadMoreTicketsAction={loadMoreTicketsAction}
        total={total}
        counts={{ open: openCount, closed: closedCount, all: allCount }}
      />
    </div>
  );
}
