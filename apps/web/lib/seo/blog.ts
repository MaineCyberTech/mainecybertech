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
  datePublished: string;
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
    datePublished: "2026-07-01",
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
    datePublished: "2026-07-01",
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
    datePublished: "2026-07-01",
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
    datePublished: "2026-07-01",
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
    datePublished: "2025-03-10",
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
    datePublished: "2025-01-22",
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
    datePublished: "2024-09-03",
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
    datePublished: "2025-07-15",
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
    datePublished: "2024-11-18",
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
    datePublished: "2026-02-08",
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
    datePublished: "2025-05-28",
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
    datePublished: "2024-07-12",
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
    datePublished: "2025-08-15",
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
    datePublished: "2025-10-22",
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
    datePublished: "2025-11-08",
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
    datePublished: "2026-01-14",
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
    datePublished: "2026-03-29",
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
    datePublished: "2026-05-17",
    relatedServiceSlugs: ["security-systems"],
  },
  {
    slug: "how-to-build-it-documentation-binder-small-business",
    title: "How to Build an IT Documentation Binder for a Small Business",
    metaTitle: "How to Build an IT Documentation Binder | Maine CyberTech",
    metaDescription:
      "A step-by-step guide to creating an IT documentation binder for a small business including network diagrams, vendor contacts, admin credentials, renewal dates, and support procedures.",
    primaryKeyword: "IT documentation binder small business",
    secondaryKeywords: [],
    category: "Managed IT",
    datePublished: "2022-07-08",
    relatedServiceSlugs: ["it-support"],
  },
  {
    slug: "how-much-should-small-business-it-support-include",
    title: "How Much Should Small Business IT Support Include?",
    metaTitle: "How Much IT Support Does a Small Business Need? | Maine CyberTech",
    metaDescription:
      "Understand what level of IT support makes sense for a small business including help desk, Microsoft 365 management, cybersecurity, device support, network maintenance, and backup planning.",
    primaryKeyword: "how much IT support small business",
    secondaryKeywords: [],
    category: "Managed IT",
    datePublished: "2022-09-14",
    relatedServiceSlugs: ["it-support", "cybersecurity", "microsoft-365-support"],
  },
  {
    slug: "password-managers-vs-browser-password-saving-small-businesses",
    title: "Password Managers vs Browser Password Saving for Small Businesses",
    metaTitle: "Password Managers vs Browser Saving for Businesses | Maine CyberTech",
    metaDescription:
      "Compare password managers with browser-based password saving for small businesses. Learn which approach is more secure, easier to manage, and better for shared credentials.",
    primaryKeyword: "password managers vs browser saving small business",
    secondaryKeywords: [],
    category: "Cybersecurity",
    datePublished: "2022-11-03",
    relatedServiceSlugs: ["cybersecurity"],
  },
  {
    slug: "security-defaults-mfa-conditional-access-small-business",
    title: "Security Defaults, MFA, and Conditional Access: What Small Businesses Need to Know",
    metaTitle: "Security Defaults, MFA, Conditional Access for Businesses | Maine CyberTech",
    metaDescription:
      "Understand Microsoft 365 security defaults, MFA, and Conditional Access policies. Learn what each does, when to use each, and how to balance security with usability for a small business.",
    primaryKeyword: "security defaults MFA conditional access small business",
    secondaryKeywords: [],
    category: "Microsoft 365",
    datePublished: "2023-01-19",
    relatedServiceSlugs: ["microsoft-365-support", "cybersecurity"],
  },
  {
    slug: "15-signs-business-outgrown-diy-it-support",
    title: "15 Signs Your Business Has Outgrown DIY IT Support",
    metaTitle: "15 Signs Your Business Has Outgrown DIY IT Support | Maine CyberTech",
    metaDescription:
      "Recognize the signs that your small business has outgrown do-it-yourself IT support and is ready for managed IT services including recurring issues, security gaps, and technology planning needs.",
    primaryKeyword: "signs business outgrown DIY IT support",
    secondaryKeywords: [],
    category: "Managed IT",
    datePublished: "2023-02-14",
    relatedServiceSlugs: ["it-support", "cybersecurity"],
  },
  {
    slug: "network-rack-firewall-switches-access-points-small-business",
    title: "Network Rack, Firewall, Switches, and Access Points: What Does a Small Business Need?",
    metaTitle: "Network Equipment for Small Businesses | Maine CyberTech",
    metaDescription:
      "Understand the network equipment a small business needs including racks, firewalls, switches, and access points. Learn the differences between consumer and business-grade gear.",
    primaryKeyword: "network equipment small business",
    secondaryKeywords: [],
    category: "Networking",
    datePublished: "2023-03-28",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "what-to-do-suspicious-login-alert-microsoft-365",
    title: "What to Do After a Suspicious Login Alert in Microsoft 365",
    metaTitle: "Suspicious Login Alert Microsoft 365: What to Do | Maine CyberTech",
    metaDescription:
      "Step-by-step response to a suspicious login alert in Microsoft 365 including securing the account, reviewing sign-in activity, checking forwarding rules, and preventing recurrence.",
    primaryKeyword: "suspicious login alert Microsoft 365",
    secondaryKeywords: [],
    category: "Microsoft 365",
    datePublished: "2023-04-19",
    relatedServiceSlugs: ["microsoft-365-support", "cybersecurity"],
  },
  {
    slug: "how-to-prepare-for-network-site-survey",
    title: "How to Prepare for a Network Site Survey",
    metaTitle: "How to Prepare for a Network Site Survey | Maine CyberTech",
    metaDescription:
      "Prepare for a network site survey to get the most accurate Wi-Fi and network design recommendations. What to gather, what to expect, and questions to ask.",
    primaryKeyword: "prepare for network site survey",
    secondaryKeywords: [],
    category: "Networking",
    datePublished: "2023-05-17",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "what-to-ask-before-installing-business-wifi",
    title: "What to Ask Before Installing Business Wi-Fi",
    metaTitle: "What to Ask Before Installing Business Wi-Fi | Maine CyberTech",
    metaDescription:
      "Key questions to ask before installing or upgrading business Wi-Fi including equipment choices, coverage planning, guest access, security, cabling, and ongoing support.",
    primaryKeyword: "questions before installing business Wi-Fi",
    secondaryKeywords: [],
    category: "Networking",
    datePublished: "2023-06-08",
    relatedServiceSlugs: ["networks"],
  },
  {
    slug: "outdoor-security-camera-placement-tips-maine-properties",
    title: "Outdoor Security Camera Placement Tips for Maine Properties",
    metaTitle: "Outdoor Security Camera Placement Tips for Maine | Maine CyberTech",
    metaDescription:
      "Practical outdoor security camera placement tips for Maine properties including camera height, angles, lighting, weather protection, and coverage zones for businesses and facilities.",
    primaryKeyword: "outdoor security camera placement Maine",
    secondaryKeywords: [],
    category: "Security Systems",
    datePublished: "2023-07-25",
    relatedServiceSlugs: ["security-systems", "networks"],
  },
  {
    slug: "unifi-protect-vs-traditional-camera-systems-small-business",
    title: "UniFi Protect vs Traditional Camera Systems for Small Businesses",
    metaTitle: "UniFi Protect vs Traditional Camera Systems | Maine CyberTech",
    metaDescription:
      "Compare UniFi Protect with traditional NVR-based security camera systems for small businesses. Learn the differences in cost, features, ease of use, and scalability.",
    primaryKeyword: "UniFi Protect vs traditional camera systems",
    secondaryKeywords: [],
    category: "Security Systems",
    datePublished: "2023-08-22",
    relatedServiceSlugs: ["security-systems", "networks"],
  },
  {
    slug: "security-camera-mistakes-to-avoid-before-installation",
    title: "Security Camera Mistakes to Avoid Before Installation",
    metaTitle: "Security Camera Mistakes to Avoid Before Installation | Maine CyberTech",
    metaDescription:
      "Avoid common security camera installation mistakes including poor placement, insufficient storage, network bottlenecks, lighting issues, and lack of testing before finalizing placement.",
    primaryKeyword: "security camera installation mistakes",
    secondaryKeywords: [],
    category: "Security Systems",
    datePublished: "2023-09-12",
    relatedServiceSlugs: ["security-systems"],
  },
  {
    slug: "what-files-should-small-business-back-up",
    title: "What Files Should a Small Business Back Up?",
    metaTitle: "What Files Should a Small Business Back Up? | Maine CyberTech",
    metaDescription:
      "A practical guide to what files and data a small business should back up including documents, email, financial records, customer data, and application data.",
    primaryKeyword: "what files should small business back up",
    secondaryKeywords: [],
    category: "Cloud Backup",
    datePublished: "2023-10-11",
    relatedServiceSlugs: ["cloud"],
  },
  {
    slug: "phone-internet-wifi-security-camera-planning-restaurants",
    title: "Phone, Internet, Wi-Fi, and Security Camera Planning for Restaurants",
    metaTitle: "Phone, Internet, Wi-Fi, Security Cameras for Restaurants | Maine CyberTech",
    metaDescription:
      "Technology planning guide for restaurants covering phone systems, internet reliability, guest and business Wi-Fi, security cameras, point-of-sale connectivity, and seasonal considerations.",
    primaryKeyword: "restaurant technology planning Maine",
    secondaryKeywords: [],
    category: "Local Business Technology",
    datePublished: "2023-12-05",
    relatedServiceSlugs: ["networks", "security-systems"],
  },
  {
    slug: "network-camera-planning-boat-storage-warehouse-buildings",
    title: "Network and Camera Planning for Boat Storage and Warehouse Buildings",
    metaTitle: "Network Camera Planning for Boat Storage Warehouses | Maine CyberTech",
    metaDescription:
      "Technology planning guide for boat storage facilities and warehouse buildings covering outdoor Wi-Fi, security cameras, network cabling, remote access, and seasonal shutdown procedures.",
    primaryKeyword: "boat storage network camera planning",
    secondaryKeywords: [],
    category: "Networking",
    datePublished: "2024-01-16",
    relatedServiceSlugs: ["networks", "security-systems"],
  },
  {
    slug: "local-backup-cloud-backup-or-both-small-business",
    title: "Local Backup, Cloud Backup, or Both?",
    metaTitle: "Local Backup vs Cloud Backup for Small Businesses | Maine CyberTech",
    metaDescription:
      "Compare local backup and cloud backup for small businesses. Learn the pros and cons of each approach and when a hybrid backup strategy makes the most sense.",
    primaryKeyword: "local backup vs cloud backup small business",
    secondaryKeywords: [],
    category: "Cloud Backup",
    datePublished: "2024-03-05",
    relatedServiceSlugs: ["cloud"],
  },
  {
    slug: "how-often-should-small-business-test-backups",
    title: "How Often Should a Small Business Test Backups?",
    metaTitle: "How Often Should a Business Test Backups? | Maine CyberTech",
    metaDescription:
      "Learn how often small businesses should test their backups, what a backup test should include, and how to build a restore testing schedule into regular operations.",
    primaryKeyword: "how often test backups small business",
    secondaryKeywords: [],
    category: "Cloud Backup",
    datePublished: "2024-05-21",
    relatedServiceSlugs: ["cloud"],
  },
  {
    slug: "how-local-organizations-modernize-technology-phases",
    title: "How Local Organizations Can Modernize Technology in Phases",
    metaTitle: "Modernize Technology in Phases for Local Organizations | Maine CyberTech",
    metaDescription:
      "A practical phase-based approach for local organizations to modernize their technology including assessment, prioritization, budgeting, and implementation without disrupting operations.",
    primaryKeyword: "modernize technology in phases small organization",
    secondaryKeywords: [],
    category: "Managed IT",
    datePublished: "2024-07-10",
    relatedServiceSlugs: ["it-support", "networks", "cybersecurity"],
  },
  {
    slug: "questions-to-ask-before-upgrading-internet-phones-wifi-cameras",
    title: "Questions to Ask Before Upgrading Internet, Phones, Wi-Fi, or Cameras",
    metaTitle: "Questions Before Upgrading Internet Phones Wi-Fi Cameras | Maine CyberTech",
    metaDescription:
      "Key questions to ask before upgrading internet service, phone systems, Wi-Fi, or security cameras to avoid costly mistakes and get the right solution for your organization.",
    primaryKeyword: "questions before upgrading internet phones Wi-Fi cameras",
    secondaryKeywords: [],
    category: "Local Business Technology",
    datePublished: "2024-09-18",
    relatedServiceSlugs: ["networks", "security-systems"],
  },
].sort((a, b) => b.datePublished.localeCompare(a.datePublished)) as BlogSeoConfig[];
