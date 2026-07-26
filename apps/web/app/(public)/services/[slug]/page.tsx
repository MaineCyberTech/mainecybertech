import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { buildServiceSchema } from "@/lib/seo/schema";
import { getServiceSeo } from "@/lib/seo/services";
import { siteConfig } from "@/lib/seo/site";
import { buildMetadata } from "@/lib/seo/metadata";

const services: Record<string, { title: string; subtitle: string; icon: string; body: string[] }> =
  {
    networks: {
      title: "Business Wi-Fi & Network Installation",
      subtitle:
        "Professional network installation, Wi-Fi design, UniFi setup, and connectivity for Maine offices, churches, marinas, warehouses, and facilities.",
      icon: "🌐",
      body: [
        "We provide new installs of business networks and management of pre-existing infrastructure with intentions of updating outdated equipment.",
        "Your network is the backbone of your organization. Slow speeds, dropped connections, and outdated hardware cost you time and money. We specialize in designing and deploying enterprise-grade networking solutions\u2014from running new drops to configuring advanced firewalls and managed switches.",
      ],
    },
    "security-systems": {
      title: "Security Camera Systems",
      subtitle:
        "Security camera planning, UniFi Protect deployments, NVRs, PoE cameras, and remote access for Maine businesses and organizations.",
      icon: "📹",
      body: [
        "We provide Security systems configuration, IoT IP Camera planning, installation, and optional monitoring of your premises.",
        "Cybersecurity doesn't end at your firewall. Protect your physical offices, warehouses, and assets with high-definition IP camera networks and integrated IoT security sensors. We handle everything from strategic camera placement to secure remote-access configuration.",
      ],
    },
    "it-support": {
      title: "Managed IT Services",
      subtitle:
        "Help desk, Microsoft 365, devices, networks, security, and backup planning for Maine small businesses and local organizations.",
      icon: "💻",
      body: [
        "We offer technical support for systems such as endpoints, printers, VoIP devices, PoS systems, and backups.",
        "When your technology stops working, your business stops working. Our engineers are experts in supporting a wide range of essential systems, including user PCs and Macs, office printers, internet phone systems, retail registers, and ensuring critical data backups are functioning flawlessly.",
      ],
    },
    cloud: {
      title: "Cloud, Backup & Disaster Recovery",
      subtitle:
        "Cloud support, backup planning, disaster recovery, hosting guidance, and resilience planning for Maine businesses and organizations.",
      icon: "☁️",
      body: [
        "We offer Cloud system configuration and management.",
        "The modern workplace requires agility and seamless collaboration. Whether you are migrating data to the cloud for the first time, setting up a new virtual workspace, or require daily administration of your current cloud platforms, our team ensures your transition is secure and your operations remain uninterrupted.",
      ],
    },
    cybersecurity: {
      title: "Cybersecurity Services",
      subtitle:
        "Microsoft 365 security, MFA, account protection, endpoint guidance, risk reduction, and incident readiness for Maine organizations.",
      icon: "🛡️",
      body: [
        "We implement Security configuration of your systems and networks to protect from outside threats.",
        "Cyber attacks are no longer a matter of 'if', but 'when'. We deploy comprehensive, multi-layered security architectures. From strict access controls and endpoint detection/response (EDR) to continuous vulnerability assessments, we harden your defenses so you can focus on your business.",
      ],
    },
    "microsoft-365-support": {
      title: "Microsoft 365 Support",
      subtitle:
        "Tenant setup, email configuration, MFA, security defaults, user onboarding, and business productivity support.",
      icon: "🔷",
      body: [
        "We provide Microsoft 365 setup, tenant administration, email configuration, MFA, and security defaults for Maine businesses and organizations.",
        "Microsoft 365 is often the center of a small business technology environment. It holds email, documents, calendars, Teams messages, user accounts, and business records. We help Maine organizations configure, secure, and manage their Microsoft 365 environment with practical, business-focused guidance.",
      ],
    },
  };

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seo = getServiceSeo(slug);
  const service = services[slug];
  if (!service) return { title: "Service Not Found" };

  const description = seo?.metaDescription ?? service.subtitle;

  return buildMetadata({
    title: seo?.metaTitle ?? service.title,
    description,
    path: `/services/${slug}`,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services[slug];
  if (!service) notFound();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-7xl">
        <BreadcrumbJsonLd
          items={[
            { name: "Home", url: siteConfig.url },
            { name: service.title, url: `${siteConfig.url}/services/${slug}` },
          ]}
        />
        <JsonLd
          data={
            buildServiceSchema({
              name: service.title,
              description: service.subtitle,
              slug,
            }) as Record<string, unknown>
          }
        />

        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold uppercase tracking-widest text-emerald-500 no-underline transition hover:text-emerald-400"
        >
          ⯇ Back to Home
        </Link>

        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {service.title.split(" ")[0]}{" "}
            <span className="text-emerald-500">{service.title.split(" ").slice(1).join(" ")}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400">{service.subtitle}</p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            {service.body.map((p, i) => (
              <p key={i} className="mb-6 leading-relaxed text-slate-400 last:mb-0">
                {p}
              </p>
            ))}
            <Link
              href="/contact"
              className="font-orbitron mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Get Support Now
            </Link>
          </div>
          <div className="flex aspect-square items-center justify-center rounded-xl border border-emerald-600/20 bg-gradient-to-br from-emerald-600/10 to-[#0A1118]/50 text-8xl shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
            {service.icon}
          </div>
        </div>
      </div>
    </section>
  );
}
