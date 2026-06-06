import type { Metadata } from "next";
import ServiceCard from "../../components/marketing/ServiceCard";

export const metadata: Metadata = {
  title: "Maine CyberTech | Networks, Security & IT Support",
  description: "Enterprise-grade IT management, proactive cybersecurity, and robust infrastructure built for modern business in Maine.",
  openGraph: {
    title: "Maine CyberTech | Networks, Security & IT Support",
    description: "Enterprise-grade IT management, proactive cybersecurity, and robust infrastructure.",
  },
};

const services = [
  {
    icon: "🌐",
    title: "Business Networks",
    description: "New installs of business networks and management of pre-existing infrastructure with intentions of updating outdated equipment.",
    href: "/services/networks",
  },
  {
    icon: "📹",
    title: "Security Systems & Cameras",
    description: "Security systems configuration, IoT IP Camera planning, installation, and optional monitoring of your premises.",
    href: "/services/security-systems",
  },
  {
    icon: "💻",
    title: "Technical IT Support",
    description: "Comprehensive technical support for user endpoints, printers, VoIP devices, PoS systems, and vital data backups.",
    href: "/services/it-support",
  },
  {
    icon: "☁️",
    title: "Cloud Configuration",
    description: "Expert cloud system configuration and ongoing management. Transition your workloads securely and efficiently.",
    href: "/services/cloud",
  },
  {
    icon: "🛡️",
    title: "Security Configuration",
    description: "Robust security configurations designed to protect your network, endpoints, and data assets from modern cyber threats.",
    href: "/services/cybersecurity",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="flex min-h-screen items-center justify-center px-4 pt-24 pb-16 text-center sm:pt-32 sm:pb-24">
        <div className="max-w-4xl">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl lg:text-6xl">
            Secure Your <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">Future</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Enterprise-grade IT management, proactive cybersecurity, and robust infrastructure built for modern business.
            We prevent problems before they impact your operations.
          </p>
          <a
            href="/contact"
            className="mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 font-orbitron text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Get Support Now
          </a>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.href} {...s} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
