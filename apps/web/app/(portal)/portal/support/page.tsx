import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import SupportCenterClient from "@/components/portal/SupportCenterClient";

export const metadata = { title: "Support - Portal - Maine CyberTech" };

type TicketRecord = Record<string, any> & { id: string };

export default async function PortalSupportPage() {
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) throw new Error("No approved membership found.");

  const currentUser = await api.users.me();
  if (!currentUser) redirect("/login");

  async function createTicketAction(formData: FormData) {
    "use server";
    const api = getApiClient();
    const membership = await getApprovedMembership();
    if (!membership?.organization_id) throw new Error("No approved membership found.");

    const subject = String(formData.get("subject") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!subject || !description) throw new Error("Subject and description are required.");

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
  }

  const result = await api.tickets.list({ organizationId: membership.organization_id });
  const tickets = result.items ?? [];

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Support" }]} />
      <PortalSubnav current="support" />
      <SupportCenterClient tickets={(tickets ?? []) as TicketRecord[]} createTicketAction={createTicketAction} />
    </div>
  );
}
