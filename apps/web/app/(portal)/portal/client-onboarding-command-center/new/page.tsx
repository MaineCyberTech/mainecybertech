import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import OnboardingCreateForm from "./OnboardingCreateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Onboarding - Portal - Maine CyberTech" };

export default function NewOnboardingPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Client Onboarding", href: "/portal/client-onboarding-command-center" },
          { label: "New Onboarding" },
        ]}
      />
      <PortalSubnav current="client-onboarding-command-center" />
      <OnboardingCreateForm />
    </div>
  );
}
