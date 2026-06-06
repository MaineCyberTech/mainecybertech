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
    await requireAdminAccess();
    const api = getApiClient();

    const organizationId = String(formData.get("organizationId") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!organizationId || !subject || !description) throw new Error("Organization, title, and description are required.");

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
      />
    </div>
  );
}
