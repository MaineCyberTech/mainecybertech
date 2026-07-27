export type BlogSeoConfig = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  category:
    | "Managed IT"
    | "Cybersecurity"
    | "Microsoft 365"
    | "Networking"
    | "Security Systems"
    | "Cloud Backup"
    | "Local Business Technology";
  relatedServiceSlugs: string[];
};

export const blogSeoBacklog: BlogSeoConfig[] = [
  {
    slug: "small-business-it-support-checklist-maine",
    title: "Small Business IT Support Checklist for Maine Companies",
    metaTitle: "Small Business IT Support Checklist for Maine Companies",
    metaDescription:
      "A practical IT support checklist for Maine small businesses reviewing devices, Microsoft 365, Wi-Fi, cybersecurity, backups, documentation, and vendor support.",
    primaryKeyword: "small business IT support Maine",
    secondaryKeywords: ["IT support Maine", "managed IT services Maine", "MSP Maine"],
    category: "Managed IT",
    relatedServiceSlugs: ["managed-it-services", "microsoft-365-support", "cybersecurity"],
  },
  {
    slug: "microsoft-365-security-checklist-maine-small-business",
    title: "Microsoft 365 Security Checklist for Maine Small Businesses",
    metaTitle: "Microsoft 365 Security Checklist for Maine Small Businesses",
    metaDescription:
      "A plain-English Microsoft 365 security checklist covering MFA, account protection, email security, admin access, device practices, and backup considerations.",
    primaryKeyword: "Microsoft 365 security Maine",
    secondaryKeywords: ["Microsoft 365 support Maine", "MFA setup", "business email security"],
    category: "Microsoft 365",
    relatedServiceSlugs: ["microsoft-365-support", "cybersecurity"],
  },
  {
    slug: "business-wifi-planning-checklist-maine",
    title: "Business Wi-Fi Planning Checklist for Maine Buildings",
    metaTitle: "Business Wi-Fi Planning Checklist for Maine Buildings",
    metaDescription:
      "Plan better business Wi-Fi for Maine offices, churches, marinas, warehouses, and local facilities with this checklist for coverage, cabling, access points, outdoor areas, and network equipment.",
    primaryKeyword: "business Wi-Fi Maine",
    secondaryKeywords: ["network installation Maine", "UniFi installation Maine", "outdoor Wi-Fi"],
    category: "Networking",
    relatedServiceSlugs: ["network-installation"],
  },
  {
    slug: "security-camera-system-planning-checklist-maine-businesses",
    title: "Security Camera System Planning Checklist for Maine Businesses",
    metaTitle: "Security Camera System Planning Checklist for Maine Businesses",
    metaDescription:
      "A practical security camera planning checklist for Maine businesses covering camera placement, NVRs, PoE, cabling, remote access, retention, and network requirements.",
    primaryKeyword: "security camera installation Maine",
    secondaryKeywords: ["business security cameras", "UniFi Protect", "NVR setup"],
    category: "Security Systems",
    relatedServiceSlugs: ["security-systems", "network-installation"],
  },
];
