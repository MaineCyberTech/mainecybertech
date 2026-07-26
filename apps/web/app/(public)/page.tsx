import type { Metadata } from "next";
import ServiceCard from "../../components/marketing/ServiceCard";
import LocalBusinessJsonLd from "../../components/seo/LocalBusinessJsonLd";
import BreadcrumbJsonLd from "../../components/seo/BreadcrumbJsonLd";
import JsonLd from "../../components/seo/JsonLd";
import { buildOrganizationSchema, buildWebsiteSchema } from "../../lib/seo/schema";
import { siteConfig } from "../../lib/seo/site";
import { buildMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  description:
    "Enterprise-grade IT management, proactive cybersecurity, and robust infrastructure built for Maine small businesses, campgrounds, restaurants, marinas, warehouses, and local organizations.",
});

const services = [
  {
    icon: "🌐",
    title: "Business Networks",
    description:
      "Professional network installation, Wi-Fi design, UniFi setup, and connectivity for Maine offices, restaurants, marinas, warehouses, and facilities.",
    href: "/services/networks",
  },
  {
    icon: "📹",
    title: "Security Camera Systems",
    description:
      "Security camera planning, UniFi Protect deployments, NVRs, PoE cameras, and remote access for Maine businesses and organizations.",
    href: "/services/security-systems",
  },
  {
    icon: "💻",
    title: "Managed IT Services",
    description:
      "Help desk, Microsoft 365, devices, networks, security, and backup planning for Maine small businesses and local organizations.",
    href: "/services/it-support",
  },
  {
    icon: "☁️",
    title: "Cloud, Backup & Disaster Recovery",
    description:
      "Cloud support, backup planning, disaster recovery, hosting guidance, and resilience planning for Maine businesses and organizations.",
    href: "/services/cloud",
  },
  {
    icon: "🛡️",
    title: "Cybersecurity Services",
    description:
      "Microsoft 365 security, MFA, account protection, endpoint guidance, risk reduction, and incident readiness for Maine organizations.",
    href: "/services/cybersecurity",
  },
  {
    icon: "🔷",
    title: "Microsoft 365 Support",
    description:
      "Tenant setup, email configuration, MFA, security defaults, user onboarding, and business productivity support for Maine organizations.",
    href: "/services/microsoft-365-support",
  },
];

