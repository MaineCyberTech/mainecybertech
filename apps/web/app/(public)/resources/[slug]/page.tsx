import { getLeadMagnetBySlug } from "@/lib/catalog/v5-loaders";
import { getAllProducts } from "@/lib/catalog/loader";
import type { CatalogProduct } from "@/lib/catalog/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const magnet = getLeadMagnetBySlug(slug);
  if (!magnet) return { title: "Checklist Not Found" };

  return buildMetadata({
    title: magnet.title,
    description: `Download the ${magnet.title} — a practical checklist from Maine CyberTech.`,
    path: `/resources/${slug}`,
  });
}

function checklistItemsForId(id: string): string[] {
  const map: Record<string, string[]> = {
    cyber_insurance_readiness_checklist: [
      "Verify cyber liability policy covers social engineering and funds transfer fraud",
      "Confirm MFA is enforced on all email and financial platforms",
      "Document backup schedule and restore test results",
      "Review incident response plan for insurer notification requirements",
      "Check that all endpoints have current antivirus and patch management",
      "Validate security awareness training completion records",
    ],
    small_business_it_starter_checklist: [
      "Set up a business-grade router with firewall enabled",
      "Enable MFA on all business accounts",
      "Establish a regular backup schedule (on-site + cloud)",
      "Create a simple password policy and deploy a password manager",
      "Document all software licenses and subscriptions",
      "Schedule a quarterly security review",
    ],
    website_health_checklist: [
      "Verify SSL certificate is valid and auto-renewing",
      "Check that CMS, plugins, and themes are up to date",
      "Confirm backups are running and restorable",
      "Test contact forms for deliverability",
      "Review uptime monitoring and alert settings",
      "Check for broken links and outdated content",
    ],
    new_employee_it_setup_checklist: [
      "Create accounts: email, password manager, relevant platforms",
      "Assign hardware and verify it is imaged correctly",
      "Enroll device in MDM and apply security baselines",
      "Grant access to shared drives, CRM, and line-of-business apps",
      "Schedule security awareness onboarding session",
      "Document issued assets in IT inventory",
    ],
    employee_offboarding_checklist: [
      "Revoke all system access and reset shared credentials",
      "Retrieve company hardware and wipe if needed",
      "Forward email and set up auto-responder if appropriate",
      "Archive user files and shared drive content",
      "Remove from all distribution lists and groups",
      "Document offboarding completion in ticket system",
    ],
    marina_preseason_technology_checklist: [
      "Verify Wi-Fi network coverage and performance at all slips",
      "Test point-of-sale and payment processing systems",
      "Check fuel dock card reader and terminal connectivity",
      "Review security camera coverage and recording retention",
      "Update gate code and access control systems",
      "Test guest network isolation from operational systems",
    ],
    church_cybersecurity_checklist: [
      "Enable MFA on all church email accounts and financial platforms",
      "Review who has admin access to website, giving platform, and database",
      "Ensure donation and giving pages use HTTPS",
      "Check that live streaming equipment and accounts are secured",
      "Document incident contact chain for volunteers and staff",
      "Schedule annual security review with technology team",
    ],
    backup_restore_test_checklist: [
      "Verify backup job completion and success status for all critical systems",
      "Perform a file-level restore test from on-site backup",
      "Perform a file-level restore test from cloud backup",
      "Document restore time and data integrity check results",
      "Review backup retention policy against business requirements",
      "Update backup runbook with any configuration changes",
    ],
  };
  return map[id] ?? [];
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const magnet = getLeadMagnetBySlug(slug);
  if (!magnet) notFound();

  const allProducts = getAllProducts();
  const related = magnet.relatedProducts
    .map((id: string) => allProducts.find((p: CatalogProduct) => p.id === id))
    .filter((p: CatalogProduct | undefined): p is CatalogProduct => p !== undefined);

  const items = magnet.checklist.length > 0 ? magnet.checklist : checklistItemsForId(magnet.id);

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/resources"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{magnet.title}</span>
        </nav>

        <div className="mb-8">
          <span className="mb-4 inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Checklist
          </span>
          <h1 className="font-orbitron mt-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {magnet.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            {magnet.description ||
              `A practical ${magnet.title.toLowerCase()} to help you stay organized and secure.`}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 backdrop-blur-sm">
          <h2 className="font-orbitron mb-6 text-xl font-bold uppercase tracking-wider text-emerald-400">
            Checklist Items
          </h2>
          <ul className="space-y-4">
            {items.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-600/30 text-xs text-emerald-400">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 text-center backdrop-blur-sm">
          <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-50">
            Want the Full Checklist?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Download a printer-friendly PDF version or get personalized guidance from our team.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={`/contact?resource=${magnet.id}`}
              className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Send Me the Download
            </Link>
            <Link
              href="/contact"
              className="font-orbitron inline-block rounded border-2 border-slate-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:border-emerald-600 hover:text-emerald-500"
            >
              Ask a Question
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-orbitron mb-6 text-xl font-bold uppercase tracking-wider text-slate-50">
              Related <span className="text-emerald-500">Services</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {related.map((product: CatalogProduct) => (
                <Link
                  key={product.slug}
                  href={`/store/${product.slug}`}
                  className="rounded border border-emerald-600/20 bg-emerald-600/5 px-4 py-2 text-sm text-emerald-400 no-underline transition hover:bg-emerald-600/10"
                >
                  {product.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
