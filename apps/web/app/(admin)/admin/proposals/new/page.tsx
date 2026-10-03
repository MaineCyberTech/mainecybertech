import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import ProposalForm from "./ProposalForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Proposal - Admin - Maine CyberTech" };

export default async function NewProposalPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Proposals", href: "/admin/proposals" },
            { label: "New Proposal" },
          ]}
        />
      }
      subnav={<AdminSubnav current="proposals" />}
      title="New Proposal"
      description="Create a proposal draft. Pricing, phases, and line items can be managed after creation."
    >
      <ProposalForm />
    </AdminPageShell>
  );
}
