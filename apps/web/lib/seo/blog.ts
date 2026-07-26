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
    relatedServiceSlugs: ["it-support", "microsoft-365-support", "cybersecurity"],
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
      "Plan better business Wi-Fi for Maine offices, restaurants, marinas, warehouses, and local facilities with this checklist for coverage, cabling, access points, outdoor areas, and network equipment.",
    primaryKeyword: "business Wi-Fi Maine",
    secondaryKeywords: ["network installation Maine", "UniFi installation Maine", "outdoor Wi-Fi"],
    category: "Networking",
    relatedServiceSlugs: ["networks"],
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
    relatedServiceSlugs: ["security-systems", "networks"],
  },
  {
    slug: "cybersecurity-checklist-maine-campgrounds-small-businesses",
    title: "Cybersecurity Checklist for Maine Campgrounds and Small Businesses",
    metaTitle: "Cybersecurity Checklist for Maine Campgrounds and Small Businesses",
    metaDescription:
      "A practical cybersecurity checklist for Maine campgrounds and small businesses covering MFA, admin access, email security, devices, backups, and staff training.",
    primaryKeyword: "cybersecurity services Maine",
    secondaryKeywords: ["campground cybersecurity", "small business security", "MFA setup"],
    category: "Cybersecurity",
    relatedServiceSlugs: ["cybersecurity", "microsoft-365-support"],
  },
  {
    slug: "improve-wifi-restaurants-marinas-warehouses-older-buildings",
    title: "How to Improve Wi-Fi in Restaurants, Marinas, Warehouses, and Older Buildings",
    metaTitle: "Improve Wi-Fi in Restaurants, Marinas, Warehouses | Maine CyberTech",
    metaDescription:
      "Practical guidance for improving Wi-Fi coverage in restaurants, marinas, warehouses, and older Maine buildings with challenging layouts, materials, and outdoor areas.",
    primaryKeyword: "improve business Wi-Fi Maine",
    secondaryKeywords: ["restaurant Wi-Fi", "marina Wi-Fi", "warehouse Wi-Fi", "outdoor Wi-Fi"],
    category: "Networking",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "cloud-backup-checklist-maine-small-businesses",
    title: "Cloud Backup Checklist for Maine Small Businesses",
    metaTitle: "Cloud Backup Checklist for Maine Small Businesses",
    metaDescription:
      "A practical cloud backup checklist for Maine small businesses covering what to back up, how often, where to store it, restore testing, and validation.",
    primaryKeyword: "cloud backup Maine",
    secondaryKeywords: ["disaster recovery", "business continuity", "backup planning"],
    category: "Cloud Backup",
    relatedServiceSlugs: ["cloud"],
  },
  {
    slug: "it-support-restaurants-campgrounds-maine",
    title: "IT Support for Restaurants and Campgrounds in Maine: What to Review First",
    metaTitle: "IT Support for Restaurants and Campgrounds in Maine | Maine CyberTech",
    metaDescription:
      "A practical guide for Maine restaurants and campgrounds reviewing their IT setup including Microsoft 365, Wi-Fi, security, computers, backups, and internet service.",
    primaryKeyword: "IT support restaurants Maine",
    secondaryKeywords: [
      "campground IT support",
      "restaurant technology",
      "managed IT services Maine",
    ],
    category: "Managed IT",
    relatedServiceSlugs: ["it-support", "microsoft-365-support"],
  },
  {
    slug: "technology-checklist-marinas-warehouses-outdoor-facilities",
    title: "Technology Checklist for Marinas, Warehouses, and Outdoor Facilities",
    metaTitle: "Technology Checklist for Marinas, Warehouses | Maine CyberTech",
    metaDescription:
      "A technology checklist for marinas, warehouses, and outdoor facilities covering outdoor Wi-Fi, security cameras, network cabling, power, and weather-rated equipment for Maine properties.",
    primaryKeyword: "marina technology support Maine",
    secondaryKeywords: ["warehouse IT", "outdoor Wi-Fi", "security cameras", "network cabling"],
    category: "Networking",
    relatedServiceSlugs: ["networks", "security-systems"],
  },
  {
    slug: "backup-vs-disaster-recovery-small-business",
    title: "Backup vs Disaster Recovery: What Small Businesses Need to Know",
    metaTitle: "Backup vs Disaster Recovery for Small Businesses | Maine CyberTech",
    metaDescription:
      "Understand the difference between backup and disaster recovery, why both matter for small businesses, and how to build a practical continuity plan.",
    primaryKeyword: "backup vs disaster recovery small business",
    secondaryKeywords: ["business continuity", "backup planning", "cloud backup"],
    category: "Cloud Backup",
    relatedServiceSlugs: ["cloud", "cybersecurity"],
  },
  {
    slug: "unifi-network-setup-small-business-planning",
    title: "UniFi Network Setup for Small Businesses: What to Plan Before Installation",
    metaTitle: "UniFi Network Setup for Small Businesses | Maine CyberTech",
    metaDescription:
      "Plan your UniFi network deployment for a small business including site survey, switch selection, access point placement, controller setup, VLANs, and ongoing management.",
    primaryKeyword: "UniFi installation Maine",
    secondaryKeywords: ["UniFi network setup", "small business network", "access point placement"],
    category: "Networking",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "isp-consolidation-checklist-restaurants-local-organizations",
    title: "ISP Consolidation Checklist for Restaurants and Local Organizations",
    metaTitle: "ISP Consolidation Checklist for Restaurants | Maine CyberTech",
    metaDescription:
      "A practical ISP consolidation checklist for restaurants and local organizations reviewing internet, phone, and connectivity services across multiple locations in Maine.",
    primaryKeyword: "ISP consolidation checklist",
    secondaryKeywords: [
      "restaurant internet",
      "phone service",
      "ISP management",
      "connectivity review",
    ],
    category: "Local Business Technology",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "what-does-managed-it-provider-do-small-business",
    title: "What Does a Managed IT Provider Do for a Small Business?",
    metaTitle: "What Does a Managed IT Provider Do? | Maine CyberTech",
    metaDescription:
      "Understand what a managed IT provider actually does for a small business including help desk, Microsoft 365 management, cybersecurity, device support, network maintenance, and backup planning.",
    primaryKeyword: "what does a managed IT provider do",
    secondaryKeywords: [
      "managed IT services Maine",
      "MSP Maine",
      "small business IT support",
      "outsourced IT",
    ],
    category: "Managed IT",
    relatedServiceSlugs: ["it-support", "microsoft-365-support", "cybersecurity"],
  },
  {
    slug: "break-fix-vs-managed-it-maine-small-businesses",
    title: "Break/Fix IT vs Managed IT: Which Is Better for Maine Small Businesses?",
    metaTitle: "Break/Fix vs Managed IT for Maine Small Businesses | Maine CyberTech",
    metaDescription:
      "Compare break/fix IT support with managed IT services for Maine small businesses. Learn the cost, response time, security, and planning differences.",
    primaryKeyword: "break fix vs managed IT",
    secondaryKeywords: [
      "managed IT services Maine",
      "MSP vs break fix",
      "small business IT support",
      "outsourced IT support",
    ],
    category: "Managed IT",
    relatedServiceSlugs: ["it-support", "cybersecurity"],
  },
  {
    slug: "why-every-business-should-enable-mfa",
    title: "Why Every Business Should Enable MFA Before Anything Else",
    metaTitle: "Why Every Business Should Enable MFA | Maine CyberTech",
    metaDescription:
      "Multi-factor authentication is the single most effective step a small business can take to protect accounts. Learn why MFA matters and how to enable it.",
    primaryKeyword: "why enable MFA small business",
    secondaryKeywords: [
      "MFA setup",
      "multi-factor authentication",
      "account security",
      "cybersecurity basics",
    ],
    category: "Cybersecurity",
    relatedServiceSlugs: ["cybersecurity", "microsoft-365-support"],
  },
  {
    slug: "common-email-security-mistakes-small-businesses",
    title: "Common Email Security Mistakes Small Businesses Make",
    metaTitle: "Common Email Security Mistakes Small Businesses Make | Maine CyberTech",
    metaDescription:
      "Avoid the most common email security mistakes small businesses make including weak MFA, missing SPF/DKIM, shared accounts, and lack of staff training.",
    primaryKeyword: "email security mistakes small business",
    secondaryKeywords: [
      "business email security",
      "phishing prevention",
      "email protection",
      "MFA setup",
    ],
    category: "Cybersecurity",
    relatedServiceSlugs: ["cybersecurity", "microsoft-365-support"],
  },
  {
    slug: "outdoor-wifi-planning-guide-maine-properties",
    title: "Outdoor Wi-Fi Planning Guide for Maine Properties",
    metaTitle: "Outdoor Wi-Fi Planning Guide for Maine Properties | Maine CyberTech",
    metaDescription:
      "Plan outdoor Wi-Fi for Maine campgrounds, marinas, restaurants, warehouses, and facilities. Covers weather-rated access points, coverage zones, cabling, and power.",
    primaryKeyword: "outdoor Wi-Fi Maine",
    secondaryKeywords: [
      "outdoor access points",
      "weather-rated Wi-Fi",
      "campground Wi-Fi",
      "marina Wi-Fi",
    ],
    category: "Networking",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "how-many-security-cameras-small-business-needs",
    title: "How Many Security Cameras Does a Small Business Need?",
    metaTitle: "How Many Security Cameras for a Small Business? | Maine CyberTech",
    metaDescription:
      "A practical guide to determining how many security cameras a small business needs based on coverage areas, camera types, resolution, lighting, and budget.",
    primaryKeyword: "how many security cameras small business",
    secondaryKeywords: [
      "security camera planning",
      "business security cameras",
      "camera coverage guide",
      "NVR setup",
    ],
    category: "Security Systems",
    relatedServiceSlugs: ["security-systems"],
  },
];
