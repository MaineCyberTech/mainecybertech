import { getApiClient } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import MfaSettingsClient from "./MfaSettingsClient";
import type { MfaFactorView, MfaRecoveryStatusView } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Security - Portal - Maine CyberTech" };

type SecurityPageProps = {
  searchParams: Promise<{ recovered?: string }>;
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const sp = await searchParams;
  const recovered = sp?.recovered === "1";
  let factors: MfaFactorView[] = [];
  let recovery: MfaRecoveryStatusView | null = null;
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

  try {
    const status = await getApiClient().auth.mfaRecoveryCodes();
    recovery = {
      remaining: status.remaining,
      total: status.total,
      lastGeneratedAt: status.lastGeneratedAt,
    };
  } catch {
    // Recovery status is supplemental; the panel falls back to an
    // "unavailable" note when the lookup fails.
    recovery = null;
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
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300"
        >
          Unable to load security settings.
        </div>
      ) : (
        <MfaSettingsClient
          initialFactors={factors}
          initialRecovery={recovery}
          recovered={recovered}
        />
      )}
    </div>
  );
}
