import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Field Services - Admin" };

export default async function FieldServicesPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let counts: Record<string, number> = {};
  try {
    const [isp, unifi, ports, cameras, staging, diagrams] = await Promise.allSettled([
      api.fieldServices.isp.list({}),
      api.fieldServices.unifi.list({}),
      api.fieldServices.portMaps.list({}),
      api.fieldServices.camera.list({}),
      api.fieldServices.staging.list({}),
      api.fieldServices.networkDiagrams.list({}),
    ]);
    for (const [k, v] of Object.entries({ isp, unifi, ports, cameras, staging, diagrams })) {
      counts[k] = v.status === "fulfilled" ? ((v.value as { total?: number }).total ?? 0) : 0;
    }
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Field Services" }]} />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Field Services & Network Tools"
      description="ISP assessments, UniFi surveys, port maps, camera storage, hardware staging, and network diagrams."
    >
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {[
          { key: "isp", label: "ISP", count: counts.isp || 0 },
          { key: "unifi", label: "UniFi", count: counts.unifi || 0 },
          { key: "port-maps", label: "Port Maps", count: counts.ports || 0 },
          { key: "camera-calc", label: "Cameras", count: counts.cameras || 0 },
          { key: "staging", label: "Staging", count: counts.staging || 0 },
          { key: "network-diagrams", label: "Diagrams", count: counts.diagrams || 0 },
        ].map((m) => (
          <div
            key={m.key}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-center"
          >
            <p className="font-orbitron text-xl text-slate-50">{m.count}</p>
            <p className="mt-1 text-xs text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
