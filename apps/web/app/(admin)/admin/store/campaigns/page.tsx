import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { getApiClient } from "@/lib/api";
import type { StoreCampaign } from "@mct/sdk";
import { createCampaignAction } from "./actions";
import { CampaignStatusForm, DeleteCampaignButton } from "./CampaignRowActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasonal Campaigns - Admin - Maine CyberTech" };

function statusPill(status: string): string {
  const map: Record<string, string> = {
    active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    draft: "border-slate-500/25 bg-slate-500/10 text-slate-400",
    paused: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    archived: "border-white/10 bg-white/5 text-slate-500",
  };
  return map[status] ?? "border-white/10 bg-white/5 text-slate-400";
}

function capacitySummary(campaign: StoreCampaign): string {
  if (!campaign.capacityEnabled) return "Capacity messaging off";
  const total = campaign.capacityTotal ?? "—";
  const remaining = campaign.capacityRemaining ?? "—";
  return `${remaining} of ${total} remaining`;
}

export default async function AdminCampaignsPage() {
  await requireAdminAccess();

  let campaigns: StoreCampaign[] = [];
  let loadFailed = false;
  try {
    campaigns = await getApiClient().store.listCampaigns();
  } catch {
    loadFailed = true;
  }

  const active = campaigns.filter((c) => c.status === "active");

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Campaigns" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-campaigns" />}
      title="Seasonal Campaigns"
      description={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} · ${active.length} live (capacity messaging only shows when enabled with real numbers)`}
    >
      {loadFailed && <DataErrorNote what="store campaigns" />}

      <div className="mb-6">
        <CrudForm
          title="New Campaign"
          action={createCampaignAction}
          fields={[
            { key: "slug", label: "Slug", required: true, placeholder: "marina-preseason-2026" },
            { key: "name", label: "Name", required: true },
            { key: "audience", label: "Audience", placeholder: "Marinas, boatyards…" },
            { key: "headline", label: "Headline" },
            { key: "body", label: "Body", type: "textarea" },
            { key: "icon", label: "Icon", placeholder: "Anchor" },
            { key: "accent", label: "Accent", placeholder: "teal" },
            {
              key: "recommendedProductIds",
              label: "Recommended product ids (comma separated)",
            },
            { key: "trustBadges", label: "Trust badges (comma separated)" },
            { key: "promoEligibility", label: "Promo eligibility (comma separated)" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["draft", "active", "paused", "archived"],
            },
            {
              key: "capacityEnabled",
              label: "Enable limited-capacity messaging (requires a real total)",
              type: "checkbox",
            },
            { key: "capacityTotal", label: "Capacity total", type: "number" },
            { key: "capacityRemaining", label: "Capacity remaining", type: "number" },
            { key: "capacityLabel", label: "Capacity label override" },
          ]}
        />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Create seasonal readiness campaigns; activate one to show it on the public store."
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <section
              key={campaign.id}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-50">{campaign.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{campaign.slug}</p>
                  <p className="mt-1 text-xs text-slate-400">{campaign.audience}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(String(campaign.status))}`}
                  >
                    {String(campaign.status)}
                  </span>
                  <DeleteCampaignButton id={campaign.id} />
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-400">{campaign.headline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/5 pt-4 text-xs">
                <span className="text-slate-500">{capacitySummary(campaign)}</span>
                {campaign.capacityEnabled && !campaign.capacityNotice && (
                  <span role="status" className="text-amber-400">
                    No notice will be shown — set a positive remaining count and a total.
                  </span>
                )}
                {campaign.capacityNotice && (
                  <span role="status" className="text-emerald-400">
                    Shows: “{campaign.capacityNotice}”
                  </span>
                )}
                <span className="ml-auto">
                  <CampaignStatusForm id={campaign.id} status={String(campaign.status)} />
                </span>
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
