import { getApiClient } from "@/lib/api";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile - Portal - Maine CyberTech" };

export default async function ProfilePage() {
  const api = getApiClient();

  let initialData = null;
  try {
    const user = await api.users.me();
    if (user?.userId) {
      initialData = {
        userId: user.userId,
        email: user.email ?? "",
        fullName: user.fullName ?? null,
        phone: user.phone ?? null,
        title: user.title ?? null,
      };
    }
  } catch {}

  if (!initialData) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Profile" }]} />
        <PortalSubnav current="dashboard" />
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Unable to load profile.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Profile" }]} />
      <PortalSubnav current="dashboard" />
      <ProfileClient initialData={initialData} />
    </div>
  );
}
