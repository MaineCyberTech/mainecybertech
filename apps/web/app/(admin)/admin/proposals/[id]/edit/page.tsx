import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import ProposalEditForm from "./ProposalEditForm";
import type { ProposalDetail } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Proposal - Admin - Maine CyberTech" };

export default async function EditProposalPage(props: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await props.params;
  const api = getApiClient();

  let proposal: ProposalDetail | null = null;
  try {
    proposal = await api.proposals.get(id);
  } catch {
    notFound();
  }
  if (!proposal) notFound();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Proposals", href: "/admin/proposals" },
            { label: "Edit Proposal" },
          ]}
        />
      }
      subnav={<AdminSubnav current="proposals" />}
      title={`Edit: ${proposal.title}`}
    >
      <ProposalEditForm
        proposalId={proposal.id}
        title={proposal.title}
        description={proposal.description ?? ""}
        status={proposal.status ?? "draft"}
        visibility={proposal.visibility ?? "internal"}
        validUntil={proposal.valid_until ? String(proposal.valid_until).slice(0, 10) : ""}
      />
    </AdminPageShell>
  );
}
