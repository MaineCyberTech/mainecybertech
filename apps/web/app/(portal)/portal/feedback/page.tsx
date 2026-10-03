import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import PortalFeedbackForm from "./PortalFeedbackForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feedback - Portal - Maine CyberTech" };

export default async function PortalFeedbackPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const orgId = membership.organization_id as string;

  return (
    <div className="space-y-6" role="region" aria-label="Feedback">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Feedback" }]}
      />
      <PortalSubnav current="feedback" />
      <h1 className="text-2xl font-semibold text-slate-50">Feedback</h1>
      <p className="text-sm text-slate-400">
        Share a rating and comments with your Maine CyberTech account team.
      </p>
      <PortalFeedbackForm organizationId={orgId} />
    </div>
  );
}
