import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
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

      if (result.failed > 0) {
        const failedItems = result.results
          .filter((r) => !r.success)
          .map((r) => `${r.id}: ${r.error ?? "Unknown error"}`)
          .join("; ");
        return {
          ok: false as const,
          error: `Bulk update partially failed (${result.successful}/${result.results.length} succeeded): ${failedItems}`,
        };
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

  const [organizations, ticketsResult] = await Promise.all([
    api.organizations.list(),
    api.tickets.list({}),
  ]);
  const tickets = ticketsResult.items ?? [];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tickets" }]} />
      <AdminSubnav current="tickets" />
      <AdminTicketCenterClient
        tickets={tickets as TicketRecord[]}
        organizations={organizations as OrganizationRecord[]}
        createTicketAction={createTicketAction}
        updateTicketStatusAction={updateTicketStatusAction}
        bulkUpdateTicketsAction={bulkUpdateTicketsAction}
      />
    </div>
  );
}
