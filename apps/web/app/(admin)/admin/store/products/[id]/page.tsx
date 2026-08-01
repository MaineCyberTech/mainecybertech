import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getProductById, getCategories } from "@/lib/catalog/loader";
import { getRecommendationsForProduct } from "@/lib/catalog/bundles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Detail - Store - Admin - Maine CyberTech" };

export default async function AdminStoreProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  await requireAdminAccess();

  const product = getProductById(id);
  const categories = getCategories();
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  if (!product) {
    return (
      <AdminPageShell
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Store", href: "/admin/store" },
              { label: "Products", href: "/admin/store/products" },
              { label: id },
            ]}
          />
        }
        subnav={<AdminSubnav current="store-products" />}
        title="Product Not Found"
      >
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-8 text-center text-sm text-amber-300">
          Product with ID &ldquo;{id}&rdquo; was not found in the catalog.
        </div>
      </AdminPageShell>
    );
  }

  const recommendations = getRecommendationsForProduct(id);

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Products", href: "/admin/store/products" },
            { label: product.name },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-products" />}
      title={product.name}
    >
      <div className="space-y-8">
        {/* Basic Info */}
        <Section heading="Basic Info">
          <Field label="ID" value={product.id} />
          <Field label="Slug" value={product.slug} />
          <Field label="Name" value={product.name} />
          <Field label="Summary" value={product.summary} />
          <Field label="Price Range" value={product.priceRange} />
          <Field
            label="Category"
            value={categoryMap.get(product.categoryId) ?? product.categoryId}
          />
          <Field label="Type" value={product.type} />
          <Field label="Status" value={product.status} />
          <Field label="Risk" value={product.riskLevel} />
          <Field label="Pricing Model" value={product.pricingModel} />
          <Field label="Purchase Mode" value={product.purchaseMode} />
          <Field label="Delivery Effort" value={product.deliveryEffort} />
          <Field label="Display" value={product.display ? "Yes" : "No"} />
          <Field label="Bundle Eligible" value={product.bundleEligible ? "Yes" : "No"} />
          <Field label="Tags" value={product.tags.length > 0 ? product.tags.join(", ") : "None"} />
        </Section>

        {/* Marketing */}
        <Section heading="Marketing">
          <Field label="Headline" value={product.marketingHeadline} />
          <Field label="Copy" value={product.marketingCopy} />
          <ArrayField label="Best For" items={product.bestFor} />
          <ArrayField label="Outcomes" items={product.customerOutcomes} />
          <ArrayField label="What Is Included" items={product.whatIsIncluded} />
          <ArrayField label="What Is Not Included" items={product.whatIsNotIncluded} />
        </Section>

        {/* Prerequisites */}
        <Section heading="Customer Prerequisites">
          {product.customerPrerequisites.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
              {product.customerPrerequisites.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No prerequisites listed.</p>
          )}
        </Section>

        {/* Intake Fields */}
        <Section heading={`Intake Fields (${product.intakeFields.length})`}>
          {product.intakeFields.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0A1118]/60">
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">Label</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">Required</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">Help</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-300">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {product.intakeFields.map((f) => (
                    <tr key={f.id} className="border-b border-white/5">
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">{f.id}</td>
                      <td className="px-3 py-2 text-slate-200">{f.label}</td>
                      <td className="px-3 py-2 text-slate-300">{f.type}</td>
                      <td className="px-3 py-2 text-slate-300">{f.required ? "Yes" : "No"}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">{f.help || "â€”"}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {f.options ? f.options.join(", ") : "â€”"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No intake fields defined.</p>
          )}
        </Section>

        {/* Recommendations */}
        <Section heading={`Recommendations (${recommendations.length})`}>
          {recommendations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec) => (
                <a
                  key={rec.id}
                  href={`/admin/store/products/${rec.id}`}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/10"
                >
                  {rec.name}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recommendations configured.</p>
          )}
          {product.addOns.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Add-ons ({product.addOns.length})
              </p>
              <p className="text-sm text-slate-400">{product.addOns.join(", ")}</p>
            </div>
          ) : null}
        </Section>

        {/* Internal Fulfillment */}
        <details className="group rounded-lg border border-white/10 bg-[#0A1118]/60">
          <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-200 transition hover:text-emerald-400">
            Internal Fulfillment Details
          </summary>
          <div className="space-y-6 border-t border-white/10 px-5 py-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fulfillment Workflow
              </p>
              {product.fulfillmentWorkflow.length > 0 ? (
                <ol className="list-inside list-decimal space-y-1 text-sm text-slate-300">
                  {product.fulfillmentWorkflow.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">None defined.</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Internal Procedure
              </p>
              {["triage", "delivery", "documentation", "qa", "closeout"].map((phase) => {
                const steps =
                  product.internalProcedure[phase as keyof typeof product.internalProcedure];
                return (
                  <details key={phase} className="mb-2">
                    <summary className="cursor-pointer rounded bg-white/5 px-3 py-1.5 text-sm font-medium capitalize text-slate-300">
                      {phase}
                    </summary>
                    {steps.length > 0 ? (
                      <ol className="mt-1 list-inside list-decimal space-y-0.5 pl-2 text-sm text-slate-400">
                        {steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="pl-2 text-sm text-slate-500">No steps defined.</p>
                    )}
                  </details>
                );
              })}
            </div>

            <ArraySection label="QA Checklist" items={product.qaChecklist} />
            <ArraySection label="Evidence to Collect" items={product.evidenceToCollect} />
            <ArraySection label="Compliance Notes" items={product.complianceNotes} />
          </div>
        </details>

        {/* JSON Preview */}
        <details className="group rounded-lg border border-white/10 bg-[#0A1118]/60">
          <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-200 transition hover:text-emerald-400">
            JSON Preview
          </summary>
          <div className="border-t border-white/10 px-5 py-4">
            <pre className="max-h-[600px] overflow-auto rounded bg-[#050B12] p-4 text-xs text-slate-300">
              {JSON.stringify(product, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </AdminPageShell>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-200">{heading}</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-200">{value}</p>
    </div>
  );
}

function ArrayField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      {items.length > 0 ? (
        <ul className="mt-0.5 list-inside list-disc text-sm text-slate-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 text-sm text-slate-500">None</p>
      )}
    </div>
  );
}

function ArraySection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      {items.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">None defined.</p>
      )}
    </div>
  );
}
