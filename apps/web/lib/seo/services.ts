export type ServiceSeoConfig = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  canonicalPath: string;
  relatedBlogSlugs: string[];
};

export const serviceSeo: ServiceSeoConfig[] = [
  {
    slug: "networks",
    title: "Business Wi-Fi & Network Installation",
    metaTitle: "Business Wi-Fi & Network Installation in Maine | Maine CyberTech",
    metaDescription:
      "Professional network installation, Wi-Fi design, UniFi setup, cabling coordination, firewall planning, and connectivity support for Maine offices, restaurants, marinas, warehouses, and facilities.",
    h1: "Business Wi-Fi and Network Installation in Maine",
    primaryKeyword: "network installation Maine",
    secondaryKeywords: [
      "business Wi-Fi Maine",
      "UniFi installation Maine",
      "office network setup",
      "outdoor Wi-Fi",
    ],
    canonicalPath: "/services/networks",
    relatedBlogSlugs: ["business-wifi-planning-checklist-maine"],
  },
  {
    slug: "security-systems",
    title: "Security Camera Systems",
    metaTitle: "Security Camera Installation in Maine | Maine CyberTech",
    metaDescription:
      "Security camera planning, UniFi Protect deployments, network-connected camera systems, NVR planning, and technology support for Maine businesses and organizations.",
    h1: "Security Camera Systems for Maine Businesses",
    primaryKeyword: "security camera installation Maine",
    secondaryKeywords: ["UniFi Protect", "business security cameras", "NVR setup", "PoE cameras"],
    canonicalPath: "/services/security-systems",
    relatedBlogSlugs: ["security-camera-system-planning-checklist-maine-businesses"],
  },
  {
    slug: "it-support",
    title: "Managed IT Services",
    metaTitle: "Managed IT Services in Maine | Maine CyberTech",
    metaDescription:
      "Managed IT support for Maine small businesses, campgrounds, restaurants, marinas, warehouses, and local organizations. Help desk, Microsoft 365, devices, networks, security, and backup planning.",
    h1: "Managed IT Services in Maine",
    primaryKeyword: "managed IT services Maine",
    secondaryKeywords: [
      "IT support Maine",
      "MSP Maine",
      "small business IT support",
      "outsourced IT support",
    ],
    canonicalPath: "/services/it-support",
    relatedBlogSlugs: ["small-business-it-support-checklist-maine"],
  },
  {
    slug: "cloud",
    title: "Cloud, Backup & Disaster Recovery",
    metaTitle: "Cloud Backup and Disaster Recovery in Maine | Maine CyberTech",
    metaDescription:
      "Cloud support, backup planning, disaster recovery, hosting guidance, automation, and resilience planning for Maine businesses and organizations.",
    h1: "Cloud Backup and Disaster Recovery Services in Maine",
    primaryKeyword: "cloud backup Maine",
    secondaryKeywords: [
      "disaster recovery",
      "business continuity",
      "backup planning",
      "cloud support",
    ],
    canonicalPath: "/services/cloud",
    relatedBlogSlugs: [],
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity Services",
    metaTitle: "Cybersecurity Services for Maine Businesses | Maine CyberTech",
    metaDescription:
      "Cybersecurity support for Maine organizations, including Microsoft 365 security, MFA, account protection, endpoint guidance, risk reduction, and incident readiness.",
    h1: "Cybersecurity Services for Maine Businesses",
    primaryKeyword: "cybersecurity services Maine",
    secondaryKeywords: [
      "business cybersecurity",
      "Microsoft 365 security",
      "MFA setup",
      "account protection",
    ],
    canonicalPath: "/services/cybersecurity",
    relatedBlogSlugs: ["microsoft-365-security-checklist-maine-small-business"],
  },
  {
    slug: "microsoft-365-support",
    title: "Microsoft 365 Support",
    metaTitle: "Microsoft 365 Support in Maine | Maine CyberTech",
    metaDescription:
      "Microsoft 365 setup, tenant administration, email configuration, MFA, security defaults, user onboarding, device guidance, and business productivity support.",
    h1: "Microsoft 365 Support and Administration in Maine",
    primaryKeyword: "Microsoft 365 support Maine",
    secondaryKeywords: [
      "M365 administration",
      "Exchange email support",
      "MFA setup",
      "tenant setup",
    ],
    canonicalPath: "/services/microsoft-365-support",
    relatedBlogSlugs: ["microsoft-365-security-checklist-maine-small-business"],
  },
];

export function getServiceSeo(slug: string) {
  return serviceSeo.find((service) => service.slug === slug);
}
