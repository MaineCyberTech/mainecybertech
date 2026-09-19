import { getApiClient } from "@/lib/api";
import { logger } from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import EmptyState from "@/components/EmptyState";
import type { ClientPortalBootstrap, ClientPortalMembership } from "@mct/sdk";

export const metadata = { title: "Client Portal - Overview - Maine CyberTech" };

function subscriptionLabel(membership: ClientPortalMembership): string {
  const sub = membership.subscription;
  if (!sub) return "No subscription";
  const plan = sub.planName ? ` (${sub.planName})` : "";
  return `${sub.status}${plan}`;
}

export default async function ClientPortalOverviewPage() {
  const api = getApiClient();

  let bootstrap: ClientPortalBootstrap | null = null;
  try {
    bootstrap = await api.clientPortal.getBootstrap();
  } catch (err) {
    logger.error({ err }, "Failed to load client portal bootstrap");
  }

  const profile = bootstrap?.profile;
  const memberships = bootstrap?.memberships ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/client-portal" },
          { label: "Overview" },
        ]}
      />
      <PortalSubnav current="client-portal" />

      <section className="cyber-panel">
        <h2 className="cyber-heading text-2xl">Client Portal Overview</h2>
        <p className="mt-3 text-slate-300">
          {profile?.fullName ? `Welcome, ${profile.fullName}.` : "Welcome to your client portal."}
          {profile?.email ? ` (${profile.email})` : ""}
        </p>
      </section>

      {memberships.length === 0 ? (
        <section className="cyber-panel">
          <EmptyState
            icon="🏢"
            title="No organization access"
            description="You are not a member of any organization yet. Contact your administrator to request access."
          />
        </section>
      ) : (
        memberships.map((m) => (
          <section key={m.organizationId} className="cyber-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="cyber-heading text-lg">{m.organizationName ?? "Unknown Organization"}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Role: {m.roleName ?? m.roleKey ?? "—"} · Status: {m.status}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Subscription: {subscriptionLabel(m)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Enabled Modules
              </h4>
              {m.enabledModules.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {m.enabledModules.map((mod) => (
                    <li
                      key={mod}
                      className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                    >
                      {mod}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No modules enabled.</p>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
