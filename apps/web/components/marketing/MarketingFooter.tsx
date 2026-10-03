import Link from "next/link";
import { siteConfig } from "@/lib/seo/site";

const serviceLinks = [
  { href: "/store", label: "Services & Pricing" },
  { href: "/services/networks", label: "Networks" },
  { href: "/services/security-systems", label: "Security Systems" },
  { href: "/services/it-support", label: "IT Support" },
  { href: "/services/cloud", label: "Cloud" },
  { href: "/services/cybersecurity", label: "Cybersecurity" },
];

const companyLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/status", label: "System Status" },
];

export default function MarketingFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-cyber-base/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-wider text-slate-50">
            Maine <span className="text-emerald-500">CyberTech</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-slate-400">{siteConfig.description}</p>
        </div>

        <nav aria-label="Services">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
            Services
          </h2>
          <ul className="mt-3 space-y-2">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-400 transition hover:text-emerald-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
            Company
          </h2>
          <ul className="mt-3 space-y-2">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-400 transition hover:text-emerald-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <a href={`mailto:${siteConfig.email}`} className="transition hover:text-emerald-400">
                {siteConfig.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${siteConfig.phone.replace(/[^0-9+]/g, "")}`}
                className="transition hover:text-emerald-400"
              >
                {siteConfig.phone}
              </a>
            </li>
            <li>
              {siteConfig.address.city}, {siteConfig.address.state} {siteConfig.address.country}
            </li>
          </ul>
          <nav aria-label="Legal" className="mt-4">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-500 transition hover:text-emerald-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-7xl text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
