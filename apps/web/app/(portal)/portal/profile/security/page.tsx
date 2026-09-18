import { getApiClient } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import MfaSettingsClient from "./MfaSettingsClient";
import type { MfaFactorView } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Security - Portal - Maine CyberTech" };

export default async function SecurityPage() {
  let factors: MfaFactorView[] = [];
  let loadError = false;

  try {
    const result = await getApiClient().auth.mfaFactors();
    factors = (result.totp ?? []).map((f) => ({
      id: f.id,
      friendlyName: f.friendlyName,
      status: f.status,
    }));
  } catch {
    loadError = true;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Profile", href: "/portal/profile" },
          { label: "Security" },
        ]}
      />
      <PortalSubnav current="dashboard" />
      {loadError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          Unable to load security settings.
        </div>
      ) : (
        <MfaSettingsClient initialFactors={factors} />
      )}
    </div>
  );
}
