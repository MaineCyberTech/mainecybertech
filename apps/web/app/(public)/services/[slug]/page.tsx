import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const services = {
  networks: {
    title: "Business Networks",
    subtitle: "Build a reliable, high-speed foundation for your operations.",
    icon: "🌐",
    body: [
      "We provide new installs of business networks and management of pre-existing infrastructure with intentions of updating outdated equipment.",
      "Your network is the backbone of your organization. Slow speeds, dropped connections, and outdated hardware cost you time and money. We specialize in designing and deploying enterprise-grade networking solutions—from running new drops to configuring advanced firewalls and managed switches.",
    ],
  },
  "security-systems": {
    title: "Security Systems & Cameras",
    subtitle: "Protect your physical assets with intelligent monitoring.",
    icon: "📹",
    body: [
      "We provide Security systems configuration, IoT IP Camera planning, installation, and optional monitoring of your premises.",
      "Cybersecurity doesn't end at your firewall. Protect your physical offices, warehouses, and assets with high-definition IP camera networks and integrated IoT security sensors. We handle everything from strategic camera placement to secure remote-access configuration.",
    ],
  },
  "it-support": {
    title: "Technical IT Support",
    subtitle: "Reliable support for the devices your business depends on.",
    icon: "💻",
    body: [
      "We offer technical support for systems such as endpoints, printers, VoIP devices, PoS systems, and backups.",
      "When your technology stops working, your business stops working. Our engineers are experts in supporting a wide range of essential systems, including user PCs and Macs, office printers, internet phone systems, retail registers, and ensuring critical data backups are functioning flawlessly.",
    ],
  },
  cloud: {
    title: "Cloud System Management",
    subtitle: "Secure, scalable, and fully optimized remote infrastructure.",
    icon: "☁️",
    body: [
      "We offer Cloud system configuration and management.",
      "The modern workplace requires agility and seamless collaboration. Whether you are migrating data to the cloud for the first time, setting up a new virtual workspace, or require daily administration of your current cloud platforms, our team ensures your transition is secure and your operations remain uninterrupted.",
    ],
  },
  cybersecurity: {
    title: "Security Configuration",
    subtitle: "Advanced defense against evolving digital threats.",
    icon: "🛡️",
    body: [
      "We implement Security configuration of your systems and networks to protect from outside threats.",
      "Cyber attacks are no longer a matter of 'if', but 'when'. We deploy comprehensive, multi-layered security architectures. From strict access controls and endpoint detection/response (EDR) to continuous vulnerability assessments, we harden your defenses so you can focus on your business.",
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services[slug as keyof typeof services];
  if (!service) return { title: "Service Not Found" };
  return {
    title: `${service.title} — Maine CyberTech`,
    description: service.subtitle,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services[slug as keyof typeof services];
  if (!service) notFound();

  return (
    <section className="min-h-screen px-4 pt-32 pb-20 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold uppercase tracking-widest text-emerald-500 no-underline transition hover:text-emerald-400"
        >
          ⯇ Back to Home
        </Link>

        <div className="mb-12 text-center">
          <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {service.title.split(" ")[0]} <span className="text-emerald-500">{service.title.split(" ").slice(1).join(" ")}</span>
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
              className="mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 font-orbitron text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
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