export default function HomePage() {
  return (
    <>
      <LocalBusinessJsonLd />
      <JsonLd data={buildOrganizationSchema() as Record<string, unknown>} />
      <JsonLd data={buildWebsiteSchema() as Record<string, unknown>} />
      <BreadcrumbJsonLd items={[{ name: "Home", url: siteConfig.url }]} />

      <section className="flex min-h-screen items-center justify-center px-4 pb-16 pt-24 text-center sm:pb-24 sm:pt-32">
        <div className="max-w-4xl">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl lg:text-6xl">
            Managed IT, Cybersecurity &amp; Technology Support for{" "}
            <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
              Maine
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Maine CyberTech provides managed IT services, cybersecurity, Microsoft 365 support,
            business Wi-Fi, network installation, UniFi systems, security cameras, cloud backup, and
            technology consulting for Maine small businesses, campgrounds, restaurants, marinas,
            warehouses, and local organizations.
          </p>
          <a
            href="/contact"
            className="font-orbitron mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Get Support Now
          </a>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-orbitron mb-12 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            <span className="text-emerald-500">Services</span> for Maine Organizations
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.href} {...s} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-orbitron text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Who We <span className="text-emerald-500">Help</span>
          </h2>
          <p className="mt-4 text-center text-lg text-slate-400">
            Maine CyberTech supports organizations across Maine with practical, professional
            technology services.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Small Businesses",
                desc: "Managed IT, Microsoft 365, cybersecurity, and day-to-day technology support.",
              },
              {
                name: "Campgrounds",
                desc: "Affordable IT guidance, security reviews, and Microsoft 365 administration.",
              },
              {
                name: "Restaurants",
                desc: "Wi-Fi, security cameras, phone systems, and technology planning for dining and hospitality.",
              },
              {
                name: "Marinas",
                desc: "Outdoor Wi-Fi, security cameras, network cabling, and weather-rated equipment.",
              },
              {
                name: "Warehouses",
                desc: "Network coverage, security camera systems, access points, and device management.",
              },
              {
                name: "Local Facilities",
                desc: "Technology assessments, upgrades, backup planning, and vendor coordination.",
              },
            ].map((audience) => (
              <div
                key={audience.name}
                className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm"
              >
                <h3 className="font-orbitron text-lg font-bold text-slate-100">{audience.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{audience.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Why <span className="text-emerald-500">Maine CyberTech</span>
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Local",
                desc: "Based in Limington, Maine. We understand the technology challenges Maine organizations face day to day.",
              },
              {
                title: "Practical",
                desc: "Clear recommendations without unnecessary upsells. Technology that works for your budget and operations.",
              },
              {
                title: "Professional",
                desc: "Enterprise-grade tools and practices scaled to what small and mid-size organizations actually need.",
              },
            ].map((reason) => (
              <div
                key={reason.title}
                className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm"
              >
                <h3 className="font-orbitron text-lg font-bold text-emerald-400">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-orbitron text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Common Problems <span className="text-emerald-500">We Solve</span>
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                issue: "Slow or unreliable Wi-Fi",
                fix: "Site surveys, access point placement, network configuration, outdoor coverage planning.",
              },
              {
                issue: "No backup strategy",
                fix: "Cloud backup setup, local backup planning, restore testing, retention policies.",
              },
              {
                issue: "Microsoft 365 security gaps",
                fix: "MFA enforcement, admin access reviews, email security configuration, security defaults review.",
              },
              {
                issue: "No IT documentation",
                fix: "Documented vendor contacts, network maps, admin credentials, renewal dates, support numbers.",
              },
              {
                issue: "Outdated network equipment",
                fix: "Network assessment, firewall/switch/access point upgrades, UniFi deployments, structured cabling.",
              },
              {
                issue: "No security camera coverage",
                fix: "Camera placement planning, UniFi Protect, NVR setup, PoE cabling, remote access configuration.",
              },
            ].map((item) => (
              <div
                key={item.issue}
                className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm"
              >
                <h3 className="font-orbitron text-base font-bold text-red-400">{item.issue}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Technology <span className="text-emerald-500">Areas</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            The systems and platforms we support across Maine organizations.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              "Managed IT Support",
              "Cybersecurity",
              "Microsoft 365",
              "Business Wi-Fi",
              "Network Installation",
              "UniFi Networks",
              "Security Cameras",
              "NVR Systems",
              "Cloud Backup",
              "Disaster Recovery",
              "VoIP Phones",
              "Endpoint Management",
              "Firewall Configuration",
              "Structured Cabling",
              "ISP Coordination",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Serving <span className="text-emerald-500">Maine</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Based in Limington, Maine, we provide technology services and support across the state.
            Our clients are in York County, Cumberland County, and throughout southern, central, and
            coastal Maine.
          </p>
          <p className="mt-4 text-base text-slate-500">
            We work with small businesses, campgrounds, restaurants, marinas, warehouses, and local
            facilities that need practical, professional technology support without a full-time
            internal IT team.
          </p>
          <a
            href="/contact"
            className="font-orbitron mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Schedule a Consultation
          </a>
        </div>
      </section>

      <section className="border-t border-white/5 px-4 py-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-orbitron text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            Frequently Asked <span className="text-emerald-500">Questions</span>
          </h2>
          <div className="mt-12 space-y-6">
            {[
              {
                q: "What IT services does Maine CyberTech provide?",
                a: "We provide managed IT services, cybersecurity, Microsoft 365 support, business Wi-Fi and network installation, UniFi systems, security camera installation, cloud backup, disaster recovery planning, and technology consulting.",
              },
              {
                q: "What types of organizations do you work with?",
                a: "We work with Maine small businesses, campgrounds, restaurants, marinas, warehouses, and local facilities. Our services are designed for organizations that may not have full-time internal IT staff.",
              },
              {
                q: "Do you support Microsoft 365?",
                a: "Yes. We help Maine organizations with Microsoft 365 tenant setup, email configuration, MFA, security defaults, user onboarding, and ongoing administration.",
              },
              {
                q: "Can you help with security cameras and UniFi Protect?",
                a: "Yes. We plan and install security camera systems including UniFi Protect, NVRs, PoE cameras, cabling, remote access, and supporting network infrastructure.",
              },
              {
                q: "How do I get started?",
                a: "Contact us to schedule a consultation. We will review your current technology setup, understand your goals, and recommend practical next steps.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm"
              >
                <h3 className="font-orbitron text-lg font-bold text-slate-100">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="/contact"
              className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Contact Us Today
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
